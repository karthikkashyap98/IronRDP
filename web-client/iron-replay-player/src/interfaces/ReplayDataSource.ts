// web-client/iron-replay-player/src/interfaces/ReplayDataSource.ts

export interface ReplayMetadata {
    durationMs: number;
    totalPdus: number;
    initialWidth?: number;
    initialHeight?: number;
}

export interface ReplayPdu {
    timestampMs: number;
    source: number; // 0 = Client (C->S), 1 = Server (S->C)
    data: Uint8Array;
}

export interface ReplayDataSource {
    /**
     * Called once when the component initializes.
     * Consumer parses headers / reads metadata, resolves when ready.
     * If this rejects, the component transitions to LoadState 'error'.
     * close() is NOT called after a rejected open() — the consumer must
     * clean up partial state in the rejection path.
     */
    open(signal?: AbortSignal): Promise<ReplayMetadata>;

    /**
     * Return PDUs within [fromMs, toMs), sorted by timestampMs ascending.
     * Returns empty array if range contains no PDUs.
     * Signal allows cancellation on seek or teardown.
     *
     * Contract:
     * - Must not return PDUs outside [fromMs, toMs).
     * - The data field must remain valid until the promise settles.
     *   The component consumes data synchronously and does not retain references.
     */
    fetch(fromMs: number, toMs: number, signal: AbortSignal): Promise<ReplayPdu[]>;

    /**
     * Called on component teardown. Fire-and-forget.
     * Consumer handles async cleanup internally.
     */
    close(): void;
}

export interface PlayerError {
    message: string;
    phase: 'init' | 'seek' | 'playback';
    cause?: unknown;
}
