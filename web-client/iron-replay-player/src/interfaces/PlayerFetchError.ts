/** Structured error emitted by the player when a fetch operation fails.
 *
 * Dispatched via the `'error'` CustomEvent on `<iron-replay-player>` and
 * accessible via `PlayerApi.getPlayerError()`.
 *
 * Use `httpStatus` to distinguish auth failures (401/403) from network errors
 * (`httpStatus` is undefined) or server errors (5xx).
 */
export interface PlayerFetchError {
    /** Human-readable error description. */
    message: string;
    /** Lifecycle phase in which the error occurred. */
    phase: 'init' | 'seek' | 'playback';
    /** HTTP status code — present only for HTTP-level errors; undefined for network errors. */
    httpStatus?: number;
}
