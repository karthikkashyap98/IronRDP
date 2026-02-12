<script lang="ts">
    import { onMount } from 'svelte';
    import type { TimingEntry } from './pdu-store';
    import type { Replay as ReplayType } from './wasm/ironrdp_replay_player';
    
    // Props - timing data passed from parent
    let { timing = [] }: { timing?: TimingEntry[] } = $props();

    // WASM module will be imported dynamically
    let Replay: typeof import('./wasm/ironrdp_replay_player').Replay;
    let initWasm: typeof import('./wasm/ironrdp_replay_player').default;
    
    let replay: ReplayType | null = $state(null);
    let isInitialized = $state(false);
    let isPlaying = $state(false);
    let error = $state<string | null>(null);
    let currentFrame = $state(0);
    let status = $state('Not initialized');

    // Canvas rendering
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;

    // Cursor canvas (cached, only rebuilt when bitmap changes)
    let cursorCanvas: HTMLCanvasElement | null = null;

    const DB_NAME = 'rdp-pdus';
    const DEFAULT_WIDTH = 1920;
    const DEFAULT_HEIGHT = 1080;

    // Reactive canvas dimensions
    let canvasWidth = $state(DEFAULT_WIDTH);
    let canvasHeight = $state(DEFAULT_HEIGHT);

    // Time tracking
    let currentTimeMs = $state(0);
    let totalDurationMs = $derived(
        timing.length > 0 ? timing[timing.length - 1].timeOffset : 0
    );

    /**
     * Format milliseconds as MM:SS.mmm
     */
    function formatTime(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = ms % 1000;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
    }

    onMount(async () => {
        try {
            // Initialize canvas context
            ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Failed to get canvas 2D context');
            }

            // Dynamic import of WASM module
            const wasmModule = await import('./wasm/ironrdp_replay_player');
            initWasm = wasmModule.default;
            Replay = wasmModule.Replay;
            
            // Initialize the WASM module
            await initWasm();
            isInitialized = true;
            status = 'WASM loaded - Ready to play';
        } catch (e) {
            error = `Failed to load WASM: ${e instanceof Error ? e.message : e}`;
            status = 'WASM load failed';
        }
    });

    async function startReplay() {
        if (!isInitialized || !Replay) {
            error = 'WASM not initialized';
            return;
        }

        try {
            status = 'Creating replay...';
            replay = await Replay.create(DB_NAME, DEFAULT_WIDTH, DEFAULT_HEIGHT);
            status = 'Replay created - Starting playback';
            isPlaying = true;
            error = null;
            await playFrames();
        } catch (e) {
            error = `Failed to create replay: ${e instanceof Error ? e.message : e}`;
            status = 'Replay creation failed';
            isPlaying = false;
        }
    }

    /**
     * Handle updates signaled by WASM after each step.
     * Checks for resolution and pointer bitmap changes.
     */
    function handleUpdates() {
        if (!replay) return;

        // Handle resolution change
        if (replay.resolutionChanged) {
            canvasWidth = replay.desktopWidth;
            canvasHeight = replay.desktopHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            replay.clearResolutionChanged();
            console.log(`Resolution changed to ${canvasWidth}x${canvasHeight}`);
            status = `Resolution changed to ${canvasWidth}x${canvasHeight}`;
        }

        // Handle pointer bitmap change
        if (replay.pointerBitmapChanged) {
            updateCursorCanvas();
            replay.clearPointerBitmapChanged();
        }
    }

    /**
     * Rebuild the cursor canvas when pointer bitmap changes.
     * Called only when pointerBitmapChanged is true.
     */
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

        // Get RGBA pixel data from WASM
        const pixels = replay.getFrameBuffer();
        // Create ImageData and draw to canvas
        const imageData = new ImageData(
            new Uint8ClampedArray(pixels),
            replay.width,
            replay.height
        );
        ctx.putImageData(imageData, 0, 0);
        
        // Render cursor on top
        renderCursor();
    }

    /**
     * Render the cached cursor canvas at the current mouse position.
     * Uses pre-built cursorCanvas for efficiency.
     */
    function renderCursor() {
        if (!replay || !ctx || !cursorCanvas) return;
        
        // Draw cursor at position (adjusted by hotspot)
        const x = replay.mouseX - replay.pointerHotspotX;
        const y = replay.mouseY - replay.pointerHotspotY;
        
        ctx.drawImage(cursorCanvas, x, y);
    }

    async function playFrames() {
        if (!replay) return;

        // Get starting time offset
        let lastTimeOffset = timing[0]?.timeOffset ?? 0;
        currentTimeMs = lastTimeOffset;

        try {
            while (isPlaying) {
                const hasMore = await replay.step();
                currentFrame = replay.currentFrame;
                
                // Check for resolution/pointer changes
                handleUpdates();
                
                // Render the frame to canvas
                renderFrame();
                
                if (!hasMore) {
                    status = `Replay complete - ${currentFrame} frames processed`;
                    isPlaying = false;
                    break;
                }

                // Calculate delay from timing data
                const currentTiming = timing[currentFrame];
                if (currentTiming) {
                    const delay = currentTiming.timeOffset - lastTimeOffset;
                    currentTimeMs = currentTiming.timeOffset;
                    lastTimeOffset = currentTiming.timeOffset;

                    if (delay > 0) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    // Fallback to fixed delay if no timing data
                    await new Promise(resolve => setTimeout(resolve, 16));
                }
            }
        } catch (e) {
            error = `Playback error: ${e instanceof Error ? e.message : e}`;
            status = 'Playback failed';
            isPlaying = false;
        }
    }

    function stopReplay() {
        isPlaying = false;
        status = `Stopped at frame ${currentFrame}`;
    }

    function resetReplay() {
        if (replay) {
            replay.reset();
            currentFrame = 0;
            currentTimeMs = 0;
            status = 'Reset to beginning';
        }
    }

    async function stepFrame() {
        if (!replay) {
            error = 'No replay loaded';
            return;
        }

        try {
            const hasMore = await replay.step();
            currentFrame = replay.currentFrame;
            
            // Update current time from timing data
            const currentTiming = timing[currentFrame];
            if (currentTiming) {
                currentTimeMs = currentTiming.timeOffset;
            }
            
            // Check for resolution/pointer changes
            handleUpdates();
            
            // Render the frame to canvas
            renderFrame();
            
            if (!hasMore) {
                status = `Replay complete - ${currentFrame} frames processed`;
            } else {
                status = `Stepped to frame ${currentFrame}`;
            }
        } catch (e) {
            error = `Step error: ${e instanceof Error ? e.message : e}`;
        }
    }
</script>

<div class="replay-player">
    <h2>Replay Player</h2>

    <div class="status-section">
        <p class="status">Status: <strong>{status}</strong></p>
        <p class="frame-counter">Frame: <strong>{currentFrame}</strong> / {timing.length || '?'}</p>
        <p class="mouse-position">Mouse: <strong>({replay?.mouseX ?? 0}, {replay?.mouseY ?? 0})</strong></p>
    </div>

    {#if error}
        <div class="error">
            {error}
        </div>
    {/if}

    <div class="controls">
        {#if !isPlaying}
            <button 
                class="btn play" 
                onclick={startReplay}
                disabled={!isInitialized}
            >
                ▶ Play
            </button>
        {:else}
            <button 
                class="btn stop" 
                onclick={stopReplay}
            >
                ⏹ Stop
            </button>
        {/if}

        <button 
            class="btn step" 
            onclick={stepFrame}
            disabled={!isInitialized || isPlaying}
        >
            ⏭ Step
        </button>

        <button 
            class="btn reset" 
            onclick={resetReplay}
            disabled={!replay}
        >
            ⏮ Reset
        </button>
    </div>

    <div class="canvas-container">
        <canvas 
            bind:this={canvas}
            width={canvasWidth}
            height={canvasHeight}
        ></canvas>
    </div>

    <div class="info">
        <p><small>Database: {DB_NAME}</small></p>
        <p><small>Resolution: {canvasWidth}x{canvasHeight}</small></p>
    </div>
</div>

<style>
    .replay-player {
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 100%;
        margin: 20px auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #f5f5f5;
    }

    .canvas-container {
        margin: 15px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
        background: #000;
    }

    canvas {
        display: block;
        width: 100%;
        height: auto;
        max-width: 100%;
    }

    h2 {
        margin-top: 0;
        color: #333;
    }

    .status-section {
        background: white;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 15px;
    }

    .status-section p {
        margin: 5px 0;
    }

    .error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 15px;
    }

    .controls {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }

    .btn {
        flex: 1;
        padding: 12px 20px;
        font-size: 14px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn.play {
        background: #28a745;
        color: white;
    }

    .btn.play:hover:not(:disabled) {
        background: #218838;
    }

    .btn.stop {
        background: #dc3545;
        color: white;
    }

    .btn.stop:hover:not(:disabled) {
        background: #c82333;
    }

    .btn.step {
        background: #17a2b8;
        color: white;
    }

    .btn.step:hover:not(:disabled) {
        background: #138496;
    }

    .btn.reset {
        background: #6c757d;
        color: white;
    }

    .btn.reset:hover:not(:disabled) {
        background: #5a6268;
    }

    .info {
        color: #666;
        font-size: 12px;
    }

    .info p {
        margin: 2px 0;
    }
</style>
