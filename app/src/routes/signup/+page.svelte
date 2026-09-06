<script lang="ts">
	import { goto } from "$app/navigation";
	import { useSession, signIn } from "$lib/auth-client";

	const sessionAtom = useSession();

	$effect(() => {
		return sessionAtom.subscribe((value: any) => {
			if (value?.data?.user) {
				goto("/");
			}
		});
	});

	let authError = $state("");
	let authBusy = $state(false);

	async function handleGoogleSignUp() {
		authError = "";
		authBusy = true;
		try {
			const r = await signIn.social({ provider: "google" });
			if (r.error) throw new Error(r.error.message ?? "Google sign up failed. Please try again.");
		} catch (err: any) {
			authError = err.message ?? "Unable to initiate Google sign in. Please try again.";
		} finally {
			authBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Sign up — Mezzo Web Player</title>
</svelte:head>

<div class="auth-page">
	<header class="auth-header">
		<a href="/" class="brand-link" aria-label="Mezzo Home">
			<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
			<span class="brand-text">MEZZO</span>
		</a>
	</header>

	<main class="auth-main">
		<div class="auth-card">
			<div class="card-header">
				<div class="badge-pill">
					<span class="dot"></span>
					<span>Lossless Audio Engine</span>
				</div>
				<h1 class="auth-title">Sign up for Mezzo</h1>
				<p class="auth-subtitle">Join Mezzo with your Google account. Fast, secure, and no passwords to remember.</p>
			</div>

			{#if authError}
				<div class="error-banner">
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span>{authError}</span>
				</div>
			{/if}

			<div class="signup-cta-wrap">
				<button
					type="button"
					class="google-signup-btn"
					onclick={handleGoogleSignUp}
					disabled={authBusy}
				>
					{#if authBusy}
						<span class="spinner"></span>
						<span>Connecting to Google...</span>
					{:else}
						<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" class="google-icon">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
						</svg>
						<span>Continue with Google</span>
					{/if}
				</button>
			</div>

			<div class="benefits-card">
				<div class="benefit-item">
					<div class="benefit-icon">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ed760" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</div>
					<div class="benefit-text">
						<strong>Lossless Hi-Fi & Studio Audio</strong>
						<span>Stream uncompressed CD-quality and FLAC audio freely.</span>
					</div>
				</div>

				<div class="benefit-item">
					<div class="benefit-icon">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ed760" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</div>
					<div class="benefit-text">
						<strong>Instant Multi-Device Sync</strong>
						<span>Liked songs and custom playlists sync across phone and laptop.</span>
					</div>
				</div>

				<div class="benefit-item">
					<div class="benefit-icon">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ed760" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</div>
					<div class="benefit-text">
						<strong>100% Free • No Passwords Needed</strong>
						<span>Clean, ad-free listening experience designed for audiophiles.</span>
					</div>
				</div>
			</div>

			<div class="toggle-footer">
				<p>Already have an account?</p>
				<a href="/login" class="toggle-link">Log in here</a>
			</div>
		</div>
	</main>

	<footer class="auth-legal">
		<span>Mezzo Lossless Audio Engine • Minimalist & High-Fidelity</span>
	</footer>
</div>

<style lang="scss">
	.auth-page {
		min-height: 100vh;
		background: #000000;
		color: #ffffff;
		display: flex;
		flex-direction: column;
	}

	.auth-header {
		padding: 2rem;
		display: flex;
		justify-content: center;

		.brand-link {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			text-decoration: none;
			color: #ffffff;
			transition: opacity 150ms ease;

			&:hover {
				opacity: 0.85;
			}

			.brand-logo {
				width: 2.25rem;
				height: 2.25rem;
			}

			.brand-text {
				font-size: 1.4rem;
				font-weight: 900;
				letter-spacing: 0.08em;
			}
		}
	}

	.auth-main {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem 1rem 3rem;
	}

	.auth-card {
		width: 100%;
		max-width: 28rem;
		background: #12141a;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 20px;
		padding: 2.75rem 2.25rem;
		display: flex;
		flex-direction: column;
		box-shadow: 0 32px 64px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05);

		@media (max-width: 600px) {
			padding: 2rem 1.25rem;
			background: transparent;
			border: none;
			box-shadow: none;
		}
	}

	.card-header {
		text-align: center;
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;

		.badge-pill {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			background: rgba(30, 215, 96, 0.12);
			border: 1px solid rgba(30, 215, 96, 0.3);
			color: #86efac;
			padding: 0.3rem 0.85rem;
			border-radius: 9999px;
			font-size: 0.74rem;
			font-weight: 700;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			margin-bottom: 0.85rem;

			.dot {
				width: 6px;
				height: 6px;
				border-radius: 50%;
				background: #1ed760;
				box-shadow: 0 0 8px #1ed760;
			}
		}

		.auth-title {
			font-size: 1.85rem;
			font-weight: 900;
			letter-spacing: -0.03em;
			margin: 0 0 0.5rem;
			color: #ffffff;
		}

		.auth-subtitle {
			color: #a7a7a7;
			font-size: 0.92rem;
			margin: 0;
			line-height: 1.45;
			max-width: 24rem;
		}
	}

	.signup-cta-wrap {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.75rem;

		.google-signup-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.85rem;
			background: #ffffff;
			color: #0b0d12;
			border: none;
			border-radius: 9999px;
			font-size: 1.05rem;
			font-weight: 800;
			padding: 1.05rem 1.75rem;
			cursor: pointer;
			box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.3);
			transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
			letter-spacing: -0.01em;

			&:hover:not(:disabled) {
				background: #f4f4f4;
				transform: scale(1.02);
				box-shadow: 0 6px 28px rgba(255, 255, 255, 0.3);
			}

			&:active:not(:disabled) {
				transform: scale(0.98);
			}

			&:disabled {
				opacity: 0.6;
				cursor: default;
			}

			.google-icon {
				flex-shrink: 0;
			}

			.spinner {
				width: 1.15rem;
				height: 1.15rem;
				border: 2px solid rgba(0, 0, 0, 0.2);
				border-top-color: #000000;
				border-radius: 50%;
				animation: spin 600ms linear infinite;
			}
		}
	}

	.benefits-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
		margin-bottom: 1.75rem;

		.benefit-item {
			display: flex;
			align-items: flex-start;
			gap: 0.85rem;

			.benefit-icon {
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: rgba(30, 215, 96, 0.12);
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
				margin-top: 1px;
			}

			.benefit-text {
				display: flex;
				flex-direction: column;
				gap: 0.15rem;

				strong {
					font-size: 0.88rem;
					font-weight: 700;
					color: #ffffff;
				}

				span {
					font-size: 0.78rem;
					color: #8e8e8e;
					line-height: 1.35;
				}
			}
		}
	}

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		color: #fca5a5;
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 1.25rem;
	}

	.toggle-footer {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);

		p {
			color: #a7a7a7;
			font-size: 0.9rem;
			margin: 0;
		}

		.toggle-link {
			color: #ffffff;
			font-size: 0.9rem;
			font-weight: 700;
			text-decoration: underline;
			text-underline-offset: 2px;
			transition: color 150ms ease;

			&:hover {
				color: #1ed760;
			}
		}
	}

	.auth-legal {
		padding: 2rem;
		text-align: center;
		color: #666666;
		font-size: 0.78rem;
		letter-spacing: 0.03em;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
