<script lang="ts">
    import { createReplayStore } from './replay-player.store.svelte.js';

    interface Props {
        url: string;
    }

    let { url }: Props = $props();

    const store = createReplayStore();
    let canvas: HTMLCanvasElement;

    $effect(() => {
        if (url) {
            store.initialiseRecording(url);
        }
    });
</script>

<div class="replay-player">
    {#if store.loadState.status === 'loading'}
        <p>Loading...</p>
    {:else if store.loadState.status === 'error'}
        <p class="error">Error: {store.loadState.message}</p>
    {:else if store.loadState.status === 'ready'}
        <div class="metadata">
            <span>Version: {store.header?.version}</span>
            <span>Duration: {store.header?.duration}ms</span>
            <span>PDUs: {store.header?.totalPdus}</span>
        </div>
    {/if}

    <div class="canvas-container">
        <canvas bind:this={canvas}></canvas>
    </div>
</div>

<style>
    @import './replay-player.css';
</style>
