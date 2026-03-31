import type { ReplayDataSource, PlayerError } from '../interfaces/ReplayDataSource.js';
import type { LoadState } from '../interfaces/LoadState.js';
import type { PlaybackState } from '../interfaces/PlaybackState.js';
import type { WasmReplayInstance } from '../interfaces/ReplayModule.js';

interface BufferConfig {
    targetMs: number;
    lowThresholdMs: number;
    criticallyLowMs: number;
    seekChunkMs: number;
}

const DEFAULT_BUFFER_CONFIG: BufferConfig = {
    targetMs: 15_000,
    lowThresholdMs: 5_000,
    criticallyLowMs: 500,
    seekChunkMs: 5_000,
};

export function createReplayStore() {
    const bufferConfig = DEFAULT_BUFFER_CONFIG;

    // --- Load state ---
    let loadState = $state<LoadState>({ status: 'idle' });
    let playerError = $state<PlayerError | null>(null);

    // --- Data source state ---
    let dataSource: ReplayDataSource | null = null;
    let duration = $state(0);
    let totalPdus = $state(0);

    // --- Playback state ---
    let playbackState = $state<PlaybackState>({ paused: true, waiting: false, seeking: false });
    let elapsed = $state(0);
    let speed = $state(1.0);
    let fetchedUntilMs = $state(0); // reactive: furthest timestamp (ms) of PDUs pushed to WASM

    // --- Internal refs ---
    let rafId: number | null = null;
    let lastTimestamp: DOMHighResTimeStamp | null = null;
    let wasmReplay: WasmReplayInstance | null = $state(null);

    // --- Seek & prefetch abort ---
    let seekAbort: AbortController | null = null;
    let prefetchAbort = new AbortController();

    function yieldToEventLoop(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    // --- Player error helpers ---
    // First-error-wins: once an error is set, subsequent errors are silently
    // discarded until the consumer calls clearError().
    function setPlayerError(phase: PlayerError['phase'], error: unknown): void {
        if (playerError !== null) return;
        playerError = {
            message: error instanceof Error ? error.message : String(error),
            phase,
            cause: error,
        };
    }

    function clearError(): void {
        if (playerError !== null) {
            loadState = playerError.phase === 'init' ? { status: 'idle' } : { status: 'ready' };
        }
        playerError = null;
    }

    // --- Fetch helper: single path for all fetch→push→advance operations ---
    async function fetchAndPush(
        fromMs: number,
        toMs: number,
        signal: AbortSignal,
    ): Promise<void> {
        if (!dataSource || !wasmReplay) return;

        const pdus = await dataSource.fetch(fromMs, toMs, signal);

        if (signal.aborted) return;

        for (const pdu of pdus) {
            wasmReplay.pushPdu(pdu.timestampMs, pdu.source, pdu.data);
        }

        fetchedUntilMs = pdus.length > 0
            ? pdus[pdus.length - 1].timestampMs
            : toMs;
    }

    // --- Load recording metadata ---
    async function initialiseRecording(source: ReplayDataSource): Promise<void> {
        dataSource = source;
        loadState = { status: 'loading' };
        duration = 0;
        totalPdus = 0;
        fetchedUntilMs = 0;

        try {
            const metadata = await dataSource.open();
            duration = metadata.durationMs;
            totalPdus = metadata.totalPdus;
            loadState = { status: 'ready' };
        } catch (e: unknown) {
            loadState = {
                status: 'error',
                message: e instanceof Error ? e.message : 'failed to open data source',
            };
            setPlayerError('init', e);
        }
    }

    // --- Set load error (called by component on WASM constructor failure) ---
    function setLoadError(message: string): void {
        loadState = { status: 'error', message };
        setPlayerError('init', new Error(message));
    }

    // --- Wire in WASM replay instance (called from component after WASM loads) ---
    function setWasmReplay(replay: WasmReplayInstance): void {
        wasmReplay = replay;
    }

    // --- Seek ---
    async function seek(targetMs: number): Promise<void> {
        if (!dataSource || !wasmReplay) return;

        targetMs = Math.max(0, Math.min(targetMs, duration));

        // Cancel any in-flight seek
        seekAbort?.abort();
        const controller = new AbortController();
        seekAbort = controller;
        const { signal } = controller;

        // Cancel any in-flight prefetch
        prefetchAbort.abort();
        prefetchAbort = new AbortController();

        // Stop rAF if running
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        playbackState = { ...playbackState, seeking: true, waiting: true };

        // Direction decision: compare targetMs against current elapsed
        let processFrom = elapsed;
        if (targetMs < elapsed) {
            // Backward seek — reset WASM, restart from 0
            // DataSource is stateless — no reset needed.
            wasmReplay.reset();
            processFrom = 0;
            fetchedUntilMs = 0;
        }

        // Immediately show head at target position — avoids visible snap-back
        elapsed = targetMs;

        // Suppress canvas updates during intermediate chunks
        wasmReplay.setUpdateCanvas(false);

        try {
            // Chunked fast-forward loop (local variable — elapsed already at target for UI)
            let current = processFrom;
            while (current < targetMs) {
                if (signal.aborted) return;

                const chunkEnd = Math.min(current + bufferConfig.seekChunkMs, targetMs);

                await fetchAndPush(current, chunkEnd, signal);
                if (signal.aborted) return;

                // Fast-forward WASM through this chunk — no canvas blit
                wasmReplay.renderTill(chunkEnd);
                current = chunkEnd;

                await yieldToEventLoop();
                if (signal.aborted) return;
            }

            // Final render with canvas updates re-enabled.
            // renderTill is a no-op here — all PDUs up to targetMs were consumed by the chunk loop.
            // forceRedraw() unconditionally blits the in-memory framebuffer to the canvas.
            wasmReplay.setUpdateCanvas(true);
            wasmReplay.forceRedraw();
        } catch (e) {
            if (signal.aborted) return; // superseded — discard error silently
            loadState = {
                status: 'error',
                message: e instanceof Error ? e.message : 'Seek failed',
            };
            playbackState = { ...playbackState, seeking: false, waiting: false, paused: true };
            setPlayerError('seek', e);
            return;
        } finally {
            // Only re-enable canvas updates if this seek was not superseded.
            if (!signal.aborted) {
                wasmReplay?.setUpdateCanvas(true);
            }
        }

        if (signal.aborted) return;

        // Resume decision: read playbackState directly — no wasPlaying snapshot needed
        playbackState = { ...playbackState, seeking: false, waiting: false };

        if (!playbackState.paused) {
            lastTimestamp = performance.now();
            rafId = requestAnimationFrame(tick);
        }
    }

    // --- Play: record intent, fill buffer, then start rAF loop ---
    async function play(): Promise<void> {
        if (!dataSource || !wasmReplay) return;

        playbackState = { ...playbackState, paused: false, waiting: true };

        try {
            await fetchAndPush(fetchedUntilMs, fetchedUntilMs + bufferConfig.targetMs, prefetchAbort.signal);
        } catch (e) {
            loadState = {
                status: 'error',
                message: e instanceof Error ? e.message : 'Failed to fetch PDUs',
            };
            playbackState = { ...playbackState, paused: true, waiting: false };
            setPlayerError('playback', e);
            return;
        }

        // Only start the loop if the user hasn't paused in the meantime
        if (!playbackState.paused && !playbackState.seeking) {
            playbackState = { ...playbackState, waiting: false };
            lastTimestamp = performance.now();
            rafId = requestAnimationFrame(tick);
        } else if (!playbackState.seeking) {
            playbackState = { ...playbackState, waiting: false };
        }
    }

    // --- Pause: record intent, cancel rAF loop (fetch continues unaffected) ---
    function pause(): void {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        playbackState = { ...playbackState, paused: true };
    }

    // --- Guard: can the player accept playback commands? ---
    function canControlPlayback(): boolean {
        return wasmReplay !== null && dataSource !== null && !playbackState.seeking;
    }

    // --- Toggle: single entry point for play/pause from canvas click ---
    function togglePlayback(): void {
        if (!canControlPlayback()) return;
        if (playbackState.paused) {
            play();
        } else {
            pause();
        }
    }

    // --- Reset: seek to beginning, preserving play/pause state ---
    function reset(): Promise<void> {
        return seek(0);
    }

    // --- Speed: set playback speed ---
    function setSpeed(value: number): void {
        if (!Number.isFinite(value) || value <= 0) return;
        speed = value;
    }

    // --- rAF tick callback ---
    function tick(now: DOMHighResTimeStamp): void {
        if (!dataSource || !wasmReplay || lastTimestamp === null) return;

        // Advance elapsed time
        const delta = now - lastTimestamp;
        lastTimestamp = now;
        elapsed = Math.min(elapsed + delta * speed, duration);

        // Render PDUs up to elapsed
        let renderResult;
        try {
            renderResult = wasmReplay.renderTill(elapsed);
        } catch (e) {
            rafId = null;
            playbackState = { ...playbackState, paused: true };
            setPlayerError('playback', e);
            return;
        }

        // Check if the session ended via a SessionEnded PDU (e.g. truncated recording)
        if (renderResult.session_ended) {
            rafId = null;
            playbackState = { ...playbackState, paused: true };
            return;
        }

        // Check if playback has reached the end
        if (elapsed >= duration) {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            playbackState = { ...playbackState, paused: true };
            return;
        }

        // Buffer health check
        const bufferAhead = fetchedUntilMs - elapsed;

        if (bufferAhead <= bufferConfig.criticallyLowMs) {
            // Buffer empty — freeze playback, fetch more, resume when ready
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            playbackState = { ...playbackState, waiting: true };

            (async () => {
                try {
                    await fetchAndPush(fetchedUntilMs, fetchedUntilMs + bufferConfig.targetMs, prefetchAbort.signal);
                } catch { /* ignore fetch errors during buffer refill */ }

                if (!playbackState.paused && !playbackState.seeking) {
                    playbackState = { ...playbackState, waiting: false };
                    lastTimestamp = performance.now();
                    rafId = requestAnimationFrame(tick);
                } else if (!playbackState.seeking) {
                    playbackState = { ...playbackState, waiting: false };
                }
            })();
            return;
        }

        if (bufferAhead < bufferConfig.lowThresholdMs) {
            // Buffer getting low — prefetch more (fire-and-forget)
            fetchAndPush(fetchedUntilMs, fetchedUntilMs + bufferConfig.targetMs, prefetchAbort.signal);
        }

        // Schedule next tick
        rafId = requestAnimationFrame(tick);
    }

    return {
        // Load state
        get loadState() {
            return loadState;
        },
        get playerError() {
            return playerError;
        },
        get duration() {
            return duration;
        },
        get totalPdus() {
            return totalPdus;
        },
        initialiseRecording,
        setLoadError,
        clearError,

        // Playback state
        get playbackState() {
            return playbackState;
        },
        get elapsed() {
            return elapsed;
        },
        get speed() {
            return speed;
        },
        get fetchedUntilMs() {
            return fetchedUntilMs;
        },

        // Playback controls
        canControlPlayback,
        play,
        pause,
        seek,
        reset,
        togglePlayback,
        setSpeed,
        setWasmReplay,
        destroy,
    };

    function destroy(): void {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        seekAbort?.abort();
        seekAbort = null;
        prefetchAbort.abort();
        playbackState = { paused: true, waiting: false, seeking: false };
        wasmReplay = null;
        if (dataSource) {
            try { dataSource.close(); } catch { /* fire-and-forget */ }
        }
        dataSource = null;
    }
}
