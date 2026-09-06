<script lang="ts">
	interface Props {
		onLoginClick?: () => void;
		onSignupClick?: () => void;
	}

	let { onLoginClick, onSignupClick }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="spotify-login-footer"
	onclick={onLoginClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === "Enter" && onLoginClick?.()}
>
	<div class="footer-content">
		<div class="text-group">
			<span class="kicker">PREVIEW OF MEZZO</span>
			<p class="description">Sign up to get unlimited songs and playlists with occasional ads. No credit card needed.</p>
		</div>

		<button class="signup-btn" onclick={(e) => { e.stopPropagation(); onSignupClick?.() ?? onLoginClick?.(); }}>
			Sign up free
		</button>
	</div>
</div>

<style lang="scss">
	.spotify-login-footer {
		flex-shrink: 0;
		margin: 0.5rem;
		background: linear-gradient(90deg, #af2896 0%, #509bf5 100%);
		border-radius: 0.5rem;
		padding: 0.75rem 1.5rem;
		user-select: none;
		cursor: pointer;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

		@media screen and (max-width: 900px) {
			margin: 0.25rem 0.25rem 4rem;
			padding: 0.65rem 1rem;
		}
	}

	.footer-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		max-width: 100%;

		.text-group {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;

			.kicker {
				color: #ffffff;
				font-size: 0.75rem;
				font-weight: 800;
				letter-spacing: 0.08em;
				text-transform: uppercase;
			}

			.description {
				color: #ffffff;
				font-size: 0.95rem;
				font-weight: 600;
				margin: 0;
			}
		}

		.signup-btn {
			background: #ffffff !important;
			color: #000000 !important;
			border: none !important;
			border-radius: 9999px !important;
			padding: 0.75rem 1.85rem !important;
			font-size: 0.95rem !important;
			font-weight: 700 !important;
			cursor: pointer !important;
			white-space: nowrap !important;
			box-shadow: none !important;
			transition: transform 150ms ease, background 150ms ease !important;
			flex-shrink: 0;

			&:hover {
				transform: scale(1.05) !important;
				background: #f6f6f6 !important;
			}
		}
	}

	@media screen and (max-width: 768px) {
		.footer-content {
			.text-group .description {
				font-size: 0.82rem;
			}

			.signup-btn {
				padding: 0.55rem 1.25rem !important;
				font-size: 0.85rem !important;
			}
		}
	}
</style>
