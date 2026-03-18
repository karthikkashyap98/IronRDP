type milliseconds = number;

export interface Header {
	version: number;
	duration: milliseconds;
	totalPdus: number;
};

export interface IndexTableRow {
	timeOffset: milliseconds;
	pduLength: number;
	byteOffset: bigint;
	direction: number;
};

export interface PDUEntry {
	data: ArrayBuffer;
	timeOffset: milliseconds;
};

