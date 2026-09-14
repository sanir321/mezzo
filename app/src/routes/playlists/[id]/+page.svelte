<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { useSharedSession } from "$lib/session.svelte";
	import {
		playTracks,
		playerCurrentTrack,
		playerPlaying,
		playerShuffle,
		formatDuration,
		coverUrl,
	} from "$lib/stores/player.svelte";
	import type { Track, Playlist } from "$lib/stores/player.svelte";
	import { DEFAULT_ALBUM_COVER, DEFAULT_PLAYLIST_COVER, handleImageError, handlePlaylistImageError } from "$lib/utils/image";
	import TrackRow from "$lib/components/TrackRow.svelte";
	import {
		getPlaylist,
		getLikedTracks,
		addTrackToPlaylist as apiAddTrack,
		removeTrackFromPlaylist,
		deletePlaylist as apiDeletePlaylist,
		searchOnlineMusic,
		getOnlineTrending,
	} from "$lib/api";
	import { getFeaturedPlaylistById } from "$lib/featured-playlists";
	import { authModal } from "$lib/stores/auth-modal.svelte";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const isLoggedIn = $derived(sessionData?.data?.user != null);
	const playlistId = $derived($page.params.id);
	const isLikedPlaylist = $derived(playlistId === "liked");
	const featuredMeta = $derived(playlistId ? getFeaturedPlaylistById(playlistId) : undefined);
	const isFeatured = $derived(
		Boolean(featuredMeta) ||
		(playlistId != null && (
			playlistId.startsWith("saavn_pl_") ||
			playlistId.startsWith("online_pl_") ||
			playlistId.startsWith("saavn_alb_") ||
			playlistId.startsWith("online_alb_") ||
			playlistId.startsWith("tidal_alb_") ||
			playlistId.startsWith("tidal_art_") ||
			playlistId.startsWith("radio_") ||
			playlistId.startsWith("mix_")
		))
	);

	let playlist = $state<Playlist | null>(null);
	let tracks = $state<Track[]>([]);
	let loading = $state(true);
	let error = $state("");

	// In-page search & suggestions
	let searchQuery = $state("");
	let searchResults = $state<Track[]>([]);
	let recommendedTracks = $state<Track[]>([]);
	let isSearching = $state(false);
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let addingId = $state("");
	let addedTrackIds = $state<Set<string>>(new Set());

	async function loadData() {
		if (!playlistId) return;
		error = "";

		// Check local cache first
		if (typeof window !== "undefined") {
			try {
				const plTracksKey = `mezzo_pl_tracks_${playlistId}`;
				const localTracksRaw = localStorage.getItem(plTracksKey);
				if (localTracksRaw) {
					const parsed = JSON.parse(localTracksRaw);
					if (Array.isArray(parsed) && parsed.length > 0) {
						tracks = parsed;
					}
				}
				// Also check cached playlists for metadata
				const plListRaw = localStorage.getItem("mezzo_cached_playlists");
				if (plListRaw) {
					const parsedList = JSON.parse(plListRaw);
					if (Array.isArray(parsedList)) {
						const found = parsedList.find((p: Playlist) => p.id === playlistId);
						if (found) {
							playlist = found;
						}
					}
				}
			} catch {}
		}

		if (playlistId.startsWith("local_")) {
			loading = false;
			if (!playlist) {
				playlist = {
					id: playlistId,
					name: "Local Playlist",
					description: "Created offline",
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
			}
			return;
		}

		if (tracks.length === 0) {
			loading = true;
		}

		try {
			if (isLikedPlaylist) {
				if (!isLoggedIn) {
					error = "Please sign in to view your Liked Songs.";
					loading = false;
					return;
				}
				const likedRes = await getLikedTracks();
				playlist = {
					id: "liked",
					name: "Liked Songs",
					description: "Your personal collection of favorited tracks",
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				tracks = likedRes.tracks ?? [];
			} else {
				const [plRes, trendRes] = await Promise.all([
					getPlaylist(playlistId),
					getOnlineTrending(10).catch(() => ({ tracks: [] })),
				]);
				playlist = plRes.playlist;
				tracks = plRes.tracks ?? [];
				recommendedTracks = trendRes.tracks ?? [];

				if (typeof window !== "undefined") {
					try {
						localStorage.setItem(`mezzo_pl_tracks_${playlistId}`, JSON.stringify(tracks));
					} catch {}
				}
			}
		} catch (e: any) {
			if (tracks.length === 0) {
				const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
				if (isOffline) {
					error = "You're offline. Reconnect to stream or sync this playlist.";
				} else {
					error = e.message ?? "Failed to load playlist";
				}
			}
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (playlistId && (isLoggedIn || isFeatured)) {
			loadData();
		} else if (!isLoggedIn && !isFeatured) {
			loading = false;
		}
	});

	const totalDuration = $derived(tracks.reduce((acc, t) => acc + (t.duration || 0), 0));

	const displayedSuggestions = $derived.by(() => {
		if (searchQuery.trim().length > 0) {
			return searchResults;
		}
		return recommendedTracks;
	});

	function handleSearchInput(e: Event) {
		const q = (e.target as HTMLInputElement).value;
		searchQuery = q;
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		if (!q.trim()) {
			searchResults = [];
			isSearching = false;
			return;
		}
		isSearching = true;
		searchDebounceTimer = setTimeout(async () => {
			try {
				const res = await searchOnlineMusic(q.trim(), 10);
				searchResults = res.tracks ?? [];
			} catch {
				searchResults = [];
			} finally {
				isSearching = false;
			}
		}, 300);
	}

	function handlePlayAll() {
		if (tracks.length === 0) return;
		playerShuffle.value = false;
		playTracks(tracks, 0);
	}

	function handleShufflePlay() {
		if (tracks.length === 0) return;
		playerShuffle.value = true;
		const rand = Math.floor(Math.random() * tracks.length);
		playTracks(tracks, rand);
	}

	async function handleAddTrack(track: Track) {
		if (isLikedPlaylist) return;
		addingId = track.id;
		try {
			await apiAddTrack(playlistId, track);
			tracks = [...tracks, track];
			addedTrackIds = new Set([...addedTrackIds, track.id]);
		} catch (e: any) {
			alert(e.message ?? "Failed to add track");
		} finally {
			addingId = "";
		}
	}

	async function handleRemoveTrack(track: Track) {
		if (isLikedPlaylist) return;
		try {
			await removeTrackFromPlaylist(playlistId, track.id);
			tracks = tracks.filter((t) => t.id !== track.id);
			const newSet = new Set(addedTrackIds);
			newSet.delete(track.id);
			addedTrackIds = newSet;
		} catch (e: any) {
			alert(e.message ?? "Failed to remove track");
		}
	}

	async function handleDeletePlaylist() {
		if (isLikedPlaylist) return;
		if (!playlist) return;
		if (confirm(`Are you sure you want to delete playlist "${playlist.name}"?`)) {
			try {
				await apiDeletePlaylist(playlistId);
				goto("/playlists");
			} catch (e: any) {
				alert(e.message ?? "Failed to delete playlist");
			}
		}
	}

	function scrollToSearch() {
		const el = document.getElementById("find-songs-anchor");
		if (el) {
			el.scrollIntoView({ behavior: "smooth" });
			const input = el.querySelector("input");
			if (input) input.focus();
		}
	}

	function isCurrentTrack(track: Track): boolean {
		return playerCurrentTrack.value?.id === track.id;
	}
</script>

<svelte:head>
	<title>{playlist ? playlist.name : "Playlist"} — Mezzo</title>
</svelte:head>

<div class="playlist-detail-page">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading playlist...</p>
		</div>
	{:else if error}
		<div class="error-view">
			<p>{error}</p>
			<a href="/playlists" class="back-link">Back to playlists</a>
		</div>
	{:else if playlist}
		<!-- Hero Header -->
		<header class="pl-hero">
			<div class="hero-artwork" class:liked-artwork={isLikedPlaylist}>
				{#if isLikedPlaylist}
					<svg viewBox="0 0 24 24" width="3.8rem" height="3.8rem" fill="#fff">
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				{:else if playlist.cover_key}
					<img
						src={playlist.cover_key || DEFAULT_PLAYLIST_COVER}
						alt={playlist.name}
						class="hero-cover-img"
						onerror={handlePlaylistImageError}
					/>
				{:else}
					<svg viewBox="0 0 24 24" width="3.5rem" height="3.5rem" fill="none" stroke="currentColor" stroke-width="1.5">
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
					</svg>
				{/if}
			</div>

			<div class="hero-meta">
				<span class="type-tag">{isLikedPlaylist ? "AUTO PLAYLIST" : isFeatured ? "FEATURED PLAYLIST" : "PLAYLIST"}</span>
				<h1>{playlist.name}</h1>
				{#if playlist.description}
					<p class="description">{playlist.description}</p>
				{/if}
				<div class="meta-row">
					<span><strong>{tracks.length}</strong> song{tracks.length !== 1 ? "s" : ""}</span>
					<span class="dot">·</span>
					<span>{formatDuration(totalDuration)} total time</span>
				</div>
			</div>
		</header>

		<!-- Action bar -->
		<div class="action-bar">
			<div class="left-actions">
				<button class="play-primary-btn" onclick={handlePlayAll} disabled={tracks.length === 0}>
					<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="currentColor">
						<polygon points="5 3 19 12 5 21 5 3" />
					</svg>
					Play All
				</button>
				<button class="secondary-action-btn" onclick={handleShufflePlay} disabled={tracks.length === 0}>
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
					</svg>
					Shuffle
				</button>
				{#if !isLikedPlaylist && !isFeatured}
					<button class="secondary-action-btn" onclick={scrollToSearch}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Find Songs
					</button>
				{/if}
			</div>

			{#if !isLikedPlaylist && !isFeatured}
				<button class="delete-pl-btn" onclick={handleDeletePlaylist} title="Delete Playlist">
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
					</svg>
					Delete
				</button>
			{/if}
		</div>

		<!-- Tracks list -->
		{#if tracks.length === 0}
			<div class="empty-playlist">
				<p>{isLikedPlaylist ? "You haven't liked any songs yet. Click the heart icon on any track to save it here!" : "This playlist is currently empty."}</p>
				{#if !isLikedPlaylist}
					<button class="add-cta-btn" onclick={scrollToSearch}>Find songs to add</button>
				{/if}
			</div>
		{:else}
			<div class="tracks-list">
				{#each tracks as track, i (track.id)}
					<TrackRow
						{track}
						index={i}
						playing={isCurrentTrack(track) && playerPlaying.value}
						onplay={() => playTracks(tracks, i)}
						onremove={!isLikedPlaylist ? handleRemoveTrack : undefined}
					/>
				{/each}
			</div>
		{/if}

		<!-- Spotify-style In-Page "Find Songs" Search Section (Only on custom playlists) -->
		{#if !isLikedPlaylist && !isFeatured}
			<section class="find-songs-section" id="find-songs-anchor">
				<div class="find-header">
					<div class="find-title-group">
						<h2>Let's find something for your playlist</h2>
						<p class="find-subtitle">Search for songs or artists to instantly add to "{playlist.name}"</p>
					</div>
					<div class="find-search-box">
						<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							type="search"
							placeholder="Search for songs or artists..."
							value={searchQuery}
							oninput={handleSearchInput}
						/>
						{#if isSearching}
							<div class="inline-spinner"></div>
						{/if}
					</div>
				</div>

				<div class="suggested-tracks-list">
					{#if displayedSuggestions.length > 0}
						{#each displayedSuggestions as track (track.id)}
							{@const inPlaylist = tracks.some((t) => t.id === track.id) || addedTrackIds.has(track.id)}
							<div class="suggestion-row">
								<div class="track-left">
									<img
										src={coverUrl(track) || DEFAULT_ALBUM_COVER}
										alt={track.title}
										class="track-thumb"
										loading="lazy"
										onerror={handleImageError}
									/>
									<div class="track-info-col">
										<span class="suggestion-title" title={track.title}>{track.title}</span>
										<span class="suggestion-artist">{track.artist || "Unknown Artist"}</span>
									</div>
								</div>

								<div class="track-right">
									<span class="suggestion-duration">{formatDuration(track.duration)}</span>
									{#if inPlaylist}
										<button class="added-badge-btn" disabled title="Already in playlist">
											<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2.5">
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>Added</span>
										</button>
									{:else}
										<button
											class="add-track-btn"
											disabled={addingId === track.id}
											onclick={() => handleAddTrack(track)}
										>
											{addingId === track.id ? "Adding..." : "+ Add"}
										</button>
									{/if}
								</div>
							</div>
						{/each}
					{:else if searchQuery && !isSearching}
						<div class="no-results-box">
							<p>No songs found for "{searchQuery}". Try searching for another artist or track.</p>
						</div>
					{/if}
				</div>
			</section>
		{/if}
	{:else if !isLoggedIn && !isFeatured}
		<div class="guest-playlist-prompt">
			<svg viewBox="0 0 24 24" width="3.5rem" height="3.5rem" fill="none" stroke="currentColor" stroke-width="1.5">
				<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
			</svg>
			<h2>Sign in to view this playlist</h2>
			<p>Custom playlists are private to their creators. Sign in to access your personal collection.</p>
			<button class="play-primary-btn" onclick={() => authModal.open()}>Sign In</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.playlist-detail-page {
		display: flex;
		flex-direction: column;
		gap: 2.25rem;
		padding-bottom: 5rem;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 5rem 0;
		gap: 1rem;
		color: rgba(255, 255, 255, 0.6);

		.spinner {
			width: 2.5rem;
			height: 2.5rem;
			border: 3px solid rgba(255, 255, 255, 0.1);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 0.8s linear infinite;
		}
	}

	.error-view {
		text-align: center;
		padding: 4rem 1rem;
		color: #ff5252;

		.back-link {
			display: inline-block;
			margin-top: 1rem;
			color: #1ed760;
			text-decoration: underline;
		}
	}

	.pl-hero {
		display: flex;
		align-items: flex-end;
		gap: 2rem;
		padding: 2rem 0 1rem;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
		border-radius: 0.75rem;

		@media screen and (max-width: 768px) {
			flex-direction: column;
			align-items: center;
			text-align: center;
			gap: 1.25rem;
		}

		.hero-artwork {
			width: 192px;
			height: 192px;
			flex-shrink: 0;
			background: #282828;
			border-radius: 0.5rem;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
			color: rgba(255, 255, 255, 0.4);
			overflow: hidden;

			.hero-cover-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			&.liked-artwork {
				background: linear-gradient(135deg, #450af5, #c4efd9);
				color: #ffffff;
			}
		}

		.hero-meta {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;

			.type-tag {
				font-size: 0.75rem;
				font-weight: 800;
				letter-spacing: 0.1em;
				color: rgba(255, 255, 255, 0.7);
			}

			h1 {
				font-size: 2.75rem;
				font-weight: 900;
				color: #ffffff;
				margin: 0;
				line-height: 1.1;

				@media screen and (max-width: 768px) {
					font-size: 1.85rem;
				}
			}

			.description {
				font-size: 0.95rem;
				color: rgba(255, 255, 255, 0.65);
				margin: 0;
			}

			.meta-row {
				display: flex;
				align-items: center;
				gap: 0.5rem;
				font-size: 0.85rem;
				color: rgba(255, 255, 255, 0.5);

				strong {
					color: #ffffff;
				}

				.dot {
					opacity: 0.4;
				}
			}
		}
	}

	.guest-playlist-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 4.5rem 2rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.08);
		max-width: 480px;
		margin: 2rem auto;
		gap: 1rem;

		svg {
			color: #1ed760;
			opacity: 0.6;
		}

		h2 {
			color: #fff;
			margin: 0;
			font-size: 1.5rem;
		}

		p {
			color: rgba(255, 255, 255, 0.6);
			margin: 0;
			font-size: 0.95rem;
			line-height: 1.5;
		}
	}

	.action-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 0;

		.left-actions {
			display: flex;
			align-items: center;
			gap: 0.85rem;
			flex-wrap: wrap;
		}

		.play-primary-btn {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			background: #1ed760;
			color: #000000;
			border: none;
			border-radius: 9999px;
			padding: 0.75rem 1.6rem;
			font-size: 0.95rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.15s ease;

			&:hover:not(:disabled) {
				background: #1fdf64;
				transform: scale(1.04);
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}

		.secondary-action-btn {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			background: rgba(255, 255, 255, 0.08);
			color: #ffffff;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 9999px;
			padding: 0.65rem 1.15rem;
			font-size: 0.88rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.15s ease;

			&:hover:not(:disabled) {
				background: rgba(255, 255, 255, 0.15);
				border-color: rgba(255, 255, 255, 0.25);
			}

			&:disabled {
				opacity: 0.4;
				cursor: not-allowed;
			}
		}

		.delete-pl-btn {
			display: flex;
			align-items: center;
			gap: 0.35rem;
			background: transparent;
			color: rgba(255, 255, 255, 0.4);
			border: none;
			padding: 0.5rem 0.75rem;
			border-radius: 6px;
			font-size: 0.82rem;
			cursor: pointer;
			transition: color 0.15s;

			&:hover {
				color: #ff5252;
			}
		}
	}

	.empty-playlist {
		text-align: center;
		padding: 3.5rem 1rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 0.75rem;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;

		p {
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.95rem;
			max-width: 420px;
			margin: 0;
		}

		.add-cta-btn {
			background: #ffffff;
			color: #000000;
			border: none;
			border-radius: 9999px;
			padding: 0.65rem 1.5rem;
			font-size: 0.9rem;
			font-weight: 700;
			cursor: pointer;
			transition: transform 0.15s ease;

			&:hover {
				transform: scale(1.04);
			}
		}
	}

	.tracks-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Spotify Find Songs In-Page Section */
	.find-songs-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;

		.find-header {
			display: flex;
			flex-direction: column;
			gap: 1.25rem;

			.find-title-group {
				h2 {
					font-size: 1.4rem;
					font-weight: 800;
					color: #ffffff;
					margin: 0 0 0.25rem;
				}

				.find-subtitle {
					font-size: 0.88rem;
					color: rgba(255, 255, 255, 0.5);
					margin: 0;
				}
			}

			.find-search-box {
				position: relative;
				display: flex;
				align-items: center;
				max-width: 520px;

				svg {
					position: absolute;
					left: 1rem;
					color: rgba(255, 255, 255, 0.4);
					pointer-events: none;
				}

				input {
					width: 100%;
					background: rgba(255, 255, 255, 0.07);
					border: 1px solid rgba(255, 255, 255, 0.15);
					border-radius: 9999px;
					padding: 0.75rem 2.8rem 0.75rem 2.8rem;
					color: #ffffff;
					font-size: 0.92rem;
					outline: none;
					transition: border-color 0.15s;

					&:focus {
						border-color: #1ed760;
						background: rgba(255, 255, 255, 0.1);
					}

					&::placeholder {
						color: rgba(255, 255, 255, 0.4);
					}
				}

				.inline-spinner {
					position: absolute;
					right: 1rem;
					width: 1.1rem;
					height: 1.1rem;
					border: 2px solid rgba(255, 255, 255, 0.2);
					border-top-color: #1ed760;
					border-radius: 50%;
					animation: spin 0.8s linear infinite;
				}
			}
		}

		.suggested-tracks-list {
			display: flex;
			flex-direction: column;
			gap: 0.4rem;
		}

		.suggestion-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0.5rem 0.85rem;
			background: rgba(255, 255, 255, 0.02);
			border: 1px solid rgba(255, 255, 255, 0.04);
			border-radius: 8px;
			transition: background 0.15s ease;

			&:hover {
				background: rgba(255, 255, 255, 0.06);
			}

			.track-left {
				display: flex;
				align-items: center;
				gap: 0.85rem;
				min-width: 0;
				flex: 1;

				.track-thumb {
					width: 44px;
					height: 44px;
					border-radius: 4px;
					object-fit: cover;
					background: #282828;
					flex-shrink: 0;
				}

				.track-info-col {
					display: flex;
					flex-direction: column;
					gap: 0.15rem;
					min-width: 0;

					.suggestion-title {
						color: #ffffff;
						font-size: 0.9rem;
						font-weight: 600;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}

					.suggestion-artist {
						color: rgba(255, 255, 255, 0.5);
						font-size: 0.78rem;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
			}

			.track-right {
				display: flex;
				align-items: center;
				gap: 1.25rem;

				.suggestion-duration {
					color: rgba(255, 255, 255, 0.4);
					font-size: 0.82rem;
					font-variant-numeric: tabular-nums;
				}

				.add-track-btn {
					background: transparent;
					border: 1px solid rgba(255, 255, 255, 0.35);
					border-radius: 9999px;
					padding: 0.35rem 1rem;
					color: #ffffff;
					font-size: 0.82rem;
					font-weight: 700;
					cursor: pointer;
					transition: all 0.15s ease;

					&:hover:not(:disabled) {
						border-color: #ffffff;
						transform: scale(1.05);
					}

					&:disabled {
						opacity: 0.5;
					}
				}

				.added-badge-btn {
					display: flex;
					align-items: center;
					gap: 0.3rem;
					background: rgba(30, 215, 96, 0.15);
					border: 1px solid rgba(30, 215, 96, 0.35);
					border-radius: 9999px;
					padding: 0.35rem 0.85rem;
					color: #1ed760;
					font-size: 0.8rem;
					font-weight: 700;
					cursor: default;
				}
			}
		}

		.no-results-box {
			text-align: center;
			padding: 2rem 1rem;
			color: rgba(255, 255, 255, 0.45);
			font-size: 0.9rem;
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
