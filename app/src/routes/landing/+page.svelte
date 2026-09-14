<script lang="ts">
	import { useSharedSession } from "$lib/session.svelte";
	import { getCachedUser } from "$lib/auth-token";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);
	let cachedUser = $state<any>(getCachedUser());

	sessionAtom.subscribe((val: any) => {
		sessionData = val;
		if (val?.data?.user) {
			cachedUser = val.data.user;
		}
	});

	const user = $derived(sessionData?.data?.user ?? cachedUser);
	const isLoggedIn = $derived(Boolean(user));

	let showSupportModal = $state(false);
	let copied = $state(false);

	function copyUpi() {
		navigator.clipboard.writeText("venkatesant820@okaxis");
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && showSupportModal) {
			showSupportModal = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Mezzo — Stream Music Free & Lossless</title>
	<meta
		name="description"
		content="High-fidelity music streaming with zero ads. Download the Android app or open the web player."
	/>
	<meta name="theme-color" content="#000000" />
</svelte:head>

<div class="landing">
	<!-- Nav -->
	<header class="nav">
		<a href="/landing" class="logo">
			<img src="/logo.svg" alt="Mezzo" />
			<span>Mezzo</span>
		</a>
		<div class="nav-right">
			<a href="https://github.com/sanir321/mezzo" target="_blank" rel="noopener noreferrer" class="nav-btn-github" title="Star Mezzo on GitHub">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
				</svg>
				<span class="desktop-only">Star</span>
				<svg viewBox="0 0 24 24" width="13" height="13" fill="#e3b341" class="star-icon">
					<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
				</svg>
			</a>

			<button type="button" class="nav-btn-coffee" title="Support Mezzo on Buy Me a Coffee" onclick={() => (showSupportModal = true)}>
				<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
					<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z" />
				</svg>
				<span class="desktop-only">Buy Me a Coffee</span>
			</button>

			{#if isLoggedIn}
				<a href="/" class="nav-link">Open Player</a>
			{:else}
				<a href="/login" class="nav-link">Log in</a>
				<a href="/signup" class="nav-link signup">Sign up</a>
			{/if}
		</div>
	</header>

	<!-- Hero -->
	<section class="hero">
		<p class="kicker">Free · Lossless · No Ads</p>
		<h1>Music without<br />compromise.</h1>
		<p class="sub">
			Stream millions of tracks in high fidelity.<br />
			No subscriptions. No interruptions. Ever.
		</p>

		<div class="actions">
			<a href="https://github.com/sanir321/mezzo/releases/latest/download/Mezzo-1.0.apk" class="btn-main">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download APK (Android)
			</a>
			<a href={isLoggedIn ? "/" : "/login"} class="btn-alt">
				Open Web Player
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</a>
			<a href="https://github.com/sanir321/mezzo" target="_blank" rel="noopener noreferrer" class="btn-github-hero">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
					<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
				</svg>
				GitHub Repo
			</a>
			<button type="button" class="btn-coffee-hero" onclick={() => (showSupportModal = true)}>
				<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
					<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z" />
				</svg>
				Buy Me a Coffee
			</button>
		</div>
	</section>

	<!-- Features -->
	<section class="features">
		<div class="feature">
			<div class="icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 18v-6a9 9 0 0 1 18 0v6" />
					<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
				</svg>
			</div>
			<h3>Lossless Audio</h3>
			<p>Crystal-clear hi-res streaming from high-bitrate sources.</p>
		</div>
		<div class="feature">
			<div class="icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
					<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
					<line x1="12" y1="19" x2="12" y2="23" />
					<line x1="8" y1="23" x2="16" y2="23" />
				</svg>
			</div>
			<h3>Synced Lyrics</h3>
			<p>Real-time lyrics that highlight line by line as you listen.</p>
		</div>
		<div class="feature">
			<div class="icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
					<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
					<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
					<line x1="1" y1="14" x2="7" y2="14" />
					<line x1="9" y1="8" x2="15" y2="8" />
					<line x1="17" y1="16" x2="23" y2="16" />
				</svg>
			</div>
			<h3>10-Band Equalizer</h3>
			<p>Fine-tune your sound with studio-grade presets and controls.</p>
		</div>
		<div class="feature">
			<div class="icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
			</div>
			<h3>Offline Mode</h3>
			<p>Download tracks and listen anywhere without a connection.</p>
		</div>
	</section>

	<!-- Download & Platform Guide -->
	<section class="download">
		<h2>Get Mezzo Everywhere</h2>
		<p>Stream on any device — natively on Android or via the Progressive Web App.</p>
		
		<div class="download-grid">
			<!-- 1. Android APK -->
			<div class="platform-card featured-platform">
				<div class="card-badge">Native App</div>
				<div class="platform-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
						<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789" />
					</svg>
				</div>
				<h3>Android (APK)</h3>
				<p>High performance native build with media notification bar controls and offline cache.</p>
				<div class="card-actions">
					<a href="https://github.com/sanir321/mezzo/releases/latest/download/Mezzo-1.0.apk" class="platform-btn primary">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Direct APK Download
					</a>
					<a href="https://github.com/sanir321/mezzo/releases/latest" target="_blank" rel="noopener" class="platform-btn secondary">
						GitHub Releases
					</a>
				</div>
			</div>

			<!-- 2. iOS & iPadOS (PWA) -->
			<div class="platform-card">
				<div class="platform-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
						<rect x="5" y="2" width="14" height="20" rx="3" />
						<line x1="12" y1="18" x2="12.01" y2="18" stroke-width="3" stroke-linecap="round" />
					</svg>
				</div>
				<h3>iOS & iPadOS</h3>
				<p>Open in Safari, tap <strong>Share</strong> and select <strong>Add to Home Screen</strong> for a full-screen app experience.</p>
				<div class="card-actions">
					<a href={isLoggedIn ? "/" : "/login"} class="platform-btn secondary">
						Open in Safari
					</a>
				</div>
			</div>

			<!-- 3. Desktop & Web -->
			<div class="platform-card">
				<div class="platform-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8">
						<rect x="2" y="3" width="20" height="14" rx="2" />
						<line x1="8" y1="21" x2="16" y2="21" />
						<line x1="12" y1="17" x2="12" y2="21" />
					</svg>
				</div>
				<h3>Desktop (Mac, Win, Linux)</h3>
				<p>Listen in Chrome, Edge, Firefox, or Safari. Click the install icon in your browser URL bar for the desktop app.</p>
				<div class="card-actions">
					<a href={isLoggedIn ? "/" : "/login"} class="platform-btn secondary">
						Launch Web Player
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="foot">
		<div class="foot-inner">
			<div class="foot-left">
				<a href="/landing" class="logo">
					<img src="/logo.svg" alt="Mezzo" />
					<span>Mezzo</span>
				</a>
				<p class="foot-tagline">Open-source, free high-fidelity audio streaming for everyone.</p>
			</div>

			<div class="foot-links">
				<a href="https://github.com/sanir321/mezzo" target="_blank" rel="noopener noreferrer" class="foot-link">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
					</svg>
					GitHub
				</a>
				<a href="https://github.com/sanir321/mezzo/releases" target="_blank" rel="noopener noreferrer" class="foot-link">Releases</a>
				<button type="button" class="foot-link coffee-link btn-reset" onclick={() => (showSupportModal = true)}>
					<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
						<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z" />
					</svg>
					Buy Me a Coffee
				</button>
			</div>
		</div>
		<p class="foot-copy">© 2026 Mezzo Music · Crafted with ❤️ by Samir Khadka</p>
	</footer>

	<!-- Support / Buy Me a Coffee Modal -->
	{#if showSupportModal}
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={() => (showSupportModal = false)}
			onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') showSupportModal = false; }}
		>
			<div
				class="modal-card"
				role="dialog"
				aria-modal="true"
				tabindex="0"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<div class="modal-header">
					<div class="modal-title">
						<div class="modal-title-icon">
							<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
								<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z" />
							</svg>
						</div>
						<div>
							<h3>Buy Me a Coffee</h3>
							<p>Support Mezzo's open-source development & hosting</p>
						</div>
					</div>
					<button
						type="button"
						class="btn-close"
						onclick={() => (showSupportModal = false)}
						aria-label="Close modal"
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				<div class="modal-body">
					<div class="qr-container">
						<div class="qr-frame">
							<img src="/upi-qr.png" alt="Scan UPI QR Code to pay" class="qr-image" />
						</div>
						<div class="qr-badge">Scan with GPay, PhonePe, Paytm, BHIM</div>
					</div>

					<div class="upi-box">
						<div class="upi-info">
							<span class="upi-label">UPI ID</span>
							<span class="upi-value">venkatesant820@okaxis</span>
						</div>
						<button
							type="button"
							class="btn-copy"
							onclick={copyUpi}
							class:copied
						>
							{#if copied}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
									<polyline points="20 6 9 17 4 12" />
								</svg>
								Copied!
							{:else}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
									<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
								</svg>
								Copy
							{/if}
						</button>
					</div>

					<div class="modal-actions">
						<a
							href="upi://pay?pa=venkatesant820@okaxis&pn=Mezzo%20Music&cu=INR"
							class="btn-upi-app"
						>
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="5" y="2" width="14" height="20" rx="3" />
								<line x1="12" y1="18" x2="12.01" y2="18" stroke-width="3" stroke-linecap="round" />
							</svg>
							Open UPI App
						</a>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	:global(body) {
		margin: 0;
		padding: 0;
		background: #000;
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
	}

	.desktop-only {
		@media screen and (max-width: 640px) {
			display: none !important;
		}
	}

	.landing {
		min-height: 100vh;
		background: #000;
		display: flex;
		flex-direction: column;
	}

	/* ─── Nav ─── */
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 2.5rem;
		max-width: 72rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;

		@media screen and (max-width: 640px) {
			padding: 1rem 1.25rem;
		}
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-decoration: none;
		color: #fff;

		img {
			width: 1.75rem;
			height: 1.75rem;
		}

		span {
			font-size: 1.2rem;
			font-weight: 800;
			letter-spacing: -0.03em;
		}
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.nav-btn-github {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: rgba(255, 255, 255, 0.85);
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.45rem 0.85rem;
		border-radius: 9999px;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.12);
		transition: all 150ms ease;

		&:hover {
			color: #fff;
			background: rgba(255, 255, 255, 0.14);
			border-color: rgba(255, 255, 255, 0.25);
		}

		.star-icon {
			color: #e3b341;
		}
	}

	.nav-btn-coffee {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: #000;
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 700;
		padding: 0.45rem 0.9rem;
		border-radius: 9999px;
		background: #ffdd00;
		border: none;
		cursor: pointer;
		font-family: inherit;
		transition: all 150ms ease;

		&:hover {
			background: #ffe333;
			transform: translateY(-1px);
			box-shadow: 0 4px 14px rgba(255, 221, 0, 0.35);
		}
	}

	.nav-link {
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		transition: color 150ms;

		&:hover {
			color: #fff;
		}

		&.signup {
			background: #fff;
			color: #000;
			padding: 0.5rem 1.25rem;
			border-radius: 9999px;
			font-weight: 700;

			&:hover {
				background: #e5e5e5;
				color: #000;
			}
		}
	}

	/* ─── Hero ─── */
	.hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 6rem 2rem 4rem;
		max-width: 48rem;
		margin: 0 auto;
	}

	.kicker {
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #1ed760;
		margin: 0 0 1.75rem;
	}

	h1 {
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.04em;
		margin: 0 0 1.5rem;
	}

	.sub {
		font-size: 1.05rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.55);
		margin: 0 0 3rem;
		max-width: 32rem;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-main {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #1ed760;
		color: #000;
		padding: 0.75rem 1.75rem;
		border-radius: 9999px;
		font-size: 0.925rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 160ms ease;

		&:hover {
			background: #1fdf66;
			transform: translateY(-1px);
			box-shadow: 0 6px 24px rgba(30, 215, 96, 0.35);
		}
	}

	.btn-alt {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 0.925rem;
		font-weight: 600;
		padding: 0.75rem 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		transition: all 160ms ease;

		&:hover {
			color: #fff;
			border-color: rgba(255, 255, 255, 0.35);
			background: rgba(255, 255, 255, 0.05);
		}
	}

	.btn-github-hero {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #fff;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.16);
		padding: 0.75rem 1.4rem;
		border-radius: 9999px;
		font-size: 0.925rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 160ms ease;

		&:hover {
			background: rgba(255, 255, 255, 0.16);
			border-color: rgba(255, 255, 255, 0.3);
			transform: translateY(-1px);
		}
	}

	.btn-coffee-hero {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: #000;
		background: #ffdd00;
		border: none;
		cursor: pointer;
		font-family: inherit;
		padding: 0.75rem 1.4rem;
		border-radius: 9999px;
		font-size: 0.925rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 160ms ease;

		&:hover {
			background: #ffe433;
			transform: translateY(-1px);
			box-shadow: 0 6px 20px rgba(255, 221, 0, 0.35);
		}
	}

	/* ─── Features ─── */
	.features {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1px;
		max-width: 64rem;
		margin: 0 auto;
		width: 100%;
		padding: 0 2rem;
		box-sizing: border-box;
	}

	.feature {
		padding: 2.5rem 2rem;
		text-align: center;

		.icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2.75rem;
			height: 2.75rem;
			border-radius: 12px;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.08);
			margin: 0 auto 1.25rem;
			color: rgba(255, 255, 255, 0.8);
		}

		h3 {
			font-size: 0.95rem;
			font-weight: 700;
			margin: 0 0 0.5rem;
			color: #fff;
		}

		p {
			font-size: 0.825rem;
			line-height: 1.6;
			color: rgba(255, 255, 255, 0.45);
			margin: 0;
		}
	}

	/* ─── Download & Platforms ─── */
	.download {
		text-align: center;
		padding: 6rem 2rem 5rem;
		max-width: 68rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;

		h2 {
			font-size: clamp(2rem, 4vw, 2.5rem);
			font-weight: 800;
			margin: 0 0 0.75rem;
			letter-spacing: -0.03em;
		}

		> p {
			font-size: 1rem;
			color: rgba(255, 255, 255, 0.55);
			margin: 0 auto 3rem;
			max-width: 32rem;
			line-height: 1.6;
		}
	}

	.download-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		text-align: left;

		@media screen and (max-width: 900px) {
			grid-template-columns: 1fr;
			max-width: 28rem;
			margin: 0 auto;
		}
	}

	.platform-card {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 2rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;

		&:hover {
			transform: translateY(-4px);
			border-color: rgba(255, 255, 255, 0.18);
			box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
		}

		&.featured-platform {
			background: linear-gradient(180deg, rgba(30, 215, 96, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
			border-color: rgba(30, 215, 96, 0.3);

			&:hover {
				border-color: rgba(30, 215, 96, 0.6);
				box-shadow: 0 16px 40px rgba(30, 215, 96, 0.15);
			}
		}

		.card-badge {
			position: absolute;
			top: 1.25rem;
			right: 1.25rem;
			background: #1ed760;
			color: #000;
			font-size: 0.72rem;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: 0.06em;
			padding: 0.25rem 0.65rem;
			border-radius: 9999px;
		}

		.platform-icon {
			width: 3.5rem;
			height: 3.5rem;
			border-radius: 14px;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.08);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 1.5rem;
			color: #1ed760;
		}

		h3 {
			font-size: 1.25rem;
			font-weight: 700;
			margin: 0 0 0.6rem;
			color: #fff;
		}

		p {
			font-size: 0.88rem;
			line-height: 1.6;
			color: rgba(255, 255, 255, 0.5);
			margin: 0 0 1.75rem;
			flex: 1;

			strong {
				color: rgba(255, 255, 255, 0.85);
			}
		}

		.card-actions {
			display: flex;
			flex-direction: column;
			gap: 0.65rem;
		}
	}

	.platform-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-radius: 12px;
		font-size: 0.88rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 160ms ease;

		&.primary {
			background: #1ed760;
			color: #000;

			&:hover {
				background: #1fdf66;
				transform: translateY(-1px);
				box-shadow: 0 6px 20px rgba(30, 215, 96, 0.35);
			}
		}

		&.secondary {
			background: rgba(255, 255, 255, 0.06);
			color: #fff;
			border: 1px solid rgba(255, 255, 255, 0.12);

			&:hover {
				background: rgba(255, 255, 255, 0.12);
				border-color: rgba(255, 255, 255, 0.25);
			}
		}
	}

	/* ─── Footer ─── */
	.foot {
		padding: 3.5rem 2.5rem 2.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin-top: auto;
		background: rgba(255, 255, 255, 0.01);
	}

	.foot-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 72rem;
		margin: 0 auto 2rem;
		gap: 2rem;
		flex-wrap: wrap;

		@media screen and (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.5rem;
		}
	}

	.foot-left {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.foot-tagline {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.45);
		margin: 0;
	}

	.foot-links {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.foot-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		transition: color 150ms ease;

		&:hover {
			color: #fff;
		}

		&.coffee-link {
			color: #ffdd00;

			&:hover {
				color: #ffe844;
			}
		}
	}

	.foot-copy {
		text-align: center;
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.3);
		margin: 0;
		padding-top: 1.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	/* ─── Mobile ─── */
	@media (max-width: 768px) {
		.hero {
			padding: 4rem 1.5rem 3rem;
		}

		h1 {
			font-size: 2.2rem;
		}

		.sub {
			font-size: 0.95rem;
		}

		.features {
			grid-template-columns: repeat(2, 1fr);
			padding: 0 1.25rem;
		}

		.feature {
			padding: 2rem 1.25rem;
		}

		.download {
			padding: 4rem 1.5rem 3rem;
		}
	}

	@media (max-width: 480px) {
		.features {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
			width: 100%;

			.btn-main,
			.btn-alt,
			.btn-github-hero,
			.btn-coffee-hero {
				width: 100%;
				justify-content: center;
				box-sizing: border-box;
			}
		}
	}
	.btn-reset {
		background: none;
		border: none;
		padding: 0;
		font-family: inherit;
		cursor: pointer;
	}

	/* ─── Modal ─── */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.78);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		animation: modalFadeIn 180ms cubic-bezier(0.16, 1, 0.3, 1);
		cursor: default;
	}

	.modal-card {
		background: #141414;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.25rem;
		width: 100%;
		max-width: 24rem;
		box-shadow: 0 24px 50px rgba(0, 0, 0, 0.7);
		overflow: hidden;
		animation: modalSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
		outline: none;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.25rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);
	}

	.modal-title {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		h3 {
			font-size: 1.05rem;
			font-weight: 700;
			margin: 0;
			color: #fff;
		}

		p {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.5);
			margin: 0.15rem 0 0;
		}
	}

	.modal-title-icon {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		background: rgba(255, 221, 0, 0.15);
		color: #ffdd00;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.btn-close {
		background: rgba(255, 255, 255, 0.06);
		border: none;
		color: rgba(255, 255, 255, 0.6);
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 150ms ease;
		flex-shrink: 0;

		&:hover {
			background: rgba(255, 255, 255, 0.15);
			color: #fff;
		}
	}

	.modal-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.1rem;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.6rem;
		width: 100%;
	}

	.qr-frame {
		background: #fff;
		padding: 0.6rem;
		border-radius: 1rem;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qr-image {
		width: 13rem;
		height: 13rem;
		display: block;
		object-fit: contain;
		border-radius: 0.5rem;
	}

	.qr-badge {
		font-size: 0.72rem;
		color: rgba(255, 255, 255, 0.5);
		text-align: center;
	}

	.upi-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		box-sizing: border-box;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		padding: 0.6rem 0.85rem;
		gap: 0.75rem;
	}

	.upi-info {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	.upi-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.4);
		font-weight: 600;
	}

	.upi-value {
		font-size: 0.85rem;
		color: #fff;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.btn-copy {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
		padding: 0.45rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.78rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		transition: all 150ms ease;
		flex-shrink: 0;

		&:hover {
			background: rgba(255, 255, 255, 0.18);
			border-color: rgba(255, 255, 255, 0.25);
		}

		&.copied {
			background: #1ed760;
			border-color: #1ed760;
			color: #000;
		}
	}

	.modal-actions {
		width: 100%;
	}

	.btn-upi-app {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		width: 100%;
		box-sizing: border-box;
		background: #ffdd00;
		color: #000;
		padding: 0.7rem 1rem;
		border-radius: 9999px;
		font-size: 0.88rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 160ms ease;

		&:hover {
			background: #ffe433;
			transform: translateY(-1px);
			box-shadow: 0 4px 14px rgba(255, 221, 0, 0.35);
		}
	}

	@keyframes modalFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes modalSlideUp {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
