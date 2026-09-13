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
	<title>Mezzo — Stream Music Free & Lossless | Android App & Web Player</title>
	<meta
		name="description"
		content="Experience high-fidelity music streaming with zero ads. Download the Mezzo Android APK or launch the instant Web Player."
	/>
	<meta name="theme-color" content="#080808" />
</svelte:head>

<div class="landing-container">
	<!-- Ambient Background Glows -->
	<div class="ambient-glow glow-top" aria-hidden="true"></div>
	<div class="ambient-glow glow-middle" aria-hidden="true"></div>

	<!-- Top Navigation -->
	<header class="landing-header">
		<div class="header-content">
			<a href="/landing" class="brand">
				<img src="/logo.svg" alt="Mezzo Logo" class="brand-logo" />
				<span class="brand-name">Mezzo</span>
			</a>

			<nav class="nav-links">
				<a href="#features" class="nav-link">Features</a>
				<a href="#preview" class="nav-link">Experience</a>
				<a href="#download" class="nav-link">Download APK</a>
			</nav>

			<div class="header-actions">
				{#if isLoggedIn}
					<a href="/" class="btn btn-ghost">
						<span>Open Player</span>
						<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
					</a>
				{:else}
					<a href="/login" class="btn btn-ghost">Log In</a>
					<a href="/signup" class="btn btn-secondary">Sign Up Free</a>
				{/if}
				<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="btn btn-primary btn-sm header-download-btn">
					<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					<span>Download App</span>
				</a>
			</div>
		</div>
	</header>

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-badge">
			<span class="badge-dot"></span>
			<span class="badge-text">Mezzo 1.0 Release • Android APK & Web Player</span>
		</div>

		<h1 class="hero-title">
			Music without limits.<br />
			<span class="gradient-text">Pure sound, zero ads.</span>
		</h1>

		<p class="hero-subtitle">
			Stream millions of tracks in lossless high fidelity. Discover trending charts, sing along with real-time synced lyrics, customize your sound with a 10-band studio equalizer, and listen offline.
		</p>

		<div class="hero-cta-group">
			<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="btn btn-primary btn-lg download-btn">
				<div class="btn-icon-wrap">
					<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="currentColor">
						<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789" />
					</svg>
				</div>
				<div class="btn-text-wrap">
					<span class="btn-caption">Get the Android APK</span>
					<strong class="btn-main">Download App (v1.0)</strong>
				</div>
				<span class="size-tag">3.4 MB</span>
			</a>

			<a href={isLoggedIn ? "/" : "/login"} class="btn btn-secondary btn-lg web-app-btn">
				<div class="btn-icon-wrap browser-icon">
					<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="2" y1="12" x2="22" y2="12" />
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
					</svg>
				</div>
				<div class="btn-text-wrap">
					<span class="btn-caption">No install needed</span>
					<strong class="btn-main">Open Web App</strong>
				</div>
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.5" class="arrow-icon">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</a>
		</div>

		<div class="hero-highlights">
			<span class="highlight-item">
				<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
				100% Free Forever
			</span>
			<span class="highlight-item">
				<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
				Zero Audio Commercials
			</span>
			<span class="highlight-item">
				<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
				Lossless Hi-Res Streaming
			</span>
			<span class="highlight-item">
				<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
				Offline Download Support
			</span>
		</div>
	</section>

	<!-- Interactive App Showcase / Preview Mockup -->
	<section class="preview-section" id="preview">
		<div class="mockup-frame">
			<div class="mockup-top-bar">
				<span class="dot dot-red"></span>
				<span class="dot dot-yellow"></span>
				<span class="dot dot-green"></span>
				<span class="mockup-title">Mezzo Music Player</span>
			</div>
			
			<div class="mockup-body">
				<div class="mockup-sidebar">
					<div class="mockup-brand">
						<img src="/logo.svg" alt="Mezzo" width="22" height="22" />
						<span>Mezzo</span>
					</div>
					<div class="mockup-nav-item active">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5V7.577l-7.5-4.33z"/></svg>
						<span>Home</span>
					</div>
					<div class="mockup-nav-item">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
						<span>Search</span>
					</div>
					<div class="mockup-nav-item">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>
						<span>Library</span>
					</div>
				</div>

				<div class="mockup-main">
					<div class="mockup-hero-banner">
						<span class="mockup-pill">Trending Now</span>
						<h3>Today's Global Top Hits</h3>
						<p>High-res streaming with zero interruptions.</p>
					</div>

					<div class="mockup-track-list">
						<div class="mockup-track-row active-track">
							<div class="track-cover-mini">
								<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
							</div>
							<div class="track-info">
								<strong>Blinding Lights</strong>
								<span>The Weeknd • After Hours</span>
							</div>
							<span class="track-badge">Lossless FLAC</span>
							<div class="sound-wave">
								<span></span><span></span><span></span><span></span>
							</div>
							<span class="track-time">3:20</span>
						</div>

						<div class="mockup-track-row">
							<div class="track-cover-mini track-alt-1">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
							</div>
							<div class="track-info">
								<strong>Starboy</strong>
								<span>The Weeknd, Daft Punk</span>
							</div>
							<span class="track-badge">Hi-Res 24-bit</span>
							<span class="track-time">3:50</span>
						</div>

						<div class="mockup-track-row">
							<div class="track-cover-mini track-alt-2">
								<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
							</div>
							<div class="track-info">
								<strong>Die With A Smile</strong>
								<span>Lady Gaga, Bruno Mars</span>
							</div>
							<span class="track-badge">Lossless</span>
							<span class="track-time">4:11</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Mockup Player Bar -->
			<div class="mockup-player-bar">
				<div class="player-left">
					<div class="now-playing-avatar"></div>
					<div>
						<div class="np-title">Blinding Lights</div>
						<div class="np-artist">The Weeknd</div>
					</div>
				</div>
				<div class="player-center">
					<div class="control-icons">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="11 19 2 12 11 5"/><polyline points="22 19 13 12 22 5"/></svg>
						<button class="mockup-play-circle" aria-label="Play">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
						</button>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 19 22 12 13 5"/><polyline points="2 19 11 12 2 5"/></svg>
					</div>
					<div class="progress-bar-wrap">
						<span>1:42</span>
						<div class="bar-line"><div class="fill" style="width: 52%;"></div></div>
						<span>3:20</span>
					</div>
				</div>
				<div class="player-right">
					<span class="feature-tag">10-Band EQ Active</span>
					<span class="feature-tag">Lyrics Sync</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="features-section" id="features">
		<div class="section-head">
			<span class="section-kicker">Engineered for Music Lovers</span>
			<h2 class="section-title">Everything you want in a modern player</h2>
			<p class="section-desc">No paywalls, no subscriptions, and zero compromises on audio fidelity.</p>
		</div>

		<div class="features-grid">
			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 18v-6a9 9 0 0 1 18 0v6" />
						<path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
					</svg>
				</div>
				<h3>Lossless Audio Fidelity</h3>
				<p>Crystal-clear sound streaming directly from high-bitrate sources. Experience details, punchy dynamics, and wide staging.</p>
			</div>

			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
						<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
					</svg>
				</div>
				<h3>Pure & Ad-Free</h3>
				<p>Enjoy uninterrupted music without loud sponsor interruptions or forced video ads between tracks.</p>
			</div>

			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
						<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789" />
					</svg>
				</div>
				<h3>Native Android App</h3>
				<p>Background playback, notification controls, lock screen media artwork, and snappy responsiveness in a tiny 3.4MB APK.</p>
			</div>

			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
						<path d="M19 10v2a7 7 0 0 1-14 0v-2" />
						<line x1="12" y1="19" x2="12" y2="23" />
						<line x1="8" y1="23" x2="16" y2="23" />
					</svg>
				</div>
				<h3>Synced Real-Time Lyrics</h3>
				<p>Sing along line-by-line with dynamic synced lyrics that highlight automatically as the track progresses.</p>
			</div>

			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
						<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
						<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
						<line x1="1" y1="14" x2="7" y2="14" />
						<line x1="9" y1="8" x2="15" y2="8" />
						<line x1="17" y1="16" x2="23" y2="16" />
					</svg>
				</div>
				<h3>10-Band Studio Equalizer</h3>
				<p>Custom frequency adjustments, Bass Boost, Vocal Enhancer, and Rock/Pop/Acoustic audio presets.</p>
			</div>

			<div class="feature-card">
				<div class="card-icon">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				</div>
				<h3>Offline Downloads</h3>
				<p>Save songs directly to your device storage and listen on flights, commutes, or in low-coverage zones.</p>
			</div>
		</div>
	</section>

	<!-- Dual CTA Section: Download App vs Web App -->
	<section class="download-section" id="download">
		<div class="section-head">
			<span class="section-kicker">Choose Your Platform</span>
			<h2 class="section-title">Install Mezzo or play right in your browser</h2>
			<p class="section-desc">Available as a native Android APK and a progressive web application.</p>
		</div>

		<div class="download-cards-container">
			<!-- Android APK Card -->
			<div class="platform-card primary-card">
				<div class="platform-badge">Recommended for Mobile</div>
				<div class="platform-icon">
					<svg viewBox="0 0 24 24" width="2.4rem" height="2.4rem" fill="currentColor">
						<path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993 0 .5511-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.997-3.4582a.416.416 0 0 0-.152-.5674.416.416 0 0 0-.568.152l-2.0223 3.5022c-1.6373-.748-3.4862-1.1718-5.4673-1.1718-1.981 0-3.8299.4238-5.4672 1.1718L4.1768 5.448a.416.416 0 0 0-.568-.152.416.416 0 0 0-.152.5674l1.997 3.4582C2.6888 10.9861 1 13.7913 1 17.0003h22c0-3.209-1.6888-6.0142-4.1185-7.6789" />
					</svg>
				</div>
				<h3>Mezzo for Android</h3>
				<p class="card-summary">Download the official release APK directly to your phone or tablet.</p>
				
				<div class="apk-specs">
					<div class="spec-row">
						<span>Version:</span>
						<strong>v1.0 (Release)</strong>
					</div>
					<div class="spec-row">
						<span>Package Size:</span>
						<strong>~3.4 MB</strong>
					</div>
					<div class="spec-row">
						<span>Compatibility:</span>
						<strong>Android 7.0 and higher</strong>
					</div>
					<div class="spec-row">
						<span>License:</span>
						<strong>Free / No Subscription</strong>
					</div>
				</div>

				<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk" class="btn btn-primary btn-block">
					<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					<span>Download Mezzo APK</span>
				</a>

				<div class="install-tips">
					<strong>How to install:</strong>
					<ol>
						<li>Tap <em>Download Mezzo APK</em> above.</li>
						<li>Open the downloaded file in your browser or Files app.</li>
						<li>If prompted, enable <em>"Install unknown apps"</em> for your browser and tap <em>Install</em>.</li>
					</ol>
				</div>
			</div>

			<!-- Web Player Card -->
			<div class="platform-card secondary-card">
				<div class="platform-badge web-badge">Instant Access</div>
				<div class="platform-icon web-icon">
					<svg viewBox="0 0 24 24" width="2.4rem" height="2.4rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<line x1="2" y1="12" x2="22" y2="12" />
						<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
					</svg>
				</div>
				<h3>Mezzo Web Player</h3>
				<p class="card-summary">Stream directly on your laptop, Mac, Chromebook, or desktop browser.</p>

				<div class="apk-specs">
					<div class="spec-row">
						<span>Platforms:</span>
						<strong>Windows, macOS, Linux, iOS</strong>
					</div>
					<div class="spec-row">
						<span>Browsers:</span>
						<strong>Chrome, Safari, Firefox, Edge</strong>
					</div>
					<div class="spec-row">
						<span>PWA:</span>
						<strong>Installable Web App</strong>
					</div>
					<div class="spec-row">
						<span>Storage:</span>
						<strong>Zero device storage used</strong>
					</div>
				</div>

				<a href={isLoggedIn ? "/" : "/login"} class="btn btn-secondary btn-block">
					<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="currentColor">
						<polygon points="6 4 20 12 6 20 6 4" />
					</svg>
					<span>{isLoggedIn ? "Go to Web Player" : "Launch Web Player"}</span>
				</a>

				<div class="install-tips web-tips">
					<strong>Features on Web:</strong>
					<ul>
						<li>Full keyboard shortcuts for playback and volume.</li>
						<li>Sync favorites across all your devices with your account.</li>
						<li>Add to Home Screen on iOS/macOS as a standalone app.</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="landing-footer">
		<div class="footer-content">
			<div class="footer-brand-wrap">
				<div class="brand">
					<img src="/logo.svg" alt="Mezzo Logo" class="brand-logo" />
					<span class="brand-name">Mezzo</span>
				</div>
				<p class="footer-tagline">High-fidelity music streaming for everyone, everywhere.</p>
			</div>

			<div class="footer-links-group">
				<div class="link-col">
					<h4>Experience</h4>
					<a href={isLoggedIn ? "/" : "/login"}>Web Player</a>
					<a href="/search">Search Music</a>
					<a href="/playlists">Playlists & Charts</a>
				</div>
				<div class="link-col">
					<h4>Download</h4>
					<a href="/apk/Mezzo-1.0.apk" download="Mezzo-1.0.apk">Android APK (v1.0)</a>
					<a href="#download">Installation Guide</a>
				</div>
				<div class="link-col">
					<h4>Account</h4>
					<a href="/login">Log In</a>
					<a href="/signup">Sign Up Free</a>
					<a href="/login/forgot">Reset Password</a>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<p>© 2026 Mezzo Music. Built for true audiophiles and music lovers.</p>
		</div>
	</footer>
</div>

<style lang="scss">
	:global(body) {
		margin: 0;
		padding: 0;
		background: #080808;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
	}

	.landing-container {
		position: relative;
		background: #080808;
		color: #ffffff;
		min-height: 100vh;
		overflow-x: hidden;
		display: flex;
		flex-direction: column;
	}

	/* Ambient Background Glows */
	.ambient-glow {
		position: absolute;
		border-radius: 50%;
		filter: blur(140px);
		pointer-events: none;
		z-index: 0;
		opacity: 0.35;
	}

	.glow-top {
		top: -10rem;
		left: 50%;
		transform: translateX(-50%);
		width: 50rem;
		height: 30rem;
		background: radial-gradient(circle, #1ed760 0%, rgba(30, 215, 96, 0) 70%);
	}

	.glow-middle {
		top: 55rem;
		right: -15rem;
		width: 40rem;
		height: 40rem;
		background: radial-gradient(circle, #0d5f2c 0%, rgba(13, 95, 44, 0) 70%);
	}

	/* Header */
	.landing-header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: rgba(8, 8, 8, 0.75);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		.header-content {
			max-width: 74rem;
			margin: 0 auto;
			padding: 1rem 2rem;
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 1.5rem;
		}

		.brand {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			text-decoration: none;
			color: #fff;

			.brand-logo {
				width: 2.2rem;
				height: 2.2rem;
			}

			.brand-name {
				font-size: 1.45rem;
				font-weight: 800;
				letter-spacing: -0.03em;
			}
		}

		.nav-links {
			display: flex;
			align-items: center;
			gap: 2rem;

			.nav-link {
				color: rgba(255, 255, 255, 0.7);
				text-decoration: none;
				font-size: 0.95rem;
				font-weight: 600;
				transition: color 140ms ease;

				&:hover {
					color: #1ed760;
				}
			}
		}

		.header-actions {
			display: flex;
			align-items: center;
			gap: 0.75rem;
		}
	}

	/* Common Button Styles */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		text-decoration: none;
		border-radius: 9999px;
		font-weight: 700;
		cursor: pointer;
		transition: all 160ms cubic-bezier(0.2, 0, 0, 1);
		white-space: nowrap;

		&.btn-sm {
			padding: 0.55rem 1.15rem;
			font-size: 0.85rem;
		}

		&.btn-lg {
			padding: 0.95rem 1.85rem;
			font-size: 1.05rem;
		}

		&.btn-block {
			width: 100%;
			padding: 0.95rem 1.5rem;
			font-size: 1.05rem;
			box-sizing: border-box;
		}

		&.btn-primary {
			background: #1ed760;
			color: #000000;
			border: 1px solid #1ed760;
			box-shadow: 0 4px 20px rgba(30, 215, 96, 0.3);

			&:hover {
				background: #22e366;
				transform: translateY(-2px);
				box-shadow: 0 8px 28px rgba(30, 215, 96, 0.45);
			}
		}

		&.btn-secondary {
			background: rgba(255, 255, 255, 0.1);
			color: #ffffff;
			border: 1px solid rgba(255, 255, 255, 0.2);
			backdrop-filter: blur(10px);

			&:hover {
				background: rgba(255, 255, 255, 0.18);
				border-color: rgba(255, 255, 255, 0.35);
				transform: translateY(-2px);
			}
		}

		&.btn-ghost {
			background: transparent;
			color: rgba(255, 255, 255, 0.8);
			border: none;
			padding: 0.55rem 1rem;
			font-size: 0.92rem;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.08);
			}
		}
	}

	/* Hero Section */
	.hero-section {
		position: relative;
		z-index: 1;
		max-width: 62rem;
		margin: 0 auto;
		padding: 5rem 2rem 3.5rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;

		.hero-badge {
			display: inline-flex;
			align-items: center;
			gap: 0.55rem;
			background: rgba(30, 215, 96, 0.12);
			border: 1px solid rgba(30, 215, 96, 0.3);
			padding: 0.35rem 1rem;
			border-radius: 9999px;
			margin-bottom: 2rem;

			.badge-dot {
				width: 0.5rem;
				height: 0.5rem;
				background: #1ed760;
				border-radius: 50%;
				box-shadow: 0 0 10px #1ed760;
			}

			.badge-text {
				font-size: 0.86rem;
				font-weight: 700;
				color: #1ed760;
				letter-spacing: 0.02em;
			}
		}

		.hero-title {
			font-size: clamp(2.5rem, 5.5vw, 4.2rem);
			font-weight: 900;
			line-height: 1.12;
			margin: 0 0 1.5rem;
			letter-spacing: -0.035em;
		}

		.gradient-text {
			background: linear-gradient(135deg, #1ed760 10%, #7ef0a8 100%);
			-webkit-background-clip: text;
			background-clip: text;
			-webkit-text-fill-color: transparent;
		}

		.hero-subtitle {
			font-size: clamp(1.05rem, 2vw, 1.25rem);
			color: rgba(255, 255, 255, 0.7);
			line-height: 1.6;
			max-width: 44rem;
			margin: 0 auto 2.5rem;
		}

		.hero-cta-group {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 1.25rem;
			flex-wrap: wrap;
			margin-bottom: 2.5rem;

			.btn-text-wrap {
				display: flex;
				flex-direction: column;
				text-align: left;
				line-height: 1.2;

				.btn-caption {
					font-size: 0.72rem;
					opacity: 0.8;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.05em;
				}

				.btn-main {
					font-size: 1.05rem;
					font-weight: 800;
				}
			}

			.size-tag {
				background: rgba(0, 0, 0, 0.2);
				padding: 0.2rem 0.5rem;
				border-radius: 9999px;
				font-size: 0.75rem;
				font-weight: 700;
				margin-left: 0.25rem;
			}

			.arrow-icon {
				transition: transform 140ms ease;
			}

			.web-app-btn:hover .arrow-icon {
				transform: translateX(4px);
			}
		}

		.hero-highlights {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 1.5rem;
			flex-wrap: wrap;

			.highlight-item {
				display: inline-flex;
				align-items: center;
				gap: 0.45rem;
				font-size: 0.88rem;
				font-weight: 600;
				color: rgba(255, 255, 255, 0.65);

				svg {
					color: #1ed760;
				}
			}
		}
	}

	/* App Preview Mockup */
	.preview-section {
		position: relative;
		z-index: 1;
		max-width: 68rem;
		margin: 0 auto 6rem;
		padding: 0 2rem;

		.mockup-frame {
			background: #121212;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 1.25rem;
			overflow: hidden;
			box-shadow: 0 30px 90px rgba(0, 0, 0, 0.95), 0 0 40px rgba(30, 215, 96, 0.1);
		}

		.mockup-top-bar {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.85rem 1.25rem;
			background: #181818;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);

			.dot {
				width: 0.7rem;
				height: 0.7rem;
				border-radius: 50%;
			}
			.dot-red { background: #ff5f56; }
			.dot-yellow { background: #ffbd2e; }
			.dot-green { background: #27c93f; }

			.mockup-title {
				font-size: 0.78rem;
				color: rgba(255, 255, 255, 0.45);
				margin-left: 0.5rem;
				font-weight: 600;
			}
		}

		.mockup-body {
			display: grid;
			grid-template-columns: 14rem 1fr;
			min-height: 22rem;
			background: #0e0e0e;
		}

		.mockup-sidebar {
			background: #080808;
			border-right: 1px solid rgba(255, 255, 255, 0.07);
			padding: 1.25rem 1rem;
			display: flex;
			flex-direction: column;
			gap: 0.4rem;

			.mockup-brand {
				display: flex;
				align-items: center;
				gap: 0.6rem;
				font-weight: 800;
				font-size: 1.05rem;
				padding: 0.25rem 0.5rem 1rem;
			}

			.mockup-nav-item {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				padding: 0.6rem 0.75rem;
				border-radius: 0.5rem;
				color: rgba(255, 255, 255, 0.6);
				font-size: 0.88rem;
				font-weight: 600;

				&.active {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.08);
				}
			}
		}

		.mockup-main {
			padding: 1.5rem;
			display: flex;
			flex-direction: column;
			gap: 1.25rem;
		}

		.mockup-hero-banner {
			background: linear-gradient(135deg, #173b22 0%, #0d1e13 70%);
			border-radius: 0.9rem;
			padding: 1.5rem;
			border: 1px solid rgba(30, 215, 96, 0.2);

			.mockup-pill {
				font-size: 0.72rem;
				font-weight: 700;
				color: #1ed760;
				text-transform: uppercase;
				letter-spacing: 0.06em;
			}

			h3 {
				font-size: 1.5rem;
				font-weight: 800;
				margin: 0.35rem 0 0.25rem;
			}

			p {
				color: rgba(255, 255, 255, 0.65);
				font-size: 0.88rem;
				margin: 0;
			}
		}

		.mockup-track-list {
			display: flex;
			flex-direction: column;
			gap: 0.45rem;
		}

		.mockup-track-row {
			display: flex;
			align-items: center;
			gap: 0.9rem;
			padding: 0.65rem 0.85rem;
			border-radius: 0.65rem;
			background: rgba(255, 255, 255, 0.02);
			border: 1px solid transparent;

			&.active-track {
				background: rgba(30, 215, 96, 0.08);
				border-color: rgba(30, 215, 96, 0.3);
			}

			.track-cover-mini {
				width: 2.4rem;
				height: 2.4rem;
				border-radius: 0.4rem;
				background: #1ed760;
				color: #000;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;

				&.track-alt-1 { background: #6366f1; color: #fff; }
				&.track-alt-2 { background: #ec4899; color: #fff; }
			}

			.track-info {
				flex: 1;
				display: flex;
				flex-direction: column;

				strong {
					font-size: 0.92rem;
					color: #fff;
				}

				span {
					font-size: 0.78rem;
					color: rgba(255, 255, 255, 0.5);
				}
			}

			.track-badge {
				font-size: 0.7rem;
				font-weight: 700;
				color: #1ed760;
				background: rgba(30, 215, 96, 0.12);
				padding: 0.2rem 0.5rem;
				border-radius: 0.3rem;
			}

			.track-time {
				font-size: 0.82rem;
				color: rgba(255, 255, 255, 0.4);
			}

			.sound-wave {
				display: flex;
				align-items: flex-end;
				gap: 2px;
				height: 14px;

				span {
					width: 3px;
					background: #1ed760;
					border-radius: 2px;
					animation: wave 1.2s infinite ease-in-out;

					&:nth-child(1) { height: 60%; animation-delay: 0.1s; }
					&:nth-child(2) { height: 100%; animation-delay: 0.3s; }
					&:nth-child(3) { height: 40%; animation-delay: 0.2s; }
					&:nth-child(4) { height: 80%; animation-delay: 0.4s; }
				}
			}
		}

		.mockup-player-bar {
			background: #161616;
			border-top: 1px solid rgba(255, 255, 255, 0.08);
			padding: 0.85rem 1.5rem;
			display: flex;
			align-items: center;
			justify-content: space-between;

			.player-left {
				display: flex;
				align-items: center;
				gap: 0.75rem;

				.now-playing-avatar {
					width: 2.6rem;
					height: 2.6rem;
					border-radius: 0.45rem;
					background: linear-gradient(135deg, #1ed760, #14532d);
				}

				.np-title { font-size: 0.88rem; font-weight: 700; }
				.np-artist { font-size: 0.76rem; color: rgba(255, 255, 255, 0.5); }
			}

			.player-center {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 0.4rem;
				flex: 1;
				max-width: 22rem;

				.control-icons {
					display: flex;
					align-items: center;
					gap: 1.25rem;
					color: rgba(255, 255, 255, 0.7);

					.mockup-play-circle {
						width: 2rem;
						height: 2rem;
						border-radius: 50%;
						background: #fff;
						color: #000;
						border: none;
						display: flex;
						align-items: center;
						justify-content: center;
					}
				}

				.progress-bar-wrap {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					width: 100%;
					font-size: 0.72rem;
					color: rgba(255, 255, 255, 0.4);

					.bar-line {
						flex: 1;
						height: 4px;
						background: rgba(255, 255, 255, 0.15);
						border-radius: 2px;
						overflow: hidden;

						.fill {
							height: 100%;
							background: #1ed760;
						}
					}
				}
			}

			.player-right {
				display: flex;
				align-items: center;
				gap: 0.5rem;

				.feature-tag {
					font-size: 0.72rem;
					font-weight: 700;
					color: rgba(255, 255, 255, 0.7);
					background: rgba(255, 255, 255, 0.06);
					border: 1px solid rgba(255, 255, 255, 0.1);
					padding: 0.25rem 0.6rem;
					border-radius: 9999px;
				}
			}
		}
	}

	@keyframes wave {
		0%, 100% { transform: scaleY(0.4); }
		50% { transform: scaleY(1); }
	}

	/* Features Grid Section */
	.features-section {
		position: relative;
		z-index: 1;
		max-width: 74rem;
		margin: 0 auto 6rem;
		padding: 0 2rem;

		.section-head {
			text-align: center;
			max-width: 42rem;
			margin: 0 auto 3.5rem;

			.section-kicker {
				font-size: 0.85rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: #1ed760;
				display: block;
				margin-bottom: 0.5rem;
			}

			.section-title {
				font-size: clamp(2rem, 3.5vw, 2.75rem);
				font-weight: 800;
				margin: 0 0 0.85rem;
				letter-spacing: -0.025em;
			}

			.section-desc {
				color: rgba(255, 255, 255, 0.65);
				font-size: 1.05rem;
				line-height: 1.5;
				margin: 0;
			}
		}

		.features-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(21rem, 1fr));
			gap: 1.5rem;
		}

		.feature-card {
			background: #111111;
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 1.25rem;
			padding: 2rem;
			transition: all 180ms cubic-bezier(0.2, 0, 0, 1);

			&:hover {
				background: #161616;
				border-color: rgba(30, 215, 96, 0.35);
				transform: translateY(-4px);
				box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
			}

			.card-icon {
				width: 3.2rem;
				height: 3.2rem;
				border-radius: 0.85rem;
				background: rgba(30, 215, 96, 0.12);
				color: #1ed760;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 1.25rem;
			}

			h3 {
				font-size: 1.25rem;
				font-weight: 800;
				margin: 0 0 0.6rem;
			}

			p {
				color: rgba(255, 255, 255, 0.65);
				font-size: 0.94rem;
				line-height: 1.55;
				margin: 0;
			}
		}
	}

	/* Platform Download Cards Section */
	.download-section {
		position: relative;
		z-index: 1;
		max-width: 74rem;
		margin: 0 auto 6rem;
		padding: 0 2rem;

		.section-head {
			text-align: center;
			max-width: 42rem;
			margin: 0 auto 3.5rem;

			.section-kicker {
				font-size: 0.85rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: #1ed760;
				display: block;
				margin-bottom: 0.5rem;
			}

			.section-title {
				font-size: clamp(2rem, 3.5vw, 2.75rem);
				font-weight: 800;
				margin: 0 0 0.85rem;
				letter-spacing: -0.025em;
			}

			.section-desc {
				color: rgba(255, 255, 255, 0.65);
				font-size: 1.05rem;
				line-height: 1.5;
				margin: 0;
			}
		}

		.download-cards-container {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
			gap: 2rem;
		}

		.platform-card {
			background: #111111;
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 1.5rem;
			padding: 2.5rem 2rem;
			display: flex;
			flex-direction: column;
			position: relative;
			overflow: hidden;

			&.primary-card {
				border-color: rgba(30, 215, 96, 0.4);
				background: radial-gradient(circle at 50% 0%, #152d1c 0%, #101511 40%, #0d0d0d 100%);
				box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
			}

			.platform-badge {
				position: absolute;
				top: 1.25rem;
				right: 1.25rem;
				background: rgba(30, 215, 96, 0.15);
				border: 1px solid rgba(30, 215, 96, 0.35);
				color: #1ed760;
				font-size: 0.75rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				padding: 0.25rem 0.75rem;
				border-radius: 9999px;

				&.web-badge {
					background: rgba(255, 255, 255, 0.08);
					border-color: rgba(255, 255, 255, 0.2);
					color: rgba(255, 255, 255, 0.8);
				}
			}

			.platform-icon {
				width: 4rem;
				height: 4rem;
				border-radius: 1rem;
				background: rgba(30, 215, 96, 0.15);
				color: #1ed760;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 1.5rem;

				&.web-icon {
					background: rgba(255, 255, 255, 0.08);
					color: #ffffff;
				}
			}

			h3 {
				font-size: 1.65rem;
				font-weight: 800;
				margin: 0 0 0.5rem;
			}

			.card-summary {
				color: rgba(255, 255, 255, 0.65);
				font-size: 0.95rem;
				line-height: 1.5;
				margin: 0 0 1.5rem;
			}

			.apk-specs {
				background: rgba(0, 0, 0, 0.3);
				border: 1px solid rgba(255, 255, 255, 0.06);
				border-radius: 0.85rem;
				padding: 1rem 1.25rem;
				margin-bottom: 2rem;
				display: flex;
				flex-direction: column;
				gap: 0.6rem;

				.spec-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					font-size: 0.88rem;

					span {
						color: rgba(255, 255, 255, 0.55);
					}

					strong {
						color: #ffffff;
					}
				}
			}

			.install-tips {
				margin-top: 1.5rem;
				font-size: 0.82rem;
				color: rgba(255, 255, 255, 0.6);
				line-height: 1.5;

				strong {
					color: rgba(255, 255, 255, 0.85);
					display: block;
					margin-bottom: 0.4rem;
				}

				ol, ul {
					margin: 0;
					padding-left: 1.25rem;
				}

				li {
					margin-bottom: 0.25rem;
				}
			}
		}
	}

	/* Footer */
	.landing-footer {
		background: #050505;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding: 4rem 2rem 2rem;

		.footer-content {
			max-width: 74rem;
			margin: 0 auto;
			display: flex;
			justify-content: space-between;
			gap: 3rem;
			flex-wrap: wrap;
			margin-bottom: 3.5rem;
		}

		.footer-brand-wrap {
			max-width: 20rem;

			.brand {
				display: flex;
				align-items: center;
				gap: 0.75rem;
				text-decoration: none;
				color: #fff;
				margin-bottom: 0.75rem;

				.brand-logo {
					width: 2rem;
					height: 2rem;
				}

				.brand-name {
					font-size: 1.35rem;
					font-weight: 800;
				}
			}

			.footer-tagline {
				color: rgba(255, 255, 255, 0.5);
				font-size: 0.92rem;
				line-height: 1.5;
				margin: 0;
			}
		}

		.footer-links-group {
			display: flex;
			gap: 4rem;
			flex-wrap: wrap;

			.link-col {
				display: flex;
				flex-direction: column;
				gap: 0.6rem;

				h4 {
					font-size: 0.85rem;
					font-weight: 700;
					color: #ffffff;
					text-transform: uppercase;
					letter-spacing: 0.05em;
					margin: 0 0 0.4rem;
				}

				a {
					color: rgba(255, 255, 255, 0.6);
					text-decoration: none;
					font-size: 0.9rem;
					transition: color 130ms;

					&:hover {
						color: #1ed760;
					}
				}
			}
		}

		.footer-bottom {
			max-width: 74rem;
			margin: 0 auto;
			padding-top: 2rem;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			text-align: center;

			p {
				color: rgba(255, 255, 255, 0.4);
				font-size: 0.84rem;
				margin: 0;
			}
		}
	}

	/* Responsive Media Queries */
	@media (max-width: 768px) {
		.landing-header .nav-links {
			display: none;
		}

		.mockup-body {
			grid-template-columns: 1fr !important;

			.mockup-sidebar {
				display: none;
			}
		}

		.mockup-player-bar {
			.player-right {
				display: none !important;
			}
		}

		.hero-section {
			padding: 3rem 1.25rem 2.5rem;
		}

		.preview-section,
		.features-section,
		.download-section {
			padding: 0 1.25rem;
			margin-bottom: 4rem;
		}

		.hero-cta-group {
			flex-direction: column;
			width: 100%;

			.btn {
				width: 100%;
				justify-content: center;
			}
		}

		.footer-links-group {
			gap: 2rem !important;
		}
	}
</style>
