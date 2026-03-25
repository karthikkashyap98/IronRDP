import init, { Replay, PduSource } from '../../../../../../crates/ironrdp-web-replay/pkg/ironrdp_web_replay.js';

export { PduSource };

/** Minimal interface for the WASM Replay engine used across the replay player */
export interface WasmReplay {
	free(): void;
	pushPdu(timestamp_ms: number, source: number, data: Uint8Array): void;
	renderTill(target_ms: number): unknown;
}

export async function initWasm(): Promise<void> {
	await init();
}

export { Replay };
