<script lang="ts">
	import { onDestroy } from "svelte";
	import { playerPlaying } from "$lib/stores/player.svelte";
	import { equalizerStore } from "$lib/stores/equalizer.svelte";

	let { active = false }: { audioEl?: HTMLAudioElement | null; active?: boolean } = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let animId: number | null = null;
	let dataArray: Uint8Array | null = null;

	function render() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext("2d");
		if (!ctx) return;

		const width = canvasEl.width;
		const height = canvasEl.height;

		ctx.clearRect(0, 0, width, height);

		const numBars = 24;
		const barWidth = (width / numBars) - 2;

		const analyser = equalizerStore.getAnalyser();

		if (analyser && playerPlaying.value && equalizerStore.enabled) {
			equalizerStore.resumeAudioContext();
			if (!dataArray || dataArray.length !== analyser.frequencyBinCount) {
				dataArray = new Uint8Array(analyser.frequencyBinCount);
			}
			analyser.getByteFrequencyData(dataArray as any);

			for (let i = 0; i < numBars; i++) {
				const value = dataArray[i] || 0;
				const percent = value / 255;
				const barHeight = Math.max(3, percent * height);
				const x = i * (barWidth + 2);
				const y = height - barHeight;

				const grad = ctx.createLinearGradient(0, height, 0, 0);
				grad.addColorStop(0, "#1ed760");
				grad.addColorStop(1, "#ffffff");

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
				ctx.fill();
			}
		} else if (playerPlaying.value) {
			// Elegant simulated rhythmic animation when direct WebAudio node isn't attached
			const time = Date.now() / 200;
			for (let i = 0; i < numBars; i++) {
				const wave = Math.sin(time + i * 0.4) * 0.4 + 0.5;
				const noise = Math.sin(time * 2 + i * 0.8) * 0.2;
				const percent = Math.min(1, Math.max(0.1, wave + noise));
				const barHeight = Math.max(3, percent * height * 0.85);
				const x = i * (barWidth + 2);
				const y = height - barHeight;

				const grad = ctx.createLinearGradient(0, height, 0, 0);
				grad.addColorStop(0, "#1ed760");
				grad.addColorStop(1, "#a7f3d0");

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
				ctx.fill();
			}
		} else {
			// Resting idle line
			for (let i = 0; i < numBars; i++) {
				const x = i * (barWidth + 2);
				ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
				ctx.beginPath();
				ctx.roundRect(x, height - 3, barWidth, 3, [1, 1, 0, 0]);
				ctx.fill();
			}
		}

		if (active) {
			animId = requestAnimationFrame(render);
		}
	}

	$effect(() => {
		if (active) {
			if (!animId) {
				animId = requestAnimationFrame(render);
			}
		} else {
			if (animId) {
				cancelAnimationFrame(animId);
				animId = null;
			}
		}
	});

	onDestroy(() => {
		if (animId) {
			cancelAnimationFrame(animId);
			animId = null;
		}
	});
</script>

<div class="visualizer-container" class:active>
	<canvas bind:this={canvasEl} width="240" height="36" class="viz-canvas"></canvas>
</div>

<style lang="scss">
	.visualizer-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.5rem;
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.5rem;
		transition: opacity 200ms ease;

		&:not(.active) {
			display: none;
		}
	}

	.viz-canvas {
		display: block;
		width: 120px;
		height: 24px;
	}
</style>
