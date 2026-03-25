<script lang="ts">
    import { createReplayStore } from './replay-player.store.svelte.js';
    import { initWasm, Replay } from './wasm/index.js';

    interface Props {
        url: string;
    }

    let { url }: Props = $props();

    const store = createReplayStore();
    let canvas: HTMLCanvasElement;
    let wasmReady = $state(false);

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

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    const isPlaying = $derived(store.playbackState === 'playing');
    const isBuffering = $derived(store.playbackState === 'buffering');
    const canPlay = $derived(store.loadState.status === 'ready' && wasmReady && store.playbackState !== 'buffering');
</script>

<div class="replay-player">
    {#if store.loadState.status === 'loading'}
        <p>Loading recording metadata...</p>
    {:else if store.loadState.status === 'error'}
        <p class="error">Error: {store.loadState.message}</p>
    {:else if store.loadState.status === 'ready'}
        <div class="metadata">
            <span>Duration: {formatTime(store.header?.duration ?? 0)}</span>
            <span>PDUs: {store.header?.totalPdus}</span>
            <span>Time: {formatTime(store.elapsed)}</span>
        </div>
    {/if}

    <div class="canvas-container">
        {#if isBuffering}
            <div class="buffering-overlay">
                <span class="buffering-label">Buffering...</span>
            </div>
        {/if}
        <canvas bind:this={canvas}></canvas>
    </div>

    {#if store.loadState.status === 'ready'}
        <div class="controls">
            {#if isPlaying}
                <button onclick={() => store.pause()} class="control-btn">⏸ Pause</button>
            {:else}
                <button onclick={() => store.play()} class="control-btn" disabled={!canPlay}>
                    {isBuffering ? '⏳ Buffering...' : '▶ Play'}
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    @import './replay-player.css';
</style>
