<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getFrameCount, type TimingEntry } from '$lib/pdu-store';
    import type { Replay as ReplayType } from '$lib/wasm/ironrdp_replay_player';

    // WASM module will be imported dynamically
    let Replay: typeof import('$lib/wasm/ironrdp_replay_player').Replay;
    let initWasm: typeof import('$lib/wasm/ironrdp_replay_player').default;
    
    let replay: ReplayType | null = $state(null);
    let isInitialized = $state(false);
    let isPlaying = $state(false);
    let error = $state<string | null>(null);
    let currentFrame = $state(0);
    let totalFrames = $state(0);

    // Canvas rendering
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let cursorCanvas: HTMLCanvasElement | null = null;

    const DB_NAME = 'rdp-pdus';
    const DEFAULT_WIDTH = 1920;
    const DEFAULT_HEIGHT = 1080;

    let canvasWidth = $state(DEFAULT_WIDTH);
    let canvasHeight = $state(DEFAULT_HEIGHT);

    // Timing data from session storage
    let timing: TimingEntry[] = $state([]);
    let currentTimeMs = $state(0);
    let totalDurationMs = $derived(
        timing.length > 0 ? timing[timing.length - 1].timeOffset : 0
    );

    // Progress as percentage
    let progress = $derived(totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0);

    // Controls visibility
    let showControls = $state(true);
    let controlsTimeout: ReturnType<typeof setTimeout>;

    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function handleMouseMove() {
        showControls = true;
        clearTimeout(controlsTimeout);
        if (isPlaying) {
            controlsTimeout = setTimeout(() => {
                showControls = false;
            }, 3000);
        }
    }

    onMount(async () => {
        // Load timing from session storage
        const timingData = sessionStorage.getItem('rdp-timing');
        if (timingData) {
            try {
                timing = JSON.parse(timingData);
            } catch (e) {
                console.error('Failed to parse timing data:', e);
            }
        }

        // Check if we have frames loaded
        const count = await getFrameCount();
        if (count === 0) {
            goto('/');
            return;
        }
        totalFrames = count;

        try {
            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get canvas 2D context');
            }

            const wasmModule = await import('$lib/wasm/ironrdp_replay_player');
            initWasm = wasmModule.default;
            Replay = wasmModule.Replay;
            
            await initWasm();
            isInitialized = true;

            // Auto-create replay instance
            replay = await Replay.create(DB_NAME, DEFAULT_WIDTH, DEFAULT_HEIGHT);
        } catch (e) {
            error = `Failed to initialize: ${e instanceof Error ? e.message : e}`;
        }
    });

    async function togglePlayPause() {
        if (isPlaying) {
            stopReplay();
        } else {
            await startReplay();
        }
    }

    async function startReplay() {
        if (!isInitialized || !Replay || !replay) {
            error = 'Player not ready';
            return;
        }

        try {
            isPlaying = true;
            error = null;
            showControls = false;
            await playFrames();
        } catch (e) {
            error = `Playback error: ${e instanceof Error ? e.message : e}`;
            isPlaying = false;
        }
    }

    function handleUpdates() {
        if (!replay) return;

        if (replay.resolutionChanged) {
            canvasWidth = replay.desktopWidth;
            canvasHeight = replay.desktopHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            replay.clearResolutionChanged();
        }

        if (replay.pointerBitmapChanged) {
            updateCursorCanvas();
            replay.clearPointerBitmapChanged();
        }
    }

    function updateCursorCanvas() {
        if (!replay) return;

        const pointerBitmap = replay.getPointerBitmap();
        if (!pointerBitmap || pointerBitmap.length === 0) {
            cursorCanvas = null;
            return;
        }

        const width = replay.pointerWidth;
        const height = replay.pointerHeight;

        if (width === 0 || height === 0) {
            cursorCanvas = null;
            return;
        }

        cursorCanvas = document.createElement('canvas');
        cursorCanvas.width = width;
        cursorCanvas.height = height;

        const cursorCtx = cursorCanvas.getContext('2d');
        if (!cursorCtx) return;

        const imageData = new ImageData(
            new Uint8ClampedArray(pointerBitmap),
            width,
            height
        );
        cursorCtx.putImageData(imageData, 0, 0);
    }

    function renderFrame() {
        if (!replay || !ctx) return;

        const pixels = replay.getFrameBuffer();
        const imageData = new ImageData(
            new Uint8ClampedArray(pixels),
            replay.width,
            replay.height
        );
        ctx.putImageData(imageData, 0, 0);
        renderCursor();
    }

    function renderCursor() {
        if (!replay || !ctx || !cursorCanvas) return;
        
        const x = replay.mouseX - replay.pointerHotspotX;
        const y = replay.mouseY - replay.pointerHotspotY;
        ctx.drawImage(cursorCanvas, x, y);
    }

    async function playFrames() {
        if (!replay) return;

        let lastTimeOffset = timing[0]?.timeOffset ?? 0;
        currentTimeMs = lastTimeOffset;

        try {
            while (isPlaying) {
                const hasMore = await replay.step();
                currentFrame = replay.currentFrame;
                
                handleUpdates();
                renderFrame();
                
                if (!hasMore) {
                    isPlaying = false;
                    showControls = true;
                    break;
                }

                const currentTiming = timing[currentFrame];
                if (currentTiming) {
                    const delay = currentTiming.timeOffset - lastTimeOffset;
                    currentTimeMs = currentTiming.timeOffset;
                    lastTimeOffset = currentTiming.timeOffset;

                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 16));
                }
            }
        } catch (e) {
            error = `Playback error: ${e instanceof Error ? e.message : e}`;
            isPlaying = false;
            showControls = true;
        }
    }

    function stopReplay() {
        isPlaying = false;
        showControls = true;
    }

    function resetReplay() {
        if (replay) {
            replay.reset();
            currentFrame = 0;
            currentTimeMs = 0;
            
            // Clear canvas to black
            if (ctx) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
        }
    }

    async function stepFrame() {
        if (!replay) return;

        try {
            const hasMore = await replay.step();
            currentFrame = replay.currentFrame;
            
            const currentTiming = timing[currentFrame];
            if (currentTiming) {
                currentTimeMs = currentTiming.timeOffset;
            }
            
            handleUpdates();
            renderFrame();
        } catch (e) {
            error = `Step error: ${e instanceof Error ? e.message : e}`;
        }
    }

    function handleProgressClick(event: MouseEvent) {
        // For now, just show a tooltip - seeking would require WASM changes
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const percent = (event.clientX - rect.left) / rect.width;
        const targetFrame = Math.floor(percent * totalFrames);
        console.log(`Seek to frame ${targetFrame} not yet implemented`);
    }

    function handleKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (!isPlaying) stepFrame();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                resetReplay();
                break;
            case 'KeyR':
                resetReplay();
                break;
        }
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="player-page" onmousemove={handleMouseMove}>
    <nav class="top-bar" class:hidden={!showControls && isPlaying}>
        <a href="/" class="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
        </a>
        <span class="resolution">{canvasWidth} x {canvasHeight}</span>
    </nav>

    {#if error}
        <div class="error-overlay">
            <p>{error}</p>
            <button onclick={() => error = null}>Dismiss</button>
        </div>
    {/if}

    <div class="video-container">
        <canvas 
            bind:this={canvas}
            width={canvasWidth}
            height={canvasHeight}
        ></canvas>

        {#if !isPlaying && currentFrame === 0 && isInitialized}
            <button class="big-play-btn" onclick={startReplay} aria-label="Play">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            </button>
        {/if}
    </div>

    <div class="controls-bar" class:hidden={!showControls && isPlaying}>
        <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
        <div class="progress-container" onclick={handleProgressClick}>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progress}%"></div>
            </div>
        </div>

        <div class="controls">
            <div class="controls-left">
                <button class="control-btn" onclick={togglePlayPause} disabled={!isInitialized}>
                    {#if isPlaying}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"></rect>
                            <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                    {:else}
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    {/if}
                </button>

                <button class="control-btn" onclick={stepFrame} disabled={!isInitialized || isPlaying} title="Step (Right Arrow)">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 15 12 5 21 5 3"></polygon>
                        <rect x="15" y="3" width="4" height="18"></rect>
                    </svg>
                </button>

                <button class="control-btn" onclick={resetReplay} disabled={!replay} title="Reset (R)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                </button>

                <span class="time-display">
                    {formatTime(currentTimeMs)} / {formatTime(totalDurationMs)}
                </span>
            </div>

            <div class="controls-right">
                <span class="frame-display">
                    Frame {currentFrame} / {totalFrames}
                </span>
            </div>
        </div>
    </div>
</div>

<style>
    .player-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        background: #000;
        position: relative;
    }

    .top-bar {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
        z-index: 10;
        transition: opacity 0.3s ease;
    }

    .top-bar.hidden {
        opacity: 0;
        pointer-events: none;
    }

    .back-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        text-decoration: none;
        font-size: 0.9rem;
        opacity: 0.9;
        transition: opacity 0.2s;
    }

    .back-link:hover {
        opacity: 1;
    }

    .back-link svg {
        width: 20px;
        height: 20px;
    }

    .resolution {
        color: #888;
        font-size: 0.85rem;
        font-family: monospace;
    }

    .error-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(248, 113, 113, 0.95);
        color: white;
        padding: 20px 32px;
        border-radius: 12px;
        text-align: center;
        z-index: 20;
    }

    .error-overlay p {
        margin: 0 0 16px 0;
    }

    .error-overlay button {
        background: rgba(0,0,0,0.3);
        border: none;
        color: white;
        padding: 8px 20px;
        border-radius: 6px;
        cursor: pointer;
    }

    .video-container {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        padding: 60px 0 100px 0;
    }

    canvas {
        max-width: 100%;
        max-height: calc(100vh - 160px);
        width: auto;
        height: auto;
        background: #111;
        border-radius: 4px;
    }

    .big-play-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
    }

    .big-play-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%) scale(1.1);
    }

    .big-play-btn svg {
        width: 32px;
        height: 32px;
        color: white;
        margin-left: 4px;
    }

    .controls-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
        padding: 40px 24px 24px 24px;
        transition: opacity 0.3s ease;
    }

    .controls-bar.hidden {
        opacity: 0;
        pointer-events: none;
    }

    .progress-container {
        padding: 8px 0;
        cursor: pointer;
    }

    .progress-bar {
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
        overflow: hidden;
        transition: height 0.1s;
    }

    .progress-container:hover .progress-bar {
        height: 6px;
    }

    .progress-fill {
        height: 100%;
        background: #4a9eff;
        border-radius: 2px;
        transition: width 0.1s ease;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
    }

    .controls-left {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .controls-right {
        display: flex;
        align-items: center;
    }

    .control-btn {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .control-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.1);
    }

    .control-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .control-btn svg {
        width: 20px;
        height: 20px;
    }

    .time-display {
        color: #ccc;
        font-size: 0.85rem;
        font-family: monospace;
        margin-left: 12px;
    }

    .frame-display {
        color: #888;
        font-size: 0.8rem;
        font-family: monospace;
    }
</style>
