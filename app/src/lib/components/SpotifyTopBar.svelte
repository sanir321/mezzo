<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { signOut, clearAuthToken } from "$lib/auth-client";
	import { useSharedSession } from "$lib/session.svelte";
	import { authModal } from "$lib/stores/auth-modal.svelte";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const user = $derived(sessionData?.data?.user ?? null);
	const isLoggedIn = $derived(user != null);
	const pathname = $derived($page.url.pathname);

	let userMenuOpen = $state(false);
	let searchQuery = $state("");
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let searchInputEl: HTMLInputElement | null = $state(null);

	// Sync with search URL parameter if on search page
	$effect(() => {
		if (typeof document !== "undefined" && document.activeElement === searchInputEl) {
			return;
		}
		if (pathname.startsWith("/search")) {
			const q = $page.url.searchParams.get("q") || "";
			searchQuery = q;
		} else {
			searchQuery = "";
		}
	});

	// Focus search on desktop when navigating to /search
	$effect(() => {
		if (typeof window !== "undefined" && window.innerWidth > 768 && pathname.startsWith("/search") && !searchQuery) {
			searchInputEl?.focus();
		}
	});

	function handleBack() {
		if (typeof window !== "undefined") {
			window.history.back();
		}
	}

	function handleForward() {
		if (typeof window !== "undefined") {
			window.history.forward();
		}
	}

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchQuery = val;
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			if (val.trim()) {
				goto(`/search?q=${encodeURIComponent(val)}`, {
					keepFocus: true,
					noScroll: true,
					replaceState: pathname.startsWith("/search"),
				});
			} else if (pathname.startsWith("/search")) {
				goto(`/search`, { keepFocus: true, noScroll: true, replaceState: true });
			}
		}, 250);
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
			const trimmed = searchQuery.trim();
			if (trimmed) {
				goto(`/search?q=${encodeURIComponent(trimmed)}`, {
					keepFocus: true,
					noScroll: true,
					replaceState: pathname.startsWith("/search"),
				});
			} else if (pathname.startsWith("/search")) {
				goto(`/search`, { keepFocus: true, noScroll: true, replaceState: true });
			}
		}
	}

	function handleClearSearch() {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchQuery = "";
		if (pathname.startsWith("/search")) {
			goto("/search", { keepFocus: true, noScroll: true, replaceState: true });
		}
		searchInputEl?.focus();
	}

	function handleGlobalKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable) {
			return;
		}
		if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
			e.preventDefault();
			if (!pathname.startsWith("/search")) {
				goto("/search");
			}
			setTimeout(() => searchInputEl?.focus(), 50);
		}
	}

	async function handleLogout() {
		userMenuOpen = false;
		try {
			await signOut({
				fetchOptions: {
					onSuccess: () => {
						clearAuthToken();
						if (typeof window !== "undefined") {
							window.location.href = "/";
						}
					}
				}
			});
		} catch {
			if (typeof window !== "undefined") {
				window.location.href = "/";
			}
		}
	}
</script>

<svelte:window onclick={() => (userMenuOpen = false)} onkeydown={handleGlobalKeydown} />

<header class="spotify-topbar">
	<div class="topbar-left">
		<!-- Mobile brand visible only on mobile screens -->
		<div class="mobile-brand">
			<a href="/" class="mobile-brand-link" aria-label="Mezzo Home">
				<img src="/logo.svg" alt="Mezzo" class="mobile-brand-logo" />
				<span class="mobile-brand-text">Mezzo</span>
			</a>
		</div>

		<!-- History arrows with explicit white stroke and icon-btn class -->
		<div class="history-controls">
			<button class="arrow-btn icon-btn" onclick={handleBack} title="Go back" aria-label="Go back">
				<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6" />
				</svg>
			</button>
			<button class="arrow-btn icon-btn" onclick={handleForward} title="Go forward" aria-label="Go forward">
				<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6" />
				</svg>
			</button>
		</div>

		<!-- Central Search Pill with correct non-overlapping padding -->
		<div class="spotify-search-box">
			<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="#b3b3b3" stroke-width="2.5" class="search-icon">
				<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
			</svg>
			<input
				bind:this={searchInputEl}
				type="text"
				inputmode="search"
				placeholder="What do you want to play?"
				value={searchQuery}
				oninput={handleSearchInput}
				onkeydown={handleSearchKeydown}
				class="spotify-search-input"
				autocomplete="off"
				autocapitalize="none"
				spellcheck="false"
			/>
			{#if searchQuery}
				<button class="search-clear-btn icon-btn" onclick={handleClearSearch} title="Clear search" aria-label="Clear search">
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="#b3b3b3" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="topbar-right">
		{#if isLoggedIn}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="user-pill-wrap" onclick={(e) => e.stopPropagation()}>
				<button
					class="user-avatar-btn icon-btn"
					onclick={() => (userMenuOpen = !userMenuOpen)}
					title={user.name || user.email}
					aria-label="User profile menu"
				>
					<div class="user-avatar">
						{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
					</div>
				</button>

				{#if userMenuOpen}
					<div class="user-dropdown-menu">
						<div class="user-dropdown-header">
							<span class="dropdown-name">{user.name || "Music Listener"}</span>
							<span class="dropdown-email">{user.email}</span>
						</div>
						<div class="dropdown-divider"></div>
						<a href="/library" class="dropdown-item" onclick={() => (userMenuOpen = false)}>
							Your Library
						</a>
						<a href="/playlists/liked" class="dropdown-item" onclick={() => (userMenuOpen = false)}>
							Liked Songs
						</a>
						<a href="/settings" class="dropdown-item" onclick={() => (userMenuOpen = false)}>
							Settings & Preferences
						</a>
						<div class="dropdown-divider"></div>
						<button class="dropdown-item logout" onclick={handleLogout}>
							Log out
						</button>
					</div>
				{/if}
			</div>
		{:else}
			<div class="auth-btn-group">
				<button class="btn-signup" onclick={() => authModal.open("signup")}>Sign up</button>
				<button class="btn-login" onclick={() => authModal.open()}>Log in</button>
			</div>
		{/if}
	</div>
</header>

<style lang="scss">
	.spotify-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.5rem;
		background: rgba(18, 18, 18, 0.85);
		backdrop-filter: blur(20px);
		border-radius: 0.55rem 0.55rem 0 0;
		position: sticky;
		top: 0;
		z-index: 50;
		gap: 1rem;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex: 1;
		max-width: 34rem;
	}

	.history-controls {
		display: flex;
		gap: 0.5rem;
		align-items: center;

		.arrow-btn {
			width: 2.1rem !important;
			height: 2.1rem !important;
			min-width: 2.1rem !important;
			min-height: 2.1rem !important;
			border-radius: 50% !important;
			background: #000000 !important;
			border: 1px solid rgba(255, 255, 255, 0.1) !important;
			color: #ffffff !important;
			padding: 0 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			cursor: pointer !important;
			box-shadow: none !important;
			transition: all 150ms ease !important;

			svg {
				width: 1.15rem !important;
				height: 1.15rem !important;
				stroke: #ffffff !important;
				display: block !important;
			}

			&:hover {
				background: #181818 !important;
				border-color: rgba(255, 255, 255, 0.3) !important;
				transform: scale(1.06) !important;
			}
		}
	}

	.spotify-search-box {
		position: relative;
		display: flex;
		align-items: center;
		flex: 1;
		max-width: 28rem;

		.search-icon {
			position: absolute;
			left: 1rem;
			color: #b3b3b3 !important;
			stroke: #b3b3b3 !important;
			pointer-events: none;
			z-index: 3;
			display: block;
		}

		.spotify-search-input {
			width: 100% !important;
			height: 2.85rem !important;
			background: #242424 !important;
			border: 1px solid transparent !important;
			border-radius: 9999px !important;
			padding: 0 2.5rem 0 2.85rem !important;
			color: #ffffff !important;
			font-size: 0.92rem !important;
			outline: none !important;
			box-sizing: border-box !important;
			box-shadow: none !important;
			transition: all 150ms ease !important;

			&:hover {
				background: #2a2a2a !important;
				border-color: rgba(255, 255, 255, 0.2) !important;
			}

			&:focus {
				background: #242424 !important;
				border-color: #ffffff !important;
				box-shadow: 0 0 0 2px #ffffff !important;
			}

			&::placeholder {
				color: #a7a7a7 !important;
				opacity: 1 !important;
			}
		}

		.search-clear-btn {
			position: absolute;
			right: 0.85rem;
			background: transparent !important;
			border: none !important;
			color: #b3b3b3 !important;
			cursor: pointer !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			padding: 0.25rem !important;
			z-index: 3;
			box-shadow: none !important;

			svg {
				stroke: #b3b3b3 !important;
			}

			&:hover svg {
				stroke: #ffffff !important;
			}
		}
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.user-pill-wrap {
		position: relative;
	}

	.user-avatar-btn {
		background: #000000 !important;
		border: none !important;
		border-radius: 50% !important;
		padding: 0.2rem !important;
		cursor: pointer !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		box-shadow: none !important;
		transition: transform 120ms ease !important;

		&:hover {
			transform: scale(1.06) !important;
		}

		.user-avatar {
			width: 2.1rem;
			height: 2.1rem;
			border-radius: 50%;
			background: #535353;
			color: #ffffff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.95rem;
			font-weight: 700;
		}
	}

	.user-dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		background: #282828;
		border-radius: 0.45rem;
		padding: 0.35rem;
		min-width: 14rem;
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		z-index: 200;

		.user-dropdown-header {
			padding: 0.6rem 0.75rem;
			display: flex;
			flex-direction: column;
			gap: 0.15rem;

			.dropdown-name {
				color: #fff;
				font-size: 0.88rem;
				font-weight: 700;
			}

			.dropdown-email {
				color: #b3b3b3;
				font-size: 0.75rem;
			}
		}

		.dropdown-divider {
			height: 1px;
			background: rgba(255, 255, 255, 0.1);
			margin: 0.25rem 0;
		}

		.dropdown-item {
			width: 100% !important;
			min-width: 0 !important;
			height: auto !important;
			white-space: nowrap !important;
			display: flex !important;
			align-items: center !important;
			background: transparent !important;
			border: none !important;
			color: #e2e8f0 !important;
			font-size: 0.88rem !important;
			font-weight: 600 !important;
			text-align: left !important;
			padding: 0.65rem 0.85rem !important;
			border-radius: 0.25rem !important;
			text-decoration: none !important;
			cursor: pointer !important;
			box-shadow: none !important;
			box-sizing: border-box !important;
			transition: background 120ms ease !important;

			&:hover {
				background: rgba(255, 255, 255, 0.1) !important;
				color: #fff !important;
			}

			&.logout {
				color: #f87171 !important;

				&:hover {
					background: rgba(239, 68, 68, 0.15) !important;
				}
			}
		}
	}

	.auth-btn-group {
		display: flex;
		align-items: center;
		gap: 1.5rem;

		.btn-signup {
			background: transparent !important;
			color: #b3b3b3 !important;
			text-decoration: none !important;
			font-weight: 700 !important;
			font-size: 0.95rem !important;
			transition: color 150ms ease, transform 120ms ease !important;

			&:hover {
				color: #fff !important;
				transform: scale(1.04) !important;
			}
		}

		.btn-login {
			background: #fff !important;
			color: #000 !important;
			border: none !important;
			border-radius: 9999px !important;
			padding: 0.75rem 1.85rem !important;
			font-size: 0.95rem !important;
			font-weight: 700 !important;
			cursor: pointer !important;
			box-shadow: none !important;
			transition: transform 120ms ease, background 150ms ease !important;

			&:hover {
				transform: scale(1.04) !important;
				background: #f2f2f2 !important;
			}
		}
	}

	.mobile-brand {
		display: none;
		align-items: center;

		.mobile-brand-link {
			display: flex;
			align-items: center;
			gap: 0.45rem;
			text-decoration: none;
			color: #ffffff;

			.mobile-brand-logo {
				width: 1.65rem;
				height: 1.65rem;
			}

			.mobile-brand-text {
				font-size: 1.2rem;
				font-weight: 800;
				letter-spacing: -0.03em;
				color: #ffffff;
			}
		}
	}

	@media screen and (max-width: 1024px) {
		.spotify-topbar {
			padding: 0.6rem 0.85rem;
			border-radius: 0;
			gap: 0.5rem;
		}

		.mobile-brand {
			display: flex;
		}

		.history-controls {
			display: none !important;
		}

		.spotify-search-box {
			display: none !important;
		}

		.topbar-right {
			gap: 0.75rem;

			.auth-btn-group {
				gap: 0.5rem;

				.btn-signup {
					display: none !important;
				}

				.btn-login {
					padding: 0.45rem 1rem !important;
					font-size: 0.85rem !important;
				}
			}
		}
	}
</style>
