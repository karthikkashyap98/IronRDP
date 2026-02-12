<script lang="ts">
    import { clearFrames, storeFrame, getFrameCount, type TimingEntry } from './pdu-store';

    interface UploadState {
        status: 'idle' | 'loading' | 'success' | 'error';
        message: string;
        progress: number;
        total: number;
    }

    // Props with bindable timing
    let { timing = $bindable([]) }: { timing?: TimingEntry[] } = $props();

    let uploadState: UploadState = $state({
        status: 'idle',
        message: '',
        progress: 0,
        total: 0
    });

    let fileInput: HTMLInputElement;
    let frameCount = $state(0);

    // Sort files naturally by name (handles numeric filenames like 0.bin, 1.bin, etc.)
    function naturalSort(files: File[]): File[] {
        return files.sort((a, b) => {
            const aMatch = a.name.match(/^(\d+)/);
            const bMatch = b.name.match(/^(\d+)/);
            
            if (aMatch && bMatch) {
                return parseInt(aMatch[1]) - parseInt(bMatch[1]);
            }
            return a.name.localeCompare(b.name, undefined, { numeric: true });
        });
    }

    async function handleFolderSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files || files.length === 0) {
            uploadState = { status: 'idle', message: 'No files selected', progress: 0, total: 0 };
            return;
        }

        // Convert FileList to array and filter/sort
        const fileArray = naturalSort(Array.from(files));

        // Find and parse timing.json
        const timingFile = fileArray.find(f => f.name === 'timing.json');
        if (timingFile) {
            try {
                const timingText = await timingFile.text();
                timing = JSON.parse(timingText);
                console.log(`Loaded timing data for ${timing.length} frames`);
            } catch (e) {
                console.error('Failed to parse timing.json:', e);
            }
        } else {
            console.warn('No timing.json found in folder');
            timing = [];
        }

        // Filter out non-PDU files (timing.json, .gitignore, etc.)
        const pduFiles = fileArray.filter(f => /^\d+$/.test(f.name));

        uploadState = {
            status: 'loading',
            message: `Loading ${pduFiles.length} PDU files...`,
            progress: 0,
            total: pduFiles.length
        };

        try {
            // Clear existing frames first
            await clearFrames();

            // Load each file as binary and store in IndexedDB
            for (let i = 0; i < pduFiles.length; i++) {
                const file = pduFiles[i];
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                // Use the filename as the index (files are named 0, 1, 2, ...)
                const frameIndex = parseInt(file.name, 10);
                await storeFrame(frameIndex, uint8Array);
                
                uploadState = {
                    ...uploadState,
                    progress: i + 1,
                    message: `Loaded ${i + 1}/${pduFiles.length}: ${file.name}`
                };
            }

            frameCount = await getFrameCount();
            
            uploadState = {
                status: 'success',
                message: `Successfully loaded ${pduFiles.length} PDU frames${timing.length > 0 ? ` with timing data` : ''}`,
                progress: pduFiles.length,
                total: pduFiles.length
            };
        } catch (error) {
            uploadState = {
                status: 'error',
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                progress: 0,
                total: 0
            };
        }

        // Reset the input so the same folder can be selected again
        input.value = '';
    }

    function triggerFolderSelect() {
        fileInput?.click();
    }

    async function refreshCount() {
        try {
            frameCount = await getFrameCount();
        } catch {
            frameCount = 0;
        }
    }

    // Load initial count on mount
    $effect(() => {
        refreshCount();
    });
</script>

<div class="folder-uploader">
    <h2>RDP PDU Folder Upload</h2>
    
    <div class="upload-section">
        <input
            bind:this={fileInput}
            type="file"
            webkitdirectory
            multiple
            onchange={handleFolderSelect}
            style="display: none;"
        />
        
        <button 
            class="upload-btn"
            onclick={triggerFolderSelect}
            disabled={uploadState.status === 'loading'}
        >
            {#if uploadState.status === 'loading'}
                Loading...
            {:else}
                Select Folder
            {/if}
        </button>
        
        <p class="help-text">
            Select a folder containing binary PDU files. Files will be sorted and stored with sequential keys (0, 1, 2, ...).
        </p>
    </div>

    {#if uploadState.status === 'loading'}
        <div class="progress-section">
            <div class="progress-bar">
                <div 
                    class="progress-fill" 
                    style="width: {(uploadState.progress / uploadState.total) * 100}%"
                ></div>
            </div>
            <p class="progress-text">{uploadState.message}</p>
        </div>
    {/if}

    {#if uploadState.status === 'success'}
        <div class="status success">
            {uploadState.message}
        </div>
    {/if}

    {#if uploadState.status === 'error'}
        <div class="status error">
            {uploadState.message}
        </div>
    {/if}

    <div class="info-section">
        <p>Frames in database: <strong>{frameCount}</strong></p>
        <button class="refresh-btn" onclick={refreshCount}>Refresh Count</button>
    </div>
</div>

<style>
    .folder-uploader {
        font-family: system-ui, -apple-system, sans-serif;
        max-width: 500px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: #fafafa;
    }

    h2 {
        margin-top: 0;
        color: #333;
    }

    .upload-section {
        margin-bottom: 20px;
    }

    .upload-btn {
        background: #0066cc;
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .upload-btn:hover:not(:disabled) {
        background: #0052a3;
    }

    .upload-btn:disabled {
        background: #999;
        cursor: not-allowed;
    }

    .help-text {
        color: #666;
        font-size: 14px;
        margin-top: 10px;
    }

    .progress-section {
        margin: 20px 0;
    }

    .progress-bar {
        height: 20px;
        background: #e0e0e0;
        border-radius: 10px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #0066cc;
        transition: width 0.1s;
    }

    .progress-text {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
    }

    .status {
        padding: 12px;
        border-radius: 4px;
        margin: 20px 0;
    }

    .status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .info-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .info-section p {
        margin: 0;
        color: #333;
    }

    .refresh-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 6px 12px;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;
    }

    .refresh-btn:hover {
        background: #5a6268;
    }
</style>
