# iron-svelte-replay-client

## Recording File Format

The recording file is a self-contained binary format with three sections:

### Header (20 bytes)

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 4 bytes | version | Header format version (uint32) |
| 4 | 8 bytes | totalPdus | Total number of PDUs in the recording (uint64) |
| 12 | 8 bytes | duration | Total session duration in milliseconds (uint64) |

### Index Table (17 bytes × totalPdus)

Each entry describes one PDU, enabling random access without scanning the entire file.

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0 | 4 bytes | timeOffset | Milliseconds since session start (uint32) |
| 4 | 4 bytes | pduLength | Length of this PDU in bytes (uint32) |
| 8 | 8 bytes | byteOffset | Starting position of this PDU in the file (uint64) |
| 16 | 1 byte | direction | 0x00 = client→server, 0x01 = server→client |

### PDU Data (variable)

Raw binary PDU data, concatenated. Each PDU's location is described by its index table entry.

### Byte Order

All multi-byte integers are stored in **big-endian** format.

## Usage

```svelte
<script>
  import { ReplayPlayer } from 'iron-svelte-replay-client';
</script>

<ReplayPlayer url="https://example.com/recording.bin" />
```

## Component API

### ReplayPlayer

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `url` | `string` | Yes | URL to the recording file |

## Development

### Prerequisites

- Rust toolchain (see `rust-toolchain.toml` at the repo root)
- `wasm-pack` — installed automatically by xtask bootstrap
- Node.js + npm

### First-time setup

```sh
# From the repo root: install all tools (wasm-pack, cargo tools, npm deps)
cargo xtask bootstrap -v
```

### Build steps

**1. Build the WASM package** (run from repo root)

```sh
cargo xtask web build-replay -v
```

This compiles `crates/ironrdp-web-replay` to WebAssembly via `wasm-pack` and
patches the generated JS so Vite can bundle the `.wasm` file correctly.
Output lands in `crates/ironrdp-web-replay/pkg/` (gitignored).

**2. Install npm dependencies** (run from this directory)

```sh
npm install
```

**3. Type check**

```sh
npm run check
```

**4. Build the library**

```sh
# Build without rebuilding WASM (WASM must already be built — step 1)
npm run build-no-wasm

# Full build: rebuilds WASM then builds the library
npm run build
```

**5. Development server**

```sh
# Start dev server (WASM must already be built — step 1)
npm run dev
```

### npm scripts

| Script | Description |
|--------|-------------|
| `pre-build` | Runs `cargo xtask web build-replay` from the repo root |
| `build` | Runs `pre-build` then Vite build + package |
| `build-no-wasm` | Vite build + package, skipping WASM rebuild |
| `dev` | Start Vite dev server (WASM must be pre-built) |
| `check` | Run `svelte-check` for TypeScript diagnostics |
| `check:watch` | Same, in watch mode |

## Project Structure

```
src/lib/
├── replay-player/
│   ├── wasm/
│   │   └── index.ts                      # WASM init, Replay re-export, WasmReplay interface
│   ├── buffer/
│   │   ├── PduFetcher.ts                 # Buffered PDU fetch logic
│   │   └── fetchRecording.ts             # HTTP Range request utilities
│   ├── ReplayPlayer.svelte               # Main component
│   ├── replay-player.css                 # Styles
│   ├── replay-player.store.svelte.ts     # State management
│   └── replay-player.types.ts            # Component types
└── index.ts                              # Public exports

src/types/
└── recording.types.ts                    # Recording file format types

crates/ironrdp-web-replay/pkg/            # wasm-pack output (gitignored, built by xtask)
```

This library is part of the [IronRDP] project.

[IronRDP]: https://github.com/Devolutions/IronRDP
