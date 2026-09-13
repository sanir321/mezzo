<script lang="ts">
	import {
		playerCurrentTrack,
		playerCurrentTime,
		playerDuration,
		playerShowLyrics,
		playerShowVisualizer,
		playerPlaying,
		playerShuffle,
		playerRepeat,
		playerHasNext,
		playerHasPrevious,
		togglePlay,
		next,
		previous,
		toggleShuffle,
		toggleRepeat,
		seek,
		streamUrl,
		coverUrl,
		formatDuration
	} from "$lib/stores/player.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { equalizerStore } from "$lib/stores/equalizer.svelte";
	import AudioVisualizer from "$lib/components/AudioVisualizer.svelte";
	import ZenVisualizer from "$lib/components/ZenVisualizer.svelte";
	import { fetchLyrics, type LyricsData, type LyricLine } from "$lib/services/lyrics";
	import { shareTrack } from "$lib/utils/share";
	import { offlineStore } from "$lib/services/offline.svelte";
	import { DEFAULT_ALBUM_COVER, handleImageError } from "$lib/utils/image";

	let loading = $state(false);
	let lyricsData = $state<LyricsData | null>(null);
	let activeLineIndex = $state(-1);
	let scrollContainer: HTMLElement | null = $state(null);
	let userScrolled = $state(false);
	let userScrollTimeout: ReturnType<typeof setTimeout> | null = null;
	let seekInput = $state(0);
	let isSeeking = $state(false);
	let hideChrome = $state(false);
	let lyricsVisible = $state(true);
	let isDownloading = $state(false);
	let mobileView = $state<"player" | "lyrics">("player");

	// Swipe-down-to-dismiss gesture state (mobile)
	let dragStartY = $state(0);
	let dragDy = $state(0);
	let isDragging = $state(false);

	const isLiked = $derived(playerCurrentTrack.value ? likedStore.isLiked(playerCurrentTrack.value.id) : false);

	// Load lyrics when current track changes
	$effect(() => {
		const track = playerCurrentTrack.value;
		if (!track) {
			lyricsData = null;
			return;
		}

		let cancelled = false;
		loading = true;

		fetchLyrics(track.title, track.artist || "", track.duration || 180)
			.then((data) => {
				if (!cancelled) {
					lyricsData = data;
					loading = false;
				}
			})
			.catch(() => {
				if (!cancelled) {
					lyricsData = null;
					loading = false;
				}
			});

		return () => {
			cancelled = true;
		};
	});

	// Compute active lyric line based on playback time
	$effect(() => {
		const time = playerCurrentTime.value;
		if (!isSeeking) {
			seekInput = time;
		}
		const lines = lyricsData?.synced || [];
		if (lines.length === 0) {
			activeLineIndex = -1;
			return;
		}

		let idx = -1;
		for (let i = 0; i < lines.length; i++) {
			if (time >= lines[i].time - 0.25) {
				idx = i;
			} else {
				break;
			}
		}
		activeLineIndex = idx;
	});

	let scrollAnim: number | null = null;
	let hasPositionedLyrics = false;
	const FOLLOW_DURATION = 450;

	function scrollToLyricLine(index: number) {
		if (!scrollContainer) return;
		const activeEl = scrollContainer.querySelector(`[data-line-index="${index}"]`) as HTMLElement | null;
		if (!activeEl) return;
		const paneRect = scrollContainer.getBoundingClientRect();
		const elRect = activeEl.getBoundingClientRect();
		const target = Math.max(
			0,
			scrollContainer.scrollTop + elRect.top - paneRect.top - paneRect.height / 2 + elRect.height / 2
		);

		if (!hasPositionedLyrics) {
			scrollContainer.scrollTop = target;
			hasPositionedLyrics = true;
			return;
		}

		if (Math.abs(scrollContainer.scrollTop - target) < 2) return;

		if (scrollAnim !== null) cancelAnimationFrame(scrollAnim);
		const from = scrollContainer.scrollTop;
		const dist = target - from;
		const start = performance.now();
		const step = (now: number) => {
			if (!scrollContainer) return;
			const t = Math.min(1, (now - start) / FOLLOW_DURATION);
			const eased = 1 - Math.pow(1 - t, 3);
			scrollContainer.scrollTop = from + dist * eased;
			if (t < 1) {
				scrollAnim = requestAnimationFrame(step);
			} else {
				scrollAnim = null;
			}
		};
		scrollAnim = requestAnimationFrame(step);
	}

	// Auto-scroll active line into vertical center (Spotify-style continuous follow)
	$effect(() => {
		if (activeLineIndex >= 0 && scrollContainer && !userScrolled) {
			scrollToLyricLine(activeLineIndex);
		}
	});

	// Body scroll lock, reset scroll position, and phone hardware back button / swipe back gesture support
	$effect(() => {
		if (typeof window !== "undefined" && typeof document !== "undefined") {
			if (playerShowLyrics.value) {
				const prevOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
				window.scrollTo(0, 0);

				// Push history state so the phone's back button / swipe gesture minimizes the player instead of navigating away
				try {
					window.history.pushState({ mezzoModal: "player" }, "");
				} catch {}

				const handlePopState = () => {
					playerShowLyrics.value = false;
				};
				window.addEventListener("popstate", handlePopState);

				return () => {
					document.body.style.overflow = prevOverflow;
					window.removeEventListener("popstate", handlePopState);
				};
			}
		}
	});

	function handleLineClick(line: LyricLine) {
		seekInput = line.time;
		seek(line.time);
		userScrolled = false;
	}

	function handleUserWheel() {
		userScrolled = true;
		if (userScrollTimeout) clearTimeout(userScrollTimeout);
		userScrollTimeout = setTimeout(() => {
			userScrolled = false;
		}, 4000);
	}

	function handleSeekInput(e: Event) {
		const val = Number((e.target as HTMLInputElement).value);
		seekInput = val;
	}

	function handleSeekChange() {
		isSeeking = false;
		seek(seekInput);
	}

	function handleSeekStart() {
		isSeeking = true;
	}

	function close() {
		if (typeof window !== "undefined" && window.history.state?.mezzoModal === "player") {
			window.history.back();
		} else {
			playerShowLyrics.value = false;
		}
	}

	function toggleLike() {
		if (playerCurrentTrack.value) {
			likedStore.toggle(playerCurrentTrack.value);
		}
	}

	let shareToastVisible = $state(false);
	let shareToastTimer: ReturnType<typeof setTimeout> | null = null;

	async function handleShare() {
		const track = playerCurrentTrack.value;
		if (!track) return;
		const res = await shareTrack(track);
		if (res.shared) {
			shareToastVisible = true;
			if (shareToastTimer) clearTimeout(shareToastTimer);
			shareToastTimer = setTimeout(() => {
				shareToastVisible = false;
			}, 2500);
		}
	}

	async function handleDownload() {
		const track = playerCurrentTrack.value;
		if (!track) return;
		const targetUrl = track.stream_url || streamUrl(track);
		if (!targetUrl) return;
		isDownloading = true;
		try {
			// Save offline into CacheStorage
			await offlineStore.downloadTrack(track).catch(() => {});

			// Also trigger browser file download
			const res = await fetch(targetUrl);
			if (!res.ok) throw new Error("Blob fetch failed");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
		} catch {
			const a = document.createElement("a");
			a.href = targetUrl;
			a.target = "_blank";
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			isDownloading = false;
		}
	}

	let zenToastVisible = $state(false);
	let zenToastTimeout: ReturnType<typeof setTimeout> | null = null;
	let mouseMoveTimer: ReturnType<typeof setTimeout> | null = null;
	let showZenControlsOnHover = $state(false);

	function toggleZenMode(forced?: boolean) {
		const nextState = typeof forced === "boolean" ? forced : !hideChrome;
		hideChrome = nextState;
		if (hideChrome) {
			zenToastVisible = true;
			if (zenToastTimeout) clearTimeout(zenToastTimeout);
			zenToastTimeout = setTimeout(() => {
				zenToastVisible = false;
			}, 3200);
		} else {
			zenToastVisible = false;
			showZenControlsOnHover = false;
		}
	}

	function handleMouseMove() {
		if (!hideChrome) return;
		showZenControlsOnHover = true;
		if (mouseMoveTimer) clearTimeout(mouseMoveTimer);
		mouseMoveTimer = setTimeout(() => {
			showZenControlsOnHover = false;
		}, 3000);
	}

	function handleOverlayClick(e: MouseEvent) {
		if (hideChrome) {
			toggleZenMode(false);
		}
	}

	// iOS-style swipe-down-to-dismiss (mobile)
	function handleSwipeStart(e: TouchEvent) {
		if (hideChrome) return;
		if (e.touches.length !== 1) return;
		const target = e.target as HTMLElement | null;
		if (!target) return;
		// Never start a dismiss drag on interactive controls
		if (target.closest("button, input, [role='slider'], .playback-controls-row, .timeline-container, .mobile-segmented-control")) {
			return;
		}

		const lyricsPane = target.closest(".fullscreen-lyrics-pane") as HTMLElement | null;
		if (lyricsPane && lyricsPane.scrollTop > 0) {
			// Only allow pull-to-dismiss from lyrics when already scrolled to the very top
			return;
		}
		dragStartY = e.touches[0].clientY;
		dragDy = 0;
		isDragging = true;
	}

	function handleSwipeMove(e: TouchEvent) {
		if (!isDragging) return;
		const dy = e.touches[0].clientY - dragStartY;
		if (dy <= 0) {
			dragDy = 0;
			return;
		}
		dragDy = dy;
		if (dragDy > 8) e.preventDefault();
	}

	function handleSwipeEnd() {
		if (!isDragging) return;
		const dist = dragDy;
		isDragging = false;
		dragDy = 0;
		if (dist > 90) {
			close();
		}
	}

	const overlayDragStyle = $derived(
		isDragging
			? `transform: translate3d(0, ${dragDy}px, 0); opacity: ${Math.max(0, 1 - dragDy / 480)}; transition: none;`
			: "transform: translate3d(0, 0, 0); opacity: 1; transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.3s ease;"
	);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			if (equalizerStore.isOpen) {
				equalizerStore.close();
				return;
			}
			if (hideChrome) {
				toggleZenMode(false);
				return;
			}
			close();
		} else if (e.key === "z" || e.key === "Z") {
			const target = e.target as HTMLElement;
			if (!["INPUT", "TEXTAREA"].includes(target?.tagName)) {
				toggleZenMode();
			}
		} else if (e.key === "l" || e.key === "L" || e.key === "f" || e.key === "F") {
			const target = e.target as HTMLElement;
			if (!["INPUT", "TEXTAREA"].includes(target?.tagName)) {
				close();
			}
		} else if (e.key === "e" || e.key === "E") {
			const target = e.target as HTMLElement;
			if (!["INPUT", "TEXTAREA"].includes(target?.tagName)) {
				equalizerStore.toggle();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- SVG CD Hole Clip Definition -->
<svg width="0" height="0" style="position: absolute; pointer-events: none;">
	<defs>
		<clipPath id="cd-hole-clip" clipPathUnits="objectBoundingBox">
			<path
				fill-rule="evenodd"
				d="M0,0 H1 V1 H0 Z
				M0.5,0.5
				m-0.07,0
				a0.07,0.07 0 1,0 0.14,0
				a0.07,0.07 0 1,0 -0.14,0 Z"
			></path>
		</clipPath>
	</defs>
</svg>

{#if playerShowLyrics.value}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fullscreen-overlay"
		class:ui-hidden={hideChrome}
		class:zen-revealed={showZenControlsOnHover}
		class:lyrics-hidden={!lyricsVisible}
		style={overlayDragStyle}
		ontouchstart={handleSwipeStart}
		ontouchmove={handleSwipeMove}
		ontouchend={handleSwipeEnd}
		ontouchcancel={handleSwipeEnd}
		onclick={handleOverlayClick}
		onmousemove={handleMouseMove}
	>
		<!-- iOS-style drag handle (mobile) -->
		<div class="swipe-handle mobile-only" aria-hidden="true">
			<span class="swipe-handle-bar"></span>
		</div>

		<!-- Floating Exit Zen Mode Button (Always visible & clickable when in Zen Mode) -->
		{#if hideChrome}
			<button
				class="floating-zen-exit"
				onclick={(e) => {
					e.stopPropagation();
					toggleZenMode(false);
				}}
				title="Exit Zen Mode (Esc or Z)"
				aria-label="Exit Zen Mode"
			>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
					<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
				</svg>
				<span>Exit Zen Mode</span>
				<kbd>Esc</kbd>
			</button>
		{/if}

		{#if zenToastVisible}
			<div class="zen-toast" role="status">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ed760" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<path d="M12 8v4M12 16h.01" />
				</svg>
				<span>Zen Mode active &bull; Click anywhere, move mouse, or press <strong>Esc</strong> to exit</span>
			</div>
		{/if}

		<!-- Ambient Dynamic Blurred Album Backdrop -->
		{#if playerCurrentTrack.value && coverUrl(playerCurrentTrack.value)}
			<div
				class="ambient-backdrop"
				style={`background-image: url('${coverUrl(playerCurrentTrack.value)}')`}
			></div>
		{/if}
		<div class="ambient-gradient-overlay"></div>

		<!-- Real-time Visual Audio Waveform & Spectrum in Zen Mode -->
		<ZenVisualizer active={hideChrome && playerPlaying.value} />

		<!-- Minimalist Track Watermark when in Zen Mode -->
		{#if hideChrome && playerCurrentTrack.value}
			<div class="zen-track-badge">
				<span class="zen-title">{playerCurrentTrack.value.title}</span>
				<span class="zen-dot">•</span>
				<span class="zen-artist">{playerCurrentTrack.value.artist || "Unknown Artist"}</span>
			</div>
		{/if}

		{#if shareToastVisible}
			<div class="zen-toast share-toast" role="status">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ed760" stroke-width="2">
					<polyline points="20 6 9 17 4 12" />
				</svg>
				<span>Track link ready to share!</span>
			</div>
		{/if}

		<!-- Top Navigation Actions Bar -->
		<header class="fullscreen-top-bar">
			<div class="top-bar-left">
				<button class="top-icon-btn close-btn" onclick={close} title="Close (Esc)" aria-label="Close fullscreen">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</button>

				<!-- Mobile Segmented View Toggle -->
				<div class="mobile-segmented-control mobile-only" role="tablist">
					<button
						class="segment-btn"
						class:active={mobileView === "player"}
						onclick={() => (mobileView = "player")}
						role="tab"
						aria-selected={mobileView === "player"}
					>
						Disc
					</button>
					<button
						class="segment-btn"
						class:active={mobileView === "lyrics"}
						onclick={() => (mobileView = "lyrics")}
						role="tab"
						aria-selected={mobileView === "lyrics"}
					>
						Lyrics
					</button>
				</div>

				<button
					class="top-icon-btn desktop-only"
					class:active={lyricsVisible}
					onclick={() => (lyricsVisible = !lyricsVisible)}
					title="Toggle Lyrics Pane"
					aria-label="Toggle Lyrics Pane"
				>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
						<path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
					</svg>
				</button>

				<button
					class="top-icon-btn desktop-only"
					class:active={playerShowVisualizer.value}
					onclick={() => (playerShowVisualizer.value = !playerShowVisualizer.value)}
					title="Real-time Audio Visualizer"
					aria-label="Real-time Audio Visualizer"
				>
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4" stroke-linecap="round" />
					</svg>
				</button>

				<button
					class="top-icon-btn"
					class:active={equalizerStore.isOpen || (equalizerStore.enabled && equalizerStore.currentPreset !== "Flat")}
					onclick={(e) => {
						e.stopPropagation();
						equalizerStore.toggle();
					}}
					title="Audio Equalizer (E)"
					aria-label="Audio Equalizer"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
						<line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
						<line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
						<line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
					</svg>
				</button>

				<button
					class="top-icon-btn"
					class:active={hideChrome}
					onclick={(e) => {
						e.stopPropagation();
						toggleZenMode();
					}}
					title="Toggle UI / Zen Mode (Z)"
					aria-label="Toggle UI / Zen Mode"
				>
					{#if hideChrome}
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{/if}
				</button>
			</div>

			<div class="top-bar-right">
				<!-- Quick Like in Top Bar -->
				<button
					class="top-icon-btn like-top-btn"
					class:liked={isLiked}
					onclick={toggleLike}
					title={isLiked ? "Unlike" : "Like"}
					aria-label={isLiked ? "Unlike" : "Like"}
				>
					{#if isLiked}
						<svg viewBox="0 0 24 24" width="19" height="19" fill="#1ed760">
							<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
						</svg>
					{:else}
						<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
						</svg>
					{/if}
				</button>





				<button
					class="top-icon-btn"
					disabled={!playerCurrentTrack.value}
					onclick={handleShare}
					title="Share Track"
					aria-label="Share Track"
				>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
					</svg>
				</button>

				<button
					class="top-icon-btn"
					disabled={!playerCurrentTrack.value || isDownloading}
					onclick={handleDownload}
					title="Download Track"
					aria-label="Download Track"
				>
					{#if isDownloading}
						<div class="top-spin"></div>
					{:else}
						<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
						</svg>
					{/if}
				</button>
			</div>
		</header>

		<!-- Main Split View -->
		<div class="fullscreen-main-layout" class:mobile-view-lyrics={mobileView === "lyrics"} role="region" aria-label="Track Player and Lyrics">
			<!-- LEFT COLUMN: CD Vinyl Record + Track Info + Controls -->
			<section class="fullscreen-media-column">
				<!-- Spinning Vinyl / Compact Disc -->
				<div
					class="fullscreen-artwork-card cd"
					class:paused={!playerPlaying.value}
					title={playerPlaying.value ? "Playing (Vinyl spinning)" : "Paused"}
				>
					{#if playerCurrentTrack.value}
						<img
							src={coverUrl(playerCurrentTrack.value) || DEFAULT_ALBUM_COVER}
							alt={playerCurrentTrack.value.title}
							class="cd-img cd"
							onerror={handleImageError}
						/>
					{:else}
						<img
							src={DEFAULT_ALBUM_COVER}
							alt="Mezzo Music"
							class="cd-img cd"
						/>
					{/if}
					<div class="cd-sheen"></div>
					<div class="cd-ring cd"></div>
				</div>

				<!-- Track Meta Information -->
				{#if playerCurrentTrack.value}
					<div class="track-info-block">
						<div class="title-row">
							<h1 class="track-title" title={playerCurrentTrack.value.title}>{playerCurrentTrack.value.title}</h1>
						</div>
						<h2 class="track-album" title={playerCurrentTrack.value.album || playerCurrentTrack.value.title}>
							{playerCurrentTrack.value.album || `${playerCurrentTrack.value.title} - Single`}
						</h2>
						<h3 class="track-artist" title={playerCurrentTrack.value.artist || "Unknown Artist"}>
							{playerCurrentTrack.value.artist || "Unknown Artist"}
						</h3>
					</div>
				{/if}

				{#if playerShowVisualizer.value}
					<div class="fullscreen-visualizer-row">
						<AudioVisualizer active={playerShowVisualizer.value && playerPlaying.value} />
					</div>
				{/if}

				<!-- Timeline Progress Bar -->
				<div class="timeline-container">
					<span class="time-stamp">{formatDuration(seekInput)}</span>
					<div class="scrubber-bar-wrap">
						<input
							type="range"
							class="scrubber-slider"
							min="0"
							max={playerDuration.value || 0}
							step="0.1"
							value={seekInput}
							oninput={handleSeekInput}
							onchange={handleSeekChange}
							onmousedown={handleSeekStart}
							onmouseup={handleSeekChange}
							ontouchstart={handleSeekStart}
							ontouchend={handleSeekChange}
							aria-label="Track progress"
							style={`--progress-pct: ${playerDuration.value > 0 ? (seekInput / playerDuration.value) * 100 : 0}%`}
						/>
					</div>
					<span class="time-stamp">{formatDuration(playerDuration.value)}</span>
				</div>

				<!-- Playback Controls Row -->
				<div class="playback-controls-row">
					<!-- Like Button -->
					<button
						class="media-action-btn like-btn"
						class:liked={isLiked}
						onclick={toggleLike}
						title={isLiked ? "Unlike" : "Like"}
						aria-label={isLiked ? "Unlike" : "Like"}
					>
						{#if isLiked}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="#1ed760">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
							</svg>
						{/if}
					</button>

					<!-- Shuffle -->
					<button
						class="media-action-btn"
						class:active={playerShuffle.value}
						onclick={toggleShuffle}
						title="Shuffle"
						aria-label="Shuffle"
					>
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
							<polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
						</svg>
					</button>

					<!-- Previous -->
					<button
						class="media-action-btn"
						disabled={!playerHasPrevious.value}
						onclick={previous}
						title="Previous"
						aria-label="Previous"
					>
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="4" y1="19" x2="4" y2="5" /><polyline points="20 5 10 12 20 19" />
						</svg>
					</button>

					<!-- Play / Pause Circular Button -->
					<button
						class="hero-play-pause-btn"
						onclick={togglePlay}
						title={playerPlaying.value ? "Pause" : "Play"}
						aria-label={playerPlaying.value ? "Pause" : "Play"}
					>
						{#if playerPlaying.value}
							<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
								<rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" style="transform: translateX(2px)">
								<polygon points="6 4 20 12 6 20 6 4" />
							</svg>
						{/if}
					</button>

					<!-- Next -->
					<button
						class="media-action-btn"
						disabled={!playerHasNext.value}
						onclick={next}
						title="Next"
						aria-label="Next"
					>
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="20" y1="5" x2="20" y2="19" /><polyline points="4 5 14 12 4 19" />
						</svg>
					</button>

					<!-- Download / Save Offline button in player -->
					<button
						class="media-action-btn download-btn"
						class:active={playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id)}
						disabled={!playerCurrentTrack.value || isDownloading}
						onclick={handleDownload}
						title={isDownloading ? "Downloading..." : (playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id) ? "Saved Offline" : "Save Offline / Download")}
						aria-label="Download Track"
					>
						{#if isDownloading}
							<div class="top-spin" style="width: 20px; height: 20px; border-width: 2px;"></div>
						{:else if playerCurrentTrack.value && offlineStore.isTrackDownloaded(playerCurrentTrack.value.id)}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1ed760" stroke-width="2.5">
								<path d="M20 6L9 17l-5-5" />
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
							</svg>
						{/if}
					</button>

					<!-- Repeat -->
					<button
						class="media-action-btn"
						class:active={playerRepeat.value !== "off"}
						onclick={toggleRepeat}
						title={`Repeat mode: ${playerRepeat.value}`}
						aria-label={`Repeat: ${playerRepeat.value}`}
					>
						{#if playerRepeat.value === "one"}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
								<text x="12" y="15" font-size="8" font-weight="900" fill="currentColor" text-anchor="middle">1</text>
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
							</svg>
						{/if}
					</button>
				</div>
			</section>

			<!-- RIGHT COLUMN: Synchronized Karaoke Typography Lyrics -->
			<aside
				class="fullscreen-lyrics-pane"
				bind:this={scrollContainer}
				onwheel={handleUserWheel}
				ontouchmove={handleUserWheel}
			>
				{#if loading}
					<div class="lyrics-loading-wrap">
						<div class="lyrics-spinner"></div>
						<p>Loading karaoke synced lyrics...</p>
					</div>
				{:else if lyricsData && lyricsData.synced.length > 0}
					<div class="lyrics-stream">
						{#each lyricsData.synced as line, i (i)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="karaoke-line"
								class:active={i === activeLineIndex}
								class:past={i < activeLineIndex}
								data-line-index={i}
								onclick={() => handleLineClick(line)}
							>
								{line.text}
							</div>
						{/each}
					</div>
				{:else if lyricsData && lyricsData.plain}
					<div class="plain-lyrics-stream">
						{#each lyricsData.plain.split("\n") as pLine}
							<p class="plain-row">{pLine || " "}</p>
						{/each}
					</div>
				{:else if lyricsData && lyricsData.instrumental}
					<div class="lyrics-empty-wrap">
						<div class="empty-icon">
							<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
							</svg>
						</div>
						<h2>Instrumental</h2>
						<p>This track doesn't have lyrics.</p>
					</div>
				{:else}
					<div class="lyrics-empty-wrap">
						<h2>Looks like we don't have lyrics for this song</h2>
						<p>Enjoy the music!</p>
					</div>
				{/if}

				<!-- Floating mini controller on mobile while reading lyrics -->
				<div class="lyrics-mobile-controls mobile-only">
					<div class="mobile-track-summary">
						<span class="m-title">{playerCurrentTrack.value?.title || "No track"}</span>
						<span class="m-artist">{playerCurrentTrack.value?.artist || "Mezzo"}</span>
					</div>
					<div class="mobile-track-btns">
						<button class="m-btn" onclick={previous} aria-label="Previous">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
								<polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2" />
							</svg>
						</button>
						<button class="m-btn play" onclick={togglePlay} aria-label={playerPlaying.value ? "Pause" : "Play"}>
							{#if playerPlaying.value}
								<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
									<rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							{/if}
						</button>
						<button class="m-btn" onclick={next} aria-label="Next">
							<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
								<polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" />
							</svg>
						</button>
					</div>
				</div>
			</aside>
		</div>
	</div>
{/if}

<style lang="scss">
	.fullscreen-overlay {
		position: fixed;
		inset: 0;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		z-index: 99999;
		background: radial-gradient(ellipse 100% 60% at 50% 0%, #1a1a30 0%, #0b0d18 35%, #080a0f 100%);
		color: #ffffff;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		user-select: none;
		animation: fadeIn 0.2s ease;

		&.ui-hidden {
			.fullscreen-top-bar,
			.playback-controls-row,
			.timeline-container,
			.track-info-block {
				opacity: 0;
				pointer-events: none;
				transition: opacity 0.4s ease;
			}

			&.zen-revealed {
				.fullscreen-top-bar {
					opacity: 1;
					pointer-events: auto;
				}
			}
		}

		&.lyrics-hidden {
			.fullscreen-main-layout {
				grid-template-columns: 1fr;
			}
			.fullscreen-lyrics-pane {
				display: none;
			}
			.fullscreen-media-column {
				margin: 0 auto;
			}
		}
	}

	.floating-zen-exit {
		position: fixed;
		top: 1.25rem;
		right: 1.5rem;
		z-index: 10001;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(18, 22, 32, 0.88);
		border: 1px solid rgba(255, 255, 255, 0.22);
		color: #ffffff;
		padding: 0.55rem 1.15rem;
		border-radius: 9999px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.65), 0 0 15px rgba(30, 215, 96, 0.2);
		transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: auto !important;
		animation: slideDown 240ms cubic-bezier(0.16, 1, 0.3, 1);

		svg {
			color: #1ed760;
			flex-shrink: 0;
		}

		kbd {
			background: rgba(255, 255, 255, 0.15);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 4px;
			padding: 0.1rem 0.4rem;
			font-size: 0.72rem;
			font-family: inherit;
			color: rgba(255, 255, 255, 0.9);
		}

		&:hover {
			background: #1ed760;
			color: #000000;
			border-color: #1ed760;
			transform: translateY(-2px) scale(1.03);
			box-shadow: 0 10px 30px rgba(30, 215, 96, 0.45);

			svg {
				color: #000000;
			}

			kbd {
				background: rgba(0, 0, 0, 0.2);
				border-color: rgba(0, 0, 0, 0.3);
				color: #000000;
			}
		}
	}

	.zen-toast {
		position: fixed;
		bottom: 2.25rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10001;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: rgba(15, 18, 26, 0.92);
		border: 1px solid rgba(255, 255, 255, 0.18);
		color: #ffffff;
		padding: 0.7rem 1.4rem;
		border-radius: 9999px;
		font-size: 0.82rem;
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-shadow: 0 10px 35px rgba(0, 0, 0, 0.7);
		animation: toastIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
		pointer-events: none;
		white-space: nowrap;

		strong {
			color: #1ed760;
		}

		&.share-toast {
			border-color: rgba(30, 215, 96, 0.35);
			color: #86efac;
		}
	}

	.zen-track-badge {
		position: fixed;
		bottom: 1.75rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 10000;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(10, 12, 18, 0.75);
		border: 1px solid rgba(255, 255, 255, 0.12);
		padding: 0.55rem 1.25rem;
		border-radius: 9999px;
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		font-size: 0.85rem;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
		animation: fadeIn 400ms ease;
		pointer-events: none;
		max-width: 90vw;

		.zen-title {
			color: #ffffff;
			font-weight: 600;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.zen-dot {
			color: rgba(255, 255, 255, 0.35);
		}

		.zen-artist {
			color: #1ed760;
			font-weight: 500;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes toastIn {
		from {
			opacity: 0;
			transform: translate(-50%, 12px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.ambient-backdrop {
		position: absolute;
		inset: -20%;
		background-size: cover;
		background-position: center;
		filter: blur(64px) brightness(0.42) saturate(2.2);
		opacity: 0.85;
		pointer-events: none;
		z-index: 0;
		transform: scale(1.08);
		animation: pulseGlow 9s ease-in-out infinite alternate;
	}

	@keyframes pulseGlow {
		0% { transform: scale(1.05) rotate(0deg); opacity: 0.75; }
		50% { transform: scale(1.12) rotate(1deg); opacity: 0.95; }
		100% { transform: scale(1.06) rotate(-1deg); opacity: 0.8; }
	}

	.ambient-gradient-overlay {
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 20% 25%, rgba(30, 215, 96, 0.22), transparent 50%),
			radial-gradient(circle at 80% 75%, rgba(99, 102, 241, 0.22), transparent 55%),
			radial-gradient(circle at 50% 10%, rgba(236, 72, 153, 0.16), transparent 45%),
			linear-gradient(180deg, rgba(11, 13, 17, 0.25) 0%, rgba(11, 13, 17, 0.8) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.mobile-only {
		display: none !important;
	}

	/* iOS-style drag handle for swipe-down dismiss (mobile) */
	.swipe-handle {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 0.55rem);
		left: 50%;
		transform: translateX(-50%);
		z-index: 11;
		display: flex;
		justify-content: center;
		pointer-events: none;

		.swipe-handle-bar {
			width: 2.75rem;
			height: 5px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.28);
		}
	}

	/* Top Navigation Bar */
	.fullscreen-top-bar {
		position: relative;
		z-index: 10;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 2.25rem 0.5rem;
		transition: opacity 0.4s ease;

		.top-bar-left,
		.top-bar-right {
			display: flex;
			align-items: center;
			gap: 0.65rem;
		}

		.top-icon-btn {
			background: rgba(0, 0, 0, 0.4);
			border: 1px solid rgba(255, 255, 255, 0.08);
			color: rgba(255, 255, 255, 0.75);
			width: 42px;
			height: 42px;
			border-radius: 50%;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s ease;
			backdrop-filter: blur(12px);

			&:hover {
				background: rgba(255, 255, 255, 0.15);
				color: #ffffff;
				transform: scale(1.05);
			}

			&.active {
				background: rgba(255, 255, 255, 0.22);
				color: #ffffff;
				border-color: rgba(255, 255, 255, 0.25);
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}

		.mobile-segmented-control {
			background: rgba(0, 0, 0, 0.45);
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 11px;
			padding: 3px;
			gap: 3px;
			backdrop-filter: blur(12px);
			display: flex;
			align-items: center;

			.segment-btn {
				appearance: none;
				background: transparent;
				border: none;
				color: rgba(255, 255, 255, 0.65);
				padding: 0.42rem 1rem;
				min-width: 4.5rem;
				border-radius: 8px;
				font-size: 0.8rem;
				font-weight: 600;
				line-height: 1;
				white-space: nowrap;
				cursor: pointer;
				transition: all 0.2s ease;

				&.active {
					background: rgba(255, 255, 255, 0.2);
					color: #ffffff;
				}

				&:active {
					transform: scale(0.96);
				}
			}
		}

		@media screen and (max-width: 1024px) {
			padding: max(0.85rem, calc(env(safe-area-inset-top, 0px) + 0.65rem)) 1rem 0.65rem;
			.desktop-only {
				display: none !important;
			}
			.mobile-only {
				display: flex !important;
			}
			.top-bar-left, .top-bar-right {
				gap: 0.5rem;
			}
			.top-icon-btn {
				width: 44px;
				height: 44px;
				min-width: 44px;
				min-height: 44px;
			}
		}
	}

	/* Main Split Layout */
	.fullscreen-main-layout {
		position: relative;
		z-index: 5;
		flex: 1;
		display: grid;
		grid-template-columns: minmax(320px, 440px) 1fr;
		gap: 3rem;
		padding: 0 2.5rem 1.25rem;
		min-height: 0;
		overflow: hidden;
		align-items: center;

		@media screen and (max-width: 1024px) {
			display: block;
			padding: 0;
			overflow: hidden;
			height: calc(100vh - 65px);

			&.mobile-view-lyrics {
				.fullscreen-media-column {
					display: none !important;
				}
				.fullscreen-lyrics-pane {
					display: block !important;
					height: 100% !important;
					padding: 1.25rem 1.25rem 6.5rem !important;
					overflow-y: auto !important;
					-webkit-overflow-scrolling: touch;
				}
			}

			&:not(.mobile-view-lyrics) {
				.fullscreen-lyrics-pane {
					display: none !important;
				}
				.fullscreen-media-column {
					display: flex !important;
					flex-direction: column !important;
					width: 100% !important;
					height: 100% !important;
					justify-content: space-evenly !important;
					align-items: center !important;
					padding: 0.5rem 1.25rem 2rem !important;
					overflow-y: auto !important;
					-webkit-overflow-scrolling: touch;
					text-align: center;
				}
			}
		}
	}

	/* Left Column: Media & Controls */
	.fullscreen-media-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.85rem;
		width: 100%;
		max-width: 440px;
		justify-self: center;

		@media screen and (max-width: 1024px) {
			align-items: center;
			text-align: center;
		}

		.fullscreen-visualizer-row {
			width: 100%;
			display: flex;
			justify-content: center;
			margin: -0.25rem 0 0.25rem;

			:global(.visualizer-container) {
				background: transparent;
				border: none;
				padding: 0;
			}

			:global(.viz-canvas) {
				width: 200px;
				height: 28px;
			}
		}
	}

	/* Vinyl Disc / CD Styling */
	.fullscreen-artwork-card.cd {
		position: relative;
		width: min(320px, 35vh, 75vw);
		aspect-ratio: 1 / 1;
		border-radius: 50% !important;
		border: 2px solid rgba(255, 255, 255, 0.22);
		box-shadow: 0 25px 70px rgba(0, 0, 0, 0.8), 0 0 55px rgba(30, 215, 96, 0.28), 0 0 100px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.12);
		animation: spinDisc 28s linear infinite;
		margin-bottom: 0.25rem;
		flex-shrink: 0;

		@media screen and (max-height: 800px) {
			width: min(250px, 30vh, 65vw);
		}

		&.paused {
			animation-play-state: paused;
		}

		.cd-img {
			width: 100%;
			height: 100%;
			border-radius: 50% !important;
			object-fit: cover;
			clip-path: url('#cd-hole-clip');
			display: block;
		}

		.cd-sheen {
			position: absolute;
			inset: 0;
			border-radius: 50%;
			background: conic-gradient(
				from 45deg,
				rgba(255, 255, 255, 0.12) 0deg,
				transparent 65deg,
				rgba(255, 255, 255, 0.16) 130deg,
				transparent 195deg,
				rgba(255, 255, 255, 0.12) 260deg,
				transparent 325deg,
				rgba(255, 255, 255, 0.16) 360deg
			);
			pointer-events: none;
		}

		.cd-ring.cd {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 23.5%;
			height: 23.5%;
			border-radius: 50%;
			border: 1.5px solid rgba(255, 255, 255, 0.4);
			background: radial-gradient(circle, rgba(0, 0, 0, 0.4) 0%, rgba(255, 255, 255, 0.08) 60%, rgba(0, 0, 0, 0.5) 100%);
			box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 255, 255, 0.15);
			pointer-events: none;

			&::after {
				content: '';
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 60%;
				height: 60%;
				border-radius: 50%;
				border: 1px solid rgba(255, 255, 255, 0.28);
			}
		}
	}

	@keyframes spinDisc {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* Track Information */
	.track-info-block {
		width: 100%;

		.title-row {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex-wrap: wrap;

			@media screen and (max-width: 1024px) {
				justify-content: center;
			}
		}

		.track-title {
			font-size: clamp(1.35rem, 1.8vw, 1.75rem);
			font-weight: 700;
			letter-spacing: -0.02em;
			margin: 0;
			color: #ffffff;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 100%;
		}


		.track-album {
			font-size: 0.95rem;
			font-weight: 500;
			color: rgba(255, 255, 255, 0.72);
			margin: 0.35rem 0 0.2rem 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.track-artist {
			font-size: 0.92rem;
			font-weight: 500;
			color: rgba(255, 255, 255, 0.65);
			margin: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	/* Timeline Scrubber */
	.timeline-container {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		width: 100%;

		.time-stamp {
			font-size: 0.82rem;
			font-weight: 500;
			color: rgba(255, 255, 255, 0.6);
			font-variant-numeric: tabular-nums;
			min-width: 36px;
		}

		.scrubber-bar-wrap {
			flex: 1;
			position: relative;
			display: flex;
			align-items: center;
		}

		.scrubber-slider {
			-webkit-appearance: none;
			appearance: none;
			width: 100%;
			height: 5px;
			background: linear-gradient(
				to right,
				#ffffff 0%,
				#ffffff var(--progress-pct, 0%),
				rgba(255, 255, 255, 0.2) var(--progress-pct, 0%),
				rgba(255, 255, 255, 0.2) 100%
			);
			border-radius: 999px;
			outline: none;
			cursor: pointer;
			transition: height 0.15s ease;

			&:hover {
				height: 7px;
				background: linear-gradient(
					to right,
					#1ed760 0%,
					#1ed760 var(--progress-pct, 0%),
					rgba(255, 255, 255, 0.3) var(--progress-pct, 0%),
					rgba(255, 255, 255, 0.3) 100%
				);

				&::-webkit-slider-thumb {
					opacity: 1;
					transform: scale(1.15);
				}
			}

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				appearance: none;
				width: 14px;
				height: 14px;
				border-radius: 50%;
				background: #ffffff;
				box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
				opacity: 0.9;
				cursor: pointer;
				transition: all 0.15s ease;
			}
		}
	}

	/* Playback Controls Row */
	.playback-controls-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		gap: 0.5rem;

		@media screen and (max-width: 1024px) {
			justify-content: center;
			gap: 1rem;
		}

		.media-action-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.7);
			width: 40px;
			height: 40px;
			border-radius: 50%;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.18s ease;

			&:hover {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.1);
				transform: scale(1.12);
			}

			&.active {
				color: #1ed760;
			}

			&:disabled {
				opacity: 0.3;
				cursor: not-allowed;
				&:hover {
					transform: none;
					background: transparent;
				}
			}
		}

		.hero-play-pause-btn {
			width: 56px;
			height: 56px;
			border-radius: 50%;
			background: #ffffff;
			color: #0b0d11;
			border: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
			transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

			&:hover {
				transform: scale(1.08);
				background: #ffffff;
				box-shadow: 0 6px 25px rgba(255, 255, 255, 0.45);
			}

			&:active {
				transform: scale(0.96);
			}
		}
	}

	/* RIGHT COLUMN: Lyrics Stream */
	.fullscreen-lyrics-pane {
		position: relative;
		height: 100%;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch !important;
		touch-action: pan-y !important;
		overscroll-behavior-y: auto;
		padding: 6rem 1rem 12rem 2.5rem;
		scrollbar-width: none;
		-ms-overflow-style: none;

		&::-webkit-scrollbar {
			display: none;
		}

		@media screen and (max-width: 1024px) {
			padding: 2rem 0.5rem 6rem;
		}
	}

	.lyrics-stream {
		display: flex;
		flex-direction: column;
		gap: 2.2rem;
		max-width: 780px;
	}

	.karaoke-line {
		font-size: clamp(1.6rem, 2.8vw, 2.5rem);
		font-weight: 700;
		line-height: 1.28;
		color: rgba(246, 244, 239, 0.28);
		filter: blur(1.5px);
		cursor: pointer;
		user-select: none;
		transition: all 0.32s cubic-bezier(0.2, 1, 0.3, 1);
		transform-origin: left center;

		&:hover {
			color: rgba(255, 255, 255, 0.85);
			filter: none;
			transform: scale(1.01);
		}

		&.active {
			color: #ffffff;
			filter: none;
			font-size: clamp(2.2rem, 3.8vw, 3.2rem);
			font-weight: 800;
			text-shadow: 0 4px 28px rgba(0, 0, 0, 0.7);
			transform: scale(1.02);
		}

		&.past {
			color: rgba(246, 244, 239, 0.38);
			filter: blur(1px);
		}
	}

	.plain-lyrics-stream {
		max-width: 680px;
		font-size: 1.35rem;
		line-height: 2;
		color: rgba(255, 255, 255, 0.8);

		.plain-row {
			margin: 0.5rem 0;
		}
	}

	.lyrics-empty-wrap {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		height: 100%;
		min-height: 300px;
		color: rgba(255, 255, 255, 0.6);

		h2 {
			font-size: 2.2rem;
			font-weight: 700;
			color: #ffffff;
			margin: 0 0 0.5rem 0;
		}

		p {
			font-size: 1.1rem;
			margin: 0;
		}

		.empty-icon {
			color: rgba(255, 255, 255, 0.4);
			margin-bottom: 1rem;
			display: flex;
			align-items: center;
		}
	}

	.lyrics-loading-wrap {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		height: 100%;
		min-height: 300px;
		color: rgba(255, 255, 255, 0.6);

		p {
			font-size: 1.1rem;
			margin: 0;
		}
	}

	.lyrics-spinner,
	.top-spin {
		width: 2rem;
		height: 2rem;
		border: 3px solid rgba(255, 255, 255, 0.2);
		border-top-color: #1ed760;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin-bottom: 1rem;
	}

	.top-spin {
		width: 1.2rem;
		height: 1.2rem;
		border-width: 2px;
		margin-bottom: 0;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.lyrics-mobile-controls {
		position: fixed;
		bottom: 1.25rem;
		left: 1rem;
		right: 1rem;
		background: rgba(18, 18, 20, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 16px;
		padding: 0.65rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 50;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);

		.mobile-track-summary {
			display: flex;
			flex-direction: column;
			min-width: 0;
			flex: 1;

			.m-title {
				font-size: 0.92rem;
				font-weight: 700;
				color: #ffffff;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.m-artist {
				font-size: 0.78rem;
				color: rgba(255, 255, 255, 0.6);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.mobile-track-btns {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			.m-btn {
				background: transparent;
				border: none;
				color: rgba(255, 255, 255, 0.85);
				width: 36px;
				height: 36px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;

				&.play {
					background: #ffffff;
					color: #0b0d11;
				}
			}
		}
	}
</style>
