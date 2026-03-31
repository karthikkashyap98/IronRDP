<svelte:options
    customElement={{
        tag: 'iron-replay-player',
        shadow: 'none',
    }}
/>

<script lang="ts">
    import { createReplayStore } from './services/replay-store.svelte.js';
    import type { ReplayModule, WasmReplayInstance } from './interfaces/ReplayModule.js';
    import type { PlayerApi } from './interfaces/PlayerApi.js';
    import type { FetchOptions } from './services/fetchRecording.js';
    import SeekBar from './ui/SeekBar.svelte';
    import PlaybackControls from './ui/PlaybackControls.svelte';

    let {
        url,
        module,
        fetchOptions,
    }: {
        url: string;
        module: ReplayModule;
        fetchOptions?: FetchOptions;
    } = $props();

    const store = createReplayStore();
    let canvas: HTMLCanvasElement;
    let playerDiv: HTMLDivElement;
    let wasmReady = $state(false);
    // Track the active Replay instance for proper WASM memory cleanup on reload/destroy.
    let currentReplay: WasmReplayInstance | null = null;
    let isFullscreen = $state(false);
    let controlsVisible = $state(true);
    let controlsTimeout: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        return () => {
            if (controlsTimeout) clearTimeout(controlsTimeout);
            // Cancel RAF loop and abort any in-flight seek before freeing WASM memory.
            // This ensures the seek's finally block sees signal.aborted = true and does
            // not call setUpdateCanvas() on the freed instance.
            store.destroy();
            // Free WASM linear memory when component is destroyed.
            currentReplay?.free();
            currentReplay = null;
        };
    });

    function showControls(): void {
        controlsVisible = true;
        if (controlsTimeout) clearTimeout(controlsTimeout);
        if (!store.playbackState.paused) {
            controlsTimeout = setTimeout(() => {
                controlsVisible = false;
            }, 3000);
        }
    }

    $effect(() => {
        if (url) store.initialiseRecording(url, fetchOptions);
    });

    // Reset wasmReady when a new load starts so WASM re-initializes for the new recording.
    // Also free the old Replay instance to avoid WASM linear memory leaks.
    $effect(() => {
        if (store.loadState.status === 'loading') {
            currentReplay?.free();
            currentReplay = null;
            wasmReady = false;
        }
    });

    $effect(() => {
        if (store.loadState.status !== 'ready') return;
        if (!canvas || wasmReady) return;

        // new module.Replay(canvas) calls a Rust constructor returning Result<Replay, JsValue>.
        // wasm-bindgen converts Err into a JS throw, so wrap in try/catch.
        let replay: WasmReplayInstance;
        try {
            replay = new module.Replay(canvas);
        } catch (err: unknown) {
            console.error('Failed to construct WASM Replay engine:', err);
            store.setLoadError(err instanceof Error ? err.message : 'WASM init failed');
            return;
        }

        currentReplay = replay;
        store.setWasmReplay(replay, url);
        wasmReady = true;

        // Build the PlayerApi and dispatch 'ready'.
        // Store method names: seek() not seekTo(), togglePlayback() not togglePlay().
        const playerApi: PlayerApi = {
            load: (newUrl: string) => store.initialiseRecording(newUrl, fetchOptions),
            play: () => store.play(),
            pause: () => store.pause(),
            togglePlayback: () => store.togglePlayback(),
            seek: (positionMs: number) => store.seek(positionMs),
            setSpeed: (s: number) => store.setSpeed(s),
            getElapsedMs: () => store.elapsed,
            getDurationMs: () => store.header?.duration ?? 0,
            isPaused: () => store.playbackState.paused,
            getLoadState: () => store.loadState,
            getPlayerError: () => store.playerError,
            clearError: () => store.clearError(),
            reset: () => store.reset(),
        };

        playerDiv.dispatchEvent(
            new CustomEvent('ready', {
                detail: { playerApi },
                bubbles: true,
                composed: true,
            }),
        );
    });

    $effect(() => {
        if (store.playerError !== null) {
            playerDiv?.dispatchEvent(
                new CustomEvent('error', {
                    detail: store.playerError,
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    });

    $effect(() => {
        const handler = () => {
            isFullscreen = document.fullscreenElement === playerDiv;
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    });

    $effect(() => {
        if (store.playbackState.paused) {
            if (controlsTimeout) {
                clearTimeout(controlsTimeout);
                controlsTimeout = null;
            }
            controlsVisible = true;
        } else {
            showControls();
        }
    });

    function toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            playerDiv.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    const isBuffering = $derived(store.playbackState.waiting);
    const canPlay = $derived(store.canControlPlayback());
</script>

<div class="replay-player" bind:this={playerDiv}>
    {#if store.loadState.status === 'loading' || (store.loadState.status === 'ready' && !wasmReady)}
        <p class="loading-text">Loading recording...</p>
    {:else if store.loadState.status === 'error'}
        <p class="error">Error: {store.loadState.message}</p>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
    <div class="canvas-container" onmousemove={showControls} onclick={() => store.togglePlayback()}>
        {#if isBuffering}
            <div class="buffering-overlay">
                <span class="buffering-label">Buffering...</span>
            </div>
        {/if}
        <!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
        <canvas bind:this={canvas} role="img" aria-label="RDP session replay"></canvas>

        {#if store.loadState.status === 'ready' && wasmReady}
            <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
            <div class="controls-overlay" class:hidden={!controlsVisible} onclick={(e) => e.stopPropagation()}>
                <SeekBar
                    elapsed={store.elapsed}
                    duration={store.header?.duration ?? 0}
                    fetchedUntilMs={store.fetchedUntilMs}
                    waiting={store.playbackState.waiting}
                    onseekend={(ms) => store.seek(ms)}
                />
                <PlaybackControls
                    paused={store.playbackState.paused}
                    waiting={store.playbackState.waiting}
                    canPlay={canPlay}
                    elapsed={store.elapsed}
                    duration={store.header?.duration ?? 0}
                    speed={store.speed}
                    isFullscreen={isFullscreen}
                    onplay={() => store.play()}
                    onpause={() => store.pause()}
                    onreset={() => store.reset()}
                    onspeedchange={(s) => store.setSpeed(s)}
                    onfullscreen={toggleFullscreen}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    /* All styles are :global because:
       1. Sub-component classes (SeekBar, PlaybackControls) live in separate Svelte files
          and would be stripped by the scoping compiler if not marked global.
       2. shadow: 'none' means styles inject into document <head>, not a shadow root,
          so global rules reach child elements correctly. */

    :global(.replay-player) {
        background: #000;
        position: relative;
        font-family: system-ui, -apple-system, sans-serif;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    :global(.loading-text) {
        color: rgba(255, 255, 255, 0.5);
        padding: 12px 16px;
        margin: 0;
        font-size: 14px;
        font-family: monospace;
    }

    :global(.error) {
        color: #f87171;
        padding: 12px 16px;
        margin: 0;
        font-size: 14px;
    }

    :global(.canvas-container) {
        position: relative;
        flex: 1;
        min-height: 0;
        width: 100%;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    :global(.canvas-container canvas) {
        display: block;
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
    }

    :global(.buffering-overlay) {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        z-index: 3;
    }

    :global(.buffering-label) {
        color: #fff;
        font-size: 18px;
        font-weight: 500;
    }

    :global(.controls-overlay) {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, transparent 100%);
        padding: 32px 16px 12px;
        z-index: 2;
        transition: opacity 0.3s ease;
    }

    :global(.controls-overlay.hidden) {
        opacity: 0;
        pointer-events: none;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0s linear 0.3s;
    }

    /* Seekbar */
    :global(.seekbar) {
        width: 100%;
        padding: 16px 0;
        cursor: default;
        box-sizing: border-box;
    }

    :global(.seekbar-track) {
        position: relative;
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.15);
        border-radius: 2px;
        overflow: visible;
        transition: height 0.15s ease;
    }

    :global(.seekbar.interactive) {
        cursor: pointer;
    }

    :global(.seekbar.interactive:hover .seekbar-track) {
        height: 6px;
    }

    :global(.seekbar-buffer) {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        pointer-events: none;
    }

    :global(.seekbar-progress) {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        background: #4a9eff;
        border-radius: 2px;
        pointer-events: none;
    }

    :global(.seekbar-head) {
        position: absolute;
        top: 50%;
        width: 12px;
        height: 12px;
        background: #4a9eff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        transition: opacity 0.15s ease, width 0.15s ease, height 0.15s ease;
        box-shadow: 0 0 4px rgba(74, 158, 255, 0.6);
    }

    :global(.seekbar.interactive:hover .seekbar-head) {
        width: 16px;
        height: 16px;
    }

    :global(.seekbar-head.waiting) {
        opacity: 0.5;
    }

    /* PlaybackControls */
    :global(.controls-bar) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 0;
    }

    :global(.controls-left) {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    :global(.controls-right) {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    :global(.play-btn) {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        color: #fff;
        border: none;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background 0.15s ease;
    }

    :global(.play-btn:hover:not(:disabled)) {
        background: rgba(255, 255, 255, 0.15);
    }

    :global(.play-btn:disabled) {
        opacity: 0.4;
        cursor: not-allowed;
    }

    :global(.time-display) {
        font-size: 13px;
        color: #ccc;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        font-family: monospace;
    }

    :global(.speed-selector) {
        position: relative;
    }

    :global(.speed-btn) {
        font-size: 12px;
        color: #ccc;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 4px;
        padding: 3px 8px;
        cursor: pointer;
        white-space: nowrap;
        transition: border-color 0.15s ease, color 0.15s ease;
    }

    :global(.speed-btn:hover) {
        border-color: rgba(255, 255, 255, 0.5);
        color: #fff;
    }

    :global(.speed-popup) {
        position: absolute;
        bottom: calc(100% + 4px);
        right: 0;
        background: #1c1c1c;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        overflow: hidden;
        z-index: 10;
        min-width: 180px;
    }

    :global(.speed-popup-heading) {
        padding: 12px 16px 10px;
        font-size: 14px;
        font-weight: 500;
        color: #fff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        white-space: nowrap;
    }

    :global(.speed-popup-item) {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 10px 16px;
        font-size: 14px;
        color: #ccc;
        background: transparent;
        border: none;
        cursor: pointer;
        white-space: nowrap;
        text-align: left;
        gap: 10px;
    }

    :global(.speed-popup-item:hover) {
        background: rgba(255, 255, 255, 0.06);
    }

    :global(.speed-popup-item.active) {
        color: #fff;
    }

    :global(.speed-popup-check) {
        width: 14px;
        font-size: 13px;
        color: #fff;
        flex-shrink: 0;
    }

    :global(.fullscreen-btn) {
        font-size: 16px;
        background: transparent;
        border: none;
        color: #ccc;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        line-height: 1;
        transition: color 0.15s ease;
    }

    :global(.fullscreen-btn:hover) {
        color: #fff;
    }

    :global(.replay-player:fullscreen),
    :global(.replay-player:-webkit-full-screen) {
        width: 100vw;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    :global(.replay-player:fullscreen .canvas-container),
    :global(.replay-player:-webkit-full-screen .canvas-container) {
        flex: 1;
        height: 100%;
    }

    :global(.replay-player:fullscreen canvas),
    :global(.replay-player:-webkit-full-screen canvas) {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
    }
</style>
