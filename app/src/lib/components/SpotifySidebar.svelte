<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { useSession } from "$lib/auth-client";
	import { getPlaylists, createPlaylist } from "$lib/api";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { userPreferences, getArtistMeta } from "$lib/stores/preferences.svelte";
	import type { Playlist } from "$lib/stores/player.svelte";
	import LanguageModal from "$lib/components/LanguageModal.svelte";
	import { authModal } from "$lib/stores/auth-modal.svelte";

	const sessionAtom = useSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const isLoggedIn = $derived(sessionData?.data?.user != null);
	const pathname = $derived($page.url.pathname);

	let playlists = $state<Playlist[]>([]);
	let filter = $state<"all" | "playlists" | "artists">("all");
	let showCreateModal = $state(false);
	let showLanguageModal = $state(false);
	let newPlaylistName = $state("");
	let isCreating = $state(false);

	const activeLanguage = $derived(userPreferences.languages[0] || "English");

	async function loadPlaylists() {
		if (!isLoggedIn) return;
		try {
			const res = await getPlaylists();
			playlists = res.playlists ?? [];
		} catch {
			// ignore
		}
	}

	$effect(() => {
		if (isLoggedIn) {
			loadPlaylists();
		}
	});

	function handleCreateClick() {
		if (!isLoggedIn) {
			authModal.open();
			return;
		}
		showCreateModal = true;
	}

	function handleLanguageClick() {
		if (!isLoggedIn) {
			authModal.open();
			return;
		}
		showLanguageModal = true;
	}

	async function handleCreatePlaylist(e: Event) {
		e.preventDefault();
		if (!newPlaylistName.trim() || isCreating) return;
		isCreating = true;
		try {
			const { id } = await createPlaylist(newPlaylistName.trim());
			if (id) {
				const newPl: Playlist = {
					id,
					name: newPlaylistName.trim(),
					description: null,
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				playlists = [newPl, ...playlists];
				newPlaylistName = "";
				showCreateModal = false;
				goto(`/playlists/${id}`);
			}
		} catch (err: any) {
			alert(err.message || "Failed to create playlist");
		} finally {
			isCreating = false;
		}
	}
</script>

<aside class="spotify-sidebar">
	<!-- Top Navigation Box -->
	<nav class="nav-box" aria-label="Main Navigation">
		<a href="/" class="brand-header">
			<img src="/logo.svg" alt="Mezzo" class="brand-logo" />
			<span class="brand-title">Mezzo</span>
		</a>

		<ul class="nav-list">
			<li>
				<a href="/" class="nav-item" class:active={pathname === "/"}>
					<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
						<path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h5v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6h5V7.577l-7.5-4.33z" />
					</svg>
					<span class="item-label">Home</span>
				</a>
			</li>

			<li>
				<a href="/search" class="nav-item" class:active={pathname.startsWith("/search")}>
					<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
					</svg>
					<span class="item-label">Search</span>
				</a>
			</li>
		</ul>
	</nav>

	<!-- Your Library Box -->
	<div class="library-box">
		<div class="lib-header">
			<a href="/library" class="lib-title-link" class:active={pathname.startsWith("/library")}>
				<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
					<line x1="12" y1="6" x2="16" y2="6" /><line x1="12" y1="10" x2="16" y2="10" />
				</svg>
				<span class="lib-title">Your Library</span>
			</a>

			<button
				class="create-btn"
				title="Create playlist"
				onclick={handleCreateClick}
				aria-label="Create playlist"
			>
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2.5">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</button>
		</div>

		{#if isLoggedIn}
			<!-- Filter Pills -->
			<div class="filter-chips">
				<button class="chip" class:active={filter === "all"} onclick={() => (filter = "all")}>All</button>
				<button class="chip" class:active={filter === "playlists"} onclick={() => (filter = "playlists")}>Playlists</button>
				<button class="chip" class:active={filter === "artists"} onclick={() => (filter = "artists")}>Artists</button>
			</div>

			<!-- Scrollable Library List -->
			<div class="lib-items-list">
				<!-- Pinned: Liked Songs Card -->
				{#if filter === "all" || filter === "playlists"}
					<a
						href="/playlists/liked"
						class="lib-item liked-item"
						class:active={pathname === "/playlists/liked"}
					>
						<div class="item-artwork liked-art">
							<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="currentColor">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						</div>
						<div class="item-meta">
							<span class="item-name">Liked Songs</span>
							<span class="item-sub">
								<span class="pin-icon">📌</span> Playlist • {likedStore.count} song{likedStore.count !== 1 ? 's' : ''}
							</span>
						</div>
					</a>
				{/if}

				<!-- User Playlists -->
				{#if filter === "all" || filter === "playlists"}
					{#each playlists as pl (pl.id)}
						<a
							href="/playlists/{pl.id}"
							class="lib-item"
							class:active={pathname === `/playlists/${pl.id}`}
						>
							<div class="item-artwork playlist-art">
								<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
								</svg>
							</div>
							<div class="item-meta">
								<span class="item-name">{pl.name}</span>
								<span class="item-sub">Playlist</span>
							</div>
						</a>
					{/each}
				{/if}

				<!-- Followed Artists with Real Photos -->
				{#if filter === "all" || filter === "artists"}
					{#each (userPreferences.favoriteArtists.length > 0 ? userPreferences.favoriteArtists : ["Anirudh Ravichander", "Sid Sriram", "A.R. Rahman", "The Weeknd", "Taylor Swift"]) as artName}
						<a
							href="/artist/{encodeURIComponent(artName)}"
							class="lib-item"
							class:active={pathname === `/artist/${encodeURIComponent(artName)}`}
						>
							<div class="item-artwork artist-avatar">
								<img
									src={getArtistMeta(artName).image}
									alt={artName}
									class="sidebar-artist-img"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
								/>
							</div>
							<div class="item-meta">
								<span class="item-name">{artName}</span>
								<span class="item-sub">Artist</span>
							</div>
						</a>
					{/each}
				{/if}
			</div>
		{:else}
			<!-- Unauthenticated Promo Boxes (like Spotify Web) -->
			<div class="unauth-promo-wrap">
				<div class="promo-box">
					<span class="promo-title">Create your first playlist</span>
					<span class="promo-desc">It's easy, we'll help you</span>
					<button class="promo-btn" onclick={() => authModal.open()}>Create playlist</button>
				</div>

				<div class="promo-box">
					<span class="promo-title">Let's find some artists to follow</span>
					<span class="promo-desc">We'll keep you updated on new music</span>
					<a href="/search" class="promo-btn link-btn">Browse artists</a>
				</div>
			</div>
		{/if}

		<!-- Sidebar Language & Preferences Footer -->
		<div class="sidebar-footer">
			<button class="lang-picker-btn" onclick={handleLanguageClick}>
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="10" />
					<line x1="2" y1="12" x2="22" y2="12" />
					<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
				</svg>
				<span>{activeLanguage}</span>
			</button>
		</div>
	</div>
</aside>

<!-- Quick Create Playlist Modal -->
{#if showCreateModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => (showCreateModal = false)}>
		<div class="create-modal-card" onclick={(e) => e.stopPropagation()}>
			<h3>Create New Playlist</h3>
			<p>Give your playlist a name to start organizing your tracks.</p>

			<form onsubmit={handleCreatePlaylist}>
				<input
					type="text"
					placeholder="My Playlist #1"
					bind:value={newPlaylistName}
					class="modal-input"
				/>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={() => (showCreateModal = false)}>
						Cancel
					</button>
					<button type="submit" class="btn-create" disabled={!newPlaylistName.trim() || isCreating}>
						{isCreating ? "Creating..." : "Create"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Language Modal -->
<LanguageModal bind:open={showLanguageModal} />

<style lang="scss">
	.spotify-sidebar {
		width: 18rem;
		min-width: 18rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
		user-select: none;
		flex-shrink: 0;

		@media screen and (max-width: 1024px) {
			display: none !important;
		}
	}

	.nav-box {
		background: #121212;
		border-radius: 0.55rem;
		padding: 1.25rem 1.25rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;

		.brand-header {
			display: flex;
			align-items: center;
			gap: 0.65rem;
			text-decoration: none;
			color: #ffffff;
			padding: 0 0.5rem;

			.brand-logo {
				width: 2.1rem;
				height: 2.1rem;
			}

			.brand-title {
				font-size: 1.35rem;
				font-weight: 800;
				letter-spacing: -0.03em;
				color: #ffffff;
			}
		}

		.nav-list {
			list-style: none;
			padding: 0;
			margin: 0;
			display: flex;
			flex-direction: column;
			gap: 0.25rem;

			.nav-item {
				display: flex;
				align-items: center;
				gap: 1.2rem;
				padding: 0.65rem 0.75rem;
				border-radius: 0.35rem;
				color: #b3b3b3;
				text-decoration: none;
				font-size: 0.95rem;
				font-weight: 700;
				transition: color 150ms ease;

				&:hover {
					color: #ffffff;
				}

				&.active {
					color: #ffffff;
				}
			}
		}
	}

	.library-box {
		background: #121212;
		border-radius: 0.55rem;
		padding: 0.75rem 0.75rem 0.5rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;

		.lib-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 0.6rem;

			.lib-title-link {
				display: flex;
				align-items: center;
				gap: 0.85rem;
				color: #b3b3b3;
				text-decoration: none;
				font-size: 0.95rem;
				font-weight: 700;
				transition: color 150ms ease;

				&:hover,
				&.active {
					color: #ffffff;
				}
			}

			.create-btn {
				background: transparent;
				border: none;
				color: #b3b3b3;
				cursor: pointer;
				padding: 0.35rem;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: color 150ms, background 150ms;

				&:hover {
					color: #ffffff;
					background: rgba(255, 255, 255, 0.08);
				}
			}
		}

		.filter-chips {
			display: flex;
			gap: 0.45rem;
			padding: 0.4rem 0.6rem 0.6rem;

			.chip {
				background: rgba(255, 255, 255, 0.08);
				border: none;
				border-radius: 9999px;
				color: #ffffff;
				font-size: 0.8rem;
				font-weight: 600;
				padding: 0.35rem 0.8rem;
				cursor: pointer;
				transition: background 150ms ease;

				&:hover {
					background: rgba(255, 255, 255, 0.15);
				}

				&.active {
					background: #ffffff;
					color: #000000;
				}
			}
		}

		.lib-items-list {
			flex: 1;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 0.2rem;
			padding: 0.25rem 0;

			.lib-item {
				display: flex;
				align-items: center;
				gap: 0.85rem;
				padding: 0.55rem 0.6rem;
				border-radius: 0.4rem;
				text-decoration: none;
				color: inherit;
				transition: background 150ms ease;

				&:hover {
					background: rgba(255, 255, 255, 0.07);
				}

				&.active {
					background: rgba(255, 255, 255, 0.1);
				}

				.item-artwork {
					width: 3rem;
					height: 3rem;
					border-radius: 0.3rem;
					flex-shrink: 0;
					overflow: hidden;
					display: flex;
					align-items: center;
					justify-content: center;

					&.liked-art {
						background: linear-gradient(135deg, #450af5, #8e8ee5 50%, #c4efd9);
						color: #ffffff;
					}

					&.playlist-art {
						background: #282828;
						color: #b3b3b3;
					}

					&.artist-avatar {
						border-radius: 50%;
					}

					.sidebar-artist-img {
						width: 100%;
						height: 100%;
						object-fit: cover;
						border-radius: 50%;
					}
				}

				.item-meta {
					flex: 1;
					min-width: 0;
					display: flex;
					flex-direction: column;
					gap: 0.15rem;

					.item-name {
						color: #ffffff;
						font-size: 0.92rem;
						font-weight: 600;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.item-sub {
						color: #a7a7a7;
						font-size: 0.8rem;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;

						.pin-icon {
							font-size: 0.7rem;
						}
					}
				}
			}
		}

		.unauth-promo-wrap {
			flex: 1;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			padding: 0.5rem 0.25rem;

			&::-webkit-scrollbar {
				width: 0.4rem;
			}
			&::-webkit-scrollbar-thumb {
				background: rgba(255, 255, 255, 0.2);
				border-radius: 9999px;
			}

			.promo-box {
				background: #242424;
				border-radius: 0.55rem;
				padding: 1rem 1.15rem;
				display: flex;
				flex-direction: column;
				gap: 0.35rem;

				.promo-title {
					color: #ffffff;
					font-size: 0.95rem;
					font-weight: 700;
				}

				.promo-desc {
					color: #ffffff;
					font-size: 0.82rem;
					font-weight: 500;
					line-height: 1.35;
				}

				.promo-btn {
					align-self: flex-start;
					margin-top: 0.6rem;
					background: #ffffff !important;
					color: #000000 !important;
					border: none !important;
					border-radius: 9999px !important;
					padding: 0.45rem 1.15rem !important;
					font-size: 0.85rem !important;
					font-weight: 700 !important;
					cursor: pointer !important;
					text-decoration: none !important;
					box-shadow: none !important;
					transition: transform 120ms ease, background 120ms ease !important;

					&:hover {
						transform: scale(1.04) !important;
						background: #f2f2f2 !important;
					}
				}
			}
		}

		.sidebar-footer {
			margin-top: auto;
			padding: 1.25rem 0.5rem 0.5rem;
			display: flex;
			flex-direction: column;
			gap: 1.25rem;
			flex-shrink: 0;

			.lang-picker-btn {
				align-self: flex-start;
				display: inline-flex;
				align-items: center;
				gap: 0.45rem;
				background: transparent !important;
				border: 1px solid rgba(255, 255, 255, 0.35) !important;
				border-radius: 9999px !important;
				padding: 0.4rem 0.95rem !important;
				color: #ffffff !important;
				font-size: 0.82rem !important;
				font-weight: 700 !important;
				cursor: pointer !important;
				box-shadow: none !important;
				transition: all 120ms ease !important;

				svg {
					stroke: #ffffff !important;
				}

				&:hover {
					border-color: #ffffff !important;
					transform: scale(1.04) !important;
				}
			}
		}
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 300;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.create-modal-card {
		background: #282828;
		border-radius: 0.65rem;
		padding: 1.75rem;
		width: 100%;
		max-width: 24rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);

		h3 {
			margin: 0 0 0.5rem;
			font-size: 1.3rem;
			font-weight: 700;
			color: #fff;
		}

		p {
			margin: 0 0 1.25rem;
			font-size: 0.88rem;
			color: #a7a7a7;
		}

		.modal-input {
			width: 100%;
			background: #3e3e3e;
			border: 1px solid transparent;
			border-radius: 0.35rem;
			padding: 0.75rem 0.95rem;
			color: #fff;
			font-size: 0.95rem;
			outline: none;
			box-sizing: border-box;
			margin-bottom: 1.5rem;

			&:focus {
				border-color: #1ed760;
			}
		}

		.modal-actions {
			display: flex;
			justify-content: flex-end;
			gap: 0.75rem;

			.btn-cancel {
				background: transparent;
				border: none;
				color: #fff;
				font-size: 0.9rem;
				font-weight: 700;
				padding: 0.65rem 1.25rem;
				cursor: pointer;

				&:hover {
					text-decoration: underline;
				}
			}

			.btn-create {
				background: #1ed760;
				color: #000;
				border: none;
				border-radius: 9999px;
				font-size: 0.9rem;
				font-weight: 700;
				padding: 0.65rem 1.5rem;
				cursor: pointer;
				transition: transform 120ms ease;

				&:hover:not(:disabled) {
					transform: scale(1.04);
					background: #1fdf64;
				}

				&:disabled {
					opacity: 0.5;
					cursor: default;
				}
			}
		}
	}
</style>
