<script lang="ts">
import { goto } from "$app/navigation";
import { useSharedSession } from "$lib/session.svelte";
import {
	playTracks,
	playerCurrentTrack,
	playerPlaying,
	formatBytes,
	coverUrl,
} from "$lib/stores/player.svelte";
import type { Track } from "$lib/stores/player.svelte";
import TrackRow from "$lib/components/TrackRow.svelte";
import { authModal } from "$lib/stores/auth-modal.svelte";
import { getLibrary, deleteTrack as apiDeleteTrack, getOnlineTrending } from "$lib/api";
import { offlineStore } from "$lib/services/offline.svelte";
import { handleImageError } from "$lib/utils/image";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const isLoggedIn = $derived(sessionData?.data?.user != null);

	type View = "songs" | "artists" | "albums" | "downloaded";
	type SortKey = "date_added" | "title" | "artist" | "duration";

	let view = $state<View>("songs");
	let sortKey = $state<SortKey>("date_added");
	let sortAsc = $state(false);
	let filterQuery = $state("");

	let tracks = $state<Track[]>([]);
	let trendingTracks = $state<Track[]>([]);
	let loading = $state(true);
	let loadError = $state("");

	async function loadLibrary() {
		loading = true;
		loadError = "";
		try {
			const data = await getLibrary();
			tracks = data.tracks ?? [];
			if (tracks.length === 0) {
				const tr = await getOnlineTrending(10).catch(() => ({ tracks: [] }));
				trendingTracks = tr.tracks ?? [];
			}
		} catch (e: any) {
			loadError = e.message ?? "Failed to load library";
			tracks = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (isLoggedIn) {
			if (typeof navigator !== "undefined" && !navigator.onLine) {
				loading = false;
				if (offlineStore.downloadedTracks.length > 0 && view === "songs") {
					view = "downloaded";
				}
			} else {
				loadLibrary();
			}
		} else {
			loading = false;
			if (offlineStore.downloadedTracks.length > 0) {
				view = "downloaded";
			}
		}
	});

	// Derived library statistics
	const totalSize = $derived(tracks.reduce((acc, t) => acc + (t.size || 0), 0));
	const totalDuration = $derived(tracks.reduce((acc, t) => acc + (t.duration || 0), 0));

	const artistsList = $derived.by(() => {
		const map = new Map<string, Track[]>();
		for (const t of tracks) {
			const art = t.artist?.trim() || "Unknown Artist";
			if (!map.has(art)) map.set(art, []);
			map.get(art)!.push(t);
		}
		return Array.from(map.entries()).map(([name, artTracks]) => ({
			name,
			tracks: artTracks,
			coverTrack: artTracks.find((t) => t.id) ?? artTracks[0],
		})).sort((a, b) => a.name.localeCompare(b.name));
	});

	const albumsList = $derived.by(() => {
		const map = new Map<string, { album: string; artist: string; year: number | null; tracks: Track[] }>();
		for (const t of tracks) {
			const alb = t.album?.trim() || "Unknown Album";
			const key = `${alb}___${t.artist ?? ""}`;
			if (!map.has(key)) {
				map.set(key, {
					album: alb,
					artist: t.artist ?? "Unknown Artist",
					year: t.year ?? null,
					tracks: [],
				});
			}
			map.get(key)!.tracks.push(t);
		}
		return Array.from(map.values()).sort((a, b) => a.album.localeCompare(b.album));
	});

	const filteredTracks = $derived.by(() => {
		let list = [...tracks];
		if (filterQuery.trim()) {
			const q = filterQuery.toLowerCase();
			list = list.filter(
				(t) =>
					t.title.toLowerCase().includes(q) ||
					(t.artist ?? "").toLowerCase().includes(q) ||
					(t.album ?? "").toLowerCase().includes(q)
			);
		}

		list.sort((a, b) => {
			let res = 0;
			if (sortKey === "date_added") res = (a.date_added || 0) - (b.date_added || 0);
			else if (sortKey === "title") res = a.title.localeCompare(b.title);
			else if (sortKey === "artist") res = (a.artist ?? "").localeCompare(b.artist ?? "");
			else if (sortKey === "duration") res = (a.duration || 0) - (b.duration || 0);
			return sortAsc ? res : -res;
		});

		return list;
	});

	function handleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === "title" || key === "artist";
		}
	}


	async function handleDeleteTrack(track: Track) {
		try {
			await apiDeleteTrack(track.id);
			tracks = tracks.filter((t) => t.id !== track.id);
		} catch (e: any) {
			alert(e.message ?? "Failed to delete track");
		}
	}

	function playArtist(artTracks: Track[]) {
		playTracks(artTracks, 0);
	}
</script>


<svelte:head>
	<title>Library — Mezzo</title>
</svelte:head>

{#if !isLoggedIn && offlineStore.downloadedTracks.length === 0 && view !== "downloaded"}
	<div class="guest-hero">
		<div class="hero-content">
			<h1>Your Music Library</h1>
			<p class="hero-desc">
				Log in to save songs, build playlists, and keep your music synced across devices.
			</p>
			<div class="hero-actions">
				<button class="primary-btn" onclick={() => authModal.open()}>
					Log in
				</button>
				<a href="/signup" class="secondary-btn">Sign up free</a>
			</div>
			{#if offlineStore.downloadedTracks.length > 0}
				<div style="margin-top: 1.5rem;">
					<button class="secondary-btn" onclick={() => (view = "downloaded")}>
						View {offlineStore.downloadedTracks.length} Offline Downloaded Tracks
					</button>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="library-container">
		<!-- Library Hero Header -->
		<header class="lib-header">
			<div class="header-main">
				<h1>Your Music Library</h1>
				{#if tracks.length > 0}
					<div class="stats-pills">
						<span class="stat-pill"><strong>{tracks.length}</strong> tracks</span>
						<span class="stat-pill"><strong>{artistsList.length}</strong> artists</span>
						<span class="stat-pill"><strong>{albumsList.length}</strong> albums</span>
						{#if totalDuration > 0}
							<span class="stat-pill"><strong>{(totalDuration / 3600).toFixed(1)}</strong> hrs</span>
						{/if}
						{#if totalSize > 0}
							<span class="stat-pill">{formatBytes(totalSize)}</span>
						{/if}
					</div>
				{/if}
			</div>
		</header>

		<!-- Sub-Navigation View Bar -->
		<div class="view-bar">
			<div class="tabs-group">
				<button class="view-tab" class:active={view === "songs"} onclick={() => (view = "songs")}>
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
					</svg>
					Songs
				</button>
				<button class="view-tab" class:active={view === "artists"} onclick={() => (view = "artists")}>
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
					</svg>
					Artists
				</button>
				<button class="view-tab" class:active={view === "albums"} onclick={() => (view = "albums")}>
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
					</svg>
					Albums
				</button>
				<button class="view-tab" class:active={view === "downloaded"} onclick={() => (view = "downloaded")}>
					<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Downloaded
					{#if offlineStore.downloadedTracks.length > 0}
						<span class="tab-badge">{offlineStore.downloadedTracks.length}</span>
					{/if}
				</button>
			</div>

			{#if view === "songs" && tracks.length > 0}
				<div class="filter-controls">
					<div class="search-mini">
						<svg viewBox="0 0 24 24" width="0.9rem" height="0.9rem" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							bind:value={filterQuery}
							type="search"
							placeholder="Filter songs..."
						/>
					</div>

					<div class="sort-menu">
						<button class="sort-btn" onclick={() => handleSort("date_added")} class:active={sortKey === "date_added"}>
							Date {sortKey === "date_added" ? (sortAsc ? "↑" : "↓") : ""}
						</button>
						<button class="sort-btn" onclick={() => handleSort("title")} class:active={sortKey === "title"}>
							Title {sortKey === "title" ? (sortAsc ? "↑" : "↓") : ""}
						</button>
						<button class="sort-btn" onclick={() => handleSort("artist")} class:active={sortKey === "artist"}>
							Artist {sortKey === "artist" ? (sortAsc ? "↑" : "↓") : ""}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- View Content -->
		{#if loading}
			<div class="status-box">
				<div class="spinner"></div>
				<p>Syncing your library...</p>
			</div>
		{:else if loadError}
			<div class="error-card">
				<p>{loadError}</p>
				<button class="retry-btn" onclick={loadLibrary}>Retry</button>
			</div>
		{:else if tracks.length === 0}
			<!-- Clean Empty Library State -->
			<div class="empty-state">
				<div class="empty-icon-circle">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
					</svg>
				</div>
				<h2>Your library is empty</h2>
				<p>Tracks and playlists you save will show up here.</p>
				<div class="empty-cta-group">
					<a href="/search" class="primary-btn explore-btn">
						Find songs
					</a>
				</div>
			</div>

			{#if trendingTracks.length > 0}
				<div class="trending-section">
					<div class="section-title-row">
						<div>
							<h3>Trending Worldwide</h3>
							<p class="sub-label">Popular tracks you can add to your collection</p>
						</div>
						<button class="primary-btn play-all-btn" onclick={() => playTracks(trendingTracks, 0)}>
							<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor">
								<polygon points="5 3 19 12 5 21 5 3" />
							</svg>
							Play all
						</button>
					</div>

					<div class="tracks-container">
						{#each trendingTracks as track, i (track.id)}
							<TrackRow
								{track}
								index={i}
								playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
								onplay={() => playTracks(trendingTracks, i)}
							/>
						{/each}
					</div>
				</div>
			{/if}
		{:else if view === "songs"}
			<!-- Songs list view -->
			{#if filteredTracks.length === 0}
				<p class="no-results">No songs matching "{filterQuery}"</p>
			{:else}
				<div class="tracks-container">
					{#each filteredTracks as track, i (track.id)}
						<TrackRow
							{track}
							index={i}
							playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
							onplay={() => playTracks(filteredTracks, i)}
							ondelete={handleDeleteTrack}
						/>
					{/each}
				</div>
			{/if}
		{:else if view === "artists"}
			<!-- Artists grid view -->
			<div class="cards-grid">
				{#each artistsList as art (art.name)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="artist-card" onclick={() => goto(`/artist/${encodeURIComponent(art.name)}`)}>
						<div class="card-avatar">
							<img
								src={coverUrl(art.coverTrack)}
								alt={art.name}
								onerror={handleImageError}
							/>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button class="card-play-overlay" onclick={(e) => { e.stopPropagation(); playArtist(art.tracks); }} title={`Play songs by ${art.name}`}>
								<svg viewBox="0 0 24 24" width="1.75rem" height="1.75rem" fill="currentColor">
									<polygon points="5 3 19 12 5 21 5 3" />
								</svg>
							</button>
						</div>
						<span class="card-title">{art.name}</span>
						<span class="card-sub">{art.tracks.length} track{art.tracks.length !== 1 ? "s" : ""}</span>
					</div>
				{/each}
			</div>
		{:else if view === "albums"}
			<!-- Albums grid view -->
			<div class="cards-grid">
				{#each albumsList as alb (alb.album + alb.artist)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="album-card" onclick={() => playTracks(alb.tracks, 0)}>
						<div class="card-artwork">
							<img
								src={coverUrl(alb.tracks[0])}
								alt={alb.album}
								onerror={handleImageError}
							/>
							<div class="card-play-overlay">
								<svg viewBox="0 0 24 24" width="1.75rem" height="1.75rem" fill="currentColor">
									<polygon points="5 3 19 12 5 21 5 3" />
								</svg>
							</div>
						</div>
						<span class="card-title">{alb.album}</span>
						<span class="card-sub">{alb.artist} {alb.year ? `· ${alb.year}` : ""}</span>
					</div>
				{/each}
			</div>
		{:else if view === "downloaded"}
			<!-- Downloaded / Offline tracks view -->
			{#if offlineStore.downloadedTracks.length === 0}
				<div class="empty-state">
					<div class="empty-icon-circle">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
						</svg>
					</div>
					<h2>No downloaded music yet</h2>
					<p>Tap the download button on any song or in player bar to save it for offline listening.</p>
					<div class="empty-cta-group">
						<a href="/search" class="primary-btn explore-btn">
							Find songs to download
						</a>
					</div>
				</div>
			{:else}
				<div class="offline-header-bar">
					<div>
						<h3 class="offline-heading">Downloaded for Offline</h3>
						<span class="offline-sub">{offlineStore.downloadedTracks.length} song{offlineStore.downloadedTracks.length !== 1 ? 's' : ''} available without internet</span>
					</div>
					<button class="primary-btn play-all-btn" onclick={() => playTracks(offlineStore.downloadedTracks, 0)}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
						<span>Play All Offline</span>
					</button>
				</div>
				<div class="tracks-container">
					{#each offlineStore.downloadedTracks as track, i (track.id)}
						<TrackRow
							{track}
							index={i}
							playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
							onplay={() => playTracks(offlineStore.downloadedTracks, i)}
							ondelete={() => offlineStore.removeDownloadedTrack(track.id)}
						/>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style lang="scss">
	.guest-hero {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		text-align: center;
		padding: 2em;
	}

	.hero-content {
		max-width: 32rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		font-size: 2.5em;
		font-weight: 800;
		color: #fff;
		margin: 0;
		letter-spacing: -0.03em;
		line-height: 1.2;
	}

	.hero-desc {
		color: rgba(255, 255, 255, 0.6);
		font-size: 1.1em;
		line-height: 1.6;
		margin: 1em 0 2em;
	}

	.hero-actions {
		display: flex;
		gap: 1em;
		flex-wrap: wrap;
		justify-content: center;
	}

	.primary-btn {
		background: #1ed760;
		color: #000;
		border: none;
		border-radius: 9999px;
		padding: 0.8em 1.75em;
		font-weight: 700;
		font-size: 1em;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(30, 215, 96, 0.35);
		transition: transform 120ms;

		&:hover {
			transform: scale(1.03);
			background: #1fdf64;
		}
	}

	.secondary-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: #fff;
		border-radius: 0.75rem;
		padding: 0.8em 1.5em;
		font-weight: 600;
		font-size: 1em;
		text-decoration: none;
		display: inline-flex;
		align-items: center;

		&:hover {
			background: rgba(255, 255, 255, 0.12);
		}
	}

	.library-container {
		padding-bottom: 3em;
	}

	.lib-header {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 2em;
		gap: 1.5em;
		flex-wrap: wrap;

		h1 {
			font-size: 2.2em;
			font-weight: 800;
			color: #fff;
			margin: 0;
			letter-spacing: -0.03em;
		}
	}

	.stats-pills {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin-top: 0.65em;
		flex-wrap: wrap;
	}

	.stat-pill {
		font-size: 0.82em;
		color: rgba(255, 255, 255, 0.55);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.25em 0.75em;
		border-radius: 1em;

		strong {
			color: #fff;
		}
	}


	.view-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5em;
		gap: 1em;
		flex-wrap: wrap;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: 1em;
	}

	.tabs-group {
		display: flex;
		align-items: center;
		gap: 0.35em;
		background: rgba(255, 255, 255, 0.04);
		padding: 0.25em;
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.view-tab {
		display: flex;
		align-items: center;
		gap: 0.45em;
		background: transparent;
		border: none;
		border-radius: 0.55rem;
		padding: 0.5em 0.9em;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.88em;
		font-weight: 600;
		cursor: pointer;
		transition: all 120ms;

		&:hover {
			color: #fff;
		}

		&.active {
			background: rgba(255, 255, 255, 0.12);
			color: #fff;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		}

		.tab-badge {
			background: rgba(30, 215, 96, 0.2);
			color: #1ed760;
			font-size: 0.72rem;
			font-weight: 700;
			padding: 0.1rem 0.45rem;
			border-radius: 9999px;
			margin-left: 0.2rem;
		}
	}

	.offline-header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0 1.25rem;
		gap: 1rem;
		flex-wrap: wrap;

		.offline-heading {
			margin: 0 0 0.2rem;
			font-size: 1.3rem;
			font-weight: 700;
			color: #fff;
		}

		.offline-sub {
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.5);
		}

		.play-all-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.55rem 1.2rem;
			border-radius: 9999px;
			font-weight: 700;
			font-size: 0.88rem;
		}
	}

	.filter-controls {
		display: flex;
		align-items: center;
		gap: 0.75em;
	}

	.search-mini {
		position: relative;
		display: flex;
		align-items: center;

		svg {
			position: absolute;
			left: 0.75em;
			color: rgba(255, 255, 255, 0.35);
			pointer-events: none;
		}

		input {
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.08);
			border-radius: 0.5rem;
			padding: 0.4em 0.75em 0.4em 2.2em;
			color: #fff;
			font-size: 0.85em;
			outline: none;
			width: 9rem;
			transition: all 150ms;

			&:focus {
				width: 12rem;
				border-color: #1ed760;
			}
		}
	}

	.sort-menu {
		display: flex;
		gap: 0.25em;
	}

	.sort-btn {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.45rem;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.8em;
		padding: 0.4em 0.65em;
		cursor: pointer;

		&:hover {
			color: #fff;
			background: rgba(255, 255, 255, 0.08);
		}

		&.active {
			color: #1ed760;
			background: rgba(30, 215, 96, 0.15);
			border-color: rgba(30, 215, 96, 0.35);
		}
	}

	.tracks-container {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.cards-grid {
		display: flex;
		flex-direction: row;
		gap: 0.85rem;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		padding: 0.25rem 0.25rem 0.85rem;
		-webkit-overflow-scrolling: touch;
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

	.artist-card, .album-card {
		flex: 0 0 135px;
		width: 135px;
		scroll-snap-align: start;
		background: #141720;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.65rem;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		transition: transform 140ms, background 140ms;

		&:hover {
			background: #191c28;
			transform: translateY(-3px);

			.card-play-overlay {
				opacity: 1 !important;
			}
		}

		@media screen and (max-width: 600px) {
			flex: 0 0 115px;
			width: 115px;
			padding: 0.5rem;
		}
	}

	.card-avatar {
		position: relative;
		width: 100%;
		aspect-ratio: 1/1;
		border-radius: 50%;
		overflow: hidden;
		background: #202432;
		margin-bottom: 0.5em;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.card-artwork {
		position: relative;
		width: 100%;
		aspect-ratio: 1/1;
		border-radius: 0.45rem;
		overflow: hidden;
		background: #202432;
		margin-bottom: 0.5em;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.card-play-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.55);
		color: #fff;
		opacity: 0;
		transition: opacity 120ms;
	}

	.card-title {
		font-weight: 600;
		color: #fff;
		font-size: 0.82em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-sub {
		font-size: 0.72em;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.25em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}


	.status-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4em;
		gap: 1em;
		color: rgba(255, 255, 255, 0.5);

		.spinner {
			width: 2rem;
			height: 2rem;
			border: 3px solid rgba(255, 255, 255, 0.1);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 3.5rem 2rem;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.75rem;
		margin-bottom: 2rem;

		.empty-icon-circle {
			width: 3.5rem;
			height: 3.5rem;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.06);
			color: rgba(255, 255, 255, 0.6);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 1.25rem;
		}

		h2 {
			color: #fff;
			font-size: 1.35rem;
			font-weight: 700;
			letter-spacing: -0.01em;
			margin: 0 0 0.4rem;
		}

		p {
			color: rgba(255, 255, 255, 0.55);
			max-width: 24rem;
			margin: 0 0 1.5rem;
			font-size: 0.9rem;
			line-height: 1.45;
		}

		.empty-cta-group {
			display: flex;
			justify-content: center;
		}

		.explore-btn {
			text-decoration: none;
			padding: 0.65rem 1.4rem;
			font-size: 0.9rem;
		}
	}

	.trending-section {
		margin-top: 2rem;

		.section-title-row {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			margin-bottom: 1.25rem;
			gap: 1rem;

			h3 {
				color: #fff;
				font-size: 1.3rem;
				font-weight: 700;
				margin: 0 0 0.25rem;
			}

			.sub-label {
				color: rgba(255, 255, 255, 0.5);
				font-size: 0.875rem;
				margin: 0;
			}

			.play-all-btn {
				display: inline-flex;
				align-items: center;
				gap: 0.4rem;
				font-size: 0.85rem;
				padding: 0.6em 1.2em;
			}
		}
	}

	.no-results {
		text-align: center;
		padding: 3em;
		color: rgba(255, 255, 255, 0.4);
	}


	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
