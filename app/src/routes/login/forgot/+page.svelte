<script lang="ts">
	import { goto } from "$app/navigation";
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
	let name = $state("");
	let newPassword = $state("");
	let confirmPassword = $state("");
	let showPassword = $state(false);
	let authError = $state("");
	let authBusy = $state(false);
	let success = $state(false);

	async function handleReset(e: Event) {
		e.preventDefault();
		authError = "";

		if (newPassword.length < 6) {
			authError = "Password must be at least 6 characters long.";
			return;
		}

		if (newPassword !== confirmPassword) {
			authError = "Passwords do not match. Please re-enter.";
			return;
		}

		authBusy = true;
		try {
			const res = await fetch("/api/auth/reset-password-direct", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					name: name.trim(),
					newPassword,
				}),
			});

			const data = await res.json();
			if (!res.ok || !data.ok) {
				throw new Error(data.message || "Failed to reset password. Please verify your details.");
			}

			success = true;
		} catch (err: any) {
			authError = err.message || "Password reset failed. Please check your credentials.";
		} finally {
			authBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password — Mezzo</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<header class="auth-header">
			<a href="/" class="brand-link" aria-label="Mezzo Home">
				<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
			</a>
			<h1 class="auth-title">Reset your password</h1>
			<p class="auth-subtitle">Verify your account details to set a new password</p>
		</header>

		{#if success}
			<div class="success-view">
				<div class="success-icon">
					<svg viewBox="0 0 24 24" width="2rem" height="2rem" fill="none" stroke="#1ed760" stroke-width="2.5">
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</div>
				<h2>Password Updated!</h2>
				<p>Your password has been successfully reset. You can now log in with your new credentials.</p>
				<a href="/login" class="btn-green">Go to Log In</a>
			</div>
		{:else}
			{#if authError}
				<div class="error-banner">
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
					</svg>
					<span>{authError}</span>
				</div>
			{/if}

			<form onsubmit={handleReset} class="auth-form">
				<div class="form-group">
					<label for="reset-email">Registered email address</label>
					<input
						id="reset-email"
						bind:value={email}
						type="email"
						placeholder="name@domain.com"
						class="auth-input"
						required
						autocomplete="email"
					/>
				</div>

				<div class="form-group">
					<label for="reset-name">Your profile name</label>
					<input
						id="reset-name"
						bind:value={name}
						type="text"
						placeholder="Enter your account profile name"
						class="auth-input"
						required
						autocomplete="name"
					/>
				</div>

				<div class="form-group">
					<label for="reset-password">New password</label>
					<div class="password-wrap">
						<input
							id="reset-password"
							bind:value={newPassword}
							type={showPassword ? "text" : "password"}
							placeholder="At least 6 characters"
							class="auth-input"
							required
							minlength="6"
							autocomplete="new-password"
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

				<div class="form-group">
					<label for="reset-confirm-password">Confirm new password</label>
					<div class="password-wrap">
						<input
							id="reset-confirm-password"
							bind:value={confirmPassword}
							type={showPassword ? "text" : "password"}
							placeholder="Re-type your new password"
							class="auth-input"
							required
							minlength="6"
							autocomplete="new-password"
						/>
					</div>
				</div>

				<button type="submit" class="btn-green" disabled={authBusy}>
					{#if authBusy}
						<span class="spinner"></span>
						<span>Updating password...</span>
					{:else}
						<span>Reset Password</span>
					{/if}
				</button>
			</form>

			<div class="bottom-divider"></div>

			<div class="auth-switch">
				<p>Remembered your password?</p>
				<a href="/login" class="switch-link">Back to log in</a>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.auth-page {
		min-height: 100dvh;
		background: #000000;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1rem;
		box-sizing: border-box;
	}

	.auth-card {
		width: 100%;
		max-width: 28rem;
		background: #121212;
		border-radius: 16px;
		padding: 2.5rem 2rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
	}

	.auth-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.75rem;

		.brand-link {
			display: inline-block;
			margin-bottom: 1.25rem;
			transition: transform 150ms ease;

			&:hover {
				transform: scale(1.05);
			}
		}

		.brand-logo {
			width: 3rem;
			height: 3rem;
			display: block;
		}

		.auth-title {
			font-size: 1.85rem;
			font-weight: 800;
			letter-spacing: -0.03em;
			margin: 0 0 0.4rem;
			color: #ffffff;
			text-align: center;
		}

		.auth-subtitle {
			font-size: 0.9rem;
			color: #a7a7a7;
			margin: 0;
			text-align: center;
			line-height: 1.4;
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

	.success-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
		padding: 1rem 0;

		.success-icon {
			width: 4rem;
			height: 4rem;
			border-radius: 50%;
			background: rgba(30, 215, 96, 0.15);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		h2 {
			font-size: 1.5rem;
			font-weight: 800;
			color: #ffffff;
			margin: 0;
		}

		p {
			color: #a7a7a7;
			font-size: 0.95rem;
			line-height: 1.5;
			margin: 0 0 0.5rem;
		}

		.btn-green {
			width: 100%;
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
			gap: 0.45rem;
			width: 100%;
			box-sizing: border-box;

			label {
				display: block !important;
				width: 100% !important;
				font-size: 0.82rem !important;
				font-weight: 800 !important;
				color: #ffffff !important;
				letter-spacing: 0.04em !important;
				text-transform: uppercase !important;
				font-variant: normal !important;
				font-variant-caps: normal !important;
				padding-left: 0.6rem;
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
				padding-right: 3.25rem !important;
			}

			.eye-btn {
				position: absolute;
				right: 0.85rem;
				top: 50%;
				transform: translateY(-50%);
				background: transparent;
				border: none;
				color: #a7a7a7;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.45rem;
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
			font-size: 0.95rem !important;
			padding: 0.95rem 1.4rem !important;
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
		gap: 0.6rem;
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 0.95rem 1.5rem;
		font-size: 1rem;
		font-weight: 800;
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
			width: 1rem;
			height: 1rem;
			border: 2px solid rgba(0, 0, 0, 0.25);
			border-top-color: #000000;
			border-radius: 50%;
			animation: spin 600ms linear infinite;
		}
	}

	.bottom-divider {
		height: 1px;
		background: #292929;
		margin: 2rem 0 1.5rem;
		width: 100%;
	}

	.auth-switch {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
		font-size: 0.95rem;
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

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 480px) {
		.auth-page {
			padding: 1.5rem 1rem;
			background: #000000;
			align-items: flex-start;
		}

		.auth-card {
			padding: 1.5rem 0.5rem;
			border: none;
			background: transparent;
			box-shadow: none;
		}
	}
</style>
