<script lang="ts">
	import { goto } from "$app/navigation";
	import { signIn } from "$lib/auth-client";
	import { useSharedSession } from "$lib/session.svelte";

	const sessionAtom = useSharedSession();

	$effect(() => {
		return sessionAtom.subscribe((value: any) => {
			if (value?.data?.user) {
				goto("/");
			}
		});
	});

	let email = $state("");
	let password = $state("");
	let showPassword = $state(false);
	let authError = $state("");
	let authBusy = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		authError = "";
		authBusy = true;
		try {
			const r = await signIn.email({ email, password });
			if (r.error) throw new Error(r.error.message ?? "Incorrect email or password.");
			goto("/");
		} catch (err: any) {
			authError = err.message ?? "Login failed. Please check your credentials.";
		} finally {
			authBusy = false;
		}
	}

	async function handleGoogleLogin() {
		authError = "";
		authBusy = true;
		try {
			const r = await signIn.social({ provider: "google" });
			if (r.error) throw new Error(r.error.message ?? "Google sign in failed");
		} catch (err: any) {
			authError = err.message ?? "Google sign in failed";
		} finally {
			authBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Log in — Mezzo Web Player</title>
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
				<h1 class="auth-title">Log in to Mezzo</h1>
				<p class="auth-subtitle">Welcome back! Sign in to access your saved music & playlists.</p>
			</div>

			<div class="social-list">
				<button type="button" class="google-login-btn" onclick={handleGoogleLogin} disabled={authBusy}>
					<svg viewBox="0 0 24 24" width="1.3rem" height="1.3rem" class="social-icon">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
					</svg>
					<span>Continue with Google</span>
				</button>
			</div>

			<div class="auth-divider-wrap">
				<span class="divider-line"></span>
				<span class="divider-text">or existing password account</span>
				<span class="divider-line"></span>
			</div>

			<form onsubmit={handleLogin} class="auth-form">
				{#if authError}
					<div class="error-banner">
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<span>{authError}</span>
					</div>
				{/if}
				<div class="form-group">
					<label for="login-email">Email address</label>
					<input
						id="login-email"
						bind:value={email}
						type="email"
						placeholder="name@domain.com"
						class="auth-input"
						required
					/>
				</div>

				<div class="form-group">
					<label for="login-password">Password</label>
					<div class="password-wrap">
						<input
							id="login-password"
							bind:value={password}
							type={showPassword ? "text" : "password"}
							placeholder="Enter your password"
							class="auth-input"
							required
							minlength="6"
						/>
						<button
							type="button"
							class="eye-btn"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{#if showPassword}
								<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
									<line x1="1" y1="1" x2="23" y2="23" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
									<circle cx="12" cy="12" r="3" />
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<button type="submit" class="auth-submit" disabled={authBusy}>
					{#if authBusy}
						<span class="spinner"></span>
						<span>Logging in...</span>
					{:else}
						<span>Log In with Password</span>
						<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2.5">
							<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
						</svg>
					{/if}
				</button>
			</form>

			<div class="toggle-footer">
				<p>Don't have an account?</p>
				<a href="/signup" class="toggle-link">Sign up with Google</a>
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
		margin-bottom: 1.75rem;

		.auth-title {
			font-size: 1.75rem;
			font-weight: 900;
			letter-spacing: -0.03em;
			margin: 0 0 0.4rem;
			color: #ffffff;
		}

		.auth-subtitle {
			color: #a7a7a7;
			font-size: 0.88rem;
			margin: 0;
			line-height: 1.4;
		}
	}

	.social-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.25rem;

		.google-login-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.85rem;
			background: #ffffff;
			border: none;
			border-radius: 9999px;
			color: #0b0d12;
			font-size: 1rem;
			font-weight: 800;
			padding: 0.95rem 1.4rem;
			cursor: pointer;
			box-shadow: 0 4px 16px rgba(255, 255, 255, 0.18);
			transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);

			&:hover:not(:disabled) {
				background: #f4f4f4;
				transform: scale(1.02);
				box-shadow: 0 6px 24px rgba(255, 255, 255, 0.28);
			}

			&:disabled {
				opacity: 0.6;
				cursor: default;
			}
		}
	}

	.auth-divider-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0.25rem 0 1.25rem;

		.divider-line {
			flex: 1;
			height: 1px;
			background: rgba(255, 255, 255, 0.1);
		}

		.divider-text {
			color: #777777;
			font-size: 0.72rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.15rem;

		.form-group {
			display: flex;
			flex-direction: column;
			gap: 0.4rem;

			label {
				font-size: 0.76rem;
				font-weight: 800;
				color: #ffffff;
				letter-spacing: 0.04em;
				text-transform: uppercase;
				padding-left: 0.75rem;
			}
		}

		.password-wrap {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;

			.auth-input {
				padding-right: 3rem !important;
			}

			.eye-btn {
				position: absolute;
				right: 0.9rem;
				background: transparent;
				border: none;
				color: #a7a7a7;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.4rem;
				border-radius: 50%;
				transition: all 150ms ease;

				&:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
				}
			}
		}

		.auth-input {
			background: #181818;
			border: 1px solid rgba(255, 255, 255, 0.18);
			border-radius: 9999px;
			color: #ffffff;
			font-size: 0.95rem;
			padding: 0.85rem 1.25rem;
			outline: none;
			width: 100%;
			box-sizing: border-box;
			transition: all 150ms ease;

			&:hover {
				border-color: rgba(255, 255, 255, 0.4);
			}

			&:focus {
				border-color: #ffffff;
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
				background: #1f1f1f;
			}

			&::placeholder {
				color: #777777;
			}

			&:-webkit-autofill,
			&:-webkit-autofill:hover,
			&:-webkit-autofill:focus,
			&:-webkit-autofill:active {
				-webkit-box-shadow: 0 0 0 1000px #181818 inset !important;
				-webkit-text-fill-color: #ffffff !important;
				caret-color: #ffffff !important;
				border-radius: 9999px !important;
				transition: background-color 5000s ease-in-out 0s;
			}
		}

		.error-banner {
			display: flex;
			align-items: center;
			gap: 0.6rem;
			background: rgba(239, 68, 68, 0.15);
			border: 1px solid rgba(239, 68, 68, 0.35);
			border-radius: 8px;
			padding: 0.75rem 1rem;
			color: #fca5a5;
			font-size: 0.85rem;
			font-weight: 600;
		}

		.auth-submit {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			background: rgba(255, 255, 255, 0.1);
			color: #ffffff;
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 9999px;
			padding: 0.85rem 1.5rem;
			font-size: 0.95rem;
			font-weight: 700;
			cursor: pointer;
			margin-top: 0.2rem;
			transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);

			&:hover:not(:disabled) {
				background: rgba(255, 255, 255, 0.18);
				border-color: #ffffff;
				transform: scale(1.01);
			}

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}

			.spinner {
				width: 1rem;
				height: 1rem;
				border: 2px solid rgba(255, 255, 255, 0.2);
				border-top-color: #ffffff;
				border-radius: 50%;
				animation: spin 600ms linear infinite;
			}
		}
	}

	.toggle-footer {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
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
