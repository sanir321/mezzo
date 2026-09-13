<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import {
		playTracks,
		playerCurrentTrack,
		playerPlaying,
	} from "$lib/stores/player.svelte";
	import type { Track, Playlist } from "$lib/stores/player.svelte";
	import TrackRow from "$lib/components/TrackRow.svelte";
	import {
		getTracks,
		getPlaylists,
		getPlaylist,
		getOnlineTrending,
		searchOnlineMusic,
		getSearchSuggestions,
	} from "$lib/api";
	import type {
		SearchArtistOnline,
		SearchPlaylistOnline,
		SearchAlbumOnline,
	} from "$lib/api";
	import { getArtistMeta, POPULAR_ARTISTS } from "$lib/stores/preferences.svelte";
	import { FEATURED_PLAYLISTS } from "$lib/featured-playlists";
	import { DEFAULT_ALBUM_COVER, DEFAULT_PLAYLIST_COVER, handleImageError, handlePlaylistImageError } from "$lib/utils/image";

	let query = $state("");
	let activeTab = $state<"all" | "songs" | "artists" | "playlists" | "albums">("all");
	let allTracks = $state<Track[]>([]);
	let allPlaylists = $state<Playlist[]>([]);
	let onlineSearchResults = $state<Track[]>([]);
	let onlineArtists = $state<SearchArtistOnline[]>([]);
	let onlinePlaylists = $state<SearchPlaylistOnline[]>([]);
	let onlineAlbums = $state<SearchAlbumOnline[]>([]);
	let suggestions = $state<string[]>([]);
	let trendingTracks = $state<Track[]>([]);
	let loading = $state(true);
	let loadingOnline = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let suggestionDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let searchInputEl: HTMLInputElement | null = $state(null);
	let activeSearchId = 0;

	async function loadData() {
		loading = true;
		try {
			const [tracksRes, playlistsRes, trendingRes] = await Promise.allSettled([
				getTracks(),
				getPlaylists(),
				getOnlineTrending(20),
			]);
			if (tracksRes.status === "fulfilled") {
				allTracks = tracksRes.value.tracks ?? [];
			}
			if (playlistsRes.status === "fulfilled") {
				allPlaylists = playlistsRes.value.playlists ?? [];
			}
			if (trendingRes.status === "fulfilled") {
				trendingTracks = trendingRes.value.tracks ?? [];
			}
		} catch {
			// Ignore error on load
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const q = $page.url.searchParams.get("q") || "";
		const isTyping = typeof document !== "undefined" && document.activeElement === searchInputEl;
		if (!isTyping && q !== query) {
			query = q;
			if (q.trim()) {
				performOnlineSearch(q.trim());
			} else {
				onlineSearchResults = [];
				onlineArtists = [];
				onlinePlaylists = [];
				onlineAlbums = [];
			}
		}
	});

	$effect(() => {
		if (allTracks.length === 0 && trendingTracks.length === 0 && !loading) {
			loadData();
		}
	});

	async function performOnlineSearch(q: string) {
		const trimmed = q.trim();
		if (!trimmed) {
			onlineSearchResults = [];
			onlineArtists = [];
			onlinePlaylists = [];
			onlineAlbums = [];
			return;
		}
		const searchId = ++activeSearchId;
		loadingOnline = true;
		try {
			const res = await searchOnlineMusic(trimmed, 30);
			if (searchId !== activeSearchId) return;
			onlineSearchResults = res.tracks ?? [];
			onlineArtists = res.artists ?? [];
			onlinePlaylists = res.playlists ?? [];
			onlineAlbums = res.albums ?? [];
		} catch {
			if (searchId === activeSearchId) {
				onlineSearchResults = [];
				onlineArtists = [];
				onlinePlaylists = [];
				onlineAlbums = [];
			}
		} finally {
			if (searchId === activeSearchId) {
				loadingOnline = false;
			}
		}
	}

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		query = val;

		// 1. Live suggestions (fast debounce 120ms)
		if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
		if (val.trim()) {
			suggestionDebounceTimer = setTimeout(async () => {
				const results = await getSearchSuggestions(val.trim());
				if (query.trim()) {
					suggestions = results;
				}
			}, 120);
		} else {
			suggestions = [];
		}

		// 2. Full Search & silent URL update (debounce 280ms)
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			const trimmed = val.trim();
			if (trimmed) {
				if (typeof window !== "undefined") {
					const newUrl = `/search?q=${encodeURIComponent(trimmed)}`;
					if (window.location.pathname + window.location.search !== newUrl) {
						window.history.replaceState(window.history.state, "", newUrl);
					}
				}
				performOnlineSearch(trimmed);
			} else {
				suggestions = [];
				if (typeof window !== "undefined") {
					window.history.replaceState(window.history.state, "", "/search");
				}
				onlineSearchResults = [];
				onlineArtists = [];
				onlinePlaylists = [];
				onlineAlbums = [];
			}
		}, 280);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			if (debounceTimer) clearTimeout(debounceTimer);
			if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
			suggestions = [];
			const trimmed = query.trim();
			if (trimmed) {
				if (typeof window !== "undefined") {
					window.history.replaceState(window.history.state, "", `/search?q=${encodeURIComponent(trimmed)}`);
				}
				performOnlineSearch(trimmed);
			} else {
				if (typeof window !== "undefined") {
					window.history.replaceState(window.history.state, "", "/search");
				}
			}
			searchInputEl?.blur();
		} else if (e.key === "Escape") {
			suggestions = [];
		}
	}

	function selectSuggestion(term: string) {
		query = term;
		suggestions = [];
		if (debounceTimer) clearTimeout(debounceTimer);
		if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
		if (typeof window !== "undefined") {
			window.history.replaceState(window.history.state, "", `/search?q=${encodeURIComponent(term)}`);
		}
		performOnlineSearch(term);
	}

	function clearSearch() {
		query = "";
		suggestions = [];
		onlineSearchResults = [];
		onlineArtists = [];
		onlinePlaylists = [];
		onlineAlbums = [];
		if (debounceTimer) clearTimeout(debounceTimer);
		if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
		if (typeof window !== "undefined") {
			window.history.replaceState(window.history.state, "", "/search");
		}
		searchInputEl?.focus();
	}

	function setQuickSearch(term: string) {
		query = term;
		suggestions = [];
		if (debounceTimer) clearTimeout(debounceTimer);
		if (suggestionDebounceTimer) clearTimeout(suggestionDebounceTimer);
		goto(`/search?q=${encodeURIComponent(term)}`, {
			keepFocus: true,
			noScroll: true,
		});
		performOnlineSearch(term);
	}

	const trimmedQuery = $derived(query.trim().toLowerCase());

	const matchingTracks = $derived(
		trimmedQuery
			? allTracks.filter((t) => {
					return (
						t.title.toLowerCase().includes(trimmedQuery) ||
						(t.artist ?? "").toLowerCase().includes(trimmedQuery) ||
						(t.album ?? "").toLowerCase().includes(trimmedQuery) ||
						(t.genre ?? "").toLowerCase().includes(trimmedQuery)
					);
				})
			: []
	);

	const allCombinedPlaylists = $derived.by(() => {
		const onlinePls = onlinePlaylists.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			coverUrl: p.coverUrl,
			query: p.query || p.name,
			isUser: false,
			trackCount: p.trackCount || 25,
		}));
		const userPls = allPlaylists.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description || "Custom Playlist",
			coverUrl: p.cover_key || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
			query: p.name,
			isUser: true,
			trackCount: 0,
		}));
		const featuredPls = FEATURED_PLAYLISTS.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			coverUrl: p.cover,
			query: p.query,
			isUser: false,
			trackCount: 30,
		}));
		return [...onlinePls, ...userPls, ...featuredPls];
	});

	const matchingPlaylists = $derived.by(() => {
		if (!trimmedQuery) return allCombinedPlaylists;
		return allCombinedPlaylists.filter(
			(p) =>
				p.id.startsWith("saavn_pl_") ||
				p.id.startsWith("radio_") ||
				p.name.toLowerCase().includes(trimmedQuery) ||
				(p.description ?? "").toLowerCase().includes(trimmedQuery) ||
				(p.query ?? "").toLowerCase().includes(trimmedQuery)
		);
	});

	const matchingArtists = $derived.by(() => {
		if (!trimmedQuery) return [];
		const artistMap = new Map<string, { name: string; trackCount: number; tracks: Track[]; image: string }>();

		// 1. Online searched artists
		onlineArtists.forEach((a) => {
			const k = a.name.toLowerCase();
			if (!artistMap.has(k)) {
				artistMap.set(k, {
					name: a.name,
					trackCount: a.trackCount || 1,
					tracks: a.tracks || [],
					image: a.image || getArtistMeta(a.name).image,
				});
			}
		});

		// 2. Curated popular artists
		POPULAR_ARTISTS.forEach((a) => {
			if (a.name.toLowerCase().includes(trimmedQuery) || a.genre.toLowerCase().includes(trimmedQuery)) {
				const k = a.name.toLowerCase();
				if (!artistMap.has(k)) {
					artistMap.set(k, {
						name: a.name,
						trackCount: 5,
						tracks: [],
						image: a.image,
					});
				}
			}
		});

		// 3. Artists extracted from online search tracks
		onlineSearchResults.forEach((t) => {
			if (t.artist) {
				const names = t.artist.split(/[,&/]|(?:feat\.?)|(?:ft\.?)/i).map((n) => n.trim()).filter((n) => n.length > 1);
				for (const name of names) {
					const k = name.toLowerCase();
					const existing = artistMap.get(k);
					const img = getArtistMeta(name).image;
					if (existing) {
						existing.trackCount++;
						if (!existing.tracks.some((x) => x.id === t.id)) existing.tracks.push(t);
					} else {
						artistMap.set(k, {
							name,
							trackCount: 1,
							tracks: [t],
							image: t.cover_url || img,
						});
					}
				}
			}
		});

		return Array.from(artistMap.values());
	});

	const matchingAlbums = $derived.by(() => {
		if (!trimmedQuery) return [];
		const albumMap = new Map<string, { id?: string; album: string; artist: string; tracks: Track[]; coverUrl?: string }>();

		// 1. Online albums from API
		onlineAlbums.forEach((a) => {
			const key = `${a.album}___${a.artist}`.toLowerCase();
			if (!albumMap.has(key)) {
				albumMap.set(key, {
					id: a.id,
					album: a.album,
					artist: a.artist,
					tracks: a.tracks || [],
					coverUrl: a.coverUrl,
				});
			}
		});

		// 2. Albums extracted from tracks
		[...onlineSearchResults, ...allTracks].forEach((t) => {
			if (t.album && t.album.toLowerCase() !== "single") {
				const key = `${t.album}___${t.artist ?? ""}`.toLowerCase();
				const existing = albumMap.get(key);
				if (existing) {
					if (!existing.tracks.some((x) => x.id === t.id)) existing.tracks.push(t);
					if (!existing.coverUrl && t.cover_url) existing.coverUrl = t.cover_url;
				} else {
					albumMap.set(key, {
						id: `alb_${encodeURIComponent(t.album)}`,
						album: t.album,
						artist: t.artist ?? "Unknown Artist",
						tracks: [t],
						coverUrl: t.cover_url,
					});
				}
			}
		});

		return Array.from(albumMap.values());
	});

	const totalResultsCount = $derived(
		onlineSearchResults.length + matchingTracks.length + matchingPlaylists.length + matchingArtists.length + matchingAlbums.length
	);

	const topResult = $derived(onlineSearchResults[0] ?? matchingTracks[0] ?? null);

	const matchedArtist = $derived.by(() => {
		if (!trimmedQuery || matchingArtists.length === 0) return null;
		return (
			matchingArtists.find((a) => {
				const aName = a.name.toLowerCase();
				return aName === trimmedQuery || aName.startsWith(trimmedQuery) || trimmedQuery.startsWith(aName);
			}) || null
		);
	});

	const BROWSE_CATEGORIES = [
		{ name: "Bollywood Hits", color: "#e91429", query: "bollywood hits" },
		{ name: "Tamil Mass & Melody", color: "#e11d48", query: "tamil hits" },
		{ name: "Telugu Beats", color: "#d946ef", query: "telugu hits" },
		{ name: "Punjabi Hits", color: "#f97316", query: "punjabi hits" },
		{ name: "Pop Essentials", color: "#8c1932", query: "pop hits" },
		{ name: "Hip-Hop / Rap", color: "#bc5900", query: "hip hop hits" },
		{ name: "Lo-Fi & Chill", color: "#148a08", query: "lofi chill beats" },
		{ name: "Electronic & Dance", color: "#1e3264", query: "electronic dance" },
		{ name: "Indie / Acoustic", color: "#477d95", query: "indie hits" },
		{ name: "Kannada Top 20", color: "#f59e0b", query: "kannada hits" },
		{ name: "Malayalam Magic", color: "#06b6d4", query: "malayalam hits" },
		{ name: "Rock Classics", color: "#535353", query: "rock classics" },
	];

	const QUICK_SEARCH_CHIPS = [
		"Anirudh",
		"A.R. Rahman",
		"Sid Sriram",
		"The Weeknd",
		"Arijit Singh",
		"Taylor Swift",
		"Lo-Fi Chill",
		"Bollywood",
	];

	function handlePlaylistClick(pl: { id: string; query?: string; isUser?: boolean }) {
		goto(`/playlists/${pl.id}`);
	}

	function handleAlbumClick(album: { id?: string; album: string; artist: string; tracks?: Track[] }) {
		if (album.id?.startsWith("saavn_alb_") || album.id?.startsWith("tidal_alb_") || album.id?.startsWith("online_alb_")) {
			goto(`/playlists/${album.id}`);
		} else if (album.tracks && album.tracks.length > 0) {
			playTracks(album.tracks, 0);
		} else {
			searchOnlineMusic(`${album.album} ${album.artist}`, 20).then((res) => {
				if (res.tracks.length > 0) playTracks(res.tracks, 0);
			});
		}
	}
</script>

<svelte:head>
	<title>{query.trim() ? `Search "${query}"` : "Search Music"} — Mezzo</title>
</svelte:head>

<div class="search-page-container">
	<!-- Dedicated Search Bar & Input Section -->
	<header class="search-header-panel">
		<div class="search-input-wrapper">
			<svg viewBox="0 0 24 24" width="1.3rem" height="1.3rem" fill="none" stroke="currentColor" stroke-width="2.5" class="search-svg-icon">
				<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
			</svg>
			<input
				bind:this={searchInputEl}
				value={query}
				oninput={handleSearchInput}
				onkeydown={handleKeydown}
				type="text"
				inputmode="search"
				placeholder="What do you want to play?"
				class="primary-search-input"
				autocomplete="off"
				autocapitalize="none"
				spellcheck="false"
			/>
			{#if query}
				<button type="button" class="clear-search-btn" onclick={clearSearch} aria-label="Clear search input">
					<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			{/if}
		</div>

		<!-- Live Search Suggestion Tokens -->
		{#if suggestions.length > 0 && query.trim()}
			<div class="live-suggestions-tray" role="listbox" aria-label="Search suggestions">
				<div class="suggestions-header">
					<span class="suggestions-title">Suggestions</span>
				</div>
				<div class="suggestions-chips-row">
					{#each suggestions as sug}
						<button
							type="button"
							class="suggestion-chip-btn"
							onclick={() => selectSuggestion(sug)}
							title={`Search for "${sug}"`}
						>
							<svg viewBox="0 0 24 24" width="0.85rem" height="0.85rem" fill="none" stroke="currentColor" stroke-width="2.2" class="sug-glass">
								<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
							</svg>
							<span class="sug-term">{sug}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Quick Suggestion Chips (Shown on initial blank search) -->
		{#if !trimmedQuery}
			<div class="quick-chips-row">
				<span class="chips-label">Popular:</span>
				{#each QUICK_SEARCH_CHIPS as chip}
					<button
						type="button"
						class="search-chip"
						class:active={trimmedQuery === chip.toLowerCase()}
						onclick={() => setQuickSearch(chip)}
					>
						{chip}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Filter Tabs Bar (Pinned inside sticky header when query active) -->
		{#if trimmedQuery}
			<nav class="filter-tabs-wrapper" aria-label="Search result types">
				<button
					type="button"
					class="filter-pill"
					class:active={activeTab === "all"}
					onclick={() => (activeTab = "all")}
				>
					All
				</button>
				<button
					type="button"
					class="filter-pill"
					class:active={activeTab === "songs"}
					onclick={() => (activeTab = "songs")}
				>
					Songs ({onlineSearchResults.length})
				</button>
				<button
					type="button"
					class="filter-pill"
					class:active={activeTab === "artists"}
					onclick={() => (activeTab = "artists")}
				>
					Artists ({matchingArtists.length})
				</button>
				<button
					type="button"
					class="filter-pill"
					class:active={activeTab === "playlists"}
					onclick={() => (activeTab = "playlists")}
				>
					Playlists ({matchingPlaylists.length})
				</button>
				{#if matchingAlbums.length > 0}
					<button
						type="button"
						class="filter-pill"
						class:active={activeTab === "albums"}
						onclick={() => (activeTab = "albums")}
					>
						Albums ({matchingAlbums.length})
					</button>
				{/if}
			</nav>
		{/if}
	</header>

	<!-- Search Body Content -->
	{#if loadingOnline}
		<div class="search-loading-box">
			<div class="spotify-spinner"></div>
			<p>Searching millions of tracks, artists & playlists...</p>
		</div>
	{:else if !trimmedQuery}
		<!-- INITIAL EMPTY BROWSE VIEW -->
		<div class="browse-layout">
			<!-- Section: Browse All Categories -->
			<section class="search-content-section">
				<h2 class="section-title">Browse all</h2>
				<div class="category-cards-grid">
					{#each BROWSE_CATEGORIES as cat}
						<button
							type="button"
							class="category-tile"
							style="background-color: {cat.color};"
							onclick={() => setQuickSearch(cat.query)}
						>
							<span class="category-tile-title">{cat.name}</span>
						</button>
					{/each}
				</div>
			</section>

			<!-- Section: Curated Featured Playlists Preview -->
			<section class="search-content-section">
				<div class="section-heading-bar">
					<h2 class="section-title">Featured Playlists</h2>
					<a href="/playlists" class="view-more-btn">See all</a>
				</div>
				<div class="playlists-grid">
					{#each FEATURED_PLAYLISTS.slice(0, 8) as pl (pl.id)}
						<a href="/playlists/{pl.id}" class="playlist-card">
							<div class="card-cover-box">
								<img
									src={pl.cover || DEFAULT_PLAYLIST_COVER}
									alt={pl.name}
									class="playlist-img"
									loading="lazy"
									onerror={handlePlaylistImageError}
								/>
								<button
									type="button"
									class="card-play-btn"
									title="Play {pl.name}"
									onclick={async (e) => {
										e.preventDefault();
										e.stopPropagation();
										const res = await searchOnlineMusic(pl.query, 30);
										if (res.tracks.length > 0) playTracks(res.tracks, 0);
									}}
								>
									<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</button>
							</div>
							<div class="playlist-meta">
								<h3 class="playlist-title">{pl.name}</h3>
								<p class="playlist-desc">{pl.description}</p>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<!-- Section: Trending Online Tracks -->
			{#if trendingTracks.length > 0}
				<section class="search-content-section">
					<div class="section-heading-bar">
						<h2 class="section-title">Trending Tracks</h2>
						<button class="play-all-action-btn" onclick={() => playTracks(trendingTracks, 0)}>
							<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor">
								<polygon points="5 3 19 12 5 21 5 3" />
							</svg>
							Play All
						</button>
					</div>
					<div class="tracks-list-container">
						{#each trendingTracks.slice(0, 10) as track, i (track.id)}
							<TrackRow
								{track}
								index={i}
								playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
								onplay={() => playTracks(trendingTracks, i)}
							/>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{:else if totalResultsCount === 0}
		<div class="search-fallback-section">
			<div class="fallback-header">
				<h2>No results found for "{query}"</h2>
				<p>Please check your spelling, or try searching for another artist, song, or playlist.</p>
			</div>

			{#if trendingTracks.length > 0}
				<div class="section-heading-bar" style="margin-top: 2rem;">
					<h2 class="section-title">Explore Trending Hits</h2>
					<button class="play-all-action-btn" onclick={() => playTracks(trendingTracks, 0)}>
						<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor">
							<polygon points="5 3 19 12 5 21 5 3" />
						</svg>
						Play All
					</button>
				</div>
				<div class="tracks-list-container">
					{#each trendingTracks.slice(0, 10) as track, i (track.id)}
						<TrackRow
							{track}
							index={i}
							playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
							onplay={() => playTracks(trendingTracks, i)}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- TAB: ALL -->
		{#if activeTab === "all"}
			<!-- Top Result & Top 4 Songs Split View -->
			{#if matchedArtist || topResult}
				<div class="top-result-split-view">
					<!-- Top Result Card (Left) -->
					<div class="top-result-panel">
						<h2 class="section-title">Top result</h2>
						{#if matchedArtist}
							<!-- Artist Top Result Card (Spotify Style) -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="top-result-card artist-top-result"
								onclick={() => goto(`/artist/${encodeURIComponent(matchedArtist.name)}`)}
							>
								<img
									src={matchedArtist.image || DEFAULT_ALBUM_COVER}
									alt={matchedArtist.name}
									class="top-res-cover artist-circle-avatar"
									onerror={handleImageError}
								/>
								<h3 class="top-res-title">{matchedArtist.name}</h3>
								<div class="top-res-meta">
									<span class="top-res-type">Artist</span>
								</div>
								<div
									class="top-res-play-btn"
									title="Play {matchedArtist.name}"
									onclick={(e) => {
										e.stopPropagation();
										if (onlineSearchResults.length > 0) playTracks(onlineSearchResults, 0);
									}}
								>
									<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
						{:else if topResult}
							<!-- Song Top Result Card -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="top-result-card" onclick={() => playTracks(onlineSearchResults, 0)}>
								<img
									src={topResult.cover_url || getArtistMeta(topResult.artist ?? "").image || DEFAULT_ALBUM_COVER}
									alt={topResult.title}
									class="top-res-cover"
									onerror={handleImageError}
								/>
								<h3 class="top-res-title">{topResult.title}</h3>
								<div class="top-res-meta">
									{#if topResult.artist}
										<a href="/artist/{encodeURIComponent(topResult.artist)}" class="top-res-artist" onclick={(e) => e.stopPropagation()}>
											{topResult.artist}
										</a>
									{/if}
								</div>
								<div class="top-res-play-btn" title="Play">
									<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
						{/if}
					</div>

					<!-- Songs List (Right - Top 4) -->
					<div class="top-songs-panel">
						<div class="section-heading-bar">
							<h2 class="section-title">Songs</h2>
							{#if onlineSearchResults.length > 4}
								<button class="view-more-btn" onclick={() => (activeTab = "songs")}>
									See all ({onlineSearchResults.length})
								</button>
							{/if}
						</div>
						<div class="songs-table-wrap">
							{#each onlineSearchResults.slice(0, 4) as track, i (track.id)}
								<TrackRow
									{track}
									index={i}
									playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
									onplay={() => playTracks(onlineSearchResults, i)}
								/>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<!-- Matching Artists Row -->
			{#if matchingArtists.length > 0}
				<section class="search-content-section">
					<div class="section-heading-bar">
						<h2 class="section-title">Artists</h2>
						{#if matchingArtists.length > 6}
							<button class="view-more-btn" onclick={() => (activeTab = "artists")}>
								See all ({matchingArtists.length})
							</button>
						{/if}
					</div>
					<div class="artists-grid">
						{#each matchingArtists.slice(0, 6) as artist (artist.name)}
							<a href="/artist/{encodeURIComponent(artist.name)}" class="artist-card">
								<div class="artist-avatar-box">
									<img
										src={artist.image || DEFAULT_ALBUM_COVER}
										alt={artist.name}
										class="artist-img"
										loading="lazy"
										onerror={handleImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {artist.name}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (artist.tracks && artist.tracks.length > 0) {
												playTracks(artist.tracks, 0);
											} else {
												const res = await searchOnlineMusic(artist.name, 25);
												if (res.tracks.length > 0) playTracks(res.tracks, 0);
											}
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<h3 class="artist-name">{artist.name}</h3>
								<span class="artist-subtitle">Artist</span>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Matching Playlists Row -->
			{#if matchingPlaylists.length > 0}
				<section class="search-content-section">
					<div class="section-heading-bar">
						<h2 class="section-title">Playlists</h2>
						{#if matchingPlaylists.length > 6}
							<button class="view-more-btn" onclick={() => (activeTab = "playlists")}>
								See all ({matchingPlaylists.length})
							</button>
						{/if}
					</div>
					<div class="playlists-grid">
						{#each matchingPlaylists.slice(0, 6) as pl (pl.id)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="playlist-card" onclick={() => handlePlaylistClick(pl)}>
								<div class="card-cover-box">
									<img
										src={pl.coverUrl || DEFAULT_PLAYLIST_COVER}
										alt={pl.name}
										class="playlist-img"
										loading="lazy"
										onerror={handlePlaylistImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {pl.name}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (pl.id.startsWith("saavn_pl_") || pl.id.startsWith("radio_")) {
												try {
													const res = await getPlaylist(pl.id);
													if (res.tracks?.length > 0) {
														playTracks(res.tracks, 0);
														return;
													}
												} catch {}
											}
											const res = await searchOnlineMusic(pl.query || pl.name, 30);
											if (res.tracks.length > 0) playTracks(res.tracks, 0);
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<div class="playlist-meta">
									<h3 class="playlist-title">{pl.name}</h3>
									<p class="playlist-desc">{pl.description}</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- Matching Albums Row -->
			{#if matchingAlbums.length > 0}
				<section class="search-content-section">
					<div class="section-heading-bar">
						<h2 class="section-title">Albums</h2>
						{#if matchingAlbums.length > 6}
							<button class="view-more-btn" onclick={() => (activeTab = "albums")}>
								See all ({matchingAlbums.length})
							</button>
						{/if}
					</div>
					<div class="playlists-grid">
						{#each matchingAlbums.slice(0, 6) as album (`${album.album}_${album.artist}`)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="playlist-card" onclick={() => handleAlbumClick(album)}>
								<div class="card-cover-box">
									<img
										src={album.coverUrl || getArtistMeta(album.artist).image || DEFAULT_ALBUM_COVER}
										alt={album.album}
										class="playlist-img"
										loading="lazy"
										onerror={handleImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {album.album}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (album.tracks && album.tracks.length > 0) {
												playTracks(album.tracks, 0);
											} else if (album.id?.startsWith("saavn_alb_")) {
												try {
													const res = await getPlaylist(album.id);
													if (res.tracks?.length > 0) {
														playTracks(res.tracks, 0);
														return;
													}
												} catch {}
											}
											const res = await searchOnlineMusic(`${album.album} ${album.artist}`, 20);
											if (res.tracks.length > 0) playTracks(res.tracks, 0);
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<div class="playlist-meta">
									<h3 class="playlist-title">{album.album}</h3>
									<p class="playlist-desc">{album.artist}{album.tracks?.length ? ` • ${album.tracks.length} songs` : ""}</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- All Other Matching Songs (from index 4 onwards) -->
			{#if onlineSearchResults.length > 4}
				<section class="search-content-section">
					<h2 class="section-title">More Songs</h2>
					<div class="tracks-list-container">
						{#each onlineSearchResults.slice(4) as track, i (track.id)}
							<TrackRow
								{track}
								index={i + 4}
								playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
								onplay={() => playTracks(onlineSearchResults, i + 4)}
							/>
						{/each}
					</div>
				</section>
			{/if}
		{/if}

		<!-- TAB: SONGS (Complete list starting from 0) -->
		{#if activeTab === "songs"}
			<section class="search-content-section">
				<div class="section-heading-bar">
					<h2 class="section-title">All Matching Songs ({onlineSearchResults.length})</h2>
					{#if onlineSearchResults.length > 0}
						<button class="play-all-action-btn" onclick={() => playTracks(onlineSearchResults, 0)}>
							<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor">
								<polygon points="5 3 19 12 5 21 5 3" />
							</svg>
							Play All
						</button>
					{/if}
				</div>
				<div class="tracks-list-container">
					{#each onlineSearchResults as track, i (track.id)}
						<TrackRow
							{track}
							index={i}
							playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
							onplay={() => playTracks(onlineSearchResults, i)}
						/>
					{/each}
				</div>
			</section>
		{/if}

		<!-- TAB: ARTISTS -->
		{#if activeTab === "artists"}
			<section class="search-content-section">
				<h2 class="section-title">All Matching Artists ({matchingArtists.length})</h2>
				{#if matchingArtists.length === 0}
					<p class="tab-empty-hint">No artists matched "{query}".</p>
				{:else}
					<div class="artists-grid">
						{#each matchingArtists as artist (artist.name)}
							<a href="/artist/{encodeURIComponent(artist.name)}" class="artist-card">
								<div class="artist-avatar-box">
									<img
										src={artist.image || DEFAULT_ALBUM_COVER}
										alt={artist.name}
										class="artist-img"
										loading="lazy"
										onerror={handleImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {artist.name}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (artist.tracks && artist.tracks.length > 0) {
												playTracks(artist.tracks, 0);
											} else {
												const res = await searchOnlineMusic(artist.name, 25);
												if (res.tracks.length > 0) playTracks(res.tracks, 0);
											}
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<h3 class="artist-name">{artist.name}</h3>
								<span class="artist-subtitle">Artist</span>
							</a>
						{/each}
					</div>
				{/if}
			</section>
		{/if}

		<!-- TAB: PLAYLISTS -->
		{#if activeTab === "playlists"}
			<section class="search-content-section">
				<h2 class="section-title">Playlists ({matchingPlaylists.length})</h2>
				{#if matchingPlaylists.length === 0}
					<p class="tab-empty-hint">No playlists matched "{query}".</p>
				{:else}
					<div class="playlists-grid">
						{#each matchingPlaylists as pl (pl.id)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="playlist-card" onclick={() => handlePlaylistClick(pl)}>
								<div class="card-cover-box">
									<img
										src={pl.coverUrl || DEFAULT_PLAYLIST_COVER}
										alt={pl.name}
										class="playlist-img"
										loading="lazy"
										onerror={handlePlaylistImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {pl.name}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (pl.id.startsWith("saavn_pl_") || pl.id.startsWith("radio_")) {
												try {
													const res = await getPlaylist(pl.id);
													if (res.tracks?.length > 0) {
														playTracks(res.tracks, 0);
														return;
													}
												} catch {}
											}
											const res = await searchOnlineMusic(pl.query || pl.name, 30);
											if (res.tracks.length > 0) playTracks(res.tracks, 0);
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<div class="playlist-meta">
									<h3 class="playlist-title">{pl.name}</h3>
									<p class="playlist-desc">{pl.description}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}

		<!-- TAB: ALBUMS -->
		{#if activeTab === "albums"}
			<section class="search-content-section">
				<h2 class="section-title">Albums ({matchingAlbums.length})</h2>
				{#if matchingAlbums.length === 0}
					<p class="tab-empty-hint">No albums matched "{query}".</p>
				{:else}
					<div class="playlists-grid">
						{#each matchingAlbums as album (`${album.album}_${album.artist}`)}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div class="playlist-card" onclick={() => handleAlbumClick(album)}>
								<div class="card-cover-box">
									<img
										src={album.coverUrl || getArtistMeta(album.artist).image || DEFAULT_ALBUM_COVER}
										alt={album.album}
										class="playlist-img"
										loading="lazy"
										onerror={handleImageError}
									/>
									<button
										type="button"
										class="card-play-btn"
										title="Play {album.album}"
										onclick={async (e) => {
											e.preventDefault();
											e.stopPropagation();
											if (album.tracks && album.tracks.length > 0) {
												playTracks(album.tracks, 0);
											} else if (album.id?.startsWith("saavn_alb_")) {
												try {
													const res = await getPlaylist(album.id);
													if (res.tracks?.length > 0) {
														playTracks(res.tracks, 0);
														return;
													}
												} catch {}
											}
											const res = await searchOnlineMusic(`${album.album} ${album.artist}`, 20);
											if (res.tracks.length > 0) playTracks(res.tracks, 0);
										}}
									>
										<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
											<polygon points="6 4 20 12 6 20 6 4" />
										</svg>
									</button>
								</div>
								<div class="playlist-meta">
									<h3 class="playlist-title">{album.album}</h3>
									<p class="playlist-desc">{album.artist}{album.tracks?.length ? ` • ${album.tracks.length} tracks` : ""}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<style lang="scss">
	.search-page-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 0.5rem 0.5rem 6rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	/* Search Header Panel */
	.search-header-panel {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: sticky;
		top: 0;
		z-index: 25;
		background: #121212;
		padding: 0.35rem 0 0.5rem;
	}

	.search-input-wrapper {
		position: relative;
		display: none;
		align-items: center;
		width: 100% !important;
		max-width: 100% !important;

		@media screen and (max-width: 1024px) {
			display: flex !important;
		}

		.search-svg-icon {
			position: absolute;
			left: 1rem;
			color: #b3b3b3 !important;
			stroke: #b3b3b3 !important;
			pointer-events: none;
			z-index: 2;
		}

		.primary-search-input {
			width: 100% !important;
			height: 2.65rem !important;
			background: #242424 !important;
			border: 1px solid rgba(255, 255, 255, 0.12) !important;
			border-radius: 9999px !important;
			padding: 0 2.5rem 0 2.8rem !important;
			color: #ffffff !important;
			font-size: 0.9rem !important;
			font-weight: 500 !important;
			outline: none !important;
			box-sizing: border-box !important;
			touch-action: manipulation;
			box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4) !important;
			transition: all 150ms ease !important;

			&::-webkit-search-decoration,
			&::-webkit-search-cancel-button,
			&::-webkit-search-results-button,
			&::-webkit-search-results-decoration {
				-webkit-appearance: none;
				appearance: none;
				display: none;
			}

			&::placeholder {
				color: #a7a7a7 !important;
				font-weight: 400 !important;
			}

			&:focus {
				border-color: #ffffff !important;
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.6) !important;
			}
		}

		.clear-search-btn {
			position: absolute;
			right: 0.85rem;
			background: transparent !important;
			border: none !important;
			color: #b3b3b3 !important;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 0.4rem;
			border-radius: 50%;
			transition: all 120ms ease;

			&:hover {
				color: #ffffff !important;
				background: rgba(255, 255, 255, 0.12) !important;
			}
		}
	}

	.live-suggestions-tray {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(24, 24, 27, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 14px;
		padding: 0.75rem 1rem;
		margin-top: 0.35rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		animation: fadeInSug 160ms cubic-bezier(0.16, 1, 0.3, 1);

		.suggestions-header {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.suggestions-title {
				font-size: 0.72rem;
				font-weight: 700;
				text-transform: uppercase;
				letter-spacing: 0.08em;
				color: rgba(255, 255, 255, 0.45);
			}
		}

		.suggestions-chips-row {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			overflow-x: auto;
			flex-wrap: wrap;
			scrollbar-width: none;
			-webkit-overflow-scrolling: touch;

			&::-webkit-scrollbar {
				display: none;
			}
		}

		.suggestion-chip-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 9999px;
			color: #e4e4e7;
			font-size: 0.82rem;
			font-weight: 500;
			padding: 0.4rem 0.85rem;
			cursor: pointer;
			white-space: nowrap;
			transition: all 140ms ease;

			.sug-glass {
				color: rgba(255, 255, 255, 0.45);
				flex-shrink: 0;
				transition: color 120ms ease;
			}

			&:hover {
				background: rgba(255, 255, 255, 0.18) !important;
				border-color: rgba(255, 255, 255, 0.25);
				color: #ffffff !important;
				transform: translateY(-1px);

				.sug-glass {
					color: #ffffff !important;
				}
			}

			&:active {
				transform: translateY(0);
				background: rgba(255, 255, 255, 0.22) !important;
			}
		}
	}

	@keyframes fadeInSug {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.quick-chips-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		overflow-x: auto;
		flex-wrap: nowrap;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		padding-bottom: 0.25rem;

		&::-webkit-scrollbar {
			display: none;
		}

		.chips-label {
			font-size: 0.78rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: rgba(255, 255, 255, 0.4);
			margin-right: 0.2rem;
			white-space: nowrap;
			flex-shrink: 0;
		}

		.search-chip {
			background: rgba(255, 255, 255, 0.07);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 9999px;
			color: rgba(255, 255, 255, 0.8);
			font-size: 0.8rem;
			font-weight: 600;
			padding: 0.35rem 0.85rem;
			cursor: pointer;
			white-space: nowrap;
			flex-shrink: 0;
			transition: all 140ms ease;

			&:hover {
				background: rgba(255, 255, 255, 0.15);
				color: #ffffff;
				transform: translateY(-1px);
			}

			&.active {
				background: #1ed760;
				color: #000000;
				border-color: #1ed760;
			}
		}
	}

	/* Filter Pills Navigation */
	.filter-tabs-wrapper {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		overflow-x: auto;
		padding: 0.15rem 0 0.25rem;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;

		&::-webkit-scrollbar {
			display: none;
		}

		.filter-pill {
			background: #282828;
			border: none;
			border-radius: 9999px;
			color: #ffffff;
			padding: 0.35rem 0.85rem;
			font-size: 0.78rem;
			font-weight: 600;
			cursor: pointer;
			white-space: nowrap;
			transition: all 140ms ease;

			&:hover {
				background: #333333;
			}

			&.active {
				background: #ffffff;
				color: #000000;
				font-weight: 700;
			}
		}
	}

	/* Content Layout */
	.browse-layout {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.search-content-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-heading-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 1.45rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #ffffff;
		margin: 0;
	}

	.view-more-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		transition: color 120ms;

		&:hover {
			color: #ffffff;
			text-decoration: underline;
		}
	}

	.play-all-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 9999px;
		padding: 0.4rem 1rem;
		color: #ffffff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 120ms;

		&:hover {
			background: #ffffff;
			color: #000000;
			transform: scale(1.02);
		}
	}

	/* Category Tiles Grid */
	.category-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
		gap: 1.25rem;
	}

	.category-tile {
		position: relative;
		height: 8.5rem;
		border-radius: 0.85rem;
		padding: 1.25rem;
		border: none;
		cursor: pointer;
		text-align: left;
		overflow: hidden;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
		transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 160ms ease;

		&:hover {
			transform: translateY(-4px) scale(1.02);
			box-shadow: 0 10px 24px rgba(0, 0, 0, 0.5);
		}

		.category-tile-title {
			color: #ffffff;
			font-size: 1.35rem;
			font-weight: 800;
			letter-spacing: -0.02em;
			line-height: 1.2;
			display: block;
			word-break: break-word;
		}
	}

	/* Playlists & Albums Horizontal Scroll */
	.playlists-grid {
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

	.playlist-card {
		flex: 0 0 138px;
		width: 138px;
		scroll-snap-align: start;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.65rem;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		transition: all 180ms ease;

		&:hover {
			background: #242424;
			border-color: rgba(255, 255, 255, 0.14);
			transform: translateY(-3px);

			.card-play-btn {
				opacity: 1 !important;
				transform: translateY(0) scale(1) !important;
			}
		}

		.card-cover-box {
			position: relative;
			width: 100%;
			aspect-ratio: 1/1;
			border-radius: 0.45rem;
			overflow: hidden;
			margin-bottom: 0.55rem;
			background: #242424;
			box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);

			.playlist-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.card-play-btn {
				position: absolute;
				bottom: 0.4rem;
				right: 0.4rem;
				width: 2.3rem;
				height: 2.3rem;
				border-radius: 50%;
				background: #1ed760;
				color: #000000;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
				opacity: 0;
				transform: translateY(6px);
				transition: all 180ms ease;

				svg {
					margin-left: 2px;
				}
			}
		}

		.playlist-meta {
			.playlist-title {
				font-size: 0.82rem;
				font-weight: 700;
				color: #ffffff;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.playlist-desc {
				font-size: 0.72rem;
				color: rgba(255, 255, 255, 0.5);
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		@media screen and (max-width: 600px) {
			flex: 0 0 118px;
			width: 118px;
			padding: 0.5rem;
		}
	}

	/* Artists Horizontal Scroll */
	.artists-grid {
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

	.artist-card {
		flex: 0 0 125px;
		width: 125px;
		scroll-snap-align: start;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.65rem;
		padding: 0.65rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		text-decoration: none;
		transition: all 180ms ease;

		&:hover {
			background: #242424;
			border-color: rgba(255, 255, 255, 0.14);
			transform: translateY(-3px);

			.card-play-btn {
				opacity: 1 !important;
				transform: translateY(0) scale(1) !important;
			}
		}

		.artist-avatar-box {
			position: relative;
			width: 100%;
			max-width: 90px;
			aspect-ratio: 1/1;
			border-radius: 50%;
			overflow: hidden;
			margin-bottom: 0.55rem;
			background: #242424;
			box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);

			.artist-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.card-play-btn {
				position: absolute;
				bottom: 0.35rem;
				right: 0.35rem;
				width: 2.1rem;
				height: 2.1rem;
				border-radius: 50%;
				background: #1ed760;
				color: #000000;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
				opacity: 0;
				transform: translateY(4px) scale(0.9);
				transition: all 180ms cubic-bezier(0.4, 0, 0.2, 1);

				svg {
					margin-left: 2px;
				}
			}
		}

		.artist-name {
			font-size: 0.95rem;
			font-weight: 700;
			color: #ffffff;
			margin: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			width: 100%;
		}

		.artist-subtitle {
			font-size: 0.78rem;
			color: rgba(255, 255, 255, 0.5);
			margin-top: 0.2rem;
		}
	}

	/* Top Result Split View */
	.top-result-split-view {
		display: grid;
		grid-template-columns: minmax(18rem, 24rem) 1fr;
		gap: 1.75rem;

		@media screen and (max-width: 840px) {
			grid-template-columns: 1fr;
		}
	}

	.top-result-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.top-result-card {
		position: relative;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.85rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		transition: all 180ms ease;

		&:hover {
			background: #282828;
			border-color: rgba(255, 255, 255, 0.14);

			.top-res-play-btn {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}

		.top-res-cover {
			width: 5.5rem;
			height: 5.5rem;
			border-radius: 0.6rem;
			object-fit: cover;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
			margin-bottom: 1.25rem;

			&.artist-circle-avatar {
				border-radius: 50% !important;
			}
		}

		.top-res-title {
			font-size: 1.6rem;
			font-weight: 800;
			color: #ffffff;
			margin: 0 0 0.5rem;
			line-height: 1.2;
			display: -webkit-box;
			line-clamp: 2;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.top-res-meta {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			margin-top: auto;

			.top-res-artist {
				font-size: 0.95rem;
				font-weight: 600;
				color: rgba(255, 255, 255, 0.7);
				text-decoration: none;

				&:hover {
					color: #ffffff;
					text-decoration: underline;
				}
			}

			.top-res-type {
				font-size: 0.8rem;
				font-weight: 500;
				color: #b3b3b3;
			}
		}

		.top-res-play-btn {
			position: absolute;
			bottom: 1.5rem;
			right: 1.5rem;
			width: 3.2rem;
			height: 3.2rem;
			border-radius: 50%;
			background: #1ed760;
			color: #000000;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
			opacity: 0;
			transform: translateY(8px) scale(0.9);
			transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);

			svg {
				margin-left: 2px;
			}

			&:hover {
				background: #1fdf64;
				transform: scale(1.08) !important;
			}
		}
	}

	.top-songs-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.songs-table-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tracks-list-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	/* Search Loading */
	.search-loading-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 6rem 2rem;
		gap: 1rem;

		p {
			color: rgba(255, 255, 255, 0.6);
			margin: 0;
			font-size: 0.95rem;
		}
	}

	.tab-empty-hint {
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.95rem;
		padding: 2rem 0;
	}

	.spotify-spinner {
		width: 2.5rem;
		height: 2.5rem;
		border: 3px solid rgba(255, 255, 255, 0.15);
		border-top-color: #1ed760;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}



	.search-fallback-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem 0;

		.fallback-header {
			h2 {
				color: #fff;
				font-size: 1.4rem;
				font-weight: 700;
				margin: 0 0 0.35rem;
			}

			p {
				color: rgba(255, 255, 255, 0.6);
				font-size: 0.92rem;
				margin: 0;
			}
		}
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
