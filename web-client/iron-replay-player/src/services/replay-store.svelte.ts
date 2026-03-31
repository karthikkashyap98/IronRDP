import { fetchHeader, fetchIndexTable, FetchHttpError } from './fetchRecording.js';
import type { FetchOptions, Header, IndexTableRow } from './fetchRecording.js';
import type { PlayerFetchError } from '../interfaces/PlayerFetchError.js';
import type { LoadState } from '../interfaces/LoadState.js';
import type { PlaybackState } from '../interfaces/PlaybackState.js';
import { PduFetcher } from './PduFetcher.js';
import type { WasmReplayInstance } from '../interfaces/ReplayModule.js';

const BUFFER_TARGET_MS = 15_000; // target: keep 15s buffered ahead
const BUFFER_LOW_THRESHOLD_MS = 5_000; // trigger prefetch when < 5s ahead
const BUFFER_CRITICALLY_LOW_MS = 500; // trigger buffering state and load

export function createReplayStore() {
    // --- Load state ---
    let loadState = $state<LoadState>({ status: 'idle' });
    let playerError = $state<PlayerFetchError | null>(null);
    let header = $state<Header | null>(null);
    let indexTable = $state<IndexTableRow[] | null>(null);

    // --- Playback state ---
    let playbackState = $state<PlaybackState>({ paused: true, waiting: false, seeking: false });
    let elapsed = $state(0);
    let speed = $state(1.0);
    let fetchedUntilMs = $state(0); // reactive: furthest timestamp (ms) of PDUs pushed to WASM

    // --- Internal refs ---
    let rafId: number | null = null;
    let lastTimestamp: DOMHighResTimeStamp | null = null;
    let fetcher: PduFetcher | null = $state(null);
    let wasmReplay: WasmReplayInstance | null = $state(null);
    let fetchOptions: FetchOptions | undefined = undefined;

    // --- Seek state ---
    const SEEK_CHUNK_MS = 5_000;
    let seekAbort: AbortController | null = null;

    function yieldToEventLoop(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    // --- Player error helpers ---
    // First-error-wins: once an error is set, subsequent errors are silently
    // discarded until the consumer calls clearError().
    function setPlayerError(phase: PlayerFetchError['phase'], e: unknown): void {
        if (playerError !== null) return;
        playerError = {
            phase,
            message: e instanceof Error ? e.message : 'Unknown error',
            httpStatus: e instanceof FetchHttpError ? e.httpStatus : undefined,
        };
    }

    function clearError(): void {
        if (playerError !== null) {
            loadState = playerError.phase === 'init' ? { status: 'idle' } : { status: 'ready' };
        }
        playerError = null;
    }

    // --- Load recording metadata ---
    async function initialiseRecording(url: string, options?: FetchOptions): Promise<void> {
        fetchOptions = options;
        loadState = { status: 'loading' };
        header = null;
        indexTable = null;

        try {
            header = await fetchHeader(url, fetchOptions);
            indexTable = await fetchIndexTable(url, header.totalPdus, fetchOptions);

            // Some recordings store duration = 0 in the header.
            // Fall back to the timeOffset of the last index table entry.
            if (header.duration === 0 && indexTable.length > 0) {
                header = { ...header, duration: indexTable[indexTable.length - 1].timeOffset };
            }

            loadState = { status: 'ready' };
        } catch (e) {
            loadState = {
                status: 'error',
                message: e instanceof Error ? e.message : 'Unknown error',
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
    function setWasmReplay(replay: WasmReplayInstance, url: string): void {
        if (!indexTable) return;
        wasmReplay = replay;
        fetcher = new PduFetcher(url, indexTable, wasmReplay, fetchOptions);
    }

    // --- Seek ---
    async function seek(targetMs: number): Promise<void> {
        if (!fetcher || !wasmReplay) return;

        const duration = header?.duration ?? 0;
        targetMs = Math.max(0, Math.min(targetMs, duration));

        // Cancel any in-flight seek
        seekAbort?.abort();
        const controller = new AbortController();
        seekAbort = controller;
        const { signal } = controller;

        // Stop rAF if running
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        playbackState = { ...playbackState, seeking: true, waiting: true };

        // Direction decision: compare targetMs against current elapsed
        let processFrom = elapsed;
        if (targetMs < elapsed) {
            // Backward seek — reset WASM and fetcher, restart from 0
            wasmReplay.reset();
            fetcher.reset();
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

                const chunkEnd = Math.min(current + SEEK_CHUNK_MS, targetMs);

                await fetcher.fetchUntilTime(chunkEnd);
                if (signal.aborted) return;

                // Update buffer indicator per chunk
                fetchedUntilMs = fetcher.nextUnfetchedTimestamp;

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
            fetchedUntilMs = fetcher.nextUnfetchedTimestamp;
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
        if (!fetcher || !wasmReplay) return;

        playbackState = { ...playbackState, paused: false, waiting: true };

        try {
            await fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS);
            fetchedUntilMs = fetcher.nextUnfetchedTimestamp;
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
        return wasmReplay !== null && fetcher !== null && !playbackState.seeking;
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
        if (!fetcher || !wasmReplay || lastTimestamp === null) return;

        const duration = header?.duration ?? 0;

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
        const bufferAhead = fetcher.nextUnfetchedTimestamp - elapsed;

        if (bufferAhead <= BUFFER_CRITICALLY_LOW_MS) {
            // Buffer empty — freeze playback, fetch more, resume when ready
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            playbackState = { ...playbackState, waiting: true };

            fetcher
                .fetchUntilTime(elapsed + BUFFER_TARGET_MS)
                .then(() => {
                    fetchedUntilMs = fetcher!.nextUnfetchedTimestamp;
                    if (!playbackState.paused && !playbackState.seeking) {
                        playbackState = { ...playbackState, waiting: false };
                        lastTimestamp = performance.now();
                        rafId = requestAnimationFrame(tick);
                    } else if (!playbackState.seeking) {
                        playbackState = { ...playbackState, waiting: false };
                    }
                })
                .catch((e: unknown) => {
                    loadState = {
                        status: 'error',
                        message: e instanceof Error ? e.message : 'Failed to fetch PDUs',
                    };
                    playbackState = { ...playbackState, waiting: false, paused: true };
                    setPlayerError('playback', e);
                });
            return;
        }

        if (bufferAhead < BUFFER_LOW_THRESHOLD_MS) {
            // Buffer getting low — prefetch more, update fetchedUntilMs when done
            fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS).then(() => {
                fetchedUntilMs = fetcher!.nextUnfetchedTimestamp;
            }).catch((e: unknown) => setPlayerError('playback', e));
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
        get header() {
            return header;
        },
        get indexTable() {
            return indexTable;
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
        playbackState = { paused: true, waiting: false, seeking: false };
        wasmReplay = null;
        fetcher = null;
    }
}
