import { fetchHeader, fetchIndexTable } from './buffer/fetchRecording.js';
import type { Header, IndexTableRow } from '../../types/recording.types.js';
import type { LoadState, PlaybackState } from './replay-player.types.js';
import { PduFetcher } from './buffer/PduFetcher.js';
import type { WasmReplay } from './wasm/index.js';

const BUFFER_TARGET_MS = 15_000;       // target: keep 10s buffered ahead
const BUFFER_LOW_THRESHOLD_MS = 5_000; // trigger prefetch when < 5s ahead
const BUFFER_CRITICALLY_LOW_MS = 500; // trigger buffering state and load 

export function createReplayStore() {
	// --- Load state ---
	let loadState = $state<LoadState>({ status: 'idle' });
	let header = $state<Header | null>(null);
	let indexTable = $state<IndexTableRow[] | null>(null);

	// --- Playback state ---
	let playbackState = $state<PlaybackState>({ paused: true, waiting: false, seeking: false });
	let elapsed = $state(0);
	let speed = $state(1.0);
	let fetchedUntilMs = $state(0); // reactive: furthest timestamp (ms) of PDUs pushed to WASM

	// --- Internal refs ---
	let rafId: number | null = null;
	let lastTimestamp: DOMHighResTimeStamp | null = null;
	let fetcher: PduFetcher | null = null;
	let wasmReplay: WasmReplay | null = null;

	// --- Load recording metadata ---
	async function initialiseRecording(url: string): Promise<void> {
		loadState = { status: 'loading' };
		header = null;
		indexTable = null;

		try {
			header = { ...(await fetchHeader(url)), duration: 760000 };
			indexTable = await fetchIndexTable(url, header.totalPdus);
			loadState = { status: 'ready' };
		} catch (e) {
			loadState = {
				status: 'error',
				message: e instanceof Error ? e.message : 'Unknown error',
			};
		}
	}

	// --- Wire in WASM replay instance (called from component after WASM loads) ---
	function setWasmReplay(replay: WasmReplay, url: string): void {
		if (!indexTable) return;
		wasmReplay = replay;
		fetcher = new PduFetcher(url, indexTable, wasmReplay);
	}

	// --- Play: record intent, fill buffer, then start rAF loop ---
	async function play(): Promise<void> {
		if (!fetcher || !wasmReplay) return;

		playbackState = { ...playbackState, paused: false, waiting: true };

		try {
			await fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS);
			fetchedUntilMs = fetcher.nextUnfetchedTimestamp;
		} catch (e) {
			loadState = {
				status: 'error',
				message: e instanceof Error ? e.message : 'Failed to fetch PDUs',
			};
			playbackState = { ...playbackState, paused: true, waiting: false };
			return;
		}

		// Only start the loop if the user hasn't paused in the meantime
		if (!playbackState.paused) {
			playbackState = { ...playbackState, waiting: false };
			lastTimestamp = performance.now();
			rafId = requestAnimationFrame(tick);
		} else {
			playbackState = { ...playbackState, waiting: false };
		}
	}

	// --- Pause: record intent, cancel rAF loop (fetch continues unaffected) ---
	function pause(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		playbackState = { ...playbackState, paused: true };
	}

	// --- Speed: set playback speed ---
	function setSpeed(value: number): void {
		speed = value;
	}

	// --- rAF tick callback ---
	function tick(now: DOMHighResTimeStamp): void {
		if (!fetcher || !wasmReplay || lastTimestamp === null) return;

		const duration = header?.duration ?? 0;

		// Advance elapsed time
		const delta = now - lastTimestamp;
		lastTimestamp = now;
		elapsed = Math.min(elapsed + delta * speed, duration);

		// Render PDUs up to elapsed
		wasmReplay.renderTill(elapsed);

		// Check if playback has reached the end
		if (elapsed >= duration) {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			playbackState = { ...playbackState, paused: true };
			return;
		}

		// Buffer health check
		const bufferAhead = fetcher.nextUnfetchedTimestamp - elapsed;

		if (bufferAhead <= BUFFER_CRITICALLY_LOW_MS) {
			// Buffer empty — freeze playback, fetch more, resume when ready
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			playbackState = { ...playbackState, waiting: true };

			fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS).then(() => {
				fetchedUntilMs = fetcher!.nextUnfetchedTimestamp;
				// Only resume rAF if user still wants to play
				if (!playbackState.paused) {
					playbackState = { ...playbackState, waiting: false };
					lastTimestamp = performance.now();
					rafId = requestAnimationFrame(tick);
				} else {
					playbackState = { ...playbackState, waiting: false };
				}
			}).catch((e: unknown) => {
				loadState = {
					status: 'error',
					message: e instanceof Error ? e.message : 'Failed to fetch PDUs',
				};
				playbackState = { ...playbackState, waiting: false, paused: true };
			});
			return;
		}

		if (bufferAhead < BUFFER_LOW_THRESHOLD_MS) {
			// Buffer getting low — prefetch more, update fetchedUntilMs when done
			fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS).then(() => {
				fetchedUntilMs = fetcher!.nextUnfetchedTimestamp;
			});
		}

		// Schedule next tick
		rafId = requestAnimationFrame(tick);
	}

	return {
		// Load state
		get loadState() { return loadState; },
		get header() { return header; },
		get indexTable() { return indexTable; },
		initialiseRecording,

		// Playback state
		get playbackState() { return playbackState; },
		get elapsed() { return elapsed; },
		get speed() { return speed; },
		get fetchedUntilMs() { return fetchedUntilMs; },

		// Playback controls
		play,
		pause,
		setSpeed,
		setWasmReplay,
	};
}
