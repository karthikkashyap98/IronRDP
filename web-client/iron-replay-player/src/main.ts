// The custom element class — importing this file registers <iron-replay-player>
export * as default from './iron-replay-player.svelte';

// Public interfaces
export type { ReplayModule, WasmReplayInstance, RenderResult } from './interfaces/ReplayModule.js';
export type { PlayerApi } from './interfaces/PlayerApi.js';
export type { PlaybackState } from './interfaces/PlaybackState.js';
export type { LoadState } from './interfaces/LoadState.js';
export type { ReplayDataSource, ReplayMetadata, ReplayPdu, PlayerError } from './interfaces/ReplayDataSource.js';
