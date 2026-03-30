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

	function onmousedown(e: MouseEvent): void {
		if (duration === 0) return;
		dragging = true;
		dragElapsed = msFromPointer(e.clientX);
	}

	// Attach window listeners only while dragging — cleaned up automatically when drag ends
	$effect(() => {
		if (!dragging) return;

		function onmousemove(e: MouseEvent): void {
			dragElapsed = msFromPointer(e.clientX);
		}

		function onmouseup(e: MouseEvent): void {
			dragging = false;
			onseekend(msFromPointer(e.clientX));
		}

		window.addEventListener('mousemove', onmousemove);
		window.addEventListener('mouseup', onmouseup);
		return () => {
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="seekbar"
	class:interactive={duration > 0}
	onmousedown={onmousedown}
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
