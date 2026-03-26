<script lang="ts">
	interface Props {
		elapsed: number;        // current playhead position in ms
		duration: number;       // total recording duration in ms (0 if not yet known)
		fetchedUntilMs: number; // furthest timestamp (ms) of PDUs pushed to WASM; Infinity when fully fetched
		waiting: boolean;       // true when the player is stalled waiting for data
	}

	let { elapsed, duration, fetchedUntilMs, waiting }: Props = $props();

	// Clamp to [0, 100]. Handles duration === 0 and fetchedUntilMs === Infinity correctly.
	const elapsedPct  = $derived(duration > 0 ? Math.min(elapsed        / duration, 1) * 100 : 0);
	const fetchedPct  = $derived(duration > 0 ? Math.min(fetchedUntilMs / duration, 1) * 100 : 0);
</script>

<div class="seekbar">
	<div class="seekbar-track">
		<div class="seekbar-buffer"   style="width: {fetchedPct}%"></div>
		<div class="seekbar-progress" style="width: {elapsedPct}%"></div>
		<div class="seekbar-head" class:waiting={waiting} style="left: {elapsedPct}%"></div>
	</div>
</div>
