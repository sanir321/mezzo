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
	} from "$lib/stores/player.svelte";
	import type { Track, Playlist } from "$lib/stores/player.svelte";
	import { DEFAULT_PLAYLIST_COVER, handlePlaylistImageError } from "$lib/utils/image";
	import TrackRow from "$lib/components/TrackRow.svelte";
	import {
		getPlaylist,
		getLikedTracks,
		removeTrackFromPlaylist,
		deletePlaylist as apiDeletePlaylist,
		searchOnlineMusic,
	} from "$lib/api";
	import { getFeaturedPlaylistById } from "$lib/featured-playlists";
	import { likedStore } from "$lib/stores/liked.svelte";
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

	async function loadData() {
		if (!playlistId) return;
		error = "";

		// 1. Check local cache first for instant display
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

		// 2. Liked Songs playlist
		if (isLikedPlaylist) {
			playlist = {
				id: "liked",
				name: "Liked Songs",
				description: "Your personal collection of favorited tracks",
				cover_key: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			if (likedStore.tracks.length > 0) {
				tracks = likedStore.tracks;
				loading = false;
				return;
			}
			try {
				const likedRes = await getLikedTracks();
				tracks = likedRes.tracks ?? [];
			} catch {
				tracks = likedStore.tracks;
			} finally {
				loading = false;
			}
			return;
		}

		// 3. Featured Curated Playlist (like today_top_hits, chill_vibes, etc.)
		if (featuredMeta) {
			playlist = {
				id: featuredMeta.id,
				name: featuredMeta.name,
				description: featuredMeta.description,
				cover_key: null,
				cover_url: featuredMeta.cover,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			if (tracks.length === 0) loading = true;
			try {
				const res = await searchOnlineMusic(featuredMeta.query, 30);
				tracks = res.tracks ?? [];
			} catch {
				// retain cached tracks if any
			} finally {
				loading = false;
			}
			return;
		}

		// 4. Online Search / Saavn / Radio Playlist
		if (
			playlistId.startsWith("saavn_pl_") ||
			playlistId.startsWith("online_pl_") ||
			playlistId.startsWith("saavn_alb_") ||
			playlistId.startsWith("online_alb_") ||
			playlistId.startsWith("radio_") ||
			playlistId.startsWith("mix_")
		) {
			const cleanName = playlistId
				.replace(/^(saavn_pl_|online_pl_|saavn_alb_|online_alb_|radio_|mix_)/, "")
				.replace(/[_-]/g, " ");
			playlist = {
				id: playlistId,
				name: cleanName ? cleanName.charAt(0).toUpperCase() + cleanName.slice(1) : "Playlist",
				description: "Curated collection",
				cover_key: null,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};
			if (tracks.length === 0) loading = true;
			try {
				const res = await searchOnlineMusic(cleanName, 30);
				tracks = res.tracks ?? [];
			} catch {
				// retain cached tracks if any
			} finally {
				loading = false;
			}
			return;
		}

		// 5. Local Playlist (created offline)
		if (playlistId.startsWith("local_")) {
			loading = false;
			if (!playlist) {
				playlist = {
					id: playlistId,
					name: "My Playlist",
					description: "Created offline",
					cover_key: null,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
			}
			return;
		}

		// 6. Custom User Server Playlist (UUID / ID)
		if (!playlist && tracks.length === 0) loading = true;
		try {
			const plRes = await getPlaylist(playlistId);
			if (plRes?.playlist) {
				playlist = plRes.playlist;
				tracks = plRes.tracks ?? [];
				if (typeof window !== "undefined") {
					try {
						localStorage.setItem(`mezzo_pl_tracks_${playlistId}`, JSON.stringify(tracks));
					} catch {}
				}
			}
		} catch (e: any) {
			if (!playlist) {
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
		if (playlistId) {
			loadData();
		}
	});

	const totalDuration = $derived(tracks.reduce((acc, t) => acc + (t.duration || 0), 0));

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

	async function handleRemoveTrack(track: Track) {
		if (isLikedPlaylist) return;
		try {
			await removeTrackFromPlaylist(playlistId, track.id);
			tracks = tracks.filter((t) => t.id !== track.id);
			if (typeof window !== "undefined") {
				try {
					localStorage.setItem(`mezzo_pl_tracks_${playlistId}`, JSON.stringify(tracks));
				} catch {}
			}
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

	function isCurrentTrack(track: Track): boolean {
		return playerCurrentTrack.value?.id === track.id;
	}
</script>

<svelte:head>
	<title>{playlist ? playlist.name : "Playlist"} — Mezzo</title>
</svelte:head>

<div class="playlist-detail-page">
	{#if loading && !playlist}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading playlist...</p>
		</div>
	{:else if error && !playlist}
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
				{:else if playlist.cover_key || playlist.cover_url}
					<img
						src={playlist.cover_url || playlist.cover_key || DEFAULT_PLAYLIST_COVER}
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
			</div>
		{:else}
			<div class="tracks-list">
				{#each tracks as track, i (track.id)}
					<TrackRow
						{track}
						index={i}
						playing={isCurrentTrack(track) && playerPlaying.value}
						onplay={() => playTracks(tracks, i)}
						onremove={!isLikedPlaylist && !isFeatured ? handleRemoveTrack : undefined}
					/>
				{/each}
			</div>
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
		gap: 2rem;
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
			background: #242424;
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
	}

	.tracks-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
