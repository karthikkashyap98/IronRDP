import type { Header, IndexTableRow } from '../types/recording.types.js'

const HEADER_SIZE = 20;
const INDEX_ROW_SIZE = 17;

async function fetchFileRanges(url: string, startBytes: number, endBytes: number): Promise<ArrayBuffer> {
	const response = await fetch(url, {
		headers: { Range: `bytes=${startBytes}-${endBytes}` }
	});
	if (!response.ok) {
		throw new Error(`HTTP error status: ${response.status}`);
	}

	return response.arrayBuffer();
}

function parseHeader(buffer: ArrayBuffer): Header {
	const view = new DataView(buffer);

	const version = view.getUint32(0, false);
	const totalPdus = Number(view.getBigUint64(4, false));
	const duration = Number(view.getBigUint64(12, false));
	return { version, totalPdus, duration };
}

function parseIndexTable(buffer: ArrayBuffer, startOffset: number, count: number): IndexTableRow[] {
	const view = new DataView(buffer);
	const entries: IndexTableRow[] = [];

	for (let i = 0; i < count; i++) {
		const entryOffset = startOffset + i * INDEX_ROW_SIZE;

		const timeOffset = view.getUint32(entryOffset, false);
		const pduLength = view.getUint32(entryOffset + 4, false);
		const byteOffset = view.getBigUint64(entryOffset + 8, false);
		const direction = view.getUint8(entryOffset + 16);

		entries.push({ timeOffset, pduLength, byteOffset, direction });
	}

	return entries;
}


export async function fetchHeader(url: string): Promise<Header> {
	const buffer = await fetchFileRanges(url, 0, HEADER_SIZE - 1);
	return parseHeader(buffer)
}

export async function fetchIndexTable(url: string, totalPDUs: number): Promise<IndexTableRow[]> {
	const endBytes = HEADER_SIZE + (INDEX_ROW_SIZE * totalPDUs) - 1;
	const buffer = await fetchFileRanges(url, HEADER_SIZE, endBytes);
	return parseIndexTable(buffer, 0, totalPDUs)
}
