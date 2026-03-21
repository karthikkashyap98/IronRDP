import { fetchFileRanges } from './fetchRecording.js';
import type { IndexTableRow } from '../../../types/recording.types.js';
import type { WasmReplay } from '../wasm/index.js';

export type { WasmReplay };

// PduSource values match the WASM enum (buffer.rs): Client = 0, Server = 1
const PDU_SOURCE_CLIENT = 0;
const PDU_SOURCE_SERVER = 1;

/**
 * Fetches PDU data from the recording file and pushes entries into the WASM buffer.
 *
 * Tracks fetch position in the index table so each call to fetchUntilTime()
 * only fetches new data not yet pushed. Concurrent fetches are deduplicated via
 * a promise guard — if a fetch is in-flight, subsequent calls return the same
 * promise so all callers can await actual completion.
 */
export class PduFetcher {
	private readonly url: string;
	private readonly indexTable: IndexTableRow[];
	private readonly wasmReplay: WasmReplay;

	private _nextFetchIndex = 0;
	private _lastPushedTimestamp = 0;
	private _fetchingPromise: Promise<void> | null = null;

	constructor(url: string, indexTable: IndexTableRow[], wasmReplay: WasmReplay) {
		this.url = url;
		this.indexTable = indexTable;
		this.wasmReplay = wasmReplay;
	}

	/** True while a fetch is in-flight. */
	get isFetching(): boolean {
		return this._fetchingPromise !== null;
	}

	/** Timestamp (ms) of the last PDU pushed to WASM. Used for buffer health checks. */
	get lastPushedTimestamp(): number {
		return this._lastPushedTimestamp;
	}

	get nextUnfetchedTimestamp(): number {
		if (this._nextFetchIndex >= this.indexTable.length) {
			return Infinity;  // All fetched
		}
		return this.indexTable[this._nextFetchIndex].timeOffset;
	}

	/**
	 * Fetch all PDUs with timeOffset <= targetMs and push them to WASM.
	 *
	 * If a fetch is already in-flight, returns the existing promise so callers
	 * can await actual completion (e.g. for buffering resume logic).
	 *
	 * Returns an already-resolved promise if:
	 * - The buffer already covers targetMs
	 * - All PDUs have been fetched
	 * - No PDUs fall within the requested range
	 *
	 * On error, releases the guard and rejects with an error message.
	 */
	async fetchUntilTime(targetMs: number): Promise<void> {
		// Return existing promise if fetch in-flight — callers get the real completion signal
		if (this._fetchingPromise !== null) {
			return this._fetchingPromise;
		}

		// Early exits — no fetch needed
		if (this._lastPushedTimestamp >= targetMs) return;
		if (this._nextFetchIndex >= this.indexTable.length) return;

		const targetIndex = this.binarySearchTarget(targetMs);
		if (targetIndex < this._nextFetchIndex) return;

		this._fetchingPromise = this.doFetch(targetIndex);

		try {
			await this._fetchingPromise;
		} finally {
			this._fetchingPromise = null;
		}
	}

	private async doFetch(targetIndex: number): Promise<void> {
		const startEntry = this.indexTable[this._nextFetchIndex];
		const endEntry = this.indexTable[targetIndex];

		const startByte = Number(startEntry.byteOffset);
		const endByte = Number(endEntry.byteOffset) + endEntry.pduLength - 1;

		let buffer: ArrayBuffer;
		try {
			buffer = await fetchFileRanges(this.url, startByte, endByte);
		} catch (e) {
			throw new Error(`Network error fetching bytes ${startByte}-${endByte}: ${e}`);
		}

		// Single view over the entire fetched buffer — avoids per-PDU allocation
		const fullView = new Uint8Array(buffer);

		for (let i = this._nextFetchIndex; i <= targetIndex; i++) {
			const entry = this.indexTable[i];
			const entryStart = Number(entry.byteOffset) - startByte;
			// subarray() returns a view (no copy) — WASM pushPdu copies into linear memory
			const pduBytes = fullView.subarray(entryStart, entryStart + entry.pduLength);

			// direction: 0 = Client-sourced (C→S), 1 = Server-sourced (S→C)
			const source = entry.direction === 0 ? PDU_SOURCE_CLIENT : PDU_SOURCE_SERVER;
			try {
				this.wasmReplay.pushPdu(entry.timeOffset, source, pduBytes);
			} catch (e) {
				throw new Error(`Wasm error pushing PDU index ${i}: ${e}`);
			}

			// Update state after each successful push so partial failures leave state consistent
			this._nextFetchIndex = i + 1;
			this._lastPushedTimestamp = entry.timeOffset;
		}
	}

	/**
	 * Binary search for the last index table entry with timeOffset <= targetMs.
	 * Search starts from _lastFetchedIndex (already-fetched entries are skipped).
	 * Returns _lastFetchedIndex - 1 if all remaining entries are after targetMs.
	 */
	private binarySearchTarget(targetMs: number): number {
		let lo = this._nextFetchIndex;
		let hi = this.indexTable.length - 1;
		let result = this._nextFetchIndex - 1;

		while (lo <= hi) {
			const mid = (lo + hi) >>> 1;
			if (this.indexTable[mid].timeOffset <= targetMs) {
				result = mid;
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		return result;
	}
}
