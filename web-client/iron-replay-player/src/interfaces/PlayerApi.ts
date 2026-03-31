import type { LoadState } from './LoadState.js';
import type { PlayerFetchError } from './PlayerFetchError.js';

/** Public API object dispatched via the 'ready' CustomEvent on <iron-replay-player>. */
export interface PlayerApi {
    /** Load a new recording URL. Resets all playback state. */
    load(url: string): Promise<void>;
    /** Start playback. No-op if already playing. */
    play(): void;
    /** Pause playback. No-op if already paused. */
    pause(): void;
    /** Toggle play/pause. Maps to store.togglePlayback(). */
    togglePlayback(): void;
    /** Seek to an absolute position in milliseconds. Maps to store.seek(ms). */
    seek(positionMs: number): Promise<void>;
    /** Set playback speed multiplier (e.g. 1, 1.5, 2, 3). */
    setSpeed(speed: number): void;
    /** Get current elapsed time in milliseconds. */
    getElapsedMs(): number;
    /** Get total duration in milliseconds (0 if not loaded). */
    getDurationMs(): number;
    /** Whether playback is currently paused. */
    isPaused(): boolean;
    /** Current load state — use to check for errors after the player is ready. */
    getLoadState(): LoadState;
    /** Current fetch error, if any. Null when no error is active or after clearError(). */
    getPlayerError(): PlayerFetchError | null;
    /** Reset the active fetch error. Consumer is responsible for retrying the failed operation. */
    clearError(): void;
    /** Seek to position 0, preserving play/pause state. */
    reset(): Promise<void>;
}
