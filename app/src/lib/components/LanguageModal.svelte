<script lang="ts">
	import { userPreferences, POPULAR_LANGUAGES } from "$lib/stores/preferences.svelte";

	interface Props {
		open?: boolean;
		onclose?: () => void;
	}

	let { open = $bindable(false), onclose }: Props = $props();

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			open = false;
			onclose?.();
		}
	}

	function selectLanguage(name: string) {
		userPreferences.setLanguages([name]);
		open = false;
		onclose?.();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="lang-backdrop"
		onclick={handleBackdrop}
		onkeydown={(e) => e.key === "Escape" && (open = false)}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
	>
		<div class="lang-modal-card">
			<div class="modal-top">
				<div class="modal-titles">
					<h2>Choose a language</h2>
					<p>This updates your music recommendations and mixes.</p>
				</div>
				<button class="close-btn" onclick={() => { open = false; onclose?.(); }} aria-label="Close">
					<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<div class="lang-grid">
				{#each POPULAR_LANGUAGES as lang}
					{@const isSelected = userPreferences.languages.includes(lang.name)}
					<button
						class="lang-tile"
						class:selected={isSelected}
						onclick={() => selectLanguage(lang.name)}
					>
						<span class="native-name">{lang.native}</span>
						<span class="english-name">{lang.name}</span>
						{#if isSelected}
							<div class="check-pill">✓</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.lang-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(16px);
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		animation: fadeIn 150ms ease-out;
	}

	.lang-modal-card {
		position: relative;
		width: 100%;
		max-width: 50rem;
		max-height: 85vh;
		background: #282828;
		border-radius: 0.75rem;
		padding: 2rem;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
		animation: scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.modal-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;

		.modal-titles {
			h2 {
				color: #ffffff;
				font-size: 1.65rem;
				font-weight: 800;
				letter-spacing: -0.03em;
				margin: 0 0 0.25rem;
			}

			p {
				color: #a7a7a7;
				font-size: 0.9rem;
				margin: 0;
			}
		}

		.close-btn {
			background: transparent;
			border: none;
			color: #b3b3b3;
			cursor: pointer;
			padding: 0.35rem;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 120ms ease;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.1);
				transform: scale(1.08);
			}
		}
	}

	.lang-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: 0.85rem;
	}

	.lang-tile {
		background: #181818;
		border: 1px solid transparent;
		border-radius: 0.45rem;
		padding: 1rem 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		cursor: pointer;
		position: relative;
		text-align: left;
		transition: all 150ms ease;

		.native-name {
			color: #ffffff;
			font-size: 1.05rem;
			font-weight: 700;
		}

		.english-name {
			color: #a7a7a7;
			font-size: 0.82rem;
		}

		.check-pill {
			position: absolute;
			right: 0.85rem;
			top: 50%;
			transform: translateY(-50%);
			color: #1ed760;
			font-weight: 900;
			font-size: 1.1rem;
		}

		&:hover {
			background: #333333;
			border-color: rgba(255, 255, 255, 0.2);
		}

		&.selected {
			background: rgba(30, 215, 96, 0.12);
			border-color: #1ed760;

			.native-name {
				color: #1ed760;
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleIn {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
