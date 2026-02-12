<script lang="ts">
    import { goto } from '$app/navigation';
    import { clearFrames, storeFrame, getFrameCount, type TimingEntry } from '$lib/pdu-store';

    interface UploadState {
        status: 'idle' | 'loading' | 'success' | 'error';
        message: string;
        progress: number;
        total: number;
    }

    let uploadState: UploadState = $state({
        status: 'idle',
        message: '',
        progress: 0,
        total: 0
    });

    let fileInput: HTMLInputElement;
    let frameCount = $state(0);
    let isDragging = $state(false);

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

    async function processFiles(files: FileList | File[]) {
        const fileArray = naturalSort(Array.from(files));

        // Find and parse timing.json
        const timingFile = fileArray.find(f => f.name === 'timing.json');
        let timing: TimingEntry[] = [];
        
        if (timingFile) {
            try {
                const timingText = await timingFile.text();
                timing = JSON.parse(timingText);
                // Store timing in sessionStorage for the player route
                sessionStorage.setItem('rdp-timing', timingText);
            } catch (e) {
                console.error('Failed to parse timing.json:', e);
            }
        } else {
            sessionStorage.removeItem('rdp-timing');
        }

        const pduFiles = fileArray.filter(f => /^\d+$/.test(f.name));

        uploadState = {
            status: 'loading',
            message: `Loading ${pduFiles.length} frames...`,
            progress: 0,
            total: pduFiles.length
        };

        try {
            await clearFrames();

            for (let i = 0; i < pduFiles.length; i++) {
                const file = pduFiles[i];
                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const frameIndex = parseInt(file.name, 10);
                await storeFrame(frameIndex, uint8Array);
                
                uploadState = {
                    ...uploadState,
                    progress: i + 1,
                    message: `Loading frame ${i + 1} of ${pduFiles.length}`
                };
            }

            frameCount = await getFrameCount();
            
            uploadState = {
                status: 'success',
                message: `Loaded ${pduFiles.length} frames`,
                progress: pduFiles.length,
                total: pduFiles.length
            };

            // Navigate to player after short delay
            setTimeout(() => goto('/player'), 800);
        } catch (error) {
            uploadState = {
                status: 'error',
                message: `${error instanceof Error ? error.message : 'Unknown error'}`,
                progress: 0,
                total: 0
            };
        }
    }

    async function handleFolderSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files || files.length === 0) {
            return;
        }

        await processFiles(files);
        input.value = '';
    }

    function handleDragOver(event: DragEvent) {
        event.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
    }

    async function handleDrop(event: DragEvent) {
        event.preventDefault();
        isDragging = false;
        
        const items = event.dataTransfer?.items;
        if (!items) return;

        const files: File[] = [];
        
        for (const item of items) {
            const entry = item.webkitGetAsEntry?.();
            if (entry?.isDirectory) {
                await readDirectory(entry as FileSystemDirectoryEntry, files);
            } else if (entry?.isFile) {
                const file = await getFile(entry as FileSystemFileEntry);
                files.push(file);
            }
        }

        if (files.length > 0) {
            await processFiles(files);
        }
    }

    async function readDirectory(dirEntry: FileSystemDirectoryEntry, files: File[]): Promise<void> {
        const reader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
            reader.readEntries(resolve, reject);
        });

        for (const entry of entries) {
            if (entry.isFile) {
                const file = await getFile(entry as FileSystemFileEntry);
                files.push(file);
            }
        }
    }

    function getFile(fileEntry: FileSystemFileEntry): Promise<File> {
        return new Promise((resolve, reject) => {
            fileEntry.file(resolve, reject);
        });
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

    $effect(() => {
        refreshCount();
    });
</script>

<div class="upload-page">
    <div class="header">
        <h1>IronRDP Replay Player</h1>
        <p class="subtitle">Upload RDP session recordings to play them back</p>
    </div>

    <input
        bind:this={fileInput}
        type="file"
        webkitdirectory
        multiple
        onchange={handleFolderSelect}
        style="display: none;"
    />
    
    <div 
        class="drop-zone"
        class:dragging={isDragging}
        class:loading={uploadState.status === 'loading'}
        class:success={uploadState.status === 'success'}
        class:error={uploadState.status === 'error'}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={triggerFolderSelect}
        role="button"
        tabindex="0"
        onkeypress={(e) => e.key === 'Enter' && triggerFolderSelect()}
    >
        {#if uploadState.status === 'loading'}
            <div class="loading-content">
                <div class="spinner"></div>
                <p class="loading-text">{uploadState.message}</p>
                <div class="progress-bar">
                    <div 
                        class="progress-fill" 
                        style="width: {(uploadState.progress / uploadState.total) * 100}%"
                    ></div>
                </div>
            </div>
        {:else if uploadState.status === 'success'}
            <div class="success-content">
                <svg class="icon success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <p>{uploadState.message}</p>
                <p class="redirect-text">Opening player...</p>
            </div>
        {:else if uploadState.status === 'error'}
            <div class="error-content">
                <svg class="icon error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>{uploadState.message}</p>
                <p class="hint">Click to try again</p>
            </div>
        {:else}
            <div class="idle-content">
                <svg class="icon folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <p class="main-text">Drop a folder here or click to browse</p>
                <p class="hint">Select a folder containing PDU files and timing.json</p>
            </div>
        {/if}
    </div>

    {#if frameCount > 0 && uploadState.status === 'idle'}
        <div class="existing-data">
            <p><strong>{frameCount}</strong> frames already loaded</p>
            <a href="/player" class="open-player-btn">Open Player</a>
        </div>
    {/if}
</div>

<style>
    .upload-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        box-sizing: border-box;
    }

    .header {
        text-align: center;
        margin-bottom: 40px;
    }

    h1 {
        font-size: 2rem;
        font-weight: 600;
        color: #1a1a1a;
        margin: 0 0 8px 0;
    }

    .subtitle {
        color: #666;
        margin: 0;
        font-size: 1rem;
    }

    .drop-zone {
        width: 100%;
        max-width: 500px;
        min-height: 280px;
        border: 2px dashed #d0d0d0;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .drop-zone:hover {
        border-color: #b0b0b0;
        background: #fafafa;
    }

    .drop-zone.dragging {
        border-color: #2563eb;
        background: rgba(37, 99, 235, 0.06);
    }

    .drop-zone.loading {
        cursor: default;
        border-color: #2563eb;
    }

    .drop-zone.success {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.06);
    }

    .drop-zone.error {
        border-color: #ef4444;
        background: rgba(239, 68, 68, 0.06);
    }

    .icon {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
    }

    .folder-icon {
        color: #9ca3af;
    }

    .success-icon {
        color: #22c55e;
    }

    .error-icon {
        color: #ef4444;
    }

    .idle-content,
    .loading-content,
    .success-content,
    .error-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px;
        text-align: center;
    }

    .main-text {
        color: #374151;
        font-size: 1.1rem;
        margin: 0 0 8px 0;
    }

    .hint {
        color: #9ca3af;
        font-size: 0.875rem;
        margin: 0;
    }

    .loading-text {
        color: #2563eb;
        font-size: 1rem;
        margin: 0 0 16px 0;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .progress-bar {
        width: 200px;
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: #2563eb;
        transition: width 0.1s ease;
    }

    .redirect-text {
        color: #22c55e;
        font-size: 0.875rem;
        margin: 8px 0 0 0;
    }

    .existing-data {
        margin-top: 32px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 24px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .existing-data p {
        color: #6b7280;
        margin: 0;
    }

    .existing-data strong {
        color: #1f2937;
    }

    .open-player-btn {
        padding: 8px 20px;
        background: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        transition: background 0.2s;
    }

    .open-player-btn:hover {
        background: #1d4ed8;
    }
</style>
