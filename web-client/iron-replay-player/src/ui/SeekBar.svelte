<script lang="ts">
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

	// Attach window listeners only while dragging — cleaned up automatically when drag ends
	$effect(() => {
		if (!dragging) return;

		function onpointermove(e: PointerEvent): void {
			dragElapsed = msFromPointer(e.clientX);
		}

		function onpointerup(e: PointerEvent): void {
			dragging = false;
			onseekend(msFromPointer(e.clientX));
		}

		window.addEventListener('pointermove', onpointermove);
		window.addEventListener('pointerup', onpointerup);
		return () => {
			window.removeEventListener('pointermove', onpointermove);
			window.removeEventListener('pointerup', onpointerup);
		};
	});
</script>

<div
	class="seekbar"
	class:interactive={duration > 0}
	role="slider"
	tabindex={duration > 0 ? 0 : -1}
	aria-label="Seek"
	aria-valuemin={0}
	aria-valuemax={duration}
	aria-valuenow={Math.round(displayElapsed)}
	style="touch-action: none"
	onpointerdown={onpointerdown}
>
	<div
		class="seekbar-track"
		bind:this={trackEl}
	>
		<div class="seekbar-buffer"   style="width: {fetchedPct}%"></div>
		<div class="seekbar-progress" style="width: {elapsedPct}%"></div>
		<div
			class="seekbar-head"
			class:waiting={waiting}
			style="left: {elapsedPct}%"
		></div>
	</div>
</div>
