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

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run check

# Build the library
npm run build
```

## Project Structure

```
src/lib/
├── replay-player/
│   ├── ReplayPlayer.svelte           # Main component
│   ├── replay-player.css             # Styles
│   ├── replay-player.store.svelte.ts # State management
│   └── replay-player.types.ts        # Component types
├── fetchRecording.ts                 # HTTP Range request utilities
└── index.ts                          # Public exports

src/types/
└── recording.types.ts                # Recording file format types
```

This library is part of the [IronRDP] project.

[IronRDP]: https://github.com/Devolutions/IronRDP
