<script lang="ts">
	import { signIn, signUp } from "$lib/auth-client";
	import { authModal } from "$lib/stores/auth-modal.svelte";

	interface Props {
		open?: boolean;
		onclose?: () => void;
		onSuccess?: () => void;
	}

	let { open = $bindable(false), onclose, onSuccess }: Props = $props();

	let email = $state("");
	let password = $state("");
	let name = $state("");
	let showPassword = $state(false);
	let authError = $state("");
	let authBusy = $state(false);

	let authMode = $derived(authModal.mode);

	function closeModal() {
		open = false;
		authModal.close();
		authError = "";
		onclose?.();
	}

	function setMode(mode: "login" | "signup") {
		authModal.mode = mode;
		authError = "";
	}

	async function handleAuth(e: Event) {
		e.preventDefault();
		authError = "";
		authBusy = true;
		try {
			if (authMode === "login") {
				const r = await signIn.email({ email, password });
				if (r.error) throw new Error(r.error.message ?? "Incorrect email or password.");
			} else {
				const r = await signUp.email({ email, password, name: name.trim() || email.split("@")[0] });
				if (r.error) throw new Error(r.error.message ?? "Registration failed. Please try again.");
			}
			closeModal();
			onSuccess?.();
		} catch (err: any) {
			authError = err.message ?? "Authentication failed. Please check your credentials.";
		} finally {
			authBusy = false;
		}
	}

	async function handleSocial(provider: "google" | "github") {
		authError = "";
		try {
			const r = await signIn.social({ provider });
			if (r.error) throw new Error(r.error.message ?? `${provider} sign in failed`);
		} catch (err: any) {
			authError = err.message ?? `${provider} sign in failed`;
		}
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeModal();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="mono-auth-backdrop"
		onclick={handleBackdrop}
		onkeydown={(e) => e.key === "Escape" && closeModal()}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
	>
		<div class="mono-auth-card">
			<button class="close-btn" onclick={closeModal} aria-label="Close modal">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
				</svg>
			</button>

			<div class="brand-header">
				<div class="brand-badge">
					<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
					<span class="brand-title">MEZZO</span>
				</div>
				<h2 class="auth-headline">{authMode === "login" ? "Welcome back" : "Create your account"}</h2>
				<p class="auth-subline">
					{authMode === "login" ? "Log in to access your lossless library & playlists." : "Join Mezzo to stream studio-master lossless audio."}
				</p>
			</div>

			<!-- Tab Switcher -->
			<div class="mode-tabs" role="tablist">
				<button
					type="button"
					class="tab-btn"
					class:active={authMode === "login"}
					onclick={() => setMode("login")}
					role="tab"
					aria-selected={authMode === "login"}
				>
					Log In
				</button>
				<button
					type="button"
					class="tab-btn"
					class:active={authMode === "signup"}
					onclick={() => setMode("signup")}
					role="tab"
					aria-selected={authMode === "signup"}
				>
					Sign Up
				</button>
			</div>

			<!-- Social OAuth: Google Sign In / Sign Up -->
			<div class="social-list">
				<button type="button" class="social-btn google-primary-btn" onclick={() => handleSocial("google")} disabled={authBusy}>
					<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" class="social-icon">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
					</svg>
					<span>{authMode === "signup" ? "Sign up with Google" : "Continue with Google"}</span>
				</button>
			</div>

			{#if authMode === "login"}
				<div class="auth-divider-wrap">
					<span class="divider-line"></span>
					<span class="divider-text">or existing password account</span>
					<span class="divider-line"></span>
				</div>

				<form onsubmit={handleAuth} class="auth-form">
					<div class="field">
						<label for="modal-email">Email address</label>
						<input
							id="modal-email"
							bind:value={email}
							type="email"
							placeholder="name@domain.com"
							class="mono-input"
							required
						/>
					</div>

					<div class="field">
						<label for="modal-password">Password</label>
						<div class="pw-wrap">
							<input
								id="modal-password"
								bind:value={password}
								type={showPassword ? "text" : "password"}
								placeholder="Enter your password"
								class="mono-input"
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
									<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
										<line x1="1" y1="1" x2="23" y2="23" />
									</svg>
								{:else}
									<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								{/if}
							</button>
						</div>
					</div>

					{#if authError}
						<div class="error-banner">
							<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
							<span>{authError}</span>
						</div>
					{/if}

					<button type="submit" class="mono-submit-btn" disabled={authBusy}>
						{#if authBusy}
							<span class="spinner"></span>
							<span>Please wait...</span>
						{:else}
							<span>Log In with Password</span>
							<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.5">
								<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
							</svg>
						{/if}
					</button>
				</form>
			{:else}
				<div class="google-only-notice">
					<p>Sign up is instant with your Google account. No email confirmation or password required!</p>
				</div>
			{/if}

			<div class="toggle-footer">
				{#if authMode === "login"}
					<span>Don't have an account?</span>
					<button
						type="button"
						class="toggle-link"
						onclick={() => setMode("signup")}
					>
						Sign up for free
					</button>
				{:else}
					<span>Already have an account?</span>
					<button
						type="button"
						class="toggle-link"
						onclick={() => setMode("login")}
					>
						Log in here
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.mono-auth-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(20px);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		animation: fadeIn 180ms ease-out;
	}

	.mono-auth-card {
		position: relative;
		width: 100%;
		max-width: 27rem;
		background: #121212;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 16px;
		padding: 2.25rem 2rem;
		box-shadow: 0 32px 64px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05);
		display: flex;
		flex-direction: column;
		animation: scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1);

		@media (max-width: 500px) {
			padding: 1.75rem 1.25rem;
		}
	}

	.close-btn {
		position: absolute;
		top: 1.25rem;
		right: 1.25rem;
		background: transparent;
		border: none;
		color: #a7a7a7;
		cursor: pointer;
		padding: 0.45rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 150ms ease;

		&:hover {
			color: #ffffff;
			background: rgba(255, 255, 255, 0.1);
			transform: scale(1.08);
		}
	}

	.brand-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		margin-bottom: 1.25rem;

		.brand-badge {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.35rem 0.75rem;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 9999px;
			margin-bottom: 0.75rem;

			.brand-logo {
				width: 1.25rem;
				height: 1.25rem;
			}

			.brand-title {
				font-size: 0.78rem;
				font-weight: 800;
				letter-spacing: 0.1em;
				color: #ffffff;
			}
		}

		.auth-headline {
			color: #ffffff;
			font-size: 1.5rem;
			font-weight: 800;
			letter-spacing: -0.03em;
			margin: 0 0 0.35rem;
		}

		.auth-subline {
			color: #a7a7a7;
			font-size: 0.85rem;
			line-height: 1.4;
			margin: 0;
			max-width: 22rem;
		}
	}

	.mode-tabs {
		display: flex;
		background: #1a1a1a;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 9999px;
		padding: 3px;
		margin-bottom: 1.25rem;
		gap: 3px;

		.tab-btn {
			flex: 1;
			background: transparent;
			border: none;
			color: #a7a7a7;
			font-size: 0.85rem;
			font-weight: 700;
			padding: 0.55rem 0.75rem;
			border-radius: 9999px;
			cursor: pointer;
			transition: all 150ms ease;

			&:hover {
				color: #ffffff;
			}

			&.active {
				background: #ffffff;
				color: #000000;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
			}
		}
	}

	.social-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		margin-bottom: 1rem;

		.social-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.75rem;
			background: transparent;
			border: 1px solid rgba(255, 255, 255, 0.15);
			border-radius: 9999px;
			color: #ffffff;
			font-size: 0.9rem;
			font-weight: 700;
			padding: 0.7rem 1.25rem;
			cursor: pointer;
			transition: all 150ms ease;

			&:hover {
				border-color: #ffffff;
				background: rgba(255, 255, 255, 0.06);
				transform: scale(1.015);
			}

			&.google-primary-btn {
				background: #ffffff;
				color: #0b0d12;
				border: none;
				font-weight: 800;
				padding: 0.85rem 1.4rem;
				box-shadow: 0 4px 16px rgba(255, 255, 255, 0.18);

				&:hover {
					background: #f4f4f4;
					transform: scale(1.02);
				}
			}
		}
	}

	.google-only-notice {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 0.85rem 1rem;
		text-align: center;
		margin-top: 0.5rem;

		p {
			color: #a7a7a7;
			font-size: 0.82rem;
			line-height: 1.4;
			margin: 0;
		}
	}

	.auth-divider-wrap {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0.25rem 0 1rem;

		.divider-line {
			flex: 1;
			height: 1px;
			background: rgba(255, 255, 255, 0.1);
		}

		.divider-text {
			color: #777777;
			font-size: 0.75rem;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.95rem;

		.field {
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

		.pw-wrap {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;

			.mono-input {
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

		.mono-input {
			background: #181818;
			border: 1px solid rgba(255, 255, 255, 0.18);
			border-radius: 9999px;
			color: #ffffff;
			font-size: 0.92rem;
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

			/* Fix browser autofill override (prevent bright square blue background) */
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
			gap: 0.55rem;
			background: rgba(239, 68, 68, 0.15);
			border: 1px solid rgba(239, 68, 68, 0.35);
			border-radius: 8px;
			padding: 0.65rem 0.85rem;
			color: #fca5a5;
			font-size: 0.82rem;
			font-weight: 600;
		}

		.mono-submit-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			background: #ffffff;
			color: #000000;
			border: none;
			border-radius: 9999px;
			padding: 0.85rem 1.5rem;
			font-size: 0.95rem;
			font-weight: 800;
			cursor: pointer;
			margin-top: 0.35rem;
			transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
			letter-spacing: -0.01em;

			&:hover:not(:disabled) {
				background: #f0f0f0;
				transform: scale(1.02);
				box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2);
			}

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}

			.spinner {
				width: 1rem;
				height: 1rem;
				border: 2px solid rgba(0, 0, 0, 0.2);
				border-top-color: #000000;
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
		gap: 0.4rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);

		span {
			color: #a7a7a7;
			font-size: 0.85rem;
		}

		.toggle-link {
			background: transparent;
			border: none;
			color: #ffffff;
			font-size: 0.85rem;
			font-weight: 700;
			text-decoration: underline;
			text-underline-offset: 2px;
			cursor: pointer;
			transition: color 150ms ease;

			&:hover {
				color: #1ed760;
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleIn {
		from { opacity: 0; transform: scale(0.96) translateY(6px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
