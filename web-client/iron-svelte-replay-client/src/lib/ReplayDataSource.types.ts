// These types mirror the component's ReplayDataSource interfaces.
// Structural typing ensures compatibility without a direct package dependency.

export interface ReplayMetadata {
    durationMs: number;
    totalPdus: number;
    initialWidth?: number;
    initialHeight?: number;
}

export interface ReplayPdu {
    timestampMs: number;
    source: number;
    data: Uint8Array;
}

export interface ReplayDataSource {
    open(signal?: AbortSignal): Promise<ReplayMetadata>;
    fetch(fromMs: number, toMs: number, signal: AbortSignal): Promise<ReplayPdu[]>;
    close(): void;
}
