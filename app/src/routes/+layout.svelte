<script lang="ts">
	import type { Snippet } from "svelte";
	import SpotifySidebar from "$lib/components/SpotifySidebar.svelte";
	import SpotifyTopBar from "$lib/components/SpotifyTopBar.svelte";
	import PlayerBar from "$lib/components/PlayerBar.svelte";
	import AuthModal from "$lib/components/AuthModal.svelte";
	import LyricsModal from "$lib/components/LyricsModal.svelte";
	import EqualizerModal from "$lib/components/EqualizerModal.svelte";
	import OnboardingModal from "$lib/components/OnboardingModal.svelte";
	import LandingPage from "$lib/components/LandingPage.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { setPlayerAuth } from "$lib/stores/player.svelte";
	import { userPreferences } from "$lib/stores/preferences.svelte";
	import { authModal } from "$lib/stores/auth-modal.svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { useSharedSession } from "$lib/session.svelte";
	import "../global/redesign/main.scss";

	let { children }: { children?: Snippet } = $props();

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);
	let sessionTimedOut = $state(false);

	// Auto-unregister old service workers that no longer exist on the server
	if (typeof window !== "undefined") {
		navigator.serviceWorker.getRegistrations().then((registrations) => {
			for (const reg of registrations) {
				reg.unregister().catch(() => {});
			}
		}).catch(() => {});
		navigator.serviceWorker.ready.then((registration) => {
			registration.unregister().catch(() => {});
		}).catch(() => {});
	}

	const unsub = sessionAtom.subscribe((value: any) => {
		sessionData = value;
		const isAuthed = Boolean(value?.data?.user);
		setPlayerAuth(isAuthed);
		if (isAuthed) {
			likedStore.init();
		}
	});

	$effect(() => {
		return () => { unsub(); };
	});

	// Fail-safe: never leave users stuck on the "Verifying session..." screen.
	// If the session request hangs (e.g. a stale profile with a broken stored
	// state), treat it as logged out after a short grace period.
	$effect(() => {
		if (typeof window === "undefined" || sessionTimedOut) return;
		const t = setTimeout(() => {
			sessionTimedOut = true;
			sessionData = sessionData ?? { data: null, isPending: false };
		}, 5000);
		return () => clearTimeout(t);
	});

	const isSessionLoading = $derived(
		!sessionTimedOut && (sessionData === undefined || sessionData.isPending),
	);
	const user = $derived(sessionData?.data?.user ?? null);
	const isLoggedIn = $derived(user != null);

	const pathname = $derived($page.url.pathname);
	const isAuthPage = $derived(pathname === "/login" || pathname === "/signup");
	const showLanding = $derived(pathname === "/" && !isLoggedIn);

	// Require account login or sign up to use Mezzo protected pages
	$effect(() => {
		if (typeof window !== "undefined" && !isSessionLoading) {
			if (!isLoggedIn && !isAuthPage && !showLanding) {
				goto("/login");
			}
		}
	});

	$effect(() => {
		if (typeof document !== "undefined") {
			if (showLanding) {
				document.body.style.overflow = "auto";
				document.body.style.position = "static";
			} else {
				document.body.style.overflow = "";
				document.body.style.position = "";
			}
		}
	});
</script>

{#if isAuthPage}
	{#if children}
		{@render children()}
	{/if}
{:else if showLanding}
	<div class="landing-scroll-wrapper">
		<LandingPage />
	</div>
{:else if isSessionLoading || !isLoggedIn}
	<div class="auth-loading-screen">
		<div class="splash-inner">
			<img src="/logo.svg" alt="Mezzo" class="auth-splash-logo" />
			<div class="auth-spinner"></div>
			<p class="auth-splash-text">Verifying session...</p>
		</div>
	</div>
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

<AuthModal bind:open={authModal.isOpen} />
<LyricsModal />
<EqualizerModal />
<OnboardingModal
	open={userPreferences.showOnboarding}
	onclose={() => userPreferences.closeOnboarding()}
	oncompleted={() => userPreferences.closeOnboarding()}
/>

<style lang="scss">
	:global(body) {
		background-color: #000000 !important;
		color: #ffffff;
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	.landing-scroll-wrapper {
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch !important;
		touch-action: pan-y !important;
		background: #000000;
		scroll-behavior: smooth;
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
		}
	}

	.spotify-canvas-content {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch !important;
		touch-action: pan-y !important;
		overscroll-behavior-y: auto !important;
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
		}
	}

	.mobile-bottom-nav {
		display: none;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(3.6rem + env(safe-area-inset-bottom));
		padding-bottom: env(safe-area-inset-bottom);
		background: rgba(18, 18, 18, 0.98);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
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
			gap: 0.2rem;
			color: #a7a7a7;
			text-decoration: none;
			font-size: 0.72rem;
			font-weight: 600;
			transition: color 150ms ease;
			padding: 0.4rem 0.75rem;

			&:hover,
			&.active {
				color: #ffffff;
			}

			&.active svg {
				color: #1ed760;
			}
		}
	}

	.auth-loading-screen {
		position: fixed;
		inset: 0;
		background: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;

		.splash-inner {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1.25rem;
		}

		.auth-splash-logo {
			width: 64px;
			height: 64px;
			animation: pulseLogo 2s infinite ease-in-out;
		}

		.auth-spinner {
			width: 28px;
			height: 28px;
			border: 2.5px solid rgba(255, 255, 255, 0.15);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}

		.auth-splash-text {
			color: #b3b3b3;
			font-size: 0.9rem;
			letter-spacing: 0.02em;
			margin: 0;
		}
	}

	@keyframes pulseLogo {
		0%, 100% {
			transform: scale(1);
			opacity: 0.9;
		}
		50% {
			transform: scale(1.06);
			opacity: 1;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
