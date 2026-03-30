# iron-replay-player

Reusable framework-agnostic web component (`<iron-replay-player>`) for RDP session replay.
Decoding is handled by a WASM engine injected at runtime via the `module` prop.

## Quick start

```html
<script type="module">
  import '@devolutions/iron-replay-player';
  import { init, ReplayBackend } from './iron-replay-player-wasm/IronReplayPlayerWasm.js';

  await init();

  const player = document.querySelector('iron-replay-player');

  // Rich props must be set as JS properties, not HTML attributes
  player.module = ReplayBackend;
  player.url = 'https://example.com/recording.bin';

  // Static form: headers evaluated once
  player.fetchOptions = { headers: { Authorization: 'Bearer <token>' } };

  // Callback form: invoked fresh on every fetch — use this for token rotation
  player.fetchOptions = async () => ({
    headers: { Authorization: `Bearer ${await getToken()}` },
  });

  player.addEventListener('ready', (e) => {
    const api = e.detail.playerApi; // PlayerApi
    api.togglePlayback();
  });
</script>

<iron-replay-player style="width: 100%; height: 100%;"></iron-replay-player>
```

> **Important:** `module` and `url` must be set as JS properties on the element instance,
> not as HTML attributes. wasm-bindgen objects cannot be serialised as attribute strings.

## Props

| Prop           | Type           | Description                                                                                                                                                                                                                 |
| -------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`          | `string`       | URL of the recording file. The server must support HTTP `Range` requests.                                                                                                                                                   |
| `module`       | `ReplayModule` | WASM backend to use for decoding. See [Module injection](#module-injection).                                                                                                                                                |
| `fetchOptions` | `FetchOptions` | Optional. Static `RequestInit` or a sync/async callback returning one. Merged into every fetch; `Range` always wins. Use the callback form for token rotation — it is invoked fresh per fetch without reloading the player. |

## Events

### `ready`

Fired once WASM is initialised and the recording metadata is loaded.
`event.detail.playerApi` exposes the `PlayerApi` for programmatic control.

```ts
player.addEventListener('ready', (e: CustomEvent) => {
  const api: PlayerApi = e.detail.playerApi;
});
```

### `error`

Fired when a fetch operation fails — covers initial load failures (network errors,
HTTP errors, corrupt recordings), WASM init failures, and mid-playback fetch/seek
failures. `event.detail` is a `PlayerFetchError`.

```ts
player.addEventListener('error', (e: CustomEvent<PlayerFetchError>) => {
  const err = e.detail;
  console.error(`[${err.phase}] ${err.message}`, err.httpStatus);
});
```

The error is held until the consumer calls `api.clearError()`. A new error will not
be reported until the previous one is cleared (first-error-wins). The inline error
message inside the component is independent and clears when a new load starts.

## PlayerApi

Returned via the `ready` event. All methods are synchronous except `seek`, which is async internally but returns `void`.

| Method           | Signature                        | Description                                                                              |
| ---------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `load`           | `(url: string) => void`          | Load a new recording. Resets all playback state.                                         |
| `togglePlayback` | `() => void`                     | Toggle between play and pause.                                                           |
| `seek`           | `(positionMs: number) => void`   | Jump to an absolute position in milliseconds.                                            |
| `setSpeed`       | `(speed: number) => void`        | Set playback speed multiplier (e.g. `1`, `1.5`, `2`, `3`).                               |
| `getElapsedMs`   | `() => number`                   | Current playhead position in milliseconds.                                               |
| `getDurationMs`  | `() => number`                   | Total recording duration in milliseconds (`0` if not yet loaded).                        |
| `isPaused`       | `() => boolean`                  | Whether playback is currently paused.                                                    |
| `getLoadState`   | `() => LoadState`                | Current load state. Use to check for errors programmatically after the `ready` event.    |
| `getPlayerError` | `() => PlayerFetchError \| null` | Current fetch error, or `null` if none active.                                           |
| `clearError`     | `() => void`                     | Reset the active fetch error. Consumer is responsible for retrying the failed operation. |

## Module injection

The component has no hard dependency on a specific WASM build. The `ReplayModule` interface
describes what the component needs; the concrete implementation is provided by the
`iron-replay-player-wasm` package, which wraps the compiled `ironrdp-web-replay` crate.

```ts
import type { ReplayModule } from '@devolutions/iron-replay-player';
```

`ReplayModule` requires:

- `Replay` — a class constructable with a `HTMLCanvasElement`, implementing `WasmReplayInstance`
- `PduSource` — an object with numeric `Client` and `Server` values

## Server requirements

The recording server must respond to HTTP `Range` requests with `206 Partial Content`.
The component fetches only the header and index table up front, then streams PDU data
on demand using byte-range requests. A server that returns `200` for range requests will
cause a parse error.

See [Recording file format](#recording-file-format) below.

## Exported types

All public TypeScript types are re-exported from the package entry point:

```ts
import { FetchHttpError } from '@devolutions/iron-replay-player'; // class — use instanceof for checks
import type {
  ReplayModule, // interface for the WASM backend
  WasmReplayInstance, // interface for a single Replay engine instance
  FetchOptions, // RequestInit object or () => RequestInit | Promise<RequestInit>
  PlayerFetchError, // { message, phase, httpStatus? } — detail of the 'error' event
  PlayerApi, // programmatic control handle (from 'ready' event)
  PlaybackState, // { paused, waiting, seeking }
  LoadState, // 'idle' | 'loading' | 'ready' | { status: 'error', message }
  Header, // recording header fields
  IndexTableRow, // one row of the PDU index table
} from '@devolutions/iron-replay-player';
```

## Auth and token refresh

For long-lived sessions where tokens can expire mid-playback, use the async callback
form of `fetchOptions` and mutate the captured token variable on `error`.

> **Important:** do NOT reassign `player.fetchOptions` during `playback`/`seek` error
> handling — that triggers a full reload and loses the playback position. Only mutate
> the variable captured by the callback closure.

```ts
let currentToken = await getInitialToken();

// Set the callback ONCE — never reassign for playback/seek retry
player.fetchOptions = async () => ({
  headers: { Authorization: `Bearer ${currentToken}` },
});

player.addEventListener('ready', (e: CustomEvent) => {
  const api: PlayerApi = e.detail.playerApi;

  player.addEventListener('error', async (e: CustomEvent<PlayerFetchError>) => {
    const err = e.detail;
    if (err.httpStatus === 401) {
      currentToken = await refreshToken(); // mutate closure variable — no reload
      api.clearError();
      if (err.phase === 'playback') api.togglePlayback();
      if (err.phase === 'seek') api.seek(api.getElapsedMs());
      if (err.phase === 'init') api.load(player.url); // reload is fine at init
    }
  });
});
```

## Development

**Prerequisites:** Node.js + npm, Rust toolchain with `wasm-pack` (`cargo xtask wasm install`).

This package sits in a three-step build chain. Run each step from its own directory:

```sh
# Step 1: compile the Rust crate to WASM (run from repo root)
cargo xtask web build-replay

# Step 2: build the WASM JS wrapper
cd web-client/iron-replay-player-wasm && npm run build

# Step 3: build this component library (outputs to dist/)
cd web-client/iron-replay-player && npm run build
```

> `iron-svelte-replay-client/pre-build.js` runs all three steps automatically when you
> run `npm run build` or `npm run dev-all` from that package — you only need to run
> them manually when working on `iron-replay-player` or `iron-replay-player-wasm` directly.

```sh
# Type check only
npm run check

# Watch mode type checking
npm run check:watch
```

## Recording file format

The recording is a self-contained binary file with three consecutive sections.
All multi-byte integers are **big-endian**.

### Header (20 bytes)

| Offset | Size    | Field       | Description                                                                                                                                     |
| ------ | ------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | 4 bytes | `version`   | Header format version (`uint32`)                                                                                                                |
| 4      | 8 bytes | `totalPdus` | Total number of PDUs in the recording (`uint64`)                                                                                                |
| 12     | 8 bytes | `duration`  | Total session duration in milliseconds (`uint64`). May be `0` in some recordings — fall back to the `timeOffset` of the last index table entry. |

### Index table (17 bytes × `totalPdus`)

Immediately follows the header. Each row describes one PDU, enabling random-access
byte-range fetching without scanning the full file.

| Offset | Size    | Field        | Description                                                                                                                           |
| ------ | ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0      | 4 bytes | `timeOffset` | Milliseconds since session start (`uint32`)                                                                                           |
| 4      | 4 bytes | `pduLength`  | Length of this PDU in bytes (`uint32`)                                                                                                |
| 8      | 8 bytes | `byteOffset` | Byte offset of this PDU in the file (`uint64`). Parse as `bigint` — values can exceed `Number.MAX_SAFE_INTEGER` for large recordings. |
| 16     | 1 byte  | `direction`  | `0x00` = client→server, `0x01` = server→client                                                                                        |

### PDU data (variable)

Raw binary PDU data, concatenated in index order. Each PDU's position and length
are described by its index table entry.
