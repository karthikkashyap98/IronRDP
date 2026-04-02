<script lang="ts">
	import { formatTime } from './format-time.js';

	interface Props {
		elapsed: number;
		duration: number;
		fetchedUntilMs: number;
		waiting: boolean;
		onseekend: (targetMs: number) => void;
	}

	let { elapsed, duration, fetchedUntilMs, waiting, onseekend }: Props = $props();

	let dragging = $state(false);
	let dragElapsed = $state(0);
	let trackEl: HTMLDivElement | undefined;

	const displayElapsed = $derived(dragging ? dragElapsed : elapsed);
	const elapsedPct = $derived(duration > 0 ? Math.min(displayElapsed / duration, 1) * 100 : 0);
	const fetchedPct  = $derived(duration > 0 ? Math.min(fetchedUntilMs  / duration, 1) * 100 : 0);

	function msFromPointer(clientX: number): number {
		if (!trackEl) return 0;
		const rect = trackEl.getBoundingClientRect();
		const pct = Math.max(0, Math.min((clientX - rect.left) / rect.width, 1));
		return pct * duration;
	}

	function onpointerdown(e: PointerEvent): void {
		if (duration === 0) return;
		dragging = true;
		dragElapsed = msFromPointer(e.clientX);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onpointermove(e: PointerEvent): void {
		if (!dragging) return;
		dragElapsed = msFromPointer(e.clientX);
	}

	function onpointerup(e: PointerEvent): void {
		if (!dragging) return;
		dragging = false;
		onseekend(msFromPointer(e.clientX));
	}

	function onlostpointercapture(): void {
		// Capture lost without pointerup: cancel drag without committing seek.
		dragging = false;
	}
</script>

<div
	class="__irp-seekbar"
	class:__irp-interactive={duration > 0}
	role="slider"
	tabindex={duration > 0 ? 0 : -1}
	aria-label="Seek"
	aria-valuemin={0}
	aria-valuemax={duration}
	aria-valuenow={Math.round(displayElapsed)}
	aria-valuetext={formatTime(displayElapsed)}
	style="touch-action: none"
	onpointerdown={onpointerdown}
	onpointermove={onpointermove}
	onpointerup={onpointerup}
	onlostpointercapture={onlostpointercapture}
>
	<div
		class="__irp-seekbar-track"
		bind:this={trackEl}
	>
		<div class="__irp-seekbar-buffer"   style="width: {fetchedPct}%"></div>
		<div class="__irp-seekbar-progress" style="width: {elapsedPct}%"></div>
		<div
			class="__irp-seekbar-head"
			class:__irp-waiting={waiting}
			style="left: {elapsedPct}%"
		></div>
	</div>
</div>
