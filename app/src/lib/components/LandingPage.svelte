<script lang="ts">
	import { authModal } from "$lib/stores/auth-modal.svelte";

	interface Props {
		onLogin?: () => void;
		onSignup?: () => void;
	}

	let { onLogin, onSignup }: Props = $props();

	const APK_URL = "https://mezzo-music.pages.dev/apk/Mezzo-1.0.apk";

	function handleLogin() {
		authModal.open("login");
		onLogin?.();
	}

	function handleSignup() {
		authModal.open("signup");
		onSignup?.();
	}

	let menuOpen = $state(false);
	let activeFaq = $state<number | null>(null);

	function toggleFaq(index: number) {
		activeFaq = activeFaq === index ? null : index;
	}

	// Curated Showcase Cards
	const SHOWCASE_ITEMS = [
		{
			title: "Anirudh Ravichander",
			category: "Tamil Hits",
			image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
			bitrate: "24-bit / 96kHz FLAC"
		},
		{
			title: "Today's Top Hits",
			category: "Global Charts",
			image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
			bitrate: "Lossless Audio"
		},
		{
			title: "Sid Sriram",
			category: "Telugu & Tamil",
			image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
			bitrate: "Studio Master"
		},
		{
			title: "Synthwave & Electronic",
			category: "Retro Wave",
			image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
			bitrate: "Lossless FLAC"
		},
		{
			title: "A.R. Rahman",
			category: "Original Scores",
			image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
			bitrate: "Hi-Res FLAC"
		},
		{
			title: "Lo-Fi Study Beats",
			category: "Chill & Focus",
			image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
			bitrate: "320kbps MP3"
		}
	];

	const PILLARS = [
		{
			number: "01",
			title: "Lossless Audio Fidelity",
			desc: "Stream up to 24-bit/192kHz uncompressed studio quality. Every drum kick, vocal harmonic, and bass line delivered in bit-perfect clarity."
		},
		{
			number: "02",
			title: "Zero Clutter & Zero Ads",
			desc: "A pure, distraction-free listening environment. No sponsored video popups, audio interruptions, or algorithmic clutter."
		},
		{
			number: "03",
			title: "Multi-Language Catalogs",
			desc: "Deep support for South Indian music (Tamil, Telugu, Kannada, Malayalam) alongside Bollywood, Punjabi, and International charts."
		},
		{
			number: "04",
			title: "Global Music Catalog",
			desc: "Instant access to millions of official tracks spanning Bollywood, South Indian, Pop, Hip-Hop, Rock, and global genres in high fidelity."
		}
	];

	const COMPARISON_ROWS = [
		{ feature: "Audio Quality", mezzo: "Lossless FLAC / 24-bit Hi-Res", others: "Compressed 128 - 256kbps" },
		{ feature: "Ads & Interruptions", mezzo: "Zero Audio or Video Ads", others: "Frequent Ad Breaks" },
		{ feature: "Regional Music Discovery", mezzo: "Tamil, Telugu, Kannada, Malayalam & Global", others: "Algorithmic Restrictions" },
		{ feature: "Offline Listening", mezzo: "Coming Soon", others: "Not Available" },
		{ feature: "User Privacy & Open APIs", mezzo: "Decentralized & Privacy-First", others: "Extensive Ad-Tracking" }
	];

	const FAQS = [
		{
			q: "What makes Mezzo different from standard streaming apps?",
			a: "Mezzo is built with a focus-first philosophy. It gives you pristine lossless audio streaming, full multi-language discovery, and decentralized music with zero ads and zero interface clutter."
		},
		{
			q: "Is Mezzo free to stream?",
			a: "Yes. All streaming, playlist creation, search, and artist discovery features are 100% free."
		},
		{
			q: "Can I stream on mobile and desktop?",
			a: "Yes. Mezzo is fully responsive and works seamlessly across desktops, laptops, tablets, iOS, and Android mobile browsers. You can also install the native Android APK for the full app experience."
		},
		{
			q: "What music catalog does Mezzo have access to?",
			a: "Mezzo provides access to millions of official tracks across all global and regional genres — including Bollywood, English Pop, South Indian, Hip-Hop, and Indie — completely free and without ads."
		}
	];
</script>

<svelte:head>
	<title>Mezzo — Music without the noise | Hi-Fi Player</title>
	<meta name="description" content="Experience music the way it was recorded. Distraction-free, lossless audio streaming in Tamil, Telugu, Hindi, and Global Hits on Mezzo." />
</svelte:head>

<div class="mono-landing">
	<!-- Navigation Bar -->
	<header class="mono-header">
		<div class="header-inner">
			<a href="/" class="brand-link">
				<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
				<span class="brand-name">Mezzo</span>
			</a>

			<nav class="desktop-nav">
				<a href="#features" class="nav-link">Features</a>
				<a href="#artists" class="nav-link">Artists</a>
				<a href="#get" class="nav-link">Get the App</a>
				<a href="#faq" class="nav-link">FAQ</a>
				<span class="nav-sep"></span>
				<a class="nav-download-link" href={APK_URL} target="_blank" rel="noreferrer">
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2.2">
						<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
					</svg>
					<span>Get the APK</span>
				</a>
				<button class="mono-btn-ghost" onclick={handleLogin}>Log in</button>
				<button class="mono-btn-solid" onclick={handleSignup}>Sign up</button>
			</nav>

			<button
				class="mobile-burger"
				class:open={menuOpen}
				onclick={() => (menuOpen = !menuOpen)}
				aria-label="Toggle Navigation"
			>
				<span></span>
				<span></span>
			</button>
		</div>
	</header>

	<!-- Mobile Drawer -->
	{#if menuOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="mono-drawer-overlay" onclick={() => (menuOpen = false)}></div>
		<div class="mono-drawer">
			<div class="drawer-header">
				<span class="drawer-title">Navigation</span>
				<button class="drawer-close" onclick={() => (menuOpen = false)}>✕</button>
			</div>
			<a href="#features" class="drawer-item" onclick={() => (menuOpen = false)}>Features</a>
			<a href="#artists" class="drawer-item" onclick={() => (menuOpen = false)}>Artists</a>
			<a href="#get" class="drawer-item" onclick={() => (menuOpen = false)}>Get the App</a>
			<a href="#faq" class="drawer-item" onclick={() => (menuOpen = false)}>FAQ</a>
			<div class="drawer-cta-group">
				<a class="mono-btn-apk full" href={APK_URL} target="_blank" rel="noreferrer" onclick={() => (menuOpen = false)}>
					<svg viewBox="0 0 24 24" width="1.05rem" height="1.05rem" fill="none" stroke="currentColor" stroke-width="2.2">
						<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
					</svg>
					<span>Download Android APK</span>
				</a>
				<button class="mono-btn-solid full" onclick={() => { menuOpen = false; handleSignup(); }}>Sign up free</button>
				<button class="mono-btn-ghost full" onclick={() => { menuOpen = false; handleLogin(); }}>Log in</button>
			</div>
		</div>
	{/if}

	<!-- Hero Section -->
	<section class="mono-hero">
		<div class="hero-glow"></div>
		<div class="mono-grid-pattern"></div>
		<div class="hero-container">
			<div class="hero-header-box">
				<div class="hero-pill-badge">
					<span class="pulse-dot"></span>
					<span>LOSSLESS HI-FI STREAMING</span>
				</div>
				<h1 class="hero-title">Music without <span class="accent">the noise.</span></h1>
				<p class="hero-description">
					A distraction-free web player designed for pure sound. Stream lossless audio, explore rich multi-language catalogs, and own your music library — or take Mezzo with you as a native Android app.
				</p>
				<div class="hero-btn-group">
					<button class="mono-btn-solid hero-btn" onclick={handleLogin}>
						<span>Open Web Player</span>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="#000">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
					</button>
					<a class="mono-btn-apk hero-btn" href={APK_URL} target="_blank" rel="noreferrer">
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.2">
							<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
						</svg>
						<span>Download APK</span>
					</a>
				</div>
			</div>

			<!-- Audio Player Mockup Preview -->
			<div class="player-mockup-card">
				<div class="mockup-top-bar">
					<div class="window-dots">
						<span></span><span></span><span></span>
					</div>
					<span class="mockup-label">MEZZO LOSSLESS AUDIO ENGINE</span>
					<div class="mockup-bitrate-tag">24-BIT / 96kHz FLAC</div>
				</div>

				<div class="mockup-body">
					<div class="mockup-track-info">
						<div class="mockup-album-art">
							<img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" alt="Album Art" />
							<div class="mockup-play-badge">
								<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="#000">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</div>
						</div>
						<div class="mockup-meta">
							<span class="mockup-song-title">Leo — Badass (Studio Master)</span>
							<span class="mockup-artist-name">Anirudh Ravichander • Tamil Beats</span>
							<div class="mockup-waveform">
								<span style="height: 40%"></span>
								<span style="height: 75%"></span>
								<span style="height: 100%"></span>
								<span style="height: 55%"></span>
								<span style="height: 90%"></span>
								<span style="height: 65%"></span>
								<span style="height: 100%"></span>
								<span style="height: 80%"></span>
								<span style="height: 45%"></span>
								<span style="height: 95%"></span>
								<span style="height: 70%"></span>
								<span style="height: 35%"></span>
								<span style="height: 85%"></span>
								<span style="height: 60%"></span>
								<span style="height: 100%"></span>
							</div>
						</div>
					</div>

					<div class="mockup-timeline">
						<span class="time-code">1:42</span>
						<div class="timeline-bar">
							<div class="timeline-fill" style="width: 45%"></div>
						</div>
						<span class="time-code">3:48</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Choose How You Listen -->
	<section class="mono-section get-section" id="get">
		<div class="section-container">
			<div class="section-top-row centered">
				<span class="mono-kicker">[ GET MEZZO ]</span>
				<h2 class="mono-headline">Choose how you listen.</h2>
				<p class="mono-subhead">One account, endless music — in your browser or as a native Android app.</p>
			</div>

			<div class="get-grid">
				<div class="get-card">
					<div class="get-icon">
						<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="1.8">
							<rect x="2" y="4" width="20" height="14" rx="3" />
							<polygon points="8 8 16 11 8 14 8 8" fill="currentColor" stroke="none" />
							<line x1="6" y1="20" x2="18" y2="20" />
						</svg>
					</div>
					<h3 class="get-title">Web Player</h3>
					<p class="get-desc">Instant access, zero install. Stream in any modern browser on desktop, tablet, or phone.</p>
					<button class="mono-btn-solid get-btn" onclick={handleLogin}>Open Web Player</button>
				</div>

				<div class="get-card">
					<div class="get-icon apk">
						<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="1.8">
							<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" />
							<rect x="4" y="17" width="16" height="4" rx="2" />
						</svg>
					</div>
					<h3 class="get-title">Android APK</h3>
					<p class="get-desc">The full Mezzo experience on your phone. Download the signed APK and install it in one tap.</p>
					<a class="mono-btn-apk get-btn" href={APK_URL} target="_blank" rel="noreferrer">
						<svg viewBox="0 0 24 24" width="1.05rem" height="1.05rem" fill="none" stroke="currentColor" stroke-width="2.2">
							<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
						</svg>
						<span>Download APK</span>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Showcase Grid Section -->
	<section class="mono-section" id="artists">
		<div class="section-container">
			<div class="section-top-row">
				<div>
					<span class="mono-kicker">[ CURATED CATALOGS ]</span>
					<h2 class="mono-headline">Featured Artists & Mixes</h2>
				</div>
				<button class="mono-btn-ghost small" onclick={handleSignup}>Explore All Artists →</button>
			</div>

			<div class="showcase-cards-grid">
				{#each SHOWCASE_ITEMS as item}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="mono-card" onclick={handleSignup}>
						<div class="card-media-wrap">
							<img src={item.image} alt={item.title} class="card-cover-image" loading="lazy" />
							<div class="card-bitrate-badge">{item.bitrate}</div>
							<div class="card-play-hover-btn">
								<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="#000">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</div>
						</div>
						<div class="card-text-box">
							<span class="card-genre">{item.category}</span>
							<h3 class="card-headline">{item.title}</h3>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Core Pillars Section -->
	<section class="mono-section dark-alt" id="features">
		<div class="section-container">
			<div class="section-top-row centered">
				<span class="mono-kicker">[ WHY MEZZO ]</span>
				<h2 class="mono-headline">Engineered for pure listening.</h2>
				<p class="mono-subhead">Designed with zero compromises on audio quality, privacy, or performance.</p>
			</div>

			<div class="pillars-grid">
				{#each PILLARS as p}
					<div class="pillar-box">
						<span class="pillar-num">{p.number}</span>
						<h3 class="pillar-title">{p.title}</h3>
						<p class="pillar-desc">{p.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Comparison Table Section -->
	<section class="mono-section" id="compare">
		<div class="section-container">
			<div class="section-top-row centered">
				<span class="mono-kicker">[ COMPARISON ]</span>
				<h2 class="mono-headline">Mezzo vs. Standard Streaming</h2>
			</div>

			<div class="comparison-table-wrap">
				<table class="mono-table">
					<thead>
						<tr>
							<th class="col-feature">FEATURE</th>
							<th class="col-mezzo">MEZZO</th>
							<th class="col-others">MAINSTREAM APPS</th>
						</tr>
					</thead>
					<tbody>
						{#each COMPARISON_ROWS as row}
							<tr>
								<td class="row-feature">{row.feature}</td>
								<td class="row-mezzo">
									<span class="check-icon">✓</span>
									<span>{row.mezzo}</span>
								</td>
								<td class="row-others">
									<span class="cross-icon">✕</span>
									<span>{row.others}</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- Call To Action Box -->
	<section class="mono-cta-section">
		<div class="section-container">
			<div class="mono-cta-card">
				<span class="mono-kicker">[ GET STARTED ]</span>
				<h2 class="cta-title">Begin your lossless journey.</h2>
				<p class="cta-desc">Instant access to millions of songs, custom mixes, and high-fidelity cloud streaming.</p>
				<div class="cta-btn-group">
					<button class="mono-btn-solid cta-btn" onclick={handleSignup}>
						<span>Create Free Account</span>
						<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="#000" stroke-width="2.5">
							<line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
						</svg>
					</button>
					<a class="mono-btn-apk cta-btn" href={APK_URL} target="_blank" rel="noreferrer">
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.2">
							<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
						</svg>
						<span>Get the Android APK</span>
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ Section -->
	<section class="mono-section dark-alt" id="faq">
		<div class="section-container max-compact">
			<div class="section-top-row centered">
				<span class="mono-kicker">[ FAQ ]</span>
				<h2 class="mono-headline">Frequently Asked Questions</h2>
			</div>

			<div class="mono-accordion">
				{#each FAQS as faq, i}
					<div class="accordion-item" class:open={activeFaq === i}>
						<button class="accordion-btn" onclick={() => toggleFaq(i)}>
							<span>{faq.q}</span>
							<span class="accordion-icon">{activeFaq === i ? "−" : "+"}</span>
						</button>
						{#if activeFaq === i}
							<div class="accordion-panel">
								<p>{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="mono-footer">
		<div class="footer-layout">
			<div class="footer-brand-side">
				<div class="footer-logo-row">
					<img src="/logo.svg" alt="Mezzo" class="brand-logo small" />
					<span class="footer-brand-title">Mezzo</span>
				</div>
				<p class="footer-subtext">Minimalist, privacy-first, lossless web music player.</p>
				<a class="mono-btn-apk footer-download" href={APK_URL} target="_blank" rel="noreferrer">
					<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2.2">
						<line x1="12" y1="3" x2="12" y2="15" /><polyline points="6 10 12 16 18 10" /><line x1="4" y1="20" x2="20" y2="20" />
					</svg>
					<span>Download Android APK</span>
				</a>
			</div>

			<div class="footer-columns">
				<div class="footer-col">
					<span class="col-head">DISCOVER</span>
					<button class="footer-link-btn" onclick={handleSignup}>Tamil Beats</button>
					<button class="footer-link-btn" onclick={handleSignup}>Telugu Hits</button>
					<button class="footer-link-btn" onclick={handleSignup}>Hindi Top Charts</button>
					<button class="footer-link-btn" onclick={handleSignup}>Global Lossless</button>
				</div>
				<div class="footer-col">
					<span class="col-head">ARCHITECTURE</span>
					<a href="#features">Svelte 5 Runes</a>
					<a href="#features">Hi-Fi Music Engine</a>
				</div>
				<div class="footer-col">
					<span class="col-head">LEGAL</span>
					<a href="#privacy">Privacy Center</a>
					<a href="#terms">Terms of Service</a>
					<a href="#cookies">Cookie Settings</a>
				</div>
			</div>
		</div>

		<div class="footer-bottom-row">
			<span class="copyright-text">© 2026 Mezzo. All rights reserved.</span>
			<div class="footer-social-links">
				<a href="https://github.com/sanir321/mezzo" target="_blank" rel="noreferrer">GitHub</a>
				<a href="#support">Documentation</a>
				<a href="#status">System Status</a>
			</div>
		</div>
	</footer>
</div>

<style lang="scss">
	/* App-Matching Dark Theme Root */
	.mono-landing {
		min-height: 100vh;
		background: #121212;
		color: #ffffff;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		overflow-x: hidden;
		position: relative;
	}

	/* Navigation */
	.mono-header {
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		height: 4.25rem;
		background: rgba(18, 18, 18, 0.9);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 100;
		display: flex;
		align-items: center;

		.header-inner {
			max-width: 76rem;
			width: 100%;
			margin: 0 auto;
			padding: 0 1.5rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.brand-link {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			text-decoration: none;
			color: #ffffff;

			.brand-logo {
				width: 2.25rem;
				height: 2.25rem;
				border-radius: 8px;
				object-fit: contain;
			}

			.brand-name {
				font-size: 1.25rem;
				font-weight: 800;
				letter-spacing: -0.02em;
				color: #ffffff;
			}
		}

		.desktop-nav {
			display: flex;
			align-items: center;
			gap: 1.4rem;

			@media screen and (max-width: 850px) {
				display: none;
			}

			.nav-link {
				color: #a7a7a7;
				text-decoration: none;
				font-size: 0.88rem;
				font-weight: 600;
				letter-spacing: 0.01em;
				transition: color 140ms ease;

				&:hover {
					color: #ffffff;
				}
			}

			.nav-sep {
				width: 1px;
				height: 1.25rem;
				background: rgba(255, 255, 255, 0.12);
			}

			.nav-download-link {
				display: inline-flex;
				align-items: center;
				gap: 0.4rem;
				color: #1ed760;
				text-decoration: none;
				font-size: 0.84rem;
				font-weight: 700;
				transition: color 140ms ease;

				&:hover {
					color: #ffffff;
				}
			}
		}

		.mobile-burger {
			display: none;
			flex-direction: column;
			gap: 6px;
			background: transparent;
			border: none;
			cursor: pointer;
			padding: 0.4rem;

			@media screen and (max-width: 850px) {
				display: flex;
			}

			span {
				width: 1.4rem;
				height: 2px;
				background: #ffffff;
				border-radius: 2px;
				transition: all 180ms ease;
			}

			&.open span:nth-child(1) { transform: translateY(4px) rotate(45deg); }
			&.open span:nth-child(2) { transform: translateY(-4px) rotate(-45deg); }
		}
	}

	/* Buttons — App Standard (Green Primary) */
	.mono-btn-solid {
		background: #1ed760 !important;
		color: #000000 !important;
		border: 1px solid #1ed760 !important;
		border-radius: 9999px !important;
		padding: 0.6rem 1.4rem !important;
		font-size: 0.88rem !important;
		font-weight: 700 !important;
		letter-spacing: 0.01em !important;
		cursor: pointer !important;
		text-decoration: none !important;
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		gap: 0.5rem !important;
		transition: all 140ms ease !important;
		box-shadow: 0 4px 16px rgba(30, 215, 96, 0.25);

		&:hover {
			background: #22e068 !important;
			border-color: #22e068 !important;
			transform: translateY(-1px) !important;
			box-shadow: 0 6px 22px rgba(30, 215, 96, 0.35) !important;
		}

		&.hero-btn {
			padding: 0.85rem 2rem !important;
			font-size: 0.95rem !important;
		}

		&.full {
			width: 100% !important;
			padding: 0.85rem !important;
		}
	}

	.mono-btn-ghost {
		background: transparent !important;
		color: #ffffff !important;
		border: 1px solid rgba(255, 255, 255, 0.3) !important;
		border-radius: 9999px !important;
		padding: 0.6rem 1.4rem !important;
		font-size: 0.88rem !important;
		font-weight: 700 !important;
		letter-spacing: 0.01em !important;
		cursor: pointer !important;
		text-decoration: none !important;
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		transition: all 140ms ease !important;

		&:hover {
			border-color: #ffffff !important;
			background: rgba(255, 255, 255, 0.08) !important;
			transform: translateY(-1px) !important;
		}

		&.small {
			padding: 0.45rem 1rem !important;
			font-size: 0.82rem !important;
		}

		&.full {
			width: 100% !important;
			padding: 0.85rem !important;
		}
	}

	.mono-btn-apk {
		background: rgba(30, 215, 96, 0.12) !important;
		color: #1ed760 !important;
		border: 1px solid rgba(30, 215, 96, 0.5) !important;
		border-radius: 9999px !important;
		padding: 0.6rem 1.4rem !important;
		font-size: 0.88rem !important;
		font-weight: 700 !important;
		letter-spacing: 0.01em !important;
		cursor: pointer !important;
		text-decoration: none !important;
		display: inline-flex !important;
		align-items: center !important;
		justify-content: center !important;
		gap: 0.5rem !important;
		transition: all 140ms ease !important;

		&:hover {
			background: #1ed760 !important;
			color: #000000 !important;
			transform: translateY(-1px) !important;
			box-shadow: 0 6px 22px rgba(30, 215, 96, 0.35) !important;
		}

		&.hero-btn {
			padding: 0.85rem 2rem !important;
			font-size: 0.95rem !important;
		}

		&.full {
			width: 100% !important;
			padding: 0.85rem !important;
		}

		&.get-btn {
			width: 100% !important;
			padding: 0.8rem !important;
		}
	}

	/* Mobile Drawer */
	.mono-drawer-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		z-index: 150;
	}

	.mono-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 18rem;
		background: #181818;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 160;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;

		.drawer-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-bottom: 1rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);

			.drawer-title {
				font-size: 0.8rem;
				font-weight: 800;
				letter-spacing: 0.08em;
				color: #a7a7a7;
			}

			.drawer-close {
				background: transparent;
				border: none;
				color: #ffffff;
				font-size: 1.25rem;
				cursor: pointer;
			}
		}

		.drawer-item {
			color: #ffffff;
			text-decoration: none;
			font-size: 1.1rem;
			font-weight: 700;
			padding: 0.5rem 0;

			&:hover {
				color: #1ed760;
			}
		}

		.drawer-cta-group {
			margin-top: auto;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}
	}

	/* Hero Section */
	.mono-hero {
		position: relative;
		padding: 6rem 1.5rem 6rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		background: linear-gradient(180deg, #121212 0%, #0c0c0c 100%);

		.hero-glow {
			position: absolute;
			top: -10rem;
			left: 50%;
			transform: translateX(-50%);
			width: 60rem;
			height: 34rem;
			background: radial-gradient(ellipse at center, rgba(30, 215, 96, 0.14) 0%, transparent 65%);
			pointer-events: none;
			z-index: 0;
		}

		.mono-grid-pattern {
			position: absolute;
			inset: 0;
			background-image: linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
				linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
			background-size: 4rem 4rem;
			pointer-events: none;
			mask-image: radial-gradient(ellipse at 50% 30%, #000 60%, transparent 100%);
		}

		.hero-container {
			max-width: 76rem;
			margin: 0 auto;
			display: grid;
			grid-template-columns: 1.1fr 1fr;
			gap: 4rem;
			align-items: center;
			position: relative;
			z-index: 2;

			@media screen and (max-width: 950px) {
				grid-template-columns: 1fr;
				gap: 3rem;
				text-align: center;
			}
		}

		.hero-header-box {
			display: flex;
			flex-direction: column;
			gap: 1.5rem;

			@media screen and (max-width: 950px) {
				align-items: center;
			}

			.hero-pill-badge {
				display: inline-flex;
				align-items: center;
				gap: 0.6rem;
				background: rgba(30, 215, 96, 0.1);
				border: 1px solid rgba(30, 215, 96, 0.35);
				border-radius: 9999px;
				padding: 0.35rem 0.9rem;
				font-size: 0.75rem;
				font-weight: 800;
				letter-spacing: 0.08em;
				color: #1ed760;
				width: fit-content;

				.pulse-dot {
					width: 0.45rem;
					height: 0.45rem;
					border-radius: 50%;
					background: #1ed760;
					box-shadow: 0 0 8px #1ed760;
				}
			}

			.hero-title {
				font-size: clamp(2.8rem, 5.5vw, 4.8rem);
				font-weight: 900;
				letter-spacing: -0.04em;
				line-height: 1.05;
				margin: 0;
				color: #ffffff;

				.accent {
					color: #1ed760;
				}
			}

			.hero-description {
				font-size: 1.15rem;
				line-height: 1.6;
				color: #a7a7a7;
				margin: 0;
				max-width: 34rem;
			}

			.hero-btn-group {
				display: flex;
				align-items: center;
				gap: 1rem;
				flex-wrap: wrap;
				margin-top: 0.5rem;

				@media screen and (max-width: 950px) {
					justify-content: center;
				}
			}
		}

		/* Player Mockup Card */
		.player-mockup-card {
			background: #181818;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 16px;
			overflow: hidden;
			box-shadow: 0 24px 48px rgba(0, 0, 0, 0.8);

			.mockup-top-bar {
				background: #1f1f1f;
				border-bottom: 1px solid rgba(255, 255, 255, 0.08);
				padding: 0.75rem 1rem;
				display: flex;
				align-items: center;
				justify-content: space-between;

				.window-dots {
					display: flex;
					gap: 6px;

					span {
						width: 8px;
						height: 8px;
						border-radius: 50%;
						background: rgba(255, 255, 255, 0.2);
					}
				}

				.mockup-label {
					font-size: 0.7rem;
					font-weight: 800;
					letter-spacing: 0.08em;
					color: #a7a7a7;
				}

				.mockup-bitrate-tag {
					font-size: 0.65rem;
					font-weight: 800;
					background: #1ed760;
					color: #000000;
					padding: 0.15rem 0.5rem;
					border-radius: 9999px;
				}
			}

			.mockup-body {
				padding: 1.5rem;
				display: flex;
				flex-direction: column;
				gap: 1.25rem;
			}

			.mockup-track-info {
				display: flex;
				align-items: center;
				gap: 1.25rem;

				.mockup-album-art {
					position: relative;
					width: 5rem;
					height: 5rem;
					border-radius: 8px;
					overflow: hidden;
					flex-shrink: 0;

					img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}

					.mockup-play-badge {
						position: absolute;
						inset: 0;
						background: rgba(30, 215, 96, 0.9);
						display: flex;
						align-items: center;
						justify-content: center;
					}
				}

				.mockup-meta {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
					flex: 1;
					min-width: 0;

					.mockup-song-title {
						font-size: 1.05rem;
						font-weight: 800;
						color: #ffffff;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.mockup-artist-name {
						font-size: 0.85rem;
						color: #a7a7a7;
					}

					.mockup-waveform {
						display: flex;
						align-items: flex-end;
						gap: 3px;
						height: 1.25rem;
						margin-top: 0.35rem;

						span {
							width: 3px;
							background: #1ed760;
							border-radius: 2px;
							animation: pulseWave 1s infinite alternate ease-in-out;

							&:nth-child(even) { animation-duration: 0.8s; }
							&:nth-child(3n) { animation-duration: 1.2s; }
						}
					}
				}
			}

			.mockup-timeline {
				display: flex;
				align-items: center;
				gap: 0.75rem;

				.time-code {
					font-size: 0.75rem;
					color: #a7a7a7;
					font-variant-numeric: tabular-nums;
				}

				.timeline-bar {
					flex: 1;
					height: 4px;
					background: rgba(255, 255, 255, 0.15);
					border-radius: 2px;
					overflow: hidden;

					.timeline-fill {
						height: 100%;
						background: #1ed760;
					}
				}
			}
		}
	}

	@keyframes pulseWave {
		0% { opacity: 0.3; }
		100% { opacity: 1; }
	}

	/* Get Mezzo — Web Player / APK */
	.get-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		max-width: 52rem;
		width: 100%;
		margin: 0 auto;

		@media screen and (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	.get-card {
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 16px;
		padding: 2.5rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		text-align: left;
		transition: all 180ms ease;

		&:hover {
			border-color: rgba(30, 215, 96, 0.45);
			transform: translateY(-3px);
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
		}

		.get-icon {
			width: 3rem;
			height: 3rem;
			border-radius: 12px;
			background: #1ed760;
			color: #000000;
			display: flex;
			align-items: center;
			justify-content: center;

			&.apk {
				background: rgba(30, 215, 96, 0.12);
				color: #1ed760;
			}
		}

		.get-title {
			font-size: 1.5rem;
			font-weight: 900;
			letter-spacing: -0.02em;
			color: #ffffff;
			margin: 0;
		}

		.get-desc {
			font-size: 0.95rem;
			line-height: 1.6;
			color: #a7a7a7;
			margin: 0;
		}

		.get-btn {
			margin-top: 0.5rem;
		}
	}

	/* Common Section Styles */
	.mono-section {
		padding: 5.5rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		&.dark-alt {
			background: #0d0d0d;
		}

		.section-container {
			max-width: 76rem;
			margin: 0 auto;
			display: flex;
			flex-direction: column;
			gap: 3rem;

			&.max-compact {
				max-width: 48rem;
			}
		}

		.section-top-row {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			gap: 1.5rem;
			flex-wrap: wrap;

			&.centered {
				flex-direction: column;
				align-items: center;
				text-align: center;
			}
		}

		.mono-kicker {
			font-size: 0.75rem;
			font-weight: 800;
			letter-spacing: 0.12em;
			color: #1ed760;
			display: block;
			margin-bottom: 0.35rem;
		}

		.mono-headline {
			font-size: clamp(2rem, 3.5vw, 2.75rem);
			font-weight: 900;
			letter-spacing: -0.03em;
			color: #ffffff;
			margin: 0;
		}

		.mono-subhead {
			font-size: 1.05rem;
			color: #a7a7a7;
			margin: 0.35rem 0 0;
			max-width: 32rem;
		}
	}

	/* Showcase Cards */
	.showcase-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
		gap: 1.25rem;
	}

	.mono-card {
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 180ms ease;

		&:hover {
			background: #1f1f1f;
			border-color: rgba(255, 255, 255, 0.2);
			transform: translateY(-3px);

			.card-play-hover-btn {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.card-media-wrap {
			position: relative;
			width: 100%;
			aspect-ratio: 1;
			border-radius: 8px;
			overflow: hidden;

			.card-cover-image {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.card-bitrate-badge {
				position: absolute;
				top: 0.4rem;
				left: 0.4rem;
				background: rgba(0, 0, 0, 0.8);
				border: 1px solid rgba(30, 215, 96, 0.4);
				color: #1ed760;
				font-size: 0.65rem;
				font-weight: 700;
				padding: 0.15rem 0.45rem;
				border-radius: 9999px;
			}

			.card-play-hover-btn {
				position: absolute;
				right: 0.5rem;
				bottom: 0.5rem;
				width: 2.75rem;
				height: 2.75rem;
				border-radius: 50%;
				background: #1ed760;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
				opacity: 0;
				transform: translateY(4px);
				transition: all 160ms ease;

				&:hover {
					transform: scale(1.08) !important;
					background: #22e068;
				}
			}
		}

		.card-text-box {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;

			.card-genre {
				font-size: 0.72rem;
				font-weight: 700;
				letter-spacing: 0.05em;
				color: #a7a7a7;
				text-transform: uppercase;
			}

			.card-headline {
				font-size: 0.95rem;
				font-weight: 800;
				color: #ffffff;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	/* Core Pillars */
	.pillars-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1.5rem;
	}

	.pillar-box {
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		transition: border-color 160ms ease;

		&:hover {
			border-color: rgba(30, 215, 96, 0.4);
		}

		.pillar-num {
			font-size: 0.8rem;
			font-weight: 900;
			letter-spacing: 0.1em;
			color: #1ed760;
		}

		.pillar-title {
			font-size: 1.25rem;
			font-weight: 800;
			color: #ffffff;
			margin: 0;
		}

		.pillar-desc {
			font-size: 0.92rem;
			line-height: 1.6;
			color: #a7a7a7;
			margin: 0;
		}
	}

	/* Comparison Table */
	.comparison-table-wrap {
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		overflow-x: auto;
		background: #141414;
	}

	.mono-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;

		th {
			padding: 1rem 1.5rem;
			font-size: 0.75rem;
			font-weight: 800;
			letter-spacing: 0.1em;
			color: #a7a7a7;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			background: #1a1a1a;

			&.col-mezzo {
				color: #1ed760;
			}
		}

		td {
			padding: 1.15rem 1.5rem;
			font-size: 0.92rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);

			&.row-feature {
				font-weight: 700;
				color: #ffffff;
			}

			&.row-mezzo {
				color: #ffffff;
				font-weight: 600;

				.check-icon {
					color: #1ed760;
					font-weight: 900;
					margin-right: 0.5rem;
				}
			}

			&.row-others {
				color: #6a6a6a;

				.cross-icon {
					color: #6a6a6a;
					margin-right: 0.5rem;
				}
			}
		}

		tr:last-child td {
			border-bottom: none;
		}
	}

	/* CTA Section */
	.mono-cta-section {
		padding: 4.5rem 1.5rem;
		background: #0c0c0c;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		.mono-cta-card {
			position: relative;
			background: #181818;
			border: 1px solid rgba(30, 215, 96, 0.35);
			border-radius: 20px;
			padding: 4rem 2rem;
			text-align: center;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1.25rem;
			overflow: hidden;

			&::before {
				content: "";
				position: absolute;
				inset: 0;
				background: radial-gradient(ellipse at 50% 120%, rgba(30, 215, 96, 0.18) 0%, transparent 65%);
				pointer-events: none;
			}

			.mono-kicker,
			.cta-title,
			.cta-desc,
			.cta-btn-group {
				position: relative;
				z-index: 1;
			}

			.cta-title {
				font-size: clamp(2rem, 4vw, 3rem);
				font-weight: 900;
				letter-spacing: -0.03em;
				color: #ffffff;
				margin: 0;
			}

			.cta-desc {
				font-size: 1.05rem;
				color: #a7a7a7;
				max-width: 32rem;
				margin: 0;
			}

			.cta-btn-group {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 1rem;
				flex-wrap: wrap;
				margin-top: 0.5rem;
			}

			.cta-btn {
				padding: 0.95rem 2.25rem !important;
				font-size: 1rem !important;
			}
		}
	}

	/* FAQ Accordion */
	.mono-accordion {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		.accordion-item {
			background: #181818;
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 12px;
			overflow: hidden;
			transition: border-color 140ms ease;

			&.open {
				border-color: rgba(30, 215, 96, 0.45);
			}

			.accordion-btn {
				width: 100%;
				background: transparent;
				border: none;
				padding: 1.25rem 1.5rem;
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: 1rem;
				color: #ffffff;
				font-size: 1rem;
				font-weight: 700;
				text-align: left;
				cursor: pointer;

				&:hover {
					color: #1ed760;
				}

				.accordion-icon {
					font-size: 1.25rem;
					font-weight: 700;
					color: #1ed760;
				}
			}

			.accordion-panel {
				padding: 0 1.5rem 1.25rem;

				p {
					margin: 0;
					font-size: 0.92rem;
					line-height: 1.6;
					color: #a7a7a7;
				}
			}
		}
	}

	/* Footer */
	.mono-footer {
		background: #0a0a0a;
		padding: 4.5rem 1.5rem 3rem;

		.footer-layout {
			max-width: 76rem;
			margin: 0 auto;
			display: grid;
			grid-template-columns: 20rem 1fr;
			gap: 4rem;
			padding-bottom: 3.5rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);

			@media screen and (max-width: 850px) {
				grid-template-columns: 1fr;
				gap: 2.5rem;
			}
		}

		.footer-brand-side {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: 0.85rem;

			.footer-logo-row {
				display: flex;
				align-items: center;
				gap: 0.65rem;

				.brand-logo.small {
					width: 1.75rem;
					height: 1.75rem;
					border-radius: 6px;
					object-fit: contain;
				}

				.footer-brand-title {
					font-size: 1.15rem;
					font-weight: 900;
					letter-spacing: -0.02em;
					color: #ffffff;
				}
			}

			.footer-subtext {
				font-size: 0.85rem;
				color: #6a6a6a;
				line-height: 1.5;
				margin: 0;
			}

			.footer-download {
				padding: 0.5rem 1rem !important;
				font-size: 0.8rem !important;
			}
		}

		.footer-columns {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 2rem;

			@media screen and (max-width: 600px) {
				grid-template-columns: 1fr;
				gap: 1.5rem;
			}

			.footer-col {
				display: flex;
				flex-direction: column;
				gap: 0.65rem;

				.col-head {
					font-size: 0.72rem;
					font-weight: 800;
					letter-spacing: 0.1em;
					color: #a7a7a7;
					margin-bottom: 0.25rem;
				}

				.footer-link-btn {
					background: transparent !important;
					border: none !important;
					padding: 0 !important;
					color: #6a6a6a !important;
					font-size: 0.85rem !important;
					font-weight: 500 !important;
					text-align: left !important;
					cursor: pointer !important;
					transition: color 120ms ease !important;

					&:hover {
						color: #1ed760 !important;
					}
				}

				a {
					color: #6a6a6a;
					text-decoration: none;
					font-size: 0.85rem;
					font-weight: 500;
					transition: color 120ms ease;

					&:hover {
						color: #1ed760;
					}
				}
			}
		}

		.footer-bottom-row {
			max-width: 76rem;
			margin: 2rem auto 0;
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 1rem;

			.copyright-text {
				font-size: 0.78rem;
				color: #5a5a5a;
			}

			.footer-social-links {
				display: flex;
				gap: 1.5rem;

				a {
					font-size: 0.78rem;
					color: #5a5a5a;
					text-decoration: none;
					transition: color 120ms ease;

					&:hover {
						color: #1ed760;
					}
				}
			}
		}
	}
</style>