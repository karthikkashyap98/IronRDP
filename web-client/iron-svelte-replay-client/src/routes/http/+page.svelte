<script lang="ts">
    import { onMount } from 'svelte';
    import { init, ReplayBackend } from '../../../static/iron-replay-player-wasm/IronReplayPlayerWasm.js';
    import { HttpRangeDataSource } from '$lib/HttpRangeDataSource.js';

    interface IronReplayPlayerElement extends HTMLElement {
        module: unknown;
        dataSource: unknown;
    }

    const DEFAULT_URL =
        'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_59ee4d0f4822541dd854bf4006b058363f1510fcd468d087ae27f32cca17a47a.bin';

    let url = $state(DEFAULT_URL);
    let loaded = $state(false);
    let playerEl: IronReplayPlayerElement | null = $state(null);

    async function load() {
        if (!url.trim()) return;

        await init();
        loaded = true;

        await new Promise((r) => requestAnimationFrame(r));

        if (playerEl) {
            playerEl.module = ReplayBackend;
            playerEl.dataSource = new HttpRangeDataSource(url.trim());

            playerEl.addEventListener('ready', (e: Event) => {
                const playerApi = (e as CustomEvent).detail.playerApi;
                console.log('Player ready:', playerApi);
            });
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') load();
    }
</script>

{#if !loaded}
    <div class="input-screen">
        <h1>HTTP Byte-Range</h1>
        <p>Enter the URL of a <code>.bin</code> recording.</p>

        <div class="input-row">
            <input type="text" bind:value={url} onkeydown={handleKeydown} />
            <button onclick={load}>Load</button>
        </div>
    </div>
{:else}
    <div class="player-container">
        <iron-replay-player bind:this={playerEl}></iron-replay-player>
    </div>
{/if}

<style>
    .input-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 45px);
    }

    h1 {
        margin: 0 0 4px;
    }

    p {
        color: #666;
        font-size: 14px;
        margin: 0 0 16px;
    }

    .input-row {
        display: flex;
        gap: 8px;
        width: 100%;
        max-width: 600px;
        padding: 0 16px;
        box-sizing: border-box;
    }

    input {
        flex: 1;
        padding: 8px;
        font-family: monospace;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    button {
        padding: 8px 16px;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fafafa;
        cursor: pointer;
    }

    button:hover {
        border-color: #888;
    }

    .player-container {
        width: 100vw;
        height: calc(100vh - 45px);
    }
</style>
