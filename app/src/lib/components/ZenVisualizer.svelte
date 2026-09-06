<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import { playerPlaying } from "$lib/stores/player.svelte";
	import { equalizerStore } from "$lib/stores/equalizer.svelte";

	interface Props {
		active?: boolean;
	}

	let { active = false }: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let animId: number | null = null;
	let time = 0;
	let freqData: Uint8Array | null = null;
	let timeData: Uint8Array | null = null;

	function resizeCanvas() {
		if (!canvasEl) return;
		const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
		const rect = canvasEl.getBoundingClientRect();
		if (rect.width > 0 && rect.height > 0) {
			canvasEl.width = rect.width * dpr;
			canvasEl.height = rect.height * dpr;
		}
	}

	function render() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext("2d");
		if (!ctx) return;

		const width = canvasEl.width;
		const height = canvasEl.height;
		ctx.clearRect(0, 0, width, height);

		const analyser = equalizerStore.getAnalyser();
		let bassLevel = 0;
		let midLevel = 0;

		if (analyser && playerPlaying.value && equalizerStore.enabled) {
			equalizerStore.resumeAudioContext();
			const binCount = analyser.frequencyBinCount;
			if (!freqData || freqData.length !== binCount) {
				freqData = new Uint8Array(binCount);
			}
			if (!timeData || timeData.length !== binCount) {
				timeData = new Uint8Array(binCount);
			}
			analyser.getByteFrequencyData(freqData as any);
			analyser.getByteTimeDomainData(timeData as any);

			let bassSum = 0;
			for (let i = 0; i < 8; i++) bassSum += freqData[i] || 0;
			bassLevel = (bassSum / (8 * 255));

			let midSum = 0;
			for (let i = 8; i < 32; i++) midSum += freqData[i] || 0;
			midLevel = (midSum / (24 * 255));
		} else if (playerPlaying.value) {
			time += 0.04;
			bassLevel = (Math.sin(time * 1.5) * 0.3 + 0.5) * 0.7;
			midLevel = (Math.cos(time * 2) * 0.3 + 0.5) * 0.6;
		} else {
			bassLevel = 0.05;
			midLevel = 0.05;
		}

		time += 0.025;

		// 1. Center pulsing radial glow
		const centerX = width / 2;
		const centerY = height / 2;
		const maxRadius = Math.min(width, height) * 0.48;
		const pulseRadius = maxRadius * (0.65 + bassLevel * 0.25);

		const glowGrad = ctx.createRadialGradient(
			centerX, centerY, pulseRadius * 0.2,
			centerX, centerY, pulseRadius
		);
		const glowAlpha = Math.min(0.35, 0.08 + bassLevel * 0.28);
		glowGrad.addColorStop(0, `rgba(30, 215, 96, ${glowAlpha})`);
		glowGrad.addColorStop(0.5, `rgba(16, 185, 129, ${glowAlpha * 0.4})`);
		glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

		ctx.fillStyle = glowGrad;
		ctx.beginPath();
		ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
		ctx.fill();

		// 2. Flowing audio waveform ribbons across the bottom
		const baseY = height * 0.78;
		const wavePoints = 48;
		const step = width / (wavePoints - 1);

		// Wave 1: Primary emerald neon
		ctx.beginPath();
		ctx.moveTo(0, height);
		for (let i = 0; i < wavePoints; i++) {
			const x = i * step;
			let amp = 0;
			if (timeData && analyser && equalizerStore.enabled) {
				const idx = Math.floor((i / wavePoints) * timeData.length);
				const val = (timeData[idx] - 128) / 128;
				amp = val * (height * 0.18);
			} else {
				amp = (Math.sin(time * 2 + i * 0.35) * 0.6 + Math.cos(time * 1.2 + i * 0.15) * 0.4) * (height * 0.06 * (bassLevel + 0.3));
			}
			const y = baseY - amp;
			if (i === 0) ctx.lineTo(x, y);
			else {
				const prevX = (i - 1) * step;
				const midX = (prevX + x) / 2;
				ctx.quadraticCurveTo(prevX, baseY - amp, midX, y);
			}
		}
		ctx.lineTo(width, height);
		ctx.closePath();

		const waveGrad1 = ctx.createLinearGradient(0, baseY - (height * 0.15), 0, height);
		waveGrad1.addColorStop(0, "rgba(30, 215, 96, 0.45)");
		waveGrad1.addColorStop(0.6, "rgba(16, 185, 129, 0.15)");
		waveGrad1.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.fillStyle = waveGrad1;
		ctx.fill();

		// Wave 2: Cyan secondary harmonic ripple
		ctx.beginPath();
		ctx.moveTo(0, height);
		for (let i = 0; i < wavePoints; i++) {
			const x = i * step;
			const harmonic = (Math.cos(time * 2.8 + i * 0.4) * 0.5 + Math.sin(time * 1.6 + i * 0.25) * 0.5);
			const amp = harmonic * (height * 0.05 * (midLevel + 0.25));
			const y = baseY + (height * 0.03) - amp;
			if (i === 0) ctx.lineTo(x, y);
			else {
				const prevX = (i - 1) * step;
				const midX = (prevX + x) / 2;
				ctx.quadraticCurveTo(prevX, baseY - amp, midX, y);
			}
		}
		ctx.lineTo(width, height);
		ctx.closePath();

		const waveGrad2 = ctx.createLinearGradient(0, baseY - (height * 0.1), 0, height);
		waveGrad2.addColorStop(0, "rgba(56, 189, 248, 0.35)");
		waveGrad2.addColorStop(1, "rgba(0, 0, 0, 0)");
		ctx.fillStyle = waveGrad2;
		ctx.fill();

		if (active) {
			animId = requestAnimationFrame(render);
		}
	}

	$effect(() => {
		if (active) {
			resizeCanvas();
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

	onMount(() => {
		resizeCanvas();
		window.addEventListener("resize", resizeCanvas);
		return () => {
			window.removeEventListener("resize", resizeCanvas);
		};
	});

	onDestroy(() => {
		if (animId) {
			cancelAnimationFrame(animId);
			animId = null;
		}
	});
</script>

<canvas bind:this={canvasEl} class="zen-visualizer-canvas"></canvas>

<style lang="scss">
	.zen-visualizer-canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}
</style>
