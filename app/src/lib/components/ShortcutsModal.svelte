<script lang="ts">
	import { playerShowShortcuts } from "$lib/stores/player.svelte";

	function close() {
		playerShowShortcuts.value = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if playerShowShortcuts.value}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="shortcuts-backdrop" onclick={close}>
		<div class="shortcuts-modal" onclick={(e) => e.stopPropagation()}>
			<div class="shortcuts-header">
				<div class="title-group">
					<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="none" stroke="currentColor" stroke-width="2">
						<rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" /><line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" /><line x1="6" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="18" y2="12" /><line x1="7" y1="16" x2="17" y2="16" stroke-width="2" />
					</svg>
					<h2>Keyboard Shortcuts</h2>
				</div>
				<button class="close-btn" onclick={close} aria-label="Close shortcuts">
					<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="shortcuts-content">
				<div class="shortcut-group">
					<h3>Playback</h3>
					<div class="shortcut-row">
						<span class="label">Play / Pause</span>
						<div class="keys"><kbd>Space</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Next Track</span>
						<div class="keys"><kbd>Shift</kbd> + <kbd>→</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Previous Track</span>
						<div class="keys"><kbd>Shift</kbd> + <kbd>←</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Seek Backward 5s</span>
						<div class="keys"><kbd>←</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Seek Forward 5s</span>
						<div class="keys"><kbd>→</kbd></div>
					</div>
				</div>

				<div class="shortcut-group">
					<h3>Audio & Controls</h3>
					<div class="shortcut-row">
						<span class="label">Volume Up (+10%)</span>
						<div class="keys"><kbd>↑</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Volume Down (-10%)</span>
						<div class="keys"><kbd>↓</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Mute / Unmute</span>
						<div class="keys"><kbd>M</kbd></div>
					</div>
				</div>

				<div class="shortcut-group">
					<h3>Navigation & Views</h3>
					<div class="shortcut-row">
						<span class="label">Full Screen Mode</span>
						<div class="keys"><kbd>F</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Audio Equalizer</span>
						<div class="keys"><kbd>E</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Synchronized Lyrics</span>
						<div class="keys"><kbd>L</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Play Queue</span>
						<div class="keys"><kbd>Q</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Search</span>
						<div class="keys"><kbd>/</kbd></div>
					</div>
					<div class="shortcut-row">
						<span class="label">Keyboard Help</span>
						<div class="keys"><kbd>?</kbd></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.shortcuts-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.78);
		backdrop-filter: blur(8px);
		z-index: 10015;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		animation: fadeIn 150ms ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.shortcuts-modal {
		background: #141416;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1rem;
		width: 100%;
		max-width: 32rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
		color: #ffffff;
		overflow: hidden;
		animation: scaleUp 180ms ease;
	}

	@keyframes scaleUp {
		from { transform: scale(0.96); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.shortcuts-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		.title-group {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			svg {
				color: #1ed760;
			}

			h2 {
				font-size: 1.15rem;
				font-weight: 700;
				color: #ffffff;
				margin: 0;
			}
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
			transition: all 150ms ease;

			&:hover {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.1);
			}
		}
	}

	.shortcuts-content {
		padding: 1.25rem 1.5rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-height: 75vh;
		overflow-y: auto;
	}

	.shortcut-group {
		h3 {
			font-size: 0.8rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: #1ed760;
			margin: 0 0 0.6rem 0;
		}

		.shortcut-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.45rem 0;
			border-bottom: 1px solid rgba(255, 255, 255, 0.04);

			&:last-child {
				border-bottom: none;
			}

			.label {
				font-size: 0.92rem;
				color: rgba(255, 255, 255, 0.85);
			}

			.keys {
				display: flex;
				align-items: center;
				gap: 0.35rem;
				font-size: 0.85rem;
				color: rgba(255, 255, 255, 0.6);
			}
		}
	}

	kbd {
		background: #242428;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-bottom: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 0.35rem;
		color: #ffffff;
		font-family: inherit;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
</style>
