<script lang="ts">
	import { updateService } from "$lib/services/updater.svelte";
	import { triggerHaptic } from "$lib/utils/haptics";

	function handleUpdate() {
		triggerHaptic("medium");
		const targetUrl = updateService.latestRelease?.apkUrl || "https://mezzo-music.pages.dev/Mezzo-1.0.apk";
		if (typeof window !== "undefined") {
			window.open(targetUrl, "_blank", "noopener,noreferrer");
		}
		updateService.dismissModal();
	}

	function handleDismiss() {
		triggerHaptic("light");
		updateService.dismissModal();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && updateService.showModal) {
			handleDismiss();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if updateService.showModal && updateService.latestRelease}
	<div
		class="update-modal-backdrop"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		aria-labelledby="update-modal-title"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleDismiss();
		}}
		onkeydown={(e) => {
			if (e.key === "Escape") handleDismiss();
		}}
	>
		<div class="update-modal-content">
			<!-- Header Badge -->
			<div class="update-icon-wrap">
				<div class="glow-orb"></div>
				<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
			</div>

			<div class="update-badge">
				<span>NEW VERSION AVAILABLE</span>
			</div>

			<h2 id="update-modal-title" class="update-title">
				Update Ready: v{updateService.latestRelease.version}
			</h2>

			<p class="update-subtitle">
				A new version of Mezzo is available. Update now to get the latest features, enhancements, and bug fixes.
			</p>

			<div class="version-comparison-row">
				<div class="ver-box current">
					<span class="ver-label">Current</span>
					<span class="ver-val">v{updateService.currentVersion}</span>
				</div>
				<div class="ver-arrow">→</div>
				<div class="ver-box new">
					<span class="ver-label">Latest</span>
					<span class="ver-val">v{updateService.latestRelease.version}</span>
				</div>
			</div>

			{#if updateService.latestRelease.notes}
				<div class="release-notes-box">
					<span class="notes-header">What's New:</span>
					<div class="notes-body">
						{updateService.latestRelease.notes.slice(0, 300)}
					</div>
				</div>
			{/if}

			<div class="update-actions">
				<button type="button" class="btn-primary-update" onclick={handleUpdate}>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					<span>Download &amp; Install</span>
				</button>
				<button type="button" class="btn-dismiss" onclick={handleDismiss}>
					<span>Remind Me Later</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.update-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(12px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.update-modal-content {
		position: relative;
		width: 100%;
		max-width: 26rem;
		background: #121216;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.5rem;
		padding: 2rem 1.75rem 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.75),
			0 0 40px rgba(30, 215, 96, 0.15);
		animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.update-icon-wrap {
		position: relative;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: linear-gradient(135deg, rgba(30, 215, 96, 0.2) 0%, rgba(13, 242, 201, 0.1) 100%);
		border: 1px solid rgba(30, 215, 96, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #1ed760;
		margin-bottom: 1rem;

		.glow-orb {
			position: absolute;
			inset: -0.5rem;
			border-radius: 50%;
			background: radial-gradient(circle, rgba(30, 215, 96, 0.3) 0%, transparent 70%);
			filter: blur(8px);
			z-index: -1;
		}
	}

	.update-badge {
		display: inline-flex;
		align-items: center;
		background: rgba(30, 215, 96, 0.12);
		border: 1px solid rgba(30, 215, 96, 0.3);
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		margin-bottom: 0.75rem;

		span {
			font-size: 0.65rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			color: #1ed760;
		}
	}

	.update-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: #ffffff;
		margin: 0 0 0.5rem;
		letter-spacing: -0.02em;
	}

	.update-subtitle {
		font-size: 0.85rem;
		color: #a0a0a8;
		margin: 0 0 1.25rem;
		line-height: 1.45;
	}

	.version-comparison-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		width: 100%;
		justify-content: center;

		.ver-box {
			flex: 1;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 255, 255, 0.08);
			padding: 0.6rem 0.5rem;
			border-radius: 0.75rem;
			display: flex;
			flex-direction: column;
			gap: 0.15rem;

			.ver-label {
				font-size: 0.65rem;
				color: #808088;
				text-transform: uppercase;
				font-weight: 600;
			}

			.ver-val {
				font-size: 0.95rem;
				font-weight: 700;
				color: #ffffff;
			}

			&.new {
				background: rgba(30, 215, 96, 0.08);
				border-color: rgba(30, 215, 96, 0.3);

				.ver-val {
					color: #1ed760;
				}
			}
		}

		.ver-arrow {
			color: #606068;
			font-size: 1.1rem;
			font-weight: 700;
		}
	}

	.release-notes-box {
		width: 100%;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.75rem;
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		text-align: left;
		box-sizing: border-box;

		.notes-header {
			display: block;
			font-size: 0.7rem;
			font-weight: 700;
			color: #888890;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 0.35rem;
		}

		.notes-body {
			font-size: 0.8rem;
			color: #d0d0d8;
			line-height: 1.4;
			white-space: pre-wrap;
			max-height: 5.5rem;
			overflow-y: auto;
		}
	}

	.update-actions {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;

		.btn-primary-update {
			width: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			background: #1ed760;
			color: #000000;
			font-size: 0.95rem;
			font-weight: 700;
			padding: 0.85rem 1.25rem;
			border-radius: 9999px;
			border: none;
			cursor: pointer;
			transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

			&:hover {
				background: #22e668;
				transform: translateY(-1px);
				box-shadow: 0 4px 15px rgba(30, 215, 96, 0.35);
			}

			&:active {
				transform: translateY(0);
			}
		}

		.btn-dismiss {
			width: 100%;
			background: transparent;
			color: #888890;
			font-size: 0.85rem;
			font-weight: 600;
			padding: 0.6rem 1rem;
			border: none;
			cursor: pointer;
			transition: color 0.15s ease;

			&:hover {
				color: #ffffff;
			}
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleUp {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
