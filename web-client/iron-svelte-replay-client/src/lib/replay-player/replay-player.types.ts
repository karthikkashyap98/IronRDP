export type LoadState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'error'; message: string }
	| { status: 'ready' };

export type FetchOptions = RequestInit | (() => RequestInit | Promise<RequestInit>);

export type PlaybackState = {
	paused: boolean; // user intent: true = wants to be paused, false = wants to play
	waiting: boolean; // buffer not ready: fetch in-flight or data gap at current position
	seeking: boolean; // playhead is mid-jump to a new position (always co-occurs with waiting)
};
