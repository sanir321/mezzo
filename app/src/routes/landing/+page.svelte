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
</script>

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
			<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="btn-main">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download for Android
			</a>
			<a href={isLoggedIn ? "/" : "/login"} class="btn-alt">
				Open Web Player
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</a>
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

	<!-- Download -->
	<section class="download">
		<h2>Get Mezzo</h2>
		<p>Available as a native Android app and a web player that works on any device.</p>
		<div class="download-row">
			<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="card">
				<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
					<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789" />
				</svg>
				<div>
					<strong>Android App</strong>
					<span>v1.0 · 3.4 MB APK</span>
				</div>
			</a>
			<a href={isLoggedIn ? "/" : "/login"} class="card">
				<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8">
					<circle cx="12" cy="12" r="10" />
					<line x1="2" y1="12" x2="22" y2="12" />
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
				</svg>
				<div>
					<strong>Web Player</strong>
					<span>No install · Any browser</span>
				</div>
			</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="foot">
		<p>© 2026 Mezzo Music</p>
	</footer>
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
		gap: 1.5rem;
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

	/* ─── Download ─── */
	.download {
		text-align: center;
		padding: 6rem 2rem 4rem;
		max-width: 40rem;
		margin: 0 auto;

		h2 {
			font-size: 1.75rem;
			font-weight: 800;
			margin: 0 0 0.75rem;
			letter-spacing: -0.03em;
		}

		> p {
			font-size: 0.925rem;
			color: rgba(255, 255, 255, 0.5);
			margin: 0 0 2.5rem;
			line-height: 1.6;
		}
	}

	.download-row {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.75rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-decoration: none;
		color: #fff;
		transition: all 180ms ease;
		min-width: 13rem;

		&:hover {
			background: rgba(255, 255, 255, 0.07);
			border-color: rgba(255, 255, 255, 0.15);
			transform: translateY(-2px);
		}

		div {
			display: flex;
			flex-direction: column;
			text-align: left;
		}

		strong {
			font-size: 0.925rem;
			font-weight: 700;
		}

		span {
			font-size: 0.78rem;
			color: rgba(255, 255, 255, 0.45);
			margin-top: 0.15rem;
		}

		svg {
			color: rgba(255, 255, 255, 0.6);
			flex-shrink: 0;
		}
	}

	/* ─── Footer ─── */
	.foot {
		text-align: center;
		padding: 3rem 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		margin-top: auto;

		p {
			font-size: 0.78rem;
			color: rgba(255, 255, 255, 0.3);
			margin: 0;
		}
	}

	/* ─── Mobile ─── */
	@media (max-width: 768px) {
		.nav {
			padding: 1rem 1.25rem;
		}

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

		.download-row {
			flex-direction: column;
			align-items: stretch;
		}

		.card {
			min-width: unset;
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
			.btn-alt {
				width: 100%;
				justify-content: center;
				box-sizing: border-box;
			}
		}
	}
</style>
