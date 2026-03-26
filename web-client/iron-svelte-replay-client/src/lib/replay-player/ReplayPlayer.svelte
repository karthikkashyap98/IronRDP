<script lang="ts">
    import { createReplayStore } from './replay-player.store.svelte.js';
    import { initWasm, Replay } from './wasm/index.js';
    import SeekBar from './SeekBar.svelte';
    import PlaybackControls from './PlaybackControls.svelte';

    interface Props {
        url: string;
    }

    let { url }: Props = $props();

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
            store.initialiseRecording(url);
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
    const canPlay     = $derived(wasmReady && !store.playbackState.seeking);
</script>

<div class="replay-player" bind:this={playerDiv}>
    {#if store.loadState.status === 'loading' || (store.loadState.status === 'ready' && !wasmReady)}
        <p class="loading-text">Loading recording...</p>
    {:else if store.loadState.status === 'error'}
        <p class="error">Error: {store.loadState.message}</p>
    {/if}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="canvas-container" onmousemove={showControls}>
        {#if isBuffering}
            <div class="buffering-overlay">
                <span class="buffering-label">Buffering...</span>
            </div>
        {/if}
        <canvas bind:this={canvas}></canvas>

        {#if store.loadState.status === 'ready' && wasmReady}
            <div class="controls-overlay" class:hidden={!controlsVisible}>
                <SeekBar
                    elapsed={store.elapsed}
                    duration={store.header?.duration ?? 0}
                    fetchedUntilMs={store.fetchedUntilMs}
                    waiting={store.playbackState.waiting}
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
