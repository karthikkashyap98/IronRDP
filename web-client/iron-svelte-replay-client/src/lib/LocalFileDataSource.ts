import type { PduDirection, ReplayDataSource, ReplayMetadata, ReplayPdu } from './ReplayDataSource.types.js';

const HEADER_SIZE = 20;
const INDEX_ROW_SIZE = 17;
const MAX_PDUS = 1_000_000;
const SUPPORTED_VERSION = 1;

interface IndexEntry {
    timeOffset: number;
    pduLength: number;
    byteOffset: number;
    direction: number;
}

export class LocalFileDataSource implements ReplayDataSource {
    private source: File | Blob | ArrayBuffer;
    private buffer?: ArrayBuffer;
    private indexTable?: IndexEntry[];
    private totalPdus = 0;
    private durationMs = 0;

    constructor(source: File | Blob | ArrayBuffer) {
        this.source = source;
    }

    async open(): Promise<ReplayMetadata> {
        if (this.source instanceof ArrayBuffer) {
            this.buffer = this.source;
        } else {
            this.buffer = await this.source.arrayBuffer();
        }

        const headerView = new DataView(this.buffer, 0, HEADER_SIZE);
        const version = headerView.getUint32(0, false);
        if (version !== SUPPORTED_VERSION) {
            throw new Error(`unsupported recording version ${version}, expected ${SUPPORTED_VERSION}`);
        }
        this.totalPdus = Number(headerView.getBigUint64(4, false));
        if (this.totalPdus > MAX_PDUS) {
            throw new Error(
                `recording claims ${this.totalPdus.toLocaleString()} PDUs; exceeds maximum of ${MAX_PDUS.toLocaleString()}, ` +
                    `the recording file may be corrupt`,
            );
        }
        this.durationMs = Number(headerView.getBigUint64(12, false));

        const indexStart = HEADER_SIZE;
        const indexView = new DataView(this.buffer, indexStart, INDEX_ROW_SIZE * this.totalPdus);
        this.indexTable = [];

        for (let i = 0; i < this.totalPdus; i++) {
            const offset = i * INDEX_ROW_SIZE;
            const pduLength = indexView.getUint32(offset + 4, false);
            const byteOffset = Number(indexView.getBigUint64(offset + 8, false));
            if (byteOffset + pduLength > this.buffer.byteLength) {
                throw new Error(`PDU ${i} extends beyond file boundary (offset ${byteOffset}, length ${pduLength}, file size ${this.buffer.byteLength})`);
            }
            this.indexTable.push({
                timeOffset: indexView.getUint32(offset, false),
                pduLength,
                byteOffset,
                direction: indexView.getUint8(offset + 16),
            });
        }

        if (this.durationMs === 0 && this.indexTable.length > 0) {
            this.durationMs = this.indexTable[this.indexTable.length - 1].timeOffset;
        }

        return {
            durationMs: this.durationMs,
            totalPdus: this.totalPdus,
        };
    }

    async fetch(fromMs: number, toMs: number, _signal: AbortSignal): Promise<ReplayPdu[]> {
        if (!this.buffer || !this.indexTable) return [];

        const startIdx = this.binarySearchFrom(fromMs);
        if (startIdx >= this.indexTable.length) return [];

        const pdus: ReplayPdu[] = [];
        const view = new Uint8Array(this.buffer);

        for (let i = startIdx; i < this.indexTable.length; i++) {
            const entry = this.indexTable[i];
            if (entry.timeOffset >= toMs) break;
            pdus.push({
                timestampMs: entry.timeOffset,
                source: entry.direction as PduDirection,
                data: view.subarray(entry.byteOffset, entry.byteOffset + entry.pduLength),
            });
        }

        return pdus;
    }

    close(): void {
        this.buffer = undefined;
        this.indexTable = undefined;
    }

    private binarySearchFrom(targetMs: number): number {
        if (!this.indexTable) return 0;
        let low = 0;
        let high = this.indexTable.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (this.indexTable[mid].timeOffset < targetMs) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }
}
