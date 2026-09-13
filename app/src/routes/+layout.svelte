<script lang="ts">
	import type { Snippet } from "svelte";
	import SpotifySidebar from "$lib/components/SpotifySidebar.svelte";
	import SpotifyTopBar from "$lib/components/SpotifyTopBar.svelte";
	import PlayerBar from "$lib/components/PlayerBar.svelte";
	import AuthModal from "$lib/components/AuthModal.svelte";
	import LyricsModal from "$lib/components/LyricsModal.svelte";
	import EqualizerModal from "$lib/components/EqualizerModal.svelte";
	import OnboardingModal from "$lib/components/OnboardingModal.svelte";
	import InstallPrompt from "$lib/components/InstallPrompt.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { setPlayerAuth } from "$lib/stores/player.svelte";
	import { userPreferences } from "$lib/stores/preferences.svelte";
	import { authModal } from "$lib/stores/auth-modal.svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { base } from "$app/paths";
	import { useSharedSession } from "$lib/session.svelte";
	import { initNativeIntegration } from "$lib/native-integration";
	import { syncNativeRoot } from "$lib/stores/native-back.svelte";
	import { getCachedUser, setCachedUser } from "$lib/auth-token";
	import { offlineStore } from "$lib/services/offline.svelte";
	import { isNativeApp } from "$lib/native";
	import "../global/redesign/main.scss";

	let { children }: { children?: Snippet } = $props();

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);
	let cachedUser = $state<any>(getCachedUser());
	let sessionTimedOut = $state(false);

	// Register the app shell service worker for offline support (production
	// web only). Not available in the Capacitor WebView (no serviceWorker API).
	if (
		typeof window !== "undefined" &&
		import.meta.env.PROD &&
		"serviceWorker" in navigator &&
		!(window as Window & { Capacitor?: unknown }).Capacitor
	) {
		navigator.serviceWorker
			.register(`${base}/service-worker.js`)
			.then((reg) => {
				reg.update().catch(() => {});
			})
			.catch(() => {});
	}

	if (typeof window !== "undefined") {
		initNativeIntegration({
			statusBar: {
				enabled: true,
				lightIcons: true,
				backgroundColor: "#000000",
			},
		});
	}

	const unsub = sessionAtom.subscribe((value: any) => {
		sessionData = value;
		if (value?.data?.user) {
			cachedUser = value.data.user;
			setCachedUser(value.data.user);
		}
		const effectiveUser = value?.data?.user ?? cachedUser;
		const isAuthed = Boolean(effectiveUser);
		setPlayerAuth(isAuthed);
		if (isAuthed) {
			likedStore.init();
		}
	});

	$effect(() => {
		if (typeof window === "undefined") return;
		const handler = (e: any) => {
			if (e.detail?.user) {
				cachedUser = e.detail.user;
			} else if (e.detail?.user === null) {
				cachedUser = null;
			}
		};
		window.addEventListener("mezzo:auth-changed", handler);
		return () => {
			window.removeEventListener("mezzo:auth-changed", handler);
			unsub();
		};
	});

	// Fail-safe: never leave users stuck on the "Verifying session..." screen.
	// If the session request hangs or is offline, fall back to cached session immediately.
	$effect(() => {
		if (typeof window === "undefined" || sessionTimedOut) return;
		const delay = (typeof navigator !== "undefined" && !navigator.onLine) || cachedUser ? 300 : 4000;
		const t = setTimeout(() => {
			sessionTimedOut = true;
			sessionData = sessionData ?? { data: cachedUser ? { user: cachedUser } : null, isPending: false };
		}, delay);
		return () => clearTimeout(t);
	});

	const isSessionLoading = $derived(
		!sessionTimedOut &&
		(sessionData === undefined || sessionData.isPending) &&
		!cachedUser &&
		!getCachedUser() &&
		(typeof navigator === "undefined" || navigator.onLine),
	);
	const user = $derived(sessionData?.data?.user ?? cachedUser ?? getCachedUser());
	const hasOfflineTracks = $derived(offlineStore.downloadedTracks.length > 0);
	const isLoggedIn = $derived(user != null || (typeof navigator !== "undefined" && !navigator.onLine && hasOfflineTracks));

	const pathname = $derived($page.url.pathname);

	$effect(() => {
		if (typeof window === "undefined") return;
		syncNativeRoot(pathname);
	});
	const isAuthPage = $derived(pathname === "/login" || pathname.startsWith("/login/") || pathname === "/signup");
	const isLandingPage = $derived(pathname === "/landing" || pathname.startsWith("/landing/") || pathname === "/download" || pathname.startsWith("/download/"));

	// OAuth completion routes (/oauth/*) finish the social sign-in themselves
	// (getSession -> persist token). Never bounce them to /login first.
	const isOAuthPage = $derived(pathname.startsWith("/oauth/"));

	// Require account login or sign up to use Mezzo protected pages.
	// On native Android app, redirect to /login. On web, introduce users via /landing.
	$effect(() => {
		if (typeof window !== "undefined" && !isSessionLoading) {
			if (!isLoggedIn && !isAuthPage && !isOAuthPage && !isLandingPage) {
				if (!navigator.onLine && (user != null || hasOfflineTracks)) {
					return;
				}
				if (isNativeApp()) {
					goto("/login");
				} else {
					goto("/landing");
				}
			}
		}
	});
</script>

{#if isAuthPage || isLandingPage}
	{#if children}
		{@render children()}
	{/if}
{:else}
	<div class="spotify-shell">
		<div class="spotify-app-body">
			<SpotifySidebar />
			<div class="spotify-main-panel">
				<SpotifyTopBar />
				<main class="spotify-canvas-content" id="main-content-scroll">
					{#if children}
						{@render children()}
					{/if}
				</main>
			</div>
		</div>

		<!-- Audio PlayerBar is mounted so streaming audio playback works seamlessly for logged-in users (hidden while onboarding is active) -->
		{#if !userPreferences.showOnboarding}
			<PlayerBar />
		{/if}

		<nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
			<a href="/" class="mobile-nav-item" class:active={pathname === "/"}>
				<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="currentColor">
					<path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5V7.577l-7.5-4.33z" />
				</svg>
				<span>Home</span>
			</a>
			<a href="/search" class="mobile-nav-item" class:active={pathname.startsWith("/search")}>
				<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="none" stroke="currentColor" stroke-width="2.5">
					<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
				</svg>
				<span>Search</span>
			</a>
			<a href="/playlists" class="mobile-nav-item" class:active={pathname.startsWith("/playlists")}>
				<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
					<line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
				<span>Playlists</span>
			</a>
			<a href="/library" class="mobile-nav-item" class:active={pathname.startsWith("/library")}>
				<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
					<line x1="12" y1="6" x2="16" y2="6" /><line x1="12" y1="10" x2="16" y2="10" />
				</svg>
				<span>Library</span>
			</a>
		</nav>
	</div>
{/if}

{#if !isLandingPage && !isAuthPage}
	<InstallPrompt />
	<AuthModal bind:open={authModal.isOpen} />
	<LyricsModal />
	<EqualizerModal />
	<OnboardingModal
		open={userPreferences.showOnboarding}
		onclose={() => userPreferences.closeOnboarding()}
		oncompleted={() => userPreferences.closeOnboarding()}
	/>
{/if}

<style lang="scss">
	:global(body) {
		background-color: #000000 !important;
		color: #ffffff;
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	.spotify-shell {
		position: fixed;
		inset: 0;
		height: 100vh;
		height: 100dvh;
		width: 100vw;
		background: #000000;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.spotify-app-body {
		display: flex;
		flex: 1;
		min-height: 0;
		padding: 0.5rem 0.5rem 0;
		gap: 0.5rem;
		overflow: hidden;

		@media screen and (max-width: 1024px) {
			padding: 0;
		}
	}

	.spotify-main-panel {
		flex: 1;
		min-width: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #121212;
		border-radius: 0.55rem;
		overflow: hidden;
		position: relative;

		@media screen and (max-width: 1024px) {
			border-radius: 0;
			padding-top: env(safe-area-inset-top);
		}
	}

	.spotify-canvas-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch !important;
		touch-action: pan-y !important;
		overscroll-behavior-y: contain !important;
		transform: none !important;
		scroll-behavior: smooth;
		padding: 1.25rem 1.75rem 5rem;
		max-width: 100% !important;

		&::-webkit-scrollbar {
			width: 0.75rem;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.2);
			border-radius: 9999px;
			border: 2px solid transparent;
			background-clip: content-box;

			&:hover {
				background-color: rgba(255, 255, 255, 0.4);
			}
		}

		@media screen and (max-width: 1024px) {
			padding: 0.75rem 0.75rem calc(8.5rem + env(safe-area-inset-bottom)) !important;
			-webkit-overflow-scrolling: touch !important;
			touch-action: pan-y !important;
			scrollbar-width: none !important;
			-ms-overflow-style: none !important;

			&::-webkit-scrollbar {
				display: none !important;
				width: 0 !important;
				height: 0 !important;
			}
		}
	}

	.mobile-bottom-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(3.1rem + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(10, 10, 10, 0.75) 40%, rgba(0, 0, 0, 0.92) 100%);
		backdrop-filter: blur(24px) saturate(180%);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		z-index: 2200;
		align-items: center;
		justify-content: space-around;
		padding-left: 0.5rem;
		padding-right: 0.5rem;

		@media screen and (max-width: 1024px) {
			display: flex;
		}

		.mobile-nav-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.15rem;
			color: #a7a7a7;
			text-decoration: none;
			font-size: 0.65rem;
			font-weight: 600;
			transition: color 150ms ease;
			padding: 0.3rem 0.75rem;

			svg {
				width: 1.15rem;
				height: 1.15rem;
			}

			&:hover,
			&.active {
				color: #ffffff;
			}

			&.active svg {
				color: #1ed760;
			}
		}
	}
</style>
