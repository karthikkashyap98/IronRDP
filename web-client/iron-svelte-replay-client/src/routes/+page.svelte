<script lang="ts">
    import { onMount } from 'svelte';
    import { init, ReplayBackend } from '../../static/iron-replay-player-wasm/IronReplayPlayerWasm.js';
    import { HttpRangeDataSource } from '$lib/HttpRangeDataSource.js';

    const testUrl =
        'http://localhost:8000/e215009e7cb9ca3d71613d5454d8bd1c_59ee4d0f4822541dd854bf4006b058363f1510fcd468d087ae27f32cca17a47a.bin';
    
    // const testUrl = 'http://localhost:8000/'

    let playerEl: HTMLElement | null = null;

    onMount(async () => {
        await init();

        if (playerEl) {
            // Rich object props must be set as JS properties, not HTML attributes
            (playerEl as unknown as Record<string, unknown>).module = ReplayBackend;
            (playerEl as unknown as Record<string, unknown>).dataSource = new HttpRangeDataSource(testUrl);

            playerEl.addEventListener('ready', (e: Event) => {
                const customEvent = e as CustomEvent;
                const playerApi = customEvent.detail.playerApi;
                console.log('Player ready:', playerApi);
            });
        }
    });
</script>

<div style="width: 100vw; height: 100vh;">
    <iron-replay-player bind:this={playerEl}></iron-replay-player>
</div>

<style>
    :global(body) {
        margin: 0px;
    }
</style>
