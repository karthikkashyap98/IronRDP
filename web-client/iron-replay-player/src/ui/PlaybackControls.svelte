<script lang="ts">
	import { formatTime } from './format-time.js';

	const SPEEDS = [3, 2, 1.75, 1.5, 1.25, 1];

	interface Props {
		paused: boolean;
		waiting: boolean;
		canPlay: boolean;
		elapsed: number;
		duration: number;
		speed: number;
		isFullscreen: boolean;
		onplay: () => void;
		onpause: () => void;
		onreset: () => void;
		onspeedchange: (speed: number) => void;
		onfullscreen: () => void;
	}

	let {
		paused,
		waiting,
		canPlay,
		elapsed,
		duration,
		speed,
		isFullscreen,
		onplay,
		onpause,
		onreset,
		onspeedchange,
		onfullscreen,
	}: Props = $props();

	let speedOpen = $state(false);

	function togglePlay(): void {
		if (paused) {
			onplay();
		} else {
			onpause();
		}
	}

	function selectSpeed(value: number): void {
		onspeedchange(value);
		speedOpen = false;
	}

	function formatSpeed(value: number): string {
		return `${value}`;
	}

	/** Close popup when clicking outside the speed selector */
	function clickOutside(node: HTMLElement, handler: () => void) {
		const handleClick = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) handler();
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			},
		};
	}
</script>

<div class="controls-bar">
	<!-- Left group: reset + play/pause + time -->
	<div class="controls-left">
		<button
			class="play-btn"
			onclick={onreset}
			disabled={!canPlay}
			aria-label="Reset to beginning"
		>
			⏮
		</button>
		<button
			class="play-btn"
			onclick={togglePlay}
			disabled={!canPlay}
			aria-label={paused ? 'Play' : 'Pause'}
		>
			{paused ? '▶' : '⏸'}
		</button>
		<span class="time-display">
			{formatTime(elapsed)} / {formatTime(duration)}
		</span>
	</div>

	<!-- Right group: speed + fullscreen -->
	<div class="controls-right">
		<!-- Speed selector -->
		<div class="speed-selector" use:clickOutside={() => (speedOpen = false)}>
			<button
				class="speed-btn"
				onclick={() => (speedOpen = !speedOpen)}
				aria-label="Playback speed"
				aria-expanded={speedOpen}
			>
				{formatSpeed(speed)}
			</button>
			{#if speedOpen}
				<div class="speed-popup" role="menu">
					<div class="speed-popup-heading">Playback speed</div>
					{#each SPEEDS as s}
						<button
							class="speed-popup-item"
							class:active={s === speed}
							role="menuitem"
							onclick={() => selectSpeed(s)}
						>
							<span class="speed-popup-check">{s === speed ? '✓' : ''}</span>
							{formatSpeed(s)}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Fullscreen -->
		<button
			class="fullscreen-btn"
			onclick={onfullscreen}
			aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
		>
			{isFullscreen ? '✕' : '⛶'}
		</button>
	</div>
</div>
