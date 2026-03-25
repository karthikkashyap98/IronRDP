import { fetchHeader, fetchIndexTable } from './buffer/fetchRecording.js';
import type { Header, IndexTableRow } from '../../types/recording.types.js';
import type { LoadState, PlaybackState } from './replay-player.types.js';
import { PduFetcher } from './buffer/PduFetcher.js';
import type { WasmReplay } from './wasm/index.js';

const BUFFER_TARGET_MS = 10_000;       // target: keep 10s buffered ahead
const BUFFER_LOW_THRESHOLD_MS = 5_000; // trigger prefetch when < 5s ahead
const BUFFER_CRITICALLY_LOW_MS = 500; // trigger buffering state and load 

export function createReplayStore() {
	// --- Load state ---
	let loadState = $state<LoadState>({ status: 'idle' });
	let header = $state<Header | null>(null);
	let indexTable = $state<IndexTableRow[] | null>(null);

	// --- Playback state ---
	let playbackState = $state<PlaybackState>('idle');
	let elapsed = $state(0);
	let speed = $state(3.0);

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

	// --- Play: eagerly fill buffer then start rAF loop ---
	async function play(): Promise<void> {
		if (playbackState === 'playing') return;
		if (!fetcher || !wasmReplay) return;

		playbackState = 'buffering';

		try {
			console.log("inside play fetch")
			await fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS);
		} catch (e) {
			loadState = {
				status: 'error',
				message: e instanceof Error ? e.message : 'Failed to fetch PDUs',
			};
			playbackState = 'paused';
			return;
		}

		playbackState = 'playing';
		lastTimestamp = performance.now();
		rafId = requestAnimationFrame(tick);
	}

	// --- Pause: cancel rAF loop ---
	function pause(): void {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		if (playbackState === 'playing') {
			playbackState = 'paused';
		}
	}

	// --- rAF tick callback ---
	function tick(now: DOMHighResTimeStamp): void {
		if (!fetcher || !wasmReplay || lastTimestamp === null) return;

		const duration = header?.duration ?? 0;

		// Advance elapsed time
		const delta = now - lastTimestamp;
		lastTimestamp = now;
		elapsed = Math.min(elapsed + delta * speed, duration);

		// Render PDUs from last processed to elapsed
		wasmReplay.renderTill(elapsed);


		// Check if playback has reached the end
		if (elapsed >= duration) {
			pause();
			playbackState = 'idle';
			return;
		}

		// Buffer health check
		const bufferAhead = fetcher.nextUnfetchedTimestamp - elapsed;

		if (bufferAhead <= BUFFER_CRITICALLY_LOW_MS) {
			// Buffer completely empty — pause until it completes
			console.log("marked for buffer")
			playbackState = 'buffering';
			if (rafId !== null) {
				console.log("cancelled RAF");
				cancelAnimationFrame(rafId);
				rafId = null;
			}
			fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS).then(() => {
				console.log("fetch ended");
				if (playbackState === 'buffering') {
					console.log("playing now")
					play();
				}
			});
			return;
		}

		if (bufferAhead < BUFFER_LOW_THRESHOLD_MS) {
			// Buffer getting low — prefetch more (fire-and-forget, deduplicates internally)
			fetcher.fetchUntilTime(elapsed + BUFFER_TARGET_MS);
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

		// Playback controls
		play,
		pause,
		setWasmReplay,
	};
}
