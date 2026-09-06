<script lang="ts">
	import { equalizerStore, EQ_PRESETS } from "$lib/stores/equalizer.svelte";
	import { playerPlaying } from "$lib/stores/player.svelte";

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let animId: number | null = null;

	function handleSlider(index: number, e: Event) {
		equalizerStore.resumeAudioContext();
		const val = parseFloat((e.target as HTMLInputElement).value);
		equalizerStore.setGain(index, val);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && equalizerStore.isOpen) {
			equalizerStore.close();
		}
	}

	// Live spectrum drawing in equalizer modal
	function drawSpectrum() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext("2d");
		if (!ctx) return;

		const width = canvasEl.width;
		const height = canvasEl.height;
		ctx.clearRect(0, 0, width, height);

		const analyser = equalizerStore.getAnalyser();
		const numBars = 32;
		const barWidth = width / numBars - 2;

		if (analyser && equalizerStore.enabled && playerPlaying.value) {
			const data = new Uint8Array(analyser.frequencyBinCount);
			analyser.getByteFrequencyData(data as any);

			for (let i = 0; i < numBars; i++) {
				const val = data[i] || 0;
				const pct = val / 255;
				const barHeight = Math.max(3, pct * height);
				const x = i * (barWidth + 2);
				const y = height - barHeight;

				const grad = ctx.createLinearGradient(0, height, 0, 0);
				grad.addColorStop(0, "#1ed760");
				grad.addColorStop(1, "#38bdf8");

				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
				ctx.fill();
			}
		} else if (playerPlaying.value && equalizerStore.enabled) {
			const time = Date.now() / 180;
			for (let i = 0; i < numBars; i++) {
				const wave = Math.sin(time + i * 0.35) * 0.4 + 0.5;
				const barHeight = Math.max(3, wave * height * 0.8);
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
			for (let i = 0; i < numBars; i++) {
				const x = i * (barWidth + 2);
				ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
				ctx.beginPath();
				ctx.roundRect(x, height - 2, barWidth, 2, [1, 1, 0, 0]);
				ctx.fill();
			}
		}

		if (equalizerStore.isOpen) {
			animId = requestAnimationFrame(drawSpectrum);
		}
	}

	$effect(() => {
		if (equalizerStore.isOpen) {
			if (!animId) {
				animId = requestAnimationFrame(drawSpectrum);
			}
		} else {
			if (animId) {
				cancelAnimationFrame(animId);
				animId = null;
			}
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if equalizerStore.isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="eq-backdrop"
		onclick={(e) => { if (e.target === e.currentTarget) equalizerStore.close(); }}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="eq-modal" role="dialog" aria-modal="true" aria-label="Audio Equalizer" tabindex="-1" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<header class="eq-header">
				<div class="header-left">
					<div class="eq-icon-pill">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
							<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
							<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
							<line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
						</svg>
					</div>
					<div>
						<h3>Audio Equalizer</h3>
						<span class="subtext">5-Band Studio DSP Tuning</span>
					</div>
				</div>

				<div class="header-right">
					<label class="toggle-switch" title={equalizerStore.enabled ? "Equalizer Enabled" : "Equalizer Bypassed"}>
						<input
							type="checkbox"
							checked={equalizerStore.enabled}
							onchange={() => equalizerStore.toggleEnabled()}
						/>
						<span class="toggle-track"></span>
						<span class="toggle-label">{equalizerStore.enabled ? "ON" : "OFF"}</span>
					</label>

					<button class="close-btn" onclick={() => equalizerStore.close()} aria-label="Close Equalizer">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</header>

			<!-- Presets Bar -->
			<div class="presets-row">
				<span class="presets-label">PRESETS</span>
				<div class="presets-list">
					{#each EQ_PRESETS as p}
						<button
							class="preset-chip"
							class:active={equalizerStore.currentPreset.toLowerCase() === p.name.toLowerCase()}
							onclick={() => equalizerStore.setPreset(p.name)}
						>
							{p.name}
						</button>
					{/each}
					{#if equalizerStore.currentPreset === "Custom"}
						<span class="preset-chip custom active">Custom</span>
					{/if}
				</div>
			</div>

			<!-- 5 Vertical Sliders Area -->
			<div class="sliders-container" class:disabled={!equalizerStore.enabled}>
				<div class="db-labels">
					<span>+12 dB</span>
					<span>0 dB</span>
					<span>-12 dB</span>
				</div>

				<div class="sliders-grid">
					{#each equalizerStore.bands as band, i}
						<div class="slider-channel">
							<div class="gain-value-badge" class:boost={band.gain > 0} class:cut={band.gain < 0}>
								{band.gain > 0 ? `+${band.gain}` : band.gain} dB
							</div>
							<div class="vertical-slider-wrap">
								<input
									type="range"
									class="vertical-slider"
									min="-12"
									max="12"
									step="0.5"
									value={band.gain}
									oninput={(e) => handleSlider(i, e)}
									disabled={!equalizerStore.enabled}
									aria-label={`${band.label} gain`}
								/>
								<div class="zero-line"></div>
							</div>
							<span class="band-label">{band.label}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Live Spectrum Visualizer Canvas -->
			<div class="eq-visualizer-box">
				<div class="viz-header">
					<span>REAL-TIME SPECTRUM</span>
					<button class="reset-btn" onclick={() => equalizerStore.reset()}>
						Reset to Flat
					</button>
				</div>
				<canvas bind:this={canvasEl} width="400" height="42" class="eq-canvas"></canvas>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.eq-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		z-index: 100050;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 150ms ease;
	}

	.eq-modal {
		background: #141720;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.25rem;
		width: min(520px, calc(100vw - 2rem));
		max-height: 92vh;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
		animation: scaleUp 180ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.eq-header {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.header-left {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.eq-icon-pill {
				width: 36px;
				height: 36px;
				border-radius: 50%;
				background: rgba(30, 215, 96, 0.15);
				color: #1ed760;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			h3 {
				margin: 0;
				font-size: 1.15rem;
				font-weight: 700;
				color: #ffffff;
			}

			.subtext {
				font-size: 0.75rem;
				color: rgba(255, 255, 255, 0.5);
			}
		}

		.header-right {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}

		.close-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.6);
			cursor: pointer;
			padding: 0.4rem;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 140ms ease;

			&:hover {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.1);
			}
		}
	}

	.toggle-switch {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		user-select: none;

		input {
			display: none;

			&:checked + .toggle-track {
				background: #1ed760;

				&::after {
					transform: translateX(18px);
				}
			}
		}

		.toggle-track {
			width: 38px;
			height: 20px;
			background: rgba(255, 255, 255, 0.2);
			border-radius: 9999px;
			position: relative;
			transition: background 150ms ease;

			&::after {
				content: "";
				position: absolute;
				top: 2px;
				left: 2px;
				width: 16px;
				height: 16px;
				background: #ffffff;
				border-radius: 50%;
				transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
			}
		}

		.toggle-label {
			font-size: 0.75rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.8);
		}
	}

	.presets-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		.presets-label {
			font-size: 0.68rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			color: rgba(255, 255, 255, 0.45);
		}

		.presets-list {
			display: flex;
			flex-wrap: wrap;
			gap: 0.4rem;
		}

		.preset-chip {
			background: rgba(255, 255, 255, 0.07);
			color: rgba(255, 255, 255, 0.75);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 9999px;
			padding: 0.3rem 0.75rem;
			font-size: 0.78rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 140ms ease;

			&:hover {
				background: rgba(255, 255, 255, 0.14);
				color: #ffffff;
			}

			&.active {
				background: #1ed760;
				color: #000000;
				border-color: #1ed760;
				font-weight: 700;
			}
		}
	}

	.sliders-container {
		background: rgba(0, 0, 0, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 0.85rem;
		padding: 1.25rem 1rem;
		display: flex;
		gap: 0.75rem;
		position: relative;
		transition: opacity 200ms ease;

		&.disabled {
			opacity: 0.4;
			pointer-events: none;
		}

		.db-labels {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			font-size: 0.68rem;
			color: rgba(255, 255, 255, 0.4);
			font-weight: 600;
			padding: 1.5rem 0 1.25rem;
		}

		.sliders-grid {
			flex: 1;
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 0.5rem;
		}
	}

	.slider-channel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;

		.gain-value-badge {
			font-size: 0.7rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.7);
			font-variant-numeric: tabular-nums;

			&.boost {
				color: #1ed760;
			}
			&.cut {
				color: #38bdf8;
			}
		}

		.vertical-slider-wrap {
			position: relative;
			height: 140px;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 28px;

			.zero-line {
				position: absolute;
				left: 4px;
				right: 4px;
				top: 50%;
				height: 1px;
				background: rgba(255, 255, 255, 0.2);
				pointer-events: none;
			}
		}

		.vertical-slider {
			-webkit-appearance: none;
			appearance: none;
			writing-mode: vertical-lr;
			direction: rtl;
			height: 100%;
			width: 6px;
			background: rgba(255, 255, 255, 0.15);
			border-radius: 9999px;
			outline: none;
			cursor: pointer;

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				width: 18px;
				height: 18px;
				border-radius: 50%;
				background: #ffffff;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
				cursor: pointer;
				transition: transform 120ms ease, background 120ms ease;

				&:hover {
					transform: scale(1.15);
					background: #1ed760;
				}
			}
		}

		.band-label {
			font-size: 0.72rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.85);
		}
	}

	.eq-visualizer-box {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.75rem;
		padding: 0.75rem;

		.viz-header {
			display: flex;
			align-items: center;
			justify-content: space-between;

			span {
				font-size: 0.65rem;
				font-weight: 800;
				letter-spacing: 0.08em;
				color: rgba(255, 255, 255, 0.45);
			}

			.reset-btn {
				background: transparent;
				border: none;
				color: rgba(255, 255, 255, 0.6);
				font-size: 0.75rem;
				font-weight: 600;
				cursor: pointer;
				padding: 0.2rem 0.5rem;
				border-radius: 4px;
				transition: all 120ms ease;

				&:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.08);
				}
			}
		}

		.eq-canvas {
			width: 100%;
			height: 38px;
			display: block;
			border-radius: 4px;
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
