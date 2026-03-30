<script lang="ts">
    import { createReplayStore } from './replay-player.store.svelte.js';
    import { initWasm, Replay } from './wasm/index.js';
    import type { FetchOptions } from './replay-player.types.js';
    import SeekBar from './SeekBar.svelte';
    import PlaybackControls from './PlaybackControls.svelte';

    interface Props {
        url: string;
        fetchOptions?: FetchOptions;
    }

    let { url, fetchOptions }: Props = $props();

    const store = createReplayStore();
    let canvas: HTMLCanvasElement;
    let wasmReady = $state(false);
    let playerDiv: HTMLDivElement;
    let isFullscreen = $state(false);
    let controlsVisible = $state(true);
    // Not reactive — just a timer handle for the controls fade
    let controlsTimeout: ReturnType<typeof setTimeout> | null = null;

    // Clear timer on component destroy to avoid dangling callbacks
    $effect(() => {
        return () => {
            if (controlsTimeout) clearTimeout(controlsTimeout);
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
        if (url) {
            store.initialiseRecording(url, fetchOptions);
        }
    });

    // Initialize WASM once canvas is mounted and recording metadata is ready.
    $effect(() => {
        if (store.loadState.status !== 'ready') return;
        if (!canvas) return;
        if (wasmReady) return;

        initWasm()
            .then(() => {
                const replay = new Replay(canvas);
                store.setWasmReplay(replay, url);
                wasmReady = true;
            })
            .catch((e: unknown) => {
                console.error('Failed to load WASM engine:', e);
            });
    });

    // Track fullscreen state
    $effect(() => {
        const handler = () => {
            isFullscreen = document.fullscreenElement === playerDiv;
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    });

    // Controls visibility: always show when paused, fade after 3s when playing
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
        if (isFullscreen) {
            document.exitFullscreen();
        } else {
            playerDiv?.requestFullscreen();
        }
    }

    const isBuffering = $derived(store.playbackState.waiting);
    const canPlay     = $derived(store.canControlPlayback());
</script>

<div class="replay-player" bind:this={playerDiv}>
    {#if store.loadState.status === 'loading' || (store.loadState.status === 'ready' && !wasmReady)}
        <p class="loading-text">Loading recording...</p>
    {:else if store.loadState.status === 'error'}
        <p class="error">Error: {store.loadState.message}</p>
    {/if}

    <div
        class="canvas-container"
        role="button"
        tabindex="0"
        onmousemove={showControls}
        onclick={() => store.togglePlayback()}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); store.togglePlayback(); } }}
    >
        {#if isBuffering}
            <div class="buffering-overlay">
                <span class="buffering-label">Buffering...</span>
            </div>
        {/if}
        <canvas bind:this={canvas}></canvas>

        {#if store.loadState.status === 'ready' && wasmReady}
            <div class="controls-overlay" class:hidden={!controlsVisible} role="toolbar" aria-label="Playback controls" tabindex="-1" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
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
                    onspeedchange={(s) => store.setSpeed(s)}
                    onfullscreen={toggleFullscreen}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    @import './replay-player.css';
</style>
