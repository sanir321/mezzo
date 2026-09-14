<script lang="ts">
import { untrack } from "svelte";
	import { useSharedSession } from "$lib/session.svelte";
	import { goto } from "$app/navigation";
	import type { Playlist } from "$lib/stores/player.svelte";
	import { getPlaylists, getPlaylist, createPlaylist as apiCreatePlaylist, deletePlaylist as apiDeletePlaylist, searchOnlineMusic } from "$lib/api";
	import { playTracks } from "$lib/stores/player.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { authModal } from "$lib/stores/auth-modal.svelte";
	import { FEATURED_PLAYLISTS } from "$lib/featured-playlists";
	import { DEFAULT_PLAYLIST_COVER, handlePlaylistImageError } from "$lib/utils/image";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(sessionAtom.get());

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const isLoggedIn = $derived(sessionData?.data?.user != null);

	const STORAGE_KEY_USER_PLAYLISTS = "mezzo_cached_playlists";

	function getCachedPlaylists(): Playlist[] {
		if (typeof window === "undefined") return [];
		try {
			const raw = localStorage.getItem(STORAGE_KEY_USER_PLAYLISTS);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) return parsed;
			}
		} catch {}
		return [];
	}

	function saveCachedPlaylists(list: Playlist[]) {
		if (typeof window === "undefined") return;
		try {
			localStorage.setItem(STORAGE_KEY_USER_PLAYLISTS, JSON.stringify(list));
		} catch {}
	}

	let playlists = $state<Playlist[]>(getCachedPlaylists());
	let loading = $state(false);
	let error = $state("");
	let showCreateModal = $state(false);
	let newName = $state("");
	let newDescription = $state("");
	let creating = $state(false);
	let lastLoadedUser = $state<string | null>(null);

	async function loadPlaylists() {
		error = "";
		if (playlists.length === 0) {
			loading = true;
		}
		try {
			const data = await getPlaylists();
			playlists = data.playlists ?? [];
			saveCachedPlaylists(playlists);
		} catch (e: any) {
			const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
			if (playlists.length === 0 && !isOffline) {
				error = e.message ?? "Failed to load playlists";
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const userKey = sessionData?.data?.user?.id || (isLoggedIn ? "logged_in" : "guest");
		if (userKey !== lastLoadedUser) {
			lastLoadedUser = userKey;
			untrack(() => {
				if (isLoggedIn) {
					loadPlaylists();
				} else {
					loading = false;
				}
			});
		}
	});

	async function handleCreate(e: Event) {
		e.preventDefault();
		const name = newName.trim();
		if (!name) return;
		creating = true;
		error = "";
		try {
			if (typeof navigator !== "undefined" && !navigator.onLine) {
				const localId = "local_" + Date.now();
				const newPl: Playlist = {
					id: localId,
					name,
					description: newDescription.trim() || undefined,
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				playlists = [newPl, ...playlists];
				saveCachedPlaylists(playlists);
				newName = "";
				newDescription = "";
				showCreateModal = false;
				goto(`/playlists/${localId}`);
				return;
			}

			const { id } = await apiCreatePlaylist(name, newDescription.trim() || undefined);
			const newPl: Playlist = {
				id,
				name,
				description: newDescription.trim() || undefined,
				cover_key: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			playlists = [newPl, ...playlists.filter((p) => p.id !== id)];
			saveCachedPlaylists(playlists);

			newName = "";
			newDescription = "";
			showCreateModal = false;
			goto(`/playlists/${id}`);
		} catch (e: any) {
			// Fallback locally
			try {
				const localId = "local_" + Date.now();
				const newPl: Playlist = {
					id: localId,
					name,
					description: newDescription.trim() || undefined,
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				playlists = [newPl, ...playlists];
				saveCachedPlaylists(playlists);
				newName = "";
				newDescription = "";
				showCreateModal = false;
				goto(`/playlists/${localId}`);
			} catch {
				error = "Failed to create playlist";
			}
		} finally {
			creating = false;
		}
	}

	async function handleDelete(e: MouseEvent, id: string, name: string) {
		e.stopPropagation();
		if (!confirm(`Delete playlist "${name}"?`)) return;
		playlists = playlists.filter((p) => p.id !== id);
		saveCachedPlaylists(playlists);
		if (typeof window !== "undefined") {
			try {
				localStorage.removeItem(`mezzo_pl_tracks_${id}`);
			} catch {}
		}
		try {
			await apiDeletePlaylist(id);
		} catch (e: any) {
			console.warn("Delete remote playlist error:", e);
		}
	}

	async function handlePlayPlaylist(e: MouseEvent, id: string) {
		e.stopPropagation();
		try {
			const data = await getPlaylist(id);
			if (data.tracks?.length > 0) {
				playTracks(data.tracks, 0);
			} else {
				goto(`/playlists/${id}`);
			}
		} catch {
			goto(`/playlists/${id}`);
		}
	}

	async function handlePlayFeatured(e: MouseEvent, query: string) {
		e.stopPropagation();
		e.preventDefault();
		try {
			const data = await searchOnlineMusic(query, 30);
			if (data.tracks?.length > 0) {
				playTracks(data.tracks, 0);
			}
		} catch {}
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
</script>

<svelte:head>
	<title>Playlists — Mezzo</title>
</svelte:head>

<div class="playlists-page">
	<header class="page-header">
		<div>
			<h1>Playlists</h1>
			<p class="subtitle">Featured curated playlists and your personal library</p>
		</div>
		{#if isLoggedIn}
			<button class="create-btn" onclick={() => (showCreateModal = true)}>
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				New Playlist
			</button>
		{:else}
			<button class="create-btn" onclick={() => authModal.open()}>
				Sign In
			</button>
		{/if}
	</header>

	<!-- Section 1: Curated Featured Playlists (Always Accessible) -->
	<section class="pl-block">
		<div class="block-title-row">
			<div class="title-meta">
				<span class="block-kicker">CURATED BY MEZZO</span>
				<h2 class="block-title">Featured Playlists</h2>
			</div>
		</div>

		<div class="playlists-grid">
			{#each FEATURED_PLAYLISTS as pl (pl.id)}
				<a href="/playlists/{pl.id}" class="playlist-card featured-pl-card">
					<div class="card-artwork">
						<img
							src={pl.cover || DEFAULT_PLAYLIST_COVER}
							alt={pl.name}
							class="card-img"
							loading="lazy"
							onerror={handlePlaylistImageError}
						/>
						{#if pl.badge}
							<span class="card-tag">{pl.badge}</span>
						{/if}
						<button
							class="play-overlay-btn"
							onclick={(e) => handlePlayFeatured(e, pl.query)}
							aria-label={`Play ${pl.name}`}
							title="Play playlist"
						>
							<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
								<polygon points="5 3 19 12 5 21 5 3" />
							</svg>
						</button>
					</div>

					<div class="card-body">
						<span class="card-title" title={pl.name}>{pl.name}</span>
						<p class="card-desc">{pl.description}</p>
						<span class="card-meta">30 tracks · Featured</span>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<!-- Section 2: Personal Playlists -->
	<section class="pl-block personal-block">
		<div class="block-title-row">
			<div class="title-meta">
				<span class="block-kicker">YOUR COLLECTION</span>
				<h2 class="block-title">Custom Playlists</h2>
			</div>
			{#if isLoggedIn && playlists.length > 0}
				<button class="secondary-create-btn" onclick={() => (showCreateModal = true)}>+ Add New</button>
			{/if}
		</div>

		{#if !isLoggedIn}
			<div class="guest-upsell-box">
				<div class="upsell-icon-wrap">
					<svg viewBox="0 0 24 24" width="2.25rem" height="2.25rem" fill="none" stroke="currentColor" stroke-width="1.8">
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				</div>
				<div class="upsell-content">
					<h3>Create & Sync Your Own Playlists</h3>
					<p>Sign in to save favorite tracks, create unlimited playlists, and access your music library anywhere.</p>
				</div>
				<button class="primary-btn" onclick={() => authModal.open()}>Sign In to Mezzo</button>
			</div>
		{:else if loading && playlists.length === 0}
			<div class="status-box">
				<div class="spinner"></div>
				<p>Loading your playlists...</p>
			</div>
		{:else if error && playlists.length === 0}
			<div class="error-banner">{error}</div>
		{:else if playlists.length === 0 && likedStore.tracks.length === 0}
			<div class="empty-state">
				<div class="empty-icon-wrap">
					<svg viewBox="0 0 24 24" width="3.5rem" height="3.5rem" fill="none" stroke="currentColor" stroke-width="1.2">
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				</div>
				<h2>No custom playlists yet</h2>
				<p>Create playlists to group your favorite songs by vibe, genre, or mood.</p>
				<button class="primary-btn" onclick={() => (showCreateModal = true)}>Create Your First Playlist</button>
			</div>
		{:else}
			<div class="playlists-grid">
				{#if likedStore.tracks.length > 0}
					<a href="/playlists/liked" class="playlist-card liked-songs-card">
						<div class="card-artwork">
							<div class="artwork-gradient liked-gradient">
								<svg viewBox="0 0 24 24" width="2.8rem" height="2.8rem" fill="#fff">
									<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
								</svg>
							</div>

							<button
								class="play-overlay-btn"
								onclick={(e) => { e.preventDefault(); e.stopPropagation(); playTracks(likedStore.tracks, 0); }}
								aria-label="Play Liked Songs"
								title="Play Liked Songs"
							>
								<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
									<polygon points="5 3 19 12 5 21 5 3" />
								</svg>
							</button>
						</div>

						<div class="card-body">
							<span class="card-title">Liked Songs</span>
							<p class="card-desc">Auto-generated playlist of all your favorited songs</p>
							<span class="card-meta">{likedStore.tracks.length} track{likedStore.tracks.length !== 1 ? 's' : ''}</span>
						</div>
					</a>
				{/if}

				{#each playlists as pl (pl.id)}
					<a href="/playlists/{pl.id}" class="playlist-card">
						<div class="card-artwork">
							<div class="artwork-gradient">
								<svg viewBox="0 0 24 24" width="2.5rem" height="2.5rem" fill="none" stroke="currentColor" stroke-width="1.5">
									<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
								</svg>
							</div>

							<button
								class="play-overlay-btn"
								onclick={(e) => { e.preventDefault(); handlePlayPlaylist(e, pl.id); }}
								aria-label={`Play playlist ${pl.name}`}
								title="Play playlist"
							>
								<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
									<polygon points="5 3 19 12 5 21 5 3" />
								</svg>
							</button>

							<button
								class="card-delete-btn"
								onclick={(e) => { e.preventDefault(); handleDelete(e, pl.id, pl.name); }}
								title="Delete playlist"
								aria-label="Delete playlist"
							>
								<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
								</svg>
							</button>
						</div>

						<div class="card-body">
							<span class="card-title" title={pl.name}>{pl.name}</span>
							{#if pl.description}
								<p class="card-desc">{pl.description}</p>
							{/if}
							<span class="card-meta">Updated {formatDate(pl.updatedAt)}</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
</div>

<!-- Create Playlist Modal -->
{#if showCreateModal}
	<div
		class="modal-backdrop"
		onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}
		onkeydown={(e) => e.key === "Escape" && (showCreateModal = false)}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
	>
		<div class="create-modal">
			<header class="modal-head">
				<h3>New Playlist</h3>
				<button class="close-btn" onclick={() => (showCreateModal = false)} aria-label="Close">
					<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			<form onsubmit={handleCreate} class="modal-form">
				<div class="form-group">
					<label for="pl-name">Playlist Name</label>
					<input
						id="pl-name"
						bind:value={newName}
						type="text"
						placeholder="e.g. Late Night Vibes"
						required
					/>
				</div>

				<div class="form-group">
					<label for="pl-desc">Description (Optional)</label>
					<textarea
						id="pl-desc"
						bind:value={newDescription}
						placeholder="Add an optional description..."
						rows="3"
					></textarea>
				</div>

				<div class="modal-actions">
					<button type="button" class="btn-cancel" onclick={() => (showCreateModal = false)}>Cancel</button>
					<button type="submit" class="btn-submit" disabled={creating}>
						{creating ? "Creating..." : "Create Playlist"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style lang="scss">
	.playlists-page {
		padding-bottom: 3em;
	}

	.page-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 2em;
		gap: 1em;
		flex-wrap: wrap;

		h1 {
			font-size: 2.2em;
			font-weight: 800;
			color: #fff;
			margin: 0;
			letter-spacing: -0.03em;
		}

		.subtitle {
			margin: 0.35em 0 0;
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.9em;
		}
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		background: #1ed760;
		color: #000;
		border: none;
		border-radius: 9999px;
		padding: 0.7em 1.5em;
		font-size: 0.92em;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(30, 215, 96, 0.35);
		transition: all 140ms ease;

		&:hover {
			background: #1fdf64;
			transform: scale(1.02);
		}
	}

	.playlists-grid {
		display: flex;
		flex-direction: row;
		gap: 0.85rem;
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0.25rem 0.25rem 0.85rem;
		-webkit-overflow-scrolling: touch;
		scroll-behavior: smooth;
		scroll-snap-type: x mandatory;
		scrollbar-width: thin;
		scrollbar-color: rgba(255, 255, 255, 0.18) transparent;

		&::-webkit-scrollbar {
			height: 5px;
		}

		&::-webkit-scrollbar-thumb {
			background: rgba(255, 255, 255, 0.18);
			border-radius: 9999px;
		}
	}

	.playlist-card {
		flex: 0 0 138px;
		width: 138px;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.65rem;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		scroll-snap-align: start;
		transition: all 180ms ease;

		&:hover {
			background: #242424;
			border-color: rgba(255, 255, 255, 0.14);
			transform: translateY(-3px);

			.play-overlay-btn {
				opacity: 1 !important;
				transform: translateY(0) scale(1) !important;
			}
			.card-delete-btn {
				opacity: 1;
			}
		}

		@media screen and (max-width: 600px) {
			flex: 0 0 118px;
			width: 118px;
			padding: 0.5rem;
		}
	}

	.pl-block {
		margin-bottom: 3.5rem;
	}

	.block-title-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 1.25rem;

		.block-kicker {
			font-size: 0.72rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			color: rgba(255, 255, 255, 0.45);
			text-transform: uppercase;
		}

		.block-title {
			font-size: 1.45rem;
			font-weight: 800;
			color: #fff;
			margin: 0.2rem 0 0;
			letter-spacing: -0.02em;
		}

		.secondary-create-btn {
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.15);
			color: #fff;
			font-size: 0.82rem;
			font-weight: 600;
			padding: 0.45rem 1rem;
			border-radius: 9999px;
			cursor: pointer;
			transition: all 120ms;

			&:hover {
				background: rgba(255, 255, 255, 0.15);
			}
		}
	}

	.card-artwork {
		position: relative;
		width: 100%;
		aspect-ratio: 1/1;
		border-radius: 0.45rem;
		overflow: hidden;
		margin-bottom: 0.55rem;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);

		.card-img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.card-tag {
			position: absolute;
			top: 0.4rem;
			left: 0.4rem;
			background: rgba(0, 0, 0, 0.75);
			backdrop-filter: blur(8px);
			color: #1ed760;
			font-size: 0.6rem;
			font-weight: 800;
			letter-spacing: 0.06em;
			padding: 0.2rem 0.5rem;
			border-radius: 4px;
			border: 1px solid rgba(255, 255, 255, 0.1);
		}
	}

	.guest-upsell-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		background: linear-gradient(135deg, rgba(30, 215, 96, 0.08) 0%, rgba(20, 23, 32, 0.9) 100%);
		border: 1px solid rgba(30, 215, 96, 0.2);
		border-radius: 1.15rem;
		padding: 2rem 2.25rem;
		flex-wrap: wrap;

		.upsell-icon-wrap {
			color: #1ed760;
			background: rgba(30, 215, 96, 0.12);
			width: 3.5rem;
			height: 3.5rem;
			border-radius: 50%;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.upsell-content {
			flex: 1;
			min-width: 260px;

			h3 {
				color: #fff;
				margin: 0 0 0.35rem;
				font-size: 1.25rem;
				font-weight: 700;
			}

			p {
				color: rgba(255, 255, 255, 0.6);
				margin: 0;
				font-size: 0.92rem;
				line-height: 1.5;
			}
		}
	}

	.artwork-gradient {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.35);

		&.liked-gradient {
			background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
			color: #fff;
			box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
		}
	}

	.play-overlay-btn {
		position: absolute;
		bottom: 0.4rem;
		right: 0.4rem;
		width: 2.3rem;
		height: 2.3rem;
		border-radius: 50%;
		background: #1ed760;
		color: #000;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
		opacity: 0;
		transform: translateY(6px);
		transition: all 180ms ease;

		&:hover {
			transform: scale(1.08) !important;
			background: #1fdf64;
		}

		svg {
			margin-left: 2px;
		}
	}

	.card-delete-btn {
		position: absolute;
		top: 0.65em;
		right: 0.65em;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		color: rgba(255, 255, 255, 0.6);
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transition: all 120ms;

		&:hover {
			color: #f87171;
			background: rgba(239, 68, 68, 0.3);
		}
	}

	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.2em;
	}

	.card-title {
		font-size: 1.02em;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-desc {
		font-size: 0.8em;
		color: rgba(255, 255, 255, 0.5);
		margin: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		font-size: 0.75em;
		color: rgba(255, 255, 255, 0.35);
		margin-top: 0.25em;
	}

	.empty-state {
		text-align: center;
		padding: 5em 2em;
		background: #181818;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		border-radius: 1.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;

		.empty-icon-wrap {
			color: rgba(30, 215, 96, 0.35);
			margin-bottom: 1em;
		}

		h2 {
			color: #fff;
			margin: 0 0 0.4em;
		}

		p {
			color: rgba(255, 255, 255, 0.5);
			max-width: 22rem;
			margin: 0 0 1.5em;
		}
	}

	.primary-btn {
		background: #1ed760;
		color: #000;
		border: none;
		border-radius: 9999px;
		padding: 0.75em 1.75em;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(30, 215, 96, 0.35);

		&:hover {
			background: #1fdf64;
		}
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.82);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		z-index: 100070;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5em;
	}

	.create-modal {
		width: 100%;
		max-width: 25rem;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 1.15rem;
		padding: 1.75em;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25em;

		h3 {
			margin: 0;
			color: #fff;
			font-size: 1.25em;
		}

		.close-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.4);
			cursor: pointer;
			display: flex;
			padding: 0.25em;
			border-radius: 50%;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.08);
			}
		}
	}

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4em;

		label {
			font-size: 0.78em;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.7);
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		input, textarea {
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 0.6rem;
			padding: 0.7em 0.9em;
			color: #fff;
			font-size: 0.95em;
			outline: none;
			font-family: inherit;

			&:focus {
				border-color: #1ed760;
			}
		}
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75em;
		margin-top: 0.5em;
	}

	.btn-cancel {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		padding: 0.6em 1em;
		cursor: pointer;
		font-weight: 500;

		&:hover {
			color: #fff;
		}
	}

	.btn-submit {
		background: #1ed760;
		color: #000;
		border: none;
		border-radius: 9999px;
		padding: 0.65em 1.5em;
		font-weight: 700;
		cursor: pointer;

		&:hover:not(:disabled) {
			background: #1fdf64;
		}

		&:disabled {
			opacity: 0.5;
		}
	}

	.status-box {
		text-align: center;
		padding: 4em;
		color: rgba(255, 255, 255, 0.5);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1em;

		.spinner {
			width: 2rem;
			height: 2rem;
			border: 3px solid rgba(255, 255, 255, 0.1);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
