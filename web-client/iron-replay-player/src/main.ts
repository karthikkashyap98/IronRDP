// The custom element class — importing this file registers <iron-replay-player>
export * as default from './iron-replay-player.svelte';

// Public interfaces
export type { ReplayModule, WasmReplayInstance, RenderResult } from './interfaces/ReplayModule.js';
export type { PlayerApi } from './interfaces/PlayerApi.js';
export type { PlaybackState } from './interfaces/PlaybackState.js';
export type { LoadState } from './interfaces/LoadState.js';
export type { PlayerFetchError } from './interfaces/PlayerFetchError.js';

// Recording fetch utilities (for consumers who want to prefetch metadata)
export { fetchHeader, fetchIndexTable, FetchHttpError } from './services/fetchRecording.js';
export type { Header, IndexTableRow, PDUEntry, FetchOptions } from './services/fetchRecording.js';
