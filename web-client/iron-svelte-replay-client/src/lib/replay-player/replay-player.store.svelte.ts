import { fetchHeader, fetchIndexTable } from '../fetchRecording.js';
import type { Header, IndexTableRow } from '../../types/recording.types.js';
import type { LoadState } from './replay-player.types.js';

export function createReplayStore() {
	let loadState = $state<LoadState>({ status: 'idle' });
	let header = $state<Header | null>(null);
	let indexTable = $state<IndexTableRow[] | null>(null);

	async function initialiseRecording(url: string): Promise<void> {
		loadState = { status: 'loading' };
		header = null;
		indexTable = null;

		try {
			header = await fetchHeader(url);
			indexTable = await fetchIndexTable(url, header.totalPdus);
			loadState = { status: 'ready' };
		} catch (e) {
			loadState = {
				status: 'error',
				message: e instanceof Error ? e.message : 'Unknown error',
			};
		}
	}

	return {
		get loadState() {
			return loadState;
		},
		get header() {
			return header;
		},
		get indexTable() {
			return indexTable;
		},
		initialiseRecording,
	};
}
