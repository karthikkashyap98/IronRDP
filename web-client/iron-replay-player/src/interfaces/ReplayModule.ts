/**
 * Shape of the RenderResult struct returned by renderTill().
 * Matches crates/ironrdp-web-replay/src/replay.rs RenderResult fields.
 */
export interface RenderResult {
    current_time_ms: number;
    pdus_processed: number;
    resolution_changed: boolean;
    session_ended: boolean;
}

/**
 * Minimal interface for a single WASM replay engine instance.
 *
 * pushPdu `source` note: The Rust signature takes `PduSource` enum (Client=0, Server=1).
 * Typed as `number` here because PduFetcher uses numeric literals (0/1) and cannot
 * easily access `module.PduSource` without additional threading. The numeric values
 * are compatible at runtime since wasm-bindgen enums are number-backed.
 */
export interface WasmReplayInstance {
    free(): void;
    /** source: 0 = Client, 1 = Server (matches PduSource enum wire values) */
    pushPdu(timestamp_ms: number, source: number, data: Uint8Array): void;
    renderTill(target_ms: number): RenderResult;
    reset(): void;
    setUpdateCanvas(update: boolean): void;
    /** Unconditionally blit the current framebuffer to the canvas. Used after seek. */
    forceRedraw(): void;
}

/**
 * Dependency-injection interface for the WASM replay backend.
 * iron-replay-player depends on this interface only — not on any specific WASM import.
 * iron-replay-player-wasm's ReplayBackend satisfies this interface.
 */
export interface ReplayModule {
    /** Construct a new replay engine bound to a canvas element. */
    Replay: { new (canvas: HTMLCanvasElement): WasmReplayInstance };
    /**
     * PduSource enum: at minimum exposes Client and Server as number values.
     * wasm-bindgen generates this as a plain object with numeric properties.
     */
    PduSource: Record<string, number>;
}
