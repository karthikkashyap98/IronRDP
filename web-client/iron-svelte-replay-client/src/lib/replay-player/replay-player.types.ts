export type LoadState =
	| { status: 'idle' }
	| { status: 'loading' }
	| { status: 'error'; message: string }
	| { status: 'ready' };

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering';
