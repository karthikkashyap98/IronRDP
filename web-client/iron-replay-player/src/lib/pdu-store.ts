/**
 * IndexedDB service for storing RDP PDU frames
 * Database: rdp-pdus
 * Object Store: frames
 * Keys: sequential integers (0, 1, 2, ...)
 * Values: Uint8Array containing raw PDU bytes
 */

/**
 * Timing entry from timing.json
 * Contains metadata about each PDU frame including timing offset
 */
export interface TimingEntry {
    index: number;
    type: string;
    source: string;
    timeOffset: number;
    size: number;
}

const DB_NAME = 'rdp-pdus';
const STORE_NAME = 'frames';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Opens or creates the IndexedDB database
 */
export async function openDatabase(): Promise<IDBDatabase> {
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error(`Failed to open database: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create the frames object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Clears all frames from the store
 */
export async function clearFrames(): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => {
            reject(new Error(`Failed to clear frames: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve();
        };
    });
}

/**
 * Stores a single frame at the given index
 */
export async function storeFrame(index: number, data: Uint8Array): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, index);

        request.onerror = () => {
            reject(new Error(`Failed to store frame ${index}: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve();
        };
    });
}

/**
 * Stores multiple frames from an array of Uint8Arrays
 * Each frame is stored with its array index as the key
 */
export async function storeFrames(frames: Uint8Array[]): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        transaction.onerror = () => {
            reject(new Error(`Transaction failed: ${transaction.error?.message}`));
        };

        transaction.oncomplete = () => {
            resolve();
        };

        // Store each frame with sequential index
        frames.forEach((frame, index) => {
            store.put(frame, index);
        });
    });
}

/**
 * Retrieves a single frame by index
 */
export async function getFrame(index: number): Promise<Uint8Array | undefined> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(index);

        request.onerror = () => {
            reject(new Error(`Failed to get frame ${index}: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

/**
 * Gets the total number of frames stored
 */
export async function getFrameCount(): Promise<number> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onerror = () => {
            reject(new Error(`Failed to count frames: ${request.error?.message}`));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

/**
 * Gets all frames as an array
 */
export async function getAllFrames(): Promise<Uint8Array[]> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const frames: Uint8Array[] = [];

        const request = store.openCursor();

        request.onerror = () => {
            reject(new Error(`Failed to get all frames: ${request.error?.message}`));
        };

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                frames[cursor.key as number] = cursor.value;
                cursor.continue();
            } else {
                resolve(frames);
            }
        };
    });
}

/**
 * Closes the database connection
 */
export function closeDatabase(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

/**
 * Debug: Inspect stored frames and validate PDU headers
 * Returns info about each frame including expected vs actual size
 */
export async function debugInspectFrames(limit = 20): Promise<void> {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        let count = 0;

        request.onerror = () => {
            reject(new Error(`Failed to inspect frames: ${request.error?.message}`));
        };

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && count < limit) {
                const index = cursor.key as number;
                const data = cursor.value as Uint8Array;
                
                // Parse PDU header to get expected length
                const headerInfo = parsePduHeader(data);
                
                console.log(`Frame ${index}:`, {
                    storedBytes: data.length,
                    ...headerInfo,
                    match: data.length === headerInfo.expectedLength ? '✓' : `✗ (diff: ${data.length - headerInfo.expectedLength})`,
                    firstBytes: Array.from(data.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join(' ')
                });
                
                count++;
                cursor.continue();
            } else {
                console.log(`Inspected ${count} frames`);
                resolve();
            }
        };
    });
}

/**
 * Parse PDU header to extract type and expected length
 */
function parsePduHeader(data: Uint8Array): { type: string; expectedLength: number } {
    if (data.length < 1) {
        return { type: 'empty', expectedLength: 0 };
    }

    const firstByte = data[0];
    
    // Check if it's FastPath (high bits 00) or X224/TPKT (starts with 0x03)
    if (firstByte === 0x03) {
        // TPKT header: version(1) + reserved(1) + length(2)
        if (data.length < 4) {
            return { type: 'X224 (incomplete header)', expectedLength: -1 };
        }
        const length = (data[2] << 8) | data[3];
        return { type: 'X224/TPKT', expectedLength: length };
    } else {
        // FastPath: action(2 bits) + reserved(4 bits) + flags(2 bits) + length(1-2 bytes)
        if (data.length < 2) {
            return { type: 'FastPath (incomplete header)', expectedLength: -1 };
        }
        
        const lengthByte1 = data[1];
        let expectedLength: number;
        
        if (lengthByte1 & 0x80) {
            // 2-byte length encoding
            if (data.length < 3) {
                return { type: 'FastPath (incomplete length)', expectedLength: -1 };
            }
            const lengthByte2 = data[2];
            expectedLength = ((lengthByte1 & 0x7F) << 8) | lengthByte2;
        } else {
            // 1-byte length encoding
            expectedLength = lengthByte1;
        }
        
        return { type: 'FastPath', expectedLength };
    }
}
