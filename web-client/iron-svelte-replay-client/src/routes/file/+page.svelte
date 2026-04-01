<script lang="ts">
    import { onMount } from 'svelte';
    import { init, ReplayBackend } from '../../../static/iron-replay-player-wasm/IronReplayPlayerWasm.js';
    import { LocalFileDataSource } from '$lib/LocalFileDataSource.js';

    interface IronReplayPlayerElement extends HTMLElement {
        module: unknown;
        dataSource: unknown;
    }

    let loaded = $state(false);
    let playerEl: IronReplayPlayerElement | null = $state(null);

    async function handleFile(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        await init();
        loaded = true;

        await new Promise((r) => requestAnimationFrame(r));

        if (playerEl) {
            playerEl.module = ReplayBackend;
            playerEl.dataSource = new LocalFileDataSource(file);

            playerEl.addEventListener('ready', (e: Event) => {
                const playerApi = (e as CustomEvent).detail.playerApi;
                console.log('Player ready:', playerApi);
            });
        }
    }
</script>

{#if !loaded}
    <div class="input-screen">
        <h1>Local File</h1>
        <p>Select a <code>.bin</code> recording file.</p>

        <label class="file-picker">
            <input type="file" accept=".bin" onchange={handleFile} />
            <span>Choose File</span>
        </label>
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

    .file-picker {
        cursor: pointer;
    }

    .file-picker input {
        display: none;
    }

    .file-picker span {
        display: inline-block;
        padding: 8px 16px;
        font-size: 14px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background: #fafafa;
    }

    .file-picker span:hover {
        border-color: #888;
    }

    .player-container {
        width: 100vw;
        height: calc(100vh - 45px);
    }
</style>
