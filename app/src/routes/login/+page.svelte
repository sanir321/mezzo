<script lang="ts">
	import { goto } from "$app/navigation";
	import { signIn, persistAuthToken } from "$lib/auth-client";
	import { useSharedSession } from "$lib/session.svelte";
	import { startSocialAuth } from "$lib/utils/social-auth";

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
			persistAuthToken(r);
			try {
				const { authClient } = await import("$lib/auth-client");
				await authClient.getSession({ query: {} });
			} catch {}
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
			await startSocialAuth("google");
		} catch (err: any) {
			authError = err.message ?? "Google sign in failed";
		} finally {
			authBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Log in — Mezzo</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<header class="auth-header">
			<a href="/" class="brand-link" aria-label="Mezzo Home">
				<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
			</a>
			<h1 class="auth-title">Log in to Mezzo</h1>
		</header>

		<div class="auth-actions">
			<button type="button" class="google-btn" onclick={handleGoogleLogin} disabled={authBusy}>
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" class="google-icon">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
				</svg>
				<span>Continue with Google</span>
			</button>
		</div>

		<div class="divider">
			<span class="divider-line"></span>
			<span class="divider-text">or</span>
			<span class="divider-line"></span>
		</div>

		{#if authError}
			<div class="error-banner">
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
				</svg>
				<span>{authError}</span>
			</div>
		{/if}

		<form onsubmit={handleLogin} class="auth-form">
			<div class="form-group">
				<label for="login-email">Email or username</label>
				<input
					id="login-email"
					bind:value={email}
					type="email"
					placeholder="Email or username"
					class="auth-input"
					required
					autocomplete="email"
				/>
			</div>

			<div class="form-group">
				<label for="login-password">Password</label>
				<div class="password-wrap">
					<input
						id="login-password"
						bind:value={password}
						type={showPassword ? "text" : "password"}
						placeholder="Password"
						class="auth-input"
						required
						minlength="6"
						autocomplete="current-password"
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
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<button type="submit" class="btn-green" disabled={authBusy}>
				{#if authBusy}
					<span class="spinner"></span>
					<span>Logging in...</span>
				{:else}
					<span>Log In</span>
				{/if}
			</button>
		</form>

		<div class="forgot-wrap">
			<a href="/login/forgot" class="forgot-link">
				Forgot your password?
			</a>
		</div>

		<div class="bottom-divider"></div>

		<div class="auth-switch">
			<p>Don't have an account?</p>
			<a href="/signup" class="switch-link">Sign up for Mezzo</a>
		</div>

		<div class="landing-switch">
			<a href="/landing" class="subtle-link">← Back to Mezzo overview</a>
			<span class="dot-sep">•</span>
			<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="subtle-link">Download Android App (.apk)</a>
		</div>
	</div>
</div>

<style lang="scss">
	.auth-page {
		min-height: 100dvh;
		background: radial-gradient(circle at 50% 15%, #1c1c1c 0%, #000000 70%);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2.5rem 1.25rem;
		box-sizing: border-box;
	}

	.auth-card {
		width: 100%;
		max-width: 32rem;
		background: #141414;
		border-radius: 24px;
		padding: 3rem 2.5rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	.auth-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 2rem;

		.brand-link {
			display: inline-block;
			margin-bottom: 1.25rem;
			transition: transform 150ms ease;

			&:hover {
				transform: scale(1.08);
			}
		}

		.brand-logo {
			width: 3.5rem;
			height: 3.5rem;
			display: block;
		}

		.auth-title {
			font-size: 2.15rem;
			font-weight: 800;
			letter-spacing: -0.035em;
			margin: 0;
			color: #ffffff;
			text-align: center;
		}
	}

	.auth-actions {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		margin-bottom: 1.75rem;
		width: 100%;
	}

	.google-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		background: transparent;
		border: 1.5px solid rgba(255, 255, 255, 0.35);
		border-radius: 9999px;
		color: #ffffff;
		font-size: 1.05rem;
		font-weight: 700;
		padding: 1rem 1.6rem;
		min-height: 3.4rem;
		cursor: pointer;
		width: 100%;
		box-sizing: border-box;
		transition: border-color 150ms ease, transform 120ms ease, background-color 150ms ease;

		&:hover:not(:disabled) {
			border-color: #ffffff;
			background: rgba(255, 255, 255, 0.08);
			transform: scale(1.01);
		}

		&:active:not(:disabled) {
			transform: scale(0.99);
		}

		&:disabled {
			opacity: 0.5;
			cursor: default;
		}

		.google-icon {
			flex-shrink: 0;
		}
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		width: 100%;

		.divider-line {
			flex: 1;
			height: 1px;
			background: #292929;
		}

		.divider-text {
			color: #a7a7a7;
			font-size: 0.8rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;
		}
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.35);
		border-radius: 10px;
		padding: 0.75rem 1rem;
		color: #fca5a5;
		font-size: 0.88rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		width: 100%;
		box-sizing: border-box;

		svg {
			flex-shrink: 0;
		}
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		box-sizing: border-box;

		.form-group {
			display: flex !important;
			flex-direction: column !important;
			align-items: stretch !important;
			gap: 0.55rem;
			width: 100%;
			box-sizing: border-box;

			label {
				display: block !important;
				width: 100% !important;
				font-size: 0.88rem !important;
				font-weight: 800 !important;
				color: #ffffff !important;
				letter-spacing: 0.05em !important;
				text-transform: uppercase !important;
				font-variant: normal !important;
				font-variant-caps: normal !important;
				padding-left: 0.75rem;
				margin: 0;
				text-align: left !important;
			}
		}

		.password-wrap {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;
			box-sizing: border-box;

			.auth-input {
				padding-right: 3.5rem !important;
			}

			.eye-btn {
				position: absolute;
				right: 0.95rem;
				top: 50%;
				transform: translateY(-50%);
				background: transparent;
				border: none;
				color: #a7a7a7;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.5rem;
				border-radius: 50%;
				transition: color 150ms ease, background-color 150ms ease;

				&:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.1);
				}
			}
		}

		.auth-input {
			display: block !important;
			width: 100% !important;
			background: #181818 !important;
			border: 1.5px solid rgba(255, 255, 255, 0.22) !important;
			border-radius: 9999px !important;
			color: #ffffff !important;
			font-size: 1.05rem !important;
			padding: 1.05rem 1.5rem !important;
			min-height: 3.4rem !important;
			outline: none !important;
			box-sizing: border-box !important;
			transition: border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;

			&:hover {
				border-color: rgba(255, 255, 255, 0.5) !important;
			}

			&:focus {
				border-color: #ffffff !important;
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
				background: #202020 !important;
			}

			&::placeholder {
				color: #727272;
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
	}

	.btn-green {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 1.05rem 1.75rem;
		font-size: 1.08rem;
		font-weight: 800;
		min-height: 3.4rem;
		cursor: pointer;
		text-decoration: none;
		margin-top: 0.5rem;
		width: 100%;
		box-sizing: border-box;
		box-shadow: 0 4px 20px rgba(30, 215, 96, 0.25);
		transition: background-color 150ms ease, transform 120ms ease, box-shadow 150ms ease;

		&:hover:not(:disabled) {
			background: #22e065;
			transform: scale(1.01);
			box-shadow: 0 6px 24px rgba(30, 215, 96, 0.35);
		}

		&:active:not(:disabled) {
			transform: scale(0.99);
		}

		&:disabled {
			opacity: 0.5;
			cursor: default;
		}

		.spinner {
			width: 1.1rem;
			height: 1.1rem;
			border: 2px solid rgba(0, 0, 0, 0.25);
			border-top-color: #000000;
			border-radius: 50%;
			animation: spin 600ms linear infinite;
		}
	}

	.forgot-wrap {
		display: flex;
		justify-content: center;
		margin-top: 1.35rem;

		.forgot-link {
			color: #ffffff;
			font-size: 0.92rem;
			font-weight: 700;
			text-decoration: underline;
			transition: color 150ms ease;

			&:hover {
				color: #1ed760;
			}
		}
	}

	.bottom-divider {
		height: 1px;
		background: #292929;
		margin: 2.2rem 0 1.5rem;
		width: 100%;
	}

	.auth-switch {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-size: 1rem;
		color: #a7a7a7;

		p {
			margin: 0;
		}

		.switch-link {
			color: #ffffff;
			font-weight: 700;
			text-decoration: underline;
			transition: color 150ms ease;

			&:hover {
				color: #1ed760;
			}
		}
	}

	.landing-switch {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		font-size: 0.85rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;

		.subtle-link {
			color: rgba(255, 255, 255, 0.5);
			text-decoration: none;
			transition: color 140ms ease;

			&:hover {
				color: #1ed760;
				text-decoration: underline;
			}
		}

		.dot-sep {
			color: rgba(255, 255, 255, 0.25);
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.auth-page {
			padding: 1.5rem 1rem;
			background: radial-gradient(circle at 50% 15%, #181818 0%, #000000 80%);
			align-items: center !important;
			justify-content: center !important;
		}

		.auth-card {
			padding: 2.2rem 1.4rem !important;
			border: 1px solid rgba(255, 255, 255, 0.12) !important;
			background: #141414 !important;
			border-radius: 20px !important;
			box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8) !important;
		}

		.auth-header .auth-title {
			font-size: 1.85rem !important;
		}
	}
</style>
