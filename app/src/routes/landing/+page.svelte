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
	let openFaq = $state<number | null>(0);

	const faqs = [
		{
			q: "Is Mezzo really 100% free with zero ads?",
			a: "Yes! Mezzo is open-source and completely free. There are no audio commercials, banner ads, tracking cookies, or subscription paywalls. All features are fully unlocked forever."
		},
		{
			q: "What audio quality does Mezzo stream?",
			a: "Mezzo delivers true lossless Hi-Res audio up to 24-bit / 192kHz FLAC via intelligent multi-source routing. You can also switch between Data Saver, High (320kbps), and Master Lossless quality in settings."
		},
		{
			q: "Can I download tracks and playlists for offline listening?",
			a: "Absolutely. With 1 click, you can save individual tracks, albums, or full playlists for offline listening. Audio is cached locally to high-speed IndexedDB on web/desktop and native storage on Android."
		},
		{
			q: "How do synchronized karaoke lyrics work?",
			a: "Mezzo fetches synchronized LRC lyrics in real-time. As the track plays, each lyric line lights up dynamically with smooth auto-scrolling. You can even click or tap any line to jump directly to that point in the song."
		},
		{
			q: "How do I install Mezzo on Android, iOS, or PC?",
			a: "On Android, download and install the direct APK. On iOS, open Mezzo in Safari, tap Share → 'Add to Home Screen' for a fullscreen app experience. On Windows, Mac, or Linux, click the install icon in Chrome/Edge or use the web app."
		},
		{
			q: "How does playlist sync work across devices?",
			a: "Log in with your free Mezzo account (backed by secure Better-Auth) and your custom playlists, liked tracks, equalizer profiles, and play history sync in real time across phone, tablet, and PC."
		}
	];

	function toggleFaq(index: number) {
		openFaq = openFaq === index ? null : index;
	}

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
	<title>Mezzo — Free & Lossless Music Streaming</title>
	<meta
		name="description"
		content="High-fidelity music streaming with zero ads. 24-bit FLAC audio, synchronized lyrics, 10-band studio EQ, offline caching, and cross-device sync."
	/>
	<meta name="theme-color" content="#030305" />
</svelte:head>

<div class="landing">
	<!-- Animated Ambient Gradient Background Mesh -->
	<div class="gradient-bg-mesh" aria-hidden="true">
		<div class="glow-orb orb-1"></div>
		<div class="glow-orb orb-2"></div>
		<div class="glow-orb orb-3"></div>
		<div class="glow-orb orb-4"></div>
		<div class="grid-overlay"></div>
		<div class="vignette-overlay"></div>
	</div>

	<!-- Navigation Bar -->
	<header class="nav">
		<a href="/landing" class="logo">
			<img src="/logo.svg" alt="Mezzo" />
			<span>Mezzo</span>
		</a>
		<div class="nav-right">
			<a
				href="https://github.com/sanir321/mezzo"
				target="_blank"
				rel="noopener noreferrer"
				class="nav-btn-github"
				title="Star Mezzo on GitHub"
			>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
					<path
						d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
					/>
				</svg>
				<span class="desktop-only">Star</span>
				<svg viewBox="0 0 24 24" width="13" height="13" fill="#e3b341" class="star-icon">
					<path
						d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
					/>
				</svg>
			</a>

			<button
				type="button"
				class="nav-btn-coffee"
				title="Support Mezzo via UPI / Buy Me a Coffee"
				onclick={() => (showSupportModal = true)}
			>
				<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
					<path
						d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z"
					/>
				</svg>
				<span class="desktop-only">Buy Me a Coffee</span>
			</button>

			<a href="/" class="nav-link open-app">Open Web App</a>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="hero">
		<div class="kicker-badge">
			<span class="soundwave">
				<span class="bar bar-1"></span>
				<span class="bar bar-2"></span>
				<span class="bar bar-3"></span>
				<span class="bar bar-4"></span>
			</span>
			<span class="kicker-text">Free · Lossless Hi-Fi · Zero Ads</span>
		</div>
		<h1 class="hero-title">
			Music without<br />
			<span class="gradient-text">compromise.</span>
		</h1>
		<p class="sub">
			Stream millions of songs in pristine 24-bit studio quality with live karaoke lyrics and a 10-band equalizer.
			No paywalls, no commercials, no subscriptions.
		</p>

		<div class="actions">
			<a
				href="/Mezzo-1.0.apk"
				download="Mezzo-1.0.apk"
				class="btn-main"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Download APK (Android)
			</a>
			<a href="/" class="btn-alt">
				Open Web Player
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</a>
			<a
				href="https://github.com/sanir321/mezzo"
				target="_blank"
				rel="noopener noreferrer"
				class="btn-github-hero"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
					<path
						d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
					/>
				</svg>
				GitHub Repo
			</a>
			<button type="button" class="btn-coffee-hero" onclick={() => (showSupportModal = true)}>
				<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
					<path
						d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z"
					/>
				</svg>
				Buy Me a Coffee
			</button>
		</div>
	</section>

	<!-- Interactive Showcase Preview Mockup -->
	<section class="mock-showcase-section">
		<div class="mock-container">
			<div class="mock-card">
				<!-- Window Header Bar -->
				<div class="mock-header">
					<div class="mock-dots">
						<span class="dot red"></span>
						<span class="dot yellow"></span>
						<span class="dot green"></span>
					</div>
					<div class="mock-title-pill">
						<span class="badge-flac">HI-RES FLAC 24-BIT</span>
						<span class="track-playing">Starboy — The Weeknd, Daft Punk</span>
					</div>
					<div class="mock-header-badge">LOSSLESS MASTER</div>
				</div>

				<!-- Mock Inner Content -->
				<div class="mock-body">
					<!-- Player Left Side: Album & Visualizer -->
					<div class="mock-left">
						<div class="mock-art-wrapper">
							<div class="mock-art-glow"></div>
							<div class="mock-art">
								<div class="vinyl-record"></div>
								<div class="art-content">
									<div class="art-icon">🎵</div>
									<div class="art-meta">
										<span class="art-title">Starboy</span>
										<span class="art-artist">The Weeknd</span>
									</div>
								</div>
							</div>
						</div>

						<!-- Equalizer visualizer bars -->
						<div class="mock-eq-bars">
							<span class="eq-col b1"></span>
							<span class="eq-col b2"></span>
							<span class="eq-col b3"></span>
							<span class="eq-col b4"></span>
							<span class="eq-col b5"></span>
							<span class="eq-col b6"></span>
							<span class="eq-col b7"></span>
							<span class="eq-col b8"></span>
							<span class="eq-col b9"></span>
							<span class="eq-col b10"></span>
							<span class="eq-col b11"></span>
							<span class="eq-col b12"></span>
							<span class="eq-col b13"></span>
							<span class="eq-col b14"></span>
							<span class="eq-col b15"></span>
							<span class="eq-col b16"></span>
						</div>

						<!-- Track Progress Bar -->
						<div class="mock-progress">
							<div class="progress-times">
								<span>1:42</span>
								<span>3:50</span>
							</div>
							<div class="progress-bar-bg">
								<div class="progress-fill" style="width: 44%;"></div>
							</div>
						</div>
					</div>

					<!-- Player Right Side: Synced Karaoke Lyrics & EQ Presets -->
					<div class="mock-right">
						<div class="mock-lyrics-header">
							<span class="lyric-label">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
									<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
								</svg>
								LIVE SYNCED LYRICS
							</span>
							<span class="lyric-badge">LRC Auto-Scroll</span>
						</div>

						<div class="mock-lyrics-body">
							<p class="lyric-line past">I'm tryna put you in the worst mood, ah</p>
							<p class="lyric-line past">P1 cleaner than your church shoes, ah</p>
							<p class="lyric-line active">
								<span class="sparkle">✨</span> Look what you've done, I'm a motherf***in' starboy
							</p>
							<p class="lyric-line future">Every day a nigga try to test me, ah</p>
							<p class="lyric-line future">Every day a nigga try to end me, ah</p>
						</div>

						<!-- EQ Preset Tags -->
						<div class="mock-eq-presets">
							<span class="preset active">🔊 Bass Boost (+6dB)</span>
							<span class="preset">🎛️ Studio Master</span>
							<span class="preset">⚡ Electronic FX</span>
							<span class="preset">🎤 Vocal Clarity</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Deep-Dive Features Grid -->
	<section class="features-section">
		<div class="section-heading">
			<span class="section-tag">ENGINEERED FOR AUDIOPHILES</span>
			<h2>Everything you want in a music app. Unlocked.</h2>
			<p>Built from scratch with modern web standards, precision DSP audio nodes, and zero compromise.</p>
		</div>

		<div class="features-grid">
			<!-- 1. Lossless Audio -->
			<div class="feature-card">
				<div class="feature-icon-wrap green">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 18v-6a9 9 0 0 1 18 0v6" />
						<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
					</svg>
				</div>
				<h3>24-bit Lossless Hi-Fi</h3>
				<p>Hear music exactly as the artist intended in studio master quality with up to 192kHz/24-bit FLAC audio streams and low-latency decoding.</p>
				<ul class="feature-bullets">
					<li>Multi-source fallback routing</li>
					<li>Selectable bitrates (64k to Lossless)</li>
					<li>Gapless playback transition</li>
				</ul>
			</div>

			<!-- 2. Synced Lyrics -->
			<div class="feature-card">
				<div class="feature-icon-wrap cyan">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
						<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
						<line x1="12" y1="19" x2="12" y2="23" />
						<line x1="8" y1="23" x2="16" y2="23" />
					</svg>
				</div>
				<h3>Real-Time Synced Lyrics</h3>
				<p>Sing along with syllable and line-by-line synchronized karaoke lyrics. Tap any sentence to immediately jump playback to that verse.</p>
				<ul class="feature-bullets">
					<li>Live line-by-line glow animation</li>
					<li>Click-to-seek timestamp navigation</li>
					<li>Full-screen lyric karaoke mode</li>
				</ul>
			</div>

			<!-- 3. Studio 10-Band EQ -->
			<div class="feature-card">
				<div class="feature-icon-wrap purple">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
						<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
						<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
						<line x1="1" y1="14" x2="7" y2="14" />
						<line x1="9" y1="8" x2="15" y2="8" />
						<line x1="17" y1="16" x2="23" y2="16" />
					</svg>
				</div>
				<h3>10-Band Equalizer & FX</h3>
				<p>Take complete control over your sound. Boost deep sub-bass, refine vocal presence, and explore real-time frequency spectrum visualizers.</p>
				<ul class="feature-bullets">
					<li>Web Audio API DSP pipeline</li>
					<li>15+ handcrafted EQ audio presets</li>
					<li>Zen Flow & visualizer animations</li>
				</ul>
			</div>

			<!-- 4. Offline Downloads -->
			<div class="feature-card">
				<div class="feature-icon-wrap amber">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				</div>
				<h3>Offline Downloads</h3>
				<p>Never worry about poor connections or airplane mode. Download individual tracks or entire playlists directly to your device with 1 tap.</p>
				<ul class="feature-bullets">
					<li>Persistent IndexedDB / disk storage</li>
					<li>No artificial limits or expirations</li>
					<li>Full offline playback capabilities</li>
				</ul>
			</div>

			<!-- 5. 100% Free & Zero Ads -->
			<div class="feature-card">
				<div class="feature-icon-wrap green">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
					</svg>
				</div>
				<h3>Zero Ads, Zero Distractions</h3>
				<p>No audio commercials interrupting your favorite drop. No video popups. No track skip limits. Enjoy pure, uninterrupted listening forever.</p>
				<ul class="feature-bullets">
					<li>No subscription paywalls</li>
					<li>Unlimited skips & on-demand play</li>
					<li>No intrusive tracking or telemetry</li>
				</ul>
			</div>

			<!-- 6. Cloud Sync & Multi-Platform -->
			<div class="feature-card">
				<div class="feature-icon-wrap cyan">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
					</svg>
				</div>
				<h3>Instant Cloud Sync</h3>
				<p>Your library travels with you. Log in once with Better-Auth to keep your playlists, liked tracks, and personalized sound settings synced across all devices.</p>
				<ul class="feature-bullets">
					<li>Instant sync across Android, Web, & iOS</li>
					<li>Seamless playlist creation & sharing</li>
					<li>Import / export backup support</li>
				</ul>
			</div>
		</div>
	</section>

	<!-- Mezzo vs Spotify vs Apple Music Comparison Table -->
	<section class="comparison-section">
		<div class="section-heading">
			<span class="section-tag">THE HONEST COMPARISON</span>
			<h2>How Mezzo compares to the industry giants</h2>
			<p>High fidelity and true musical freedom without the $120/year price tag.</p>
		</div>

		<div class="table-container">
			<table class="comparison-table">
				<thead>
					<tr>
						<th class="feature-col">Feature</th>
						<th class="mezzo-col">
							<div class="col-head-mezzo">
								<span class="brand-pill">MEZZO</span>
								<span class="brand-sub">Open Source</span>
							</div>
						</th>
						<th>Spotify Free</th>
						<th>Apple Music</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="feature-name">
							<strong>Audio Quality</strong>
							<span class="desc">Streaming resolution & format</span>
						</td>
						<td class="mezzo-val">
							<span class="highlight-badge">Hi-Res Lossless 24-bit FLAC</span>
						</td>
						<td>160 kbps MP3</td>
						<td>256 kbps AAC / ALAC</td>
					</tr>
					<tr>
						<td class="feature-name">
							<strong>Advertisements</strong>
							<span class="desc">Commercial interruptions</span>
						</td>
						<td class="mezzo-val"><span class="check">✓</span> <strong>0 Ads (Never)</strong></td>
						<td class="bad-val">Frequent Audio & Banner Ads</td>
						<td>No Ads</td>
					</tr>
					<tr>
						<td class="feature-name">
							<strong>Offline Downloads</strong>
							<span class="desc">Listen without data / WiFi</span>
						</td>
						<td class="mezzo-val"><span class="check">✓</span> <strong>Free & Unlimited</strong></td>
						<td class="bad-val">✕ Premium Only</td>
						<td>Included in Subscription</td>
					</tr>
					<tr>
						<td class="feature-name">
							<strong>Mobile Track Selection</strong>
							<span class="desc">Pick and play any song on phone</span>
						</td>
						<td class="mezzo-val"><span class="check">✓</span> <strong>Full On-Demand</strong></td>
						<td class="bad-val">Shuffle-Only + 6 Skips/Hr</td>
						<td>Full On-Demand</td>
					</tr>
					<tr>
						<td class="feature-name">
							<strong>Studio Equalizer</strong>
							<span class="desc">Acoustic control & visualizers</span>
						</td>
						<td class="mezzo-val"><span class="check">✓</span> <strong>10-Band + Visualizers</strong></td>
						<td>Basic 6-Band</td>
						<td>Preset-Only (No Sliders)</td>
					</tr>
					<tr>
						<td class="feature-name">
							<strong>Real-Time Synced Lyrics</strong>
							<span class="desc">Interactive karaoke line seeking</span>
						</td>
						<td class="mezzo-val"><span class="check">✓</span> <strong>Interactive Karaoke</strong></td>
						<td>Limited Rate on Free</td>
						<td>Included</td>
					</tr>
					<tr class="price-row">
						<td class="feature-name">
							<strong>Subscription Price</strong>
							<span class="desc">Monthly recurring cost</span>
						</td>
						<td class="mezzo-val price-highlight">
							<span class="free-text">$0 / FREE FOREVER</span>
						</td>
						<td class="price-other">$11.99 / month (for Ad-Free)</td>
						<td class="price-other">$10.99 / month</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Download & Platform Guide -->
	<section class="download">
		<div class="section-heading">
			<span class="section-tag">CROSS-PLATFORM</span>
			<h2>Get Mezzo on all your devices</h2>
			<p>Stream anywhere — natively on Android or via the lightweight Progressive Web App.</p>
		</div>

		<div class="download-grid">
			<!-- 1. Android APK -->
			<div class="platform-card featured-platform">
				<div class="card-badge">Native App</div>
				<div class="platform-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
						<path
							d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789"
						/>
					</svg>
				</div>
				<h3>Android (APK)</h3>
				<p>High performance native package with lockscreen media controls, background playback, and instant local caching.</p>
				<div class="card-actions">
					<a
						href="/Mezzo-1.0.apk"
						download="Mezzo-1.0.apk"
						class="platform-btn primary"
					>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Direct APK Download
					</a>
					<a
						href="https://github.com/sanir321/mezzo/releases/latest"
						target="_blank"
						rel="noopener"
						class="platform-btn secondary"
					>
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
				<p>Open Mezzo in Safari, tap the <strong>Share</strong> button, and tap <strong>Add to Home Screen</strong> for a clean, borderless standalone app.</p>
				<div class="card-actions">
					<a href="/" class="platform-btn secondary">
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
				<p>Stream in Chrome, Edge, Firefox, or Brave. Click the install icon in your address bar to run Mezzo as an ultra-fast desktop app.</p>
				<div class="card-actions">
					<a href="/" class="platform-btn secondary">
						Launch Web Player
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Interactive FAQ Section -->
	<section class="faq-section">
		<div class="section-heading">
			<span class="section-tag">FREQUENTLY ASKED QUESTIONS</span>
			<h2>Got questions? We've got answers.</h2>
			<p>Everything you need to know about Mezzo, lossless audio, and our open-source philosophy.</p>
		</div>

		<div class="faq-accordion">
			{#each faqs as faq, i}
				<div class="faq-item" class:open={openFaq === i}>
					<button
						type="button"
						class="faq-question"
						onclick={() => toggleFaq(i)}
						aria-expanded={openFaq === i}
					>
						<span>{faq.q}</span>
						<span class="faq-toggle-icon">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</span>
					</button>
					{#if openFaq === i}
						<div class="faq-answer">
							<p>{faq.a}</p>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<!-- Bottom Call-To-Action Banner -->
	<section class="cta-banner-section">
		<div class="cta-banner-card">
			<div class="cta-glow"></div>
			<div class="cta-content">
				<span class="cta-kicker">READY TO ELEVATE YOUR LISTENING?</span>
				<h2>Start streaming lossless audio today.</h2>
				<p>Join thousands of music lovers enjoying ad-free music with high-fidelity sound and live lyrics.</p>
				
				<div class="cta-buttons">
					<a href="/" class="btn-main cta-btn">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
						Open Web Player
					</a>
					<a
						href="/Mezzo-1.0.apk"
						download="Mezzo-1.0.apk"
						class="btn-alt cta-btn"
					>
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="7 10 12 15 17 10" />
							<line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						Download Android APK
					</a>
					<button type="button" class="btn-coffee-hero cta-btn" onclick={() => (showSupportModal = true)}>
						<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
							<path
								d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z"
							/>
						</svg>
						Support via UPI
					</button>
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
				<a
					href="https://github.com/sanir321/mezzo"
					target="_blank"
					rel="noopener noreferrer"
					class="foot-link"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
						<path
							d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
						/>
					</svg>
					GitHub
				</a>
				<a href="https://github.com/sanir321/mezzo/releases" target="_blank" rel="noopener noreferrer" class="foot-link">Releases</a>
				<button type="button" class="foot-link coffee-link btn-reset" onclick={() => (showSupportModal = true)}>
					<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
						<path
							d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z"
						/>
					</svg>
					Buy Me a Coffee
				</button>
			</div>
		</div>
		<p class="foot-copy">© 2026 Mezzo Music · Crafted with ❤️ by Samir Khadka</p>
	</footer>

	<!-- Support / Buy Me a Coffee UPI Modal -->
	{#if showSupportModal}
		<div
			class="modal-backdrop"
			role="button"
			tabindex="0"
			onclick={() => (showSupportModal = false)}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") showSupportModal = false;
			}}
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
								<path
									d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 19h20v2H2z"
								/>
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
		background: #030305;
		display: flex;
		flex-direction: column;
		position: relative;
		overflow-x: hidden;
	}

	/* ─── Animated Ambient Gradient Background Mesh ─── */
	.gradient-bg-mesh {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;

		.glow-orb {
			position: absolute;
			border-radius: 50%;
			filter: blur(110px);
			opacity: 0.36;
			will-change: transform;
		}

		.orb-1 {
			width: 60vw;
			height: 60vw;
			max-width: 650px;
			max-height: 650px;
			top: -15%;
			left: 10%;
			background: radial-gradient(circle, #1ed760 0%, rgba(30, 215, 96, 0.45) 45%, transparent 75%);
			animation: floatOrb1 18s ease-in-out infinite alternate;
		}

		.orb-2 {
			width: 55vw;
			height: 55vw;
			max-width: 580px;
			max-height: 580px;
			top: 20%;
			right: -8%;
			background: radial-gradient(circle, #0df2c9 0%, rgba(13, 242, 201, 0.4) 45%, transparent 75%);
			animation: floatOrb2 22s ease-in-out infinite alternate;
		}

		.orb-3 {
			width: 55vw;
			height: 55vw;
			max-width: 600px;
			max-height: 600px;
			bottom: -12%;
			left: -5%;
			background: radial-gradient(circle, #7c3aed 0%, rgba(99, 102, 241, 0.35) 50%, transparent 75%);
			animation: floatOrb3 20s ease-in-out infinite alternate;
		}

		.orb-4 {
			width: 45vw;
			height: 45vw;
			max-width: 480px;
			max-height: 480px;
			top: 55%;
			right: 15%;
			background: radial-gradient(circle, rgba(30, 215, 96, 0.5) 0%, rgba(255, 221, 0, 0.25) 50%, transparent 75%);
			animation: floatOrb4 16s ease-in-out infinite alternate;
		}

		.grid-overlay {
			position: absolute;
			inset: 0;
			background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
				linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
			background-size: 40px 40px;
			mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
			-webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 85%);
		}

		.vignette-overlay {
			position: absolute;
			inset: 0;
			background: radial-gradient(circle at 50% 30%, transparent 20%, rgba(3, 3, 5, 0.85) 85%);
		}
	}

	@keyframes floatOrb1 {
		0% { transform: translate(0, 0) scale(1) rotate(0deg); }
		50% { transform: translate(10%, 15%) scale(1.15) rotate(45deg); }
		100% { transform: translate(-8%, 6%) scale(0.92) rotate(-25deg); }
	}

	@keyframes floatOrb2 {
		0% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(-12%, 10%) scale(1.18); }
		100% { transform: translate(6%, -8%) scale(0.88); }
	}

	@keyframes floatOrb3 {
		0% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(15%, -12%) scale(1.12); }
		100% { transform: translate(-6%, -4%) scale(0.95); }
	}

	@keyframes floatOrb4 {
		0% { transform: translate(0, 0) scale(0.9); opacity: 0.25; }
		50% { transform: translate(-10%, -15%) scale(1.15); opacity: 0.45; }
		100% { transform: translate(8%, 8%) scale(1); opacity: 0.3; }
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
		position: relative;
		z-index: 10;

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
			filter: drop-shadow(0 0 10px rgba(30, 215, 96, 0.4));
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
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		transition: all 150ms ease;

		&:hover {
			color: #fff;
			background: rgba(255, 255, 255, 0.14);
			border-color: rgba(255, 255, 255, 0.25);
			box-shadow: 0 0 14px rgba(255, 255, 255, 0.1);
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
			box-shadow: 0 4px 16px rgba(255, 221, 0, 0.4);
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

		&.open-app {
			background: #1ed760;
			color: #000000;
			padding: 0.5rem 1.25rem;
			border-radius: 9999px;
			font-weight: 700;
			transition: all 150ms ease;

			&:hover {
				background: #1fdf64;
				color: #000000;
				transform: translateY(-1px);
				box-shadow: 0 4px 16px rgba(30, 215, 96, 0.4);
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
		padding: 5rem 2rem 3rem;
		max-width: 50rem;
		margin: 0 auto;
		position: relative;
		z-index: 2;
	}

	.kicker-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.45rem 1.15rem;
		border-radius: 9999px;
		background: rgba(30, 215, 96, 0.08);
		border: 1px solid rgba(30, 215, 96, 0.25);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		margin-bottom: 1.75rem;
		box-shadow: 0 0 24px rgba(30, 215, 96, 0.14);
		transition: all 200ms ease;

		&:hover {
			border-color: rgba(30, 215, 96, 0.45);
			box-shadow: 0 0 30px rgba(30, 215, 96, 0.28);
			transform: translateY(-1px);
		}
	}

	.kicker-text {
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		background: linear-gradient(90deg, #1ed760 0%, #0df2c9 35%, #a855f7 70%, #1ed760 100%);
		background-size: 300% 100%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: gradientPan 8s linear infinite;
	}

	.soundwave {
		display: inline-flex;
		align-items: flex-end;
		gap: 2.5px;
		height: 14px;

		.bar {
			width: 2.5px;
			background: #1ed760;
			border-radius: 9999px;
			animation: soundwaveBounce 1.2s ease-in-out infinite alternate;

			&.bar-1 { height: 6px; animation-delay: 0.1s; }
			&.bar-2 { height: 13px; animation-delay: 0.35s; }
			&.bar-3 { height: 9px; animation-delay: 0.2s; }
			&.bar-4 { height: 14px; animation-delay: 0.5s; }
		}
	}

	@keyframes soundwaveBounce {
		0% { height: 3px; }
		100% { height: 14px; }
	}

	@keyframes gradientPan {
		0% { background-position: 0% 50%; }
		100% { background-position: 300% 50%; }
	}

	.hero-title {
		font-size: clamp(2.6rem, 6vw, 4.4rem);
		font-weight: 850;
		line-height: 1.08;
		letter-spacing: -0.04em;
		margin: 0 0 1.5rem;
		color: #fff;
	}

	.gradient-text {
		background: linear-gradient(135deg, #ffffff 15%, #1ed760 45%, #0df2c9 75%, #c084fc 100%);
		background-size: 200% 200%;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: gradientShift 6s ease infinite alternate;
	}

	@keyframes gradientShift {
		0% { background-position: 0% 50%; }
		100% { background-position: 100% 50%; }
	}

	.sub {
		font-size: 1.08rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.65);
		margin: 0 0 2.75rem;
		max-width: 36rem;
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

	/* ─── Shared Section Headings ─── */
	.section-heading {
		text-align: center;
		margin-bottom: 3.5rem;

		.section-tag {
			font-size: 0.76rem;
			font-weight: 800;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			color: #1ed760;
			display: block;
			margin-bottom: 0.6rem;
		}

		h2 {
			font-size: clamp(1.85rem, 3.5vw, 2.75rem);
			font-weight: 850;
			letter-spacing: -0.03em;
			margin: 0 0 0.85rem;
			color: #fff;
		}

		p {
			font-size: 1.05rem;
			color: rgba(255, 255, 255, 0.6);
			max-width: 36rem;
			margin: 0 auto;
			line-height: 1.6;
		}
	}

	/* ─── Mock Showcase Preview ─── */
	.mock-showcase-section {
		padding: 2rem 2rem 5rem;
		max-width: 68rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.mock-container {
		perspective: 1000px;
	}

	.mock-card {
		background: rgba(18, 18, 22, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(30, 215, 96, 0.1);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
	}

	.mock-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.07);

		.mock-dots {
			display: flex;
			gap: 6px;

			.dot {
				width: 11px;
				height: 11px;
				border-radius: 50%;

				&.red { background: #ff5f56; }
				&.yellow { background: #ffbd2e; }
				&.green { background: #27c93f; }
			}
		}

		.mock-title-pill {
			display: flex;
			align-items: center;
			gap: 0.6rem;
			background: rgba(0, 0, 0, 0.4);
			padding: 0.35rem 0.85rem;
			border-radius: 9999px;
			border: 1px solid rgba(255, 255, 255, 0.08);

			.badge-flac {
				font-size: 0.68rem;
				font-weight: 800;
				color: #1ed760;
				background: rgba(30, 215, 96, 0.15);
				padding: 0.15rem 0.45rem;
				border-radius: 4px;
			}

			.track-playing {
				font-size: 0.8rem;
				color: rgba(255, 255, 255, 0.85);
				font-weight: 600;
			}
		}

		.mock-header-badge {
			font-size: 0.72rem;
			font-weight: 700;
			color: #0df2c9;
			letter-spacing: 0.05em;

			@media (max-width: 600px) {
				display: none;
			}
		}
	}

	.mock-body {
		display: grid;
		grid-template-columns: 1fr 1.25fr;
		gap: 2rem;
		padding: 2.25rem 2rem;

		@media (max-width: 850px) {
			grid-template-columns: 1fr;
		}
	}

	.mock-left {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.mock-art-wrapper {
		position: relative;
		width: 100%;
		max-width: 240px;
	}

	.mock-art-glow {
		position: absolute;
		inset: -10px;
		background: radial-gradient(circle, rgba(30, 215, 96, 0.45) 0%, rgba(13, 242, 201, 0.2) 50%, transparent 80%);
		filter: blur(20px);
		border-radius: 20px;
	}

	.mock-art {
		position: relative;
		width: 100%;
		aspect-ratio: 1;
		background: linear-gradient(135deg, #18181f 0%, #0a0a0d 100%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;

		.art-content {
			text-align: center;
			z-index: 2;

			.art-icon {
				font-size: 2.5rem;
				margin-bottom: 0.5rem;
			}

			.art-title {
				display: block;
				font-size: 1.1rem;
				font-weight: 800;
				color: #fff;
			}

			.art-artist {
				display: block;
				font-size: 0.85rem;
				color: rgba(255, 255, 255, 0.6);
			}
		}
	}

	.mock-eq-bars {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 40px;
		width: 100%;
		max-width: 240px;
		justify-content: center;

		.eq-col {
			flex: 1;
			background: linear-gradient(180deg, #1ed760 0%, #0df2c9 100%);
			border-radius: 2px;
			animation: eqAnim 1.2s ease-in-out infinite alternate;

			&.b1 { height: 35%; animation-delay: 0.1s; }
			&.b2 { height: 65%; animation-delay: 0.3s; }
			&.b3 { height: 90%; animation-delay: 0.15s; }
			&.b4 { height: 45%; animation-delay: 0.45s; }
			&.b5 { height: 80%; animation-delay: 0.2s; }
			&.b6 { height: 50%; animation-delay: 0.6s; }
			&.b7 { height: 95%; animation-delay: 0.25s; }
			&.b8 { height: 70%; animation-delay: 0.5s; }
			&.b9 { height: 85%; animation-delay: 0.35s; }
			&.b10 { height: 40%; animation-delay: 0.1s; }
			&.b11 { height: 90%; animation-delay: 0.4s; }
			&.b12 { height: 60%; animation-delay: 0.2s; }
			&.b13 { height: 75%; animation-delay: 0.55s; }
			&.b14 { height: 95%; animation-delay: 0.3s; }
			&.b15 { height: 55%; animation-delay: 0.15s; }
			&.b16 { height: 80%; animation-delay: 0.45s; }
		}
	}

	@keyframes eqAnim {
		0% { transform: scaleY(0.3); opacity: 0.7; }
		100% { transform: scaleY(1); opacity: 1; }
	}

	.mock-progress {
		width: 100%;
		max-width: 240px;

		.progress-times {
			display: flex;
			justify-content: space-between;
			font-size: 0.72rem;
			color: rgba(255, 255, 255, 0.45);
			margin-bottom: 0.35rem;
		}

		.progress-bar-bg {
			height: 4px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 9999px;
			overflow: hidden;

			.progress-fill {
				height: 100%;
				background: #1ed760;
				border-radius: 9999px;
			}
		}
	}

	.mock-right {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 1.5rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 1.5rem;
	}

	.mock-lyrics-header {
		display: flex;
		align-items: center;
		justify-content: space-between;

		.lyric-label {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 0.75rem;
			font-weight: 800;
			letter-spacing: 0.06em;
			color: #0df2c9;
		}

		.lyric-badge {
			font-size: 0.68rem;
			color: rgba(255, 255, 255, 0.4);
			background: rgba(255, 255, 255, 0.05);
			padding: 0.2rem 0.5rem;
			border-radius: 9999px;
		}
	}

	.mock-lyrics-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;

		.lyric-line {
			margin: 0;
			font-size: 0.95rem;
			font-weight: 600;
			transition: all 200ms ease;

			&.past {
				color: rgba(255, 255, 255, 0.3);
			}

			&.active {
				color: #fff;
				font-size: 1.12rem;
				font-weight: 800;
				background: linear-gradient(90deg, #1ed760 0%, #0df2c9 100%);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				text-shadow: 0 0 20px rgba(30, 215, 96, 0.3);
			}

			&.future {
				color: rgba(255, 255, 255, 0.2);
			}
		}
	}

	.mock-eq-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;

		.preset {
			font-size: 0.75rem;
			font-weight: 700;
			padding: 0.35rem 0.75rem;
			border-radius: 8px;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.1);
			color: rgba(255, 255, 255, 0.75);

			&.active {
				background: rgba(30, 215, 96, 0.15);
				border-color: rgba(30, 215, 96, 0.4);
				color: #1ed760;
			}
		}
	}

	/* ─── Features Grid ─── */
	.features-section {
		padding: 4rem 2rem 5rem;
		max-width: 72rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;

		@media (max-width: 950px) {
			grid-template-columns: repeat(2, 1fr);
		}

		@media (max-width: 600px) {
			grid-template-columns: 1fr;
		}
	}

	.feature-card {
		background: rgba(18, 18, 22, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 20px;
		padding: 2rem 1.75rem;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		transition: all 200ms ease;
		display: flex;
		flex-direction: column;

		&:hover {
			background: rgba(255, 255, 255, 0.04);
			border-color: rgba(30, 215, 96, 0.3);
			transform: translateY(-4px);
			box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
		}

		.feature-icon-wrap {
			width: 3.25rem;
			height: 3.25rem;
			border-radius: 14px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 1.25rem;

			&.green {
				background: rgba(30, 215, 96, 0.12);
				border: 1px solid rgba(30, 215, 96, 0.25);
				color: #1ed760;
			}

			&.cyan {
				background: rgba(13, 242, 201, 0.12);
				border: 1px solid rgba(13, 242, 201, 0.25);
				color: #0df2c9;
			}

			&.purple {
				background: rgba(168, 85, 247, 0.12);
				border: 1px solid rgba(168, 85, 247, 0.25);
				color: #c084fc;
			}

			&.amber {
				background: rgba(245, 158, 11, 0.12);
				border: 1px solid rgba(245, 158, 11, 0.25);
				color: #fbbf24;
			}
		}

		h3 {
			font-size: 1.2rem;
			font-weight: 750;
			margin: 0 0 0.6rem;
			color: #fff;
		}

		p {
			font-size: 0.9rem;
			line-height: 1.6;
			color: rgba(255, 255, 255, 0.55);
			margin: 0 0 1.25rem;
			flex: 1;
		}

		.feature-bullets {
			list-style: none;
			padding: 0;
			margin: 0;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			padding-top: 1rem;
			display: flex;
			flex-direction: column;
			gap: 0.45rem;

			li {
				font-size: 0.8rem;
				color: rgba(255, 255, 255, 0.7);
				display: flex;
				align-items: center;
				gap: 0.4rem;

				&::before {
					content: "•";
					color: #1ed760;
					font-weight: bold;
				}
			}
		}
	}

	/* ─── Comparison Table ─── */
	.comparison-section {
		padding: 4rem 2rem 5rem;
		max-width: 72rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.table-container {
		background: rgba(18, 18, 22, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 24px;
		overflow-x: auto;
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
	}

	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		min-width: 600px;

		th, td {
			padding: 1.25rem 1.5rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		}

		thead th {
			font-size: 0.95rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.6);
			background: rgba(255, 255, 255, 0.02);

			&.mezzo-col {
				background: rgba(30, 215, 96, 0.08);
				border-left: 1px solid rgba(30, 215, 96, 0.25);
				border-right: 1px solid rgba(30, 215, 96, 0.25);
			}

			.col-head-mezzo {
				display: flex;
				flex-direction: column;
				gap: 0.2rem;

				.brand-pill {
					font-size: 1.1rem;
					font-weight: 850;
					color: #1ed760;
					letter-spacing: -0.02em;
				}

				.brand-sub {
					font-size: 0.72rem;
					color: rgba(255, 255, 255, 0.5);
				}
			}
		}

		tbody tr:last-child td {
			border-bottom: none;
		}

		.feature-name {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;

			strong {
				color: #fff;
				font-size: 0.95rem;
			}

			.desc {
				font-size: 0.76rem;
				color: rgba(255, 255, 255, 0.45);
			}
		}

		.mezzo-val {
			background: rgba(30, 215, 96, 0.05);
			border-left: 1px solid rgba(30, 215, 96, 0.2);
			border-right: 1px solid rgba(30, 215, 96, 0.2);
			color: #fff;
			font-size: 0.9rem;

			.check {
				color: #1ed760;
				font-weight: 900;
				margin-right: 0.25rem;
			}

			.highlight-badge {
				background: rgba(30, 215, 96, 0.15);
				border: 1px solid rgba(30, 215, 96, 0.3);
				color: #1ed760;
				padding: 0.3rem 0.6rem;
				border-radius: 6px;
				font-size: 0.78rem;
				font-weight: 700;
			}
		}

		.bad-val {
			color: rgba(255, 255, 255, 0.4);
			font-size: 0.88rem;
		}

		.price-row {
			background: rgba(255, 255, 255, 0.02);

			.price-highlight {
				background: rgba(30, 215, 96, 0.12);

				.free-text {
					font-size: 1rem;
					font-weight: 850;
					color: #1ed760;
					letter-spacing: 0.02em;
				}
			}

			.price-other {
				font-size: 0.88rem;
				color: rgba(255, 255, 255, 0.55);
			}
		}
	}

	/* ─── Download & Platforms ─── */
	.download {
		padding: 4rem 2rem 5rem;
		max-width: 68rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
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
		padding: 2.25rem 2rem;
		border-radius: 24px;
		background: rgba(18, 18, 22, 0.55);
		border: 1px solid rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		transition: transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease;

		&:hover {
			transform: translateY(-4px);
			border-color: rgba(255, 255, 255, 0.2);
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
		}

		&.featured-platform {
			background: linear-gradient(180deg, rgba(30, 215, 96, 0.09) 0%, rgba(18, 18, 22, 0.75) 100%);
			border: 1px solid rgba(30, 215, 96, 0.35);
			box-shadow: 0 0 40px rgba(30, 215, 96, 0.12);

			&:hover {
				border-color: rgba(30, 215, 96, 0.6);
				box-shadow: 0 20px 48px rgba(30, 215, 96, 0.22);
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

	/* ─── FAQ Accordion ─── */
	.faq-section {
		padding: 4rem 2rem 5rem;
		max-width: 52rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.faq-accordion {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.faq-item {
		background: rgba(18, 18, 22, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		overflow: hidden;
		transition: all 180ms ease;

		&:hover {
			border-color: rgba(255, 255, 255, 0.18);
		}

		&.open {
			background: rgba(18, 18, 22, 0.75);
			border-color: rgba(30, 215, 96, 0.35);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

			.faq-toggle-icon {
				transform: rotate(180deg);
				color: #1ed760;
			}
		}
	}

	.faq-question {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		background: none;
		border: none;
		color: #fff;
		font-family: inherit;
		font-size: 1rem;
		font-weight: 700;
		text-align: left;
		cursor: pointer;
		gap: 1rem;

		.faq-toggle-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			color: rgba(255, 255, 255, 0.5);
			transition: transform 200ms ease, color 200ms ease;
			flex-shrink: 0;
		}
	}

	.faq-answer {
		padding: 0 1.5rem 1.35rem;

		p {
			margin: 0;
			font-size: 0.92rem;
			line-height: 1.65;
			color: rgba(255, 255, 255, 0.65);
		}
	}

	/* ─── Bottom CTA Banner ─── */
	.cta-banner-section {
		padding: 2rem 2rem 6rem;
		max-width: 68rem;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
		position: relative;
		z-index: 2;
	}

	.cta-banner-card {
		position: relative;
		background: linear-gradient(135deg, rgba(30, 215, 96, 0.15) 0%, rgba(13, 242, 201, 0.08) 50%, rgba(124, 58, 237, 0.12) 100%);
		border: 1px solid rgba(30, 215, 96, 0.3);
		border-radius: 28px;
		padding: 4rem 2rem;
		text-align: center;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);

		.cta-glow {
			position: absolute;
			top: 50%;
			left: 50%;
			width: 60%;
			height: 60%;
			background: radial-gradient(circle, rgba(30, 215, 96, 0.3) 0%, transparent 70%);
			transform: translate(-50%, -50%);
			filter: blur(50px);
			pointer-events: none;
		}

		.cta-content {
			position: relative;
			z-index: 2;
			max-width: 44rem;
			margin: 0 auto;
		}

		.cta-kicker {
			font-size: 0.78rem;
			font-weight: 800;
			letter-spacing: 0.12em;
			color: #1ed760;
			display: block;
			margin-bottom: 0.8rem;
		}

		h2 {
			font-size: clamp(2rem, 4vw, 3rem);
			font-weight: 850;
			letter-spacing: -0.03em;
			margin: 0 0 1rem;
			color: #fff;
		}

		p {
			font-size: 1.1rem;
			color: rgba(255, 255, 255, 0.7);
			margin: 0 0 2.5rem;
			line-height: 1.6;
		}

		.cta-buttons {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 1rem;
			flex-wrap: wrap;

			.cta-btn {
				padding: 0.85rem 1.65rem;
				font-size: 0.95rem;
			}
		}
	}

	/* ─── Footer ─── */
	.foot {
		padding: 3.5rem 2.5rem 2.5rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		margin-top: auto;
		background: rgba(3, 3, 5, 0.4);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		position: relative;
		z-index: 2;
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

	@media (max-width: 768px) {
		.hero {
			padding: 4rem 1.5rem 2.5rem;
		}

		.hero-title {
			font-size: 2.35rem;
		}

		.sub {
			font-size: 0.95rem;
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

		.cta-buttons {
			flex-direction: column;
			width: 100%;

			.cta-btn {
				width: 100%;
				justify-content: center;
				box-sizing: border-box;
			}
		}
	}
</style>
