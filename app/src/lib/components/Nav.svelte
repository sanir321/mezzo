<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { signOut } from "$lib/auth-client";
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
	const pathname = $derived($page.url.pathname);

	let searchQuery = $state("");
	let userMenuOpen = $state(false);

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
			e.preventDefault();
			const input = document.getElementById("nav-search-input");
			input?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} onclick={() => (userMenuOpen = false)} />

<header class="app-nav">
	<div class="nav-container">
		<div class="nav-brand">
			<a href="/" class="brand-link">
				<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
				<div class="brand-text">
					<span class="brand-name">Mezzo</span>
				</div>
			</a>
		</div>

		<nav class="nav-links" aria-label="Main Navigation">
			<a
				href="/"
				class="nav-link"
				class:active={pathname === "/"}
				aria-label="Home"
			>
				<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
				</svg>
				<span class="link-label">Home</span>
			</a>

			<a
				href="/search"
				class="nav-link"
				class:active={pathname.startsWith("/search")}
				aria-label="Search"
			>
				<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<span class="link-label">Search</span>
			</a>

			<a
				href="/library"
				class="nav-link"
				class:active={pathname.startsWith("/library")}
				aria-label="Music Library"
			>
				<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
				</svg>
				<span class="link-label">Library</span>
			</a>

			<a
				href="/playlists"
				class="nav-link"
				class:active={pathname.startsWith("/playlists")}
				aria-label="Playlists"
			>
				<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
				</svg>
				<span class="link-label">Playlists</span>
			</a>
		</nav>

		<div class="nav-right">
			<form class="search-box" onsubmit={handleSearch}>
				<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
					<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					id="nav-search-input"
					bind:value={searchQuery}
					type="search"
					placeholder="Search library..."
					autocomplete="off"
				/>
				<kbd class="shortcut-kbd">⌘K</kbd>
			</form>

			{#if user}
				<div class="user-menu-wrapper">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<button
						class="user-btn"
						onclick={(e) => { e.stopPropagation(); userMenuOpen = !userMenuOpen; }}
						aria-label="User profile menu"
					>
						<div class="avatar">
							{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
						</div>
						<span class="user-name">{user.name ?? user.email.split("@")[0]}</span>
						<svg viewBox="0 0 24 24" width="0.8rem" height="0.8rem" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="6 9 12 15 18 9" />
						</svg>
					</button>

					{#if userMenuOpen}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="user-dropdown" onclick={(e) => e.stopPropagation()}>
							<div class="dropdown-header">
								<p class="name">{user.name ?? "User"}</p>
								<p class="email">{user.email}</p>
							</div>
							<div class="dropdown-divider"></div>
							<a href="/settings" class="dropdown-item" onclick={() => (userMenuOpen = false)}>
								<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="3" />
									<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
								</svg>
								Settings
							</a>
							<button class="dropdown-item danger" onclick={() => { userMenuOpen = false; signOut({}); }}>
								<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
								</svg>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<button class="signin-btn" onclick={() => authModal.open()}>
					Sign In
				</button>
			{/if}
		</div>
	</div>
</header>

<style lang="scss">
	.app-nav {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--top-bar-height);
		background: rgba(15, 17, 23, 0.85);
		backdrop-filter: blur(20px) saturate(180%);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		z-index: 150;
		display: flex;
		align-items: center;
	}

	.nav-container {
		width: 100%;
		max-width: var(--max-width);
		margin: 0 auto;
		padding: 0 1.25em;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5em;
	}

	.nav-brand {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: 0.65em;
		text-decoration: none;
		color: #fff;
	}

	.brand-logo {
		width: 2.1rem;
		height: 2.1rem;
		transition: transform 200ms ease;

		&:hover {
			transform: rotate(-8deg) scale(1.05);
		}
	}

	.brand-name {
		font-size: 1.25em;
		font-weight: 700;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 0.35em;
		background: rgba(255, 255, 255, 0.04);
		padding: 0.25rem;
		border-radius: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.06);

		@media screen and (max-width: 680px) {
			gap: 0.15em;
		}
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.45em;
		padding: 0.45em 0.9em;
		border-radius: 1.5rem;
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		font-size: 0.88em;
		font-weight: 500;
		transition: all 140ms ease;

		&:hover {
			color: #fff;
			background: rgba(255, 255, 255, 0.06);
		}

		&.active {
			color: #fff;
			background: rgba(255, 255, 255, 0.12);
			border: 1px solid rgba(255, 255, 255, 0.2);
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		}

		@media screen and (max-width: 580px) {
			padding: 0.5em;
			.link-label {
				display: none;
			}
		}
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.85em;
		flex-shrink: 0;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;

		@media screen and (max-width: 780px) {
			display: none;
		}

		.search-icon {
			position: absolute;
			left: 0.85em;
			color: rgba(255, 255, 255, 0.4);
			pointer-events: none;
		}

		input {
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 2rem;
			padding: 0.45em 2.5em 0.45em 2.4em;
			color: #fff;
			font-size: 0.88em;
			width: 11rem;
			outline: none;
			transition: all 180ms ease;

			&:focus {
				width: 15rem;
				background: rgba(255, 255, 255, 0.09);
				border-color: #1ed760;
				box-shadow: 0 0 0 3px rgba(30, 215, 96, 0.2);
			}

			&::placeholder {
				color: rgba(255, 255, 255, 0.3);
			}
		}

		.shortcut-kbd {
			position: absolute;
			right: 0.75em;
			font-size: 0.7em;
			font-family: inherit;
			color: rgba(255, 255, 255, 0.35);
			background: rgba(255, 255, 255, 0.08);
			padding: 0.15em 0.4em;
			border-radius: 0.25rem;
			pointer-events: none;
		}
	}

	.signin-btn {
		background: #ffffff;
		color: #000000;
		border: none;
		border-radius: 1.5rem;
		padding: 0.45em 1.15em;
		font-size: 0.88em;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
		transition: all 150ms ease;

		&:hover {
			transform: scale(1.04);
			background: #f1f5f9;
		}
	}

	.user-menu-wrapper {
		position: relative;
	}

	.user-btn {
		display: flex;
		align-items: center;
		gap: 0.55em;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 2rem;
		padding: 0.25em 0.75em 0.25em 0.3em;
		color: #e2e8f0;
		cursor: pointer;
		transition: all 150ms;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
			border-color: rgba(255, 255, 255, 0.2);
		}

		.avatar {
			width: 1.75rem;
			height: 1.75rem;
			background: #1ed760;
			color: #000000;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 0.85em;
			font-weight: 800;
		}

		.user-name {
			font-size: 0.85em;
			font-weight: 500;
			max-width: 7rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			@media screen and (max-width: 600px) {
				display: none;
			}
		}
	}

	.user-dropdown {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		background: #181b24;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.85rem;
		padding: 0.5em;
		min-width: 13rem;
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
		z-index: 180;
		display: flex;
		flex-direction: column;
		gap: 0.2em;
		animation: menuPop 120ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.dropdown-header {
		padding: 0.6em 0.75em;

		.name {
			margin: 0;
			font-size: 0.9em;
			font-weight: 600;
			color: #fff;
		}

		.email {
			margin: 0.2em 0 0;
			font-size: 0.78em;
			color: rgba(255, 255, 255, 0.45);
			word-break: break-all;
		}
	}

	.dropdown-divider {
		height: 1px;
		background: rgba(255, 255, 255, 0.08);
		margin: 0.25em 0;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 0.65em;
		padding: 0.55em 0.75em;
		border-radius: 0.45rem;
		color: #e2e8f0;
		font-size: 0.85em;
		font-weight: 500;
		text-decoration: none;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 120ms;

		&:hover {
			background: rgba(255, 255, 255, 0.08);
			color: #fff;
		}

		&.danger {
			color: #f87171;

			&:hover {
				background: rgba(239, 68, 68, 0.15);
				color: #fca5a5;
			}
		}
	}

	@keyframes menuPop {
		from { opacity: 0; transform: translateY(-6px) scale(0.96); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
</style>
