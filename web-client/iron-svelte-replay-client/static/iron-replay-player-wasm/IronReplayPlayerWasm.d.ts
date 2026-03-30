/**
 * Initialize the WASM module. Must be called once before constructing Replay instances.
 */
export declare function init(): Promise<void>;

/**
 * Direction/source of a PDU in the recording
 */
export declare enum PduSource {
    /**
     * PDU from client (C→S)
     */
    Client = 0,
    /**
     * PDU from server (S→C)
     */
    Server = 1,
}

/**
 * Result returned to JS after render_till() completes
 */
declare class RenderResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Current playhead position after rendering
     */
    current_time_ms: number;
    /**
     * Number of PDUs processed in this call
     */
    pdus_processed: number;
    /**
     * Whether the desktop resolution changed during this render
     */
    resolution_changed: boolean;
}

declare class Replay {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Unconditionally blit the current in-memory framebuffer to the canvas.
     *
     * Call this after a seek's fast-forward loop to display the final frame.
     * `renderTill` alone is insufficient here because all PDUs up to the seek
     * target have already been consumed by the chunk loop, so its inner loop
     * processes zero PDUs and `draw_to_canvas` is never reached.
     */
    forceRedraw(): void;
    constructor(canvas: HTMLCanvasElement);
    /**
     * Push a single PDU into the internal buffer.
     * Called by JS (PduFetcher) to feed PDU data before calling renderTill().
     */
    pushPdu(timestamp_ms: number, source: PduSource, data: Uint8Array): void;
    /**
     * Process all PDUs up to `target_ms` and blit the resulting framebuffer to canvas.
     */
    renderTill(target_ms: number): RenderResult;
    /**
     * Reset playback state to the beginning.
     *
     * # Caller contract
     * The canvas is not cleared by this method. The caller is responsible for
     * not displaying the canvas between reset() and the first render_till() call.
     */
    reset(): void;
    /**
     * Enable or disable canvas updates during rendering.
     * Set to false during seek fast-forward to suppress intermediate frame blits.
     */
    setUpdateCanvas(update: boolean): void;
}

/**
 * ReplayBackend satisfies the ReplayModule interface expected by iron-replay-player.
 * Pass this as the `module` prop to <iron-replay-player>.
 */
export declare const ReplayBackend: {
    Replay: typeof Replay;
    PduSource: typeof PduSource;
};

export { }
