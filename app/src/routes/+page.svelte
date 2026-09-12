<script lang="ts">
	import { untrack } from "svelte";
	import { useSharedSession } from "$lib/session.svelte";
	import {
		playTracks,
		playerCurrentTrack,
		playerPlaying,
		playerRecentlyPlayed,
		clearRecentlyPlayed,
		coverUrl,
	} from "$lib/stores/player.svelte";
	import type { Track, Playlist } from "$lib/stores/player.svelte";
	import { userPreferences, getArtistMeta, POPULAR_ARTISTS, LANGUAGE_SEARCH_TERMS } from "$lib/stores/preferences.svelte";
	import { getOnlineTrending, searchOnlineMusic, getPlaylists, getPlaylist } from "$lib/api";
	import TrackRow from "$lib/components/TrackRow.svelte";
	import { FEATURED_PLAYLISTS } from "$lib/featured-playlists";

	import { likedStore } from "$lib/stores/liked.svelte";

	const sessionAtom = useSharedSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const user = $derived(sessionData?.data?.user ?? null);
	const userName = $derived(user?.name ? user.name.split(" ")[0] : "Listener");

	let trendingTracks = $state<Track[]>([]);
	let artistMixTracks = $state<{ artist: string; tracks: Track[]; coverUrl?: string; gradient: string }[]>([]);
	let becauseYouListened = $state<{ artist: string; tracks: Track[] } | null>(null);
	let recommendedSections = $state<{ title: string; kicker: string; tracks: Track[] }[]>([]);
	let userPlaylists = $state<Playlist[]>([]);
	let loading = $state(true);
	$effect(() => {
		if (sessionData !== undefined && !sessionData.isPending) {
			const userKey = user?.email || user?.id;
			if (userKey) {
				userPreferences.loadFromStorage(userKey);
			}

			const isDone = userPreferences.isUserOnboarded(userKey);
			const hasExistingData = untrack(
				() =>
					likedStore.tracks.length > 0 ||
					userPlaylists.length > 0 ||
					playerRecentlyPlayed.value.length > 0,
			);

			if (isDone || hasExistingData) {
				userPreferences.completeOnboarding(userKey);
				userPreferences.showOnboarding = false;
			}
		}
	});

	// Dynamic time-based greeting
	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 18) return "Good afternoon";
		return "Good evening";
	});

	// Dynamic User Taste Profile derived directly from tracks the user actually listens to and likes
	const userTaste = $derived.by(() => {
		const history = [...playerRecentlyPlayed.value, ...likedStore.tracks];
		if (history.length === 0) {
			return {
				hasHistory: false,
				topArtists: [] as string[],
				latestArtist: null as string | null,
				topGenres: [] as string[],
			};
		}

		const artistFrequency = new Map<string, number>();
		const orderedArtists: string[] = [];
		const genreFrequency = new Map<string, number>();

		for (const track of history) {
			if (track.artist) {
				const mainArtist = track.artist.split(/[,&/]|(?:feat\.?)|(?:ft\.?)/i)[0].trim();
				if (mainArtist && mainArtist.length > 1) {
					artistFrequency.set(mainArtist, (artistFrequency.get(mainArtist) || 0) + 1);
					if (!orderedArtists.includes(mainArtist)) {
						orderedArtists.push(mainArtist);
					}
				}
			}
			if (track.genre && track.genre !== "Music" && track.genre !== "LOSSLESS") {
				genreFrequency.set(track.genre, (genreFrequency.get(track.genre) || 0) + 1);
			}
		}

		const sortedArtists = Array.from(artistFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([a]) => a);

		const sortedGenres = Array.from(genreFrequency.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([g]) => g);

		return {
			hasHistory: true,
			topArtists: sortedArtists.slice(0, 6),
			latestArtist: orderedArtists[0] || null,
			topGenres: sortedGenres.slice(0, 4),
		};
	});

	const activeArtists = $derived.by(() => {
		// 1. If user has played music, use their real most-listened artists!
		if (userTaste.hasHistory && userTaste.topArtists.length > 0) {
			return userTaste.topArtists.slice(0, 4);
		}
		// 2. Explicit favorite artists from settings
		if (userPreferences.favoriteArtists.length > 0) {
			return userPreferences.favoriteArtists.slice(0, 4);
		}
		// 3. Match top artists according to user's selected languages
		const userLangs = userPreferences.languages.map((l) => l.toLowerCase());
		const matchedFromLangs = POPULAR_ARTISTS
			.filter((a) => a.languages.some((l) => userLangs.includes(l.toLowerCase())))
			.map((a) => a.name);
		if (matchedFromLangs.length > 0) {
			return matchedFromLangs.slice(0, 4);
		}
		// 4. Diverse global and multi-genre spread
		return ["Arijit Singh", "The Weeknd", "Diljit Dosanjh", "Taylor Swift"];
	});

	const quickMixTiles = $derived.by(() => {
		const list: Array<{ title: string; tracks: Track[]; coverUrl: string; link: string }> = [];

		if (becauseYouListened && becauseYouListened.tracks.length > 0) {
			list.push({
				title: `${becauseYouListened.artist} Mix`,
				tracks: becauseYouListened.tracks,
				coverUrl: becauseYouListened.tracks[0]?.cover_url || getArtistMeta(becauseYouListened.artist).image,
				link: `/artist/${encodeURIComponent(becauseYouListened.artist)}`,
			});
		}

		for (const mix of artistMixTracks) {
			if (list.length >= 4) break;
			if (list.some((x) => x.title.includes(mix.artist))) continue;
			list.push({
				title: `${mix.artist} Mix`,
				tracks: mix.tracks,
				coverUrl: mix.coverUrl || getArtistMeta(mix.artist).image,
				link: `/artist/${encodeURIComponent(mix.artist)}`,
			});
		}

		if (list.length < 4) {
			for (const sec of recommendedSections) {
				if (list.length >= 4) break;
				list.push({
					title: sec.title,
					tracks: sec.tracks,
					coverUrl: sec.tracks[0]?.cover_url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
					link: `/search?q=${encodeURIComponent(sec.title)}`,
				});
			}
		}

		return list;
	});

	const sortedPopularArtists = $derived.by(() => {
		// If user has listening history, prioritize artists matching their genres and top artists
		if (userTaste.hasHistory) {
			const userArts = userTaste.topArtists.map((a) => a.toLowerCase());
			const userGenres = userTaste.topGenres.map((g) => g.toLowerCase());
			return [...POPULAR_ARTISTS]
				.sort((a, b) => {
					const aMatchArt = userArts.some((art) => a.name.toLowerCase().includes(art));
					const bMatchArt = userArts.some((art) => b.name.toLowerCase().includes(art));
					if (aMatchArt && !bMatchArt) return -1;
					if (!aMatchArt && bMatchArt) return 1;

					const aMatchGenre = userGenres.some((g) => a.genre.toLowerCase().includes(g));
					const bMatchGenre = userGenres.some((g) => b.genre.toLowerCase().includes(g));
					if (aMatchGenre && !bMatchGenre) return -1;
					if (!aMatchGenre && bMatchGenre) return 1;
					return 0;
				})
				.slice(0, 8);
		}

		const userLangs = userPreferences.languages.map((l) => l.toLowerCase());
		if (userLangs.length === 0) return POPULAR_ARTISTS.slice(0, 8);

		return [...POPULAR_ARTISTS]
			.sort((a, b) => {
				const aMatch = a.languages.some((l) => userLangs.includes(l.toLowerCase()));
				const bMatch = b.languages.some((l) => userLangs.includes(l.toLowerCase()));
				if (aMatch && !bMatch) return -1;
				if (!aMatch && bMatch) return 1;
				return 0;
			})
			.slice(0, 8);
	});

	async function handlePlayFeatured(query: string) {
		try {
			const res = await searchOnlineMusic(query, 15);
			if (res.tracks?.length > 0) {
				playTracks(res.tracks, 0);
			}
		} catch {}
	}

	async function handlePlayUserPlaylist(e: MouseEvent, plId: string) {
		e.stopPropagation();
		try {
			const data = await getPlaylist(plId);
			if (data.tracks?.length > 0) {
				playTracks(data.tracks, 0);
			}
		} catch {}
	}

	let homeContentLoading = false;
	let homeContentQueued = false;
	async function loadHomeContent() {
		if (homeContentLoading) {
			homeContentQueued = true;
			return;
		}
		homeContentLoading = true;
		loading = true;
		try {
			// 1. Fetch Global Trending tracks
			const trPromise = getOnlineTrending(15).catch(() => ({ tracks: [] }));

			// 2. Compute dynamic recommendations based on user's actual listening
			const taste = userTaste;

			// 3. Artist Mixes for their actual top artists
			const favs = activeArtists.slice(0, 4);
			const artistPromises = favs.map(async (art) => {
				const res = await searchOnlineMusic(art, 8).catch(() => ({ tracks: [] }));
				const meta = getArtistMeta(art);
				const tracks = res.tracks ?? [];
				return {
					artist: art,
					tracks,
					coverUrl: meta.image,
					gradient: meta.gradient,
				};
			});

			// 4. "Because you listened to [Latest Artist]"
			let becausePromise: Promise<any> = Promise.resolve(null);
			if (taste.hasHistory && taste.latestArtist) {
				becausePromise = searchOnlineMusic(taste.latestArtist, 8)
					.then((res) => ({ artist: taste.latestArtist!, tracks: res.tracks ?? [] }))
					.catch(() => null);
			}

			// 5. Genre / Vibe Discovery Mixes (adapting to their played genres or preferred languages)
			let genresToFetch: string[] = [];
			if (taste.hasHistory && taste.topGenres.length > 0) {
				genresToFetch = taste.topGenres.slice(0, 3);
			} else {
				const langQueries = userPreferences.languages
					.map((l) => LANGUAGE_SEARCH_TERMS[l] || `${l} Top Hits`)
					.filter(Boolean);
				if (langQueries.length > 0) {
					genresToFetch = langQueries.slice(0, 3);
				} else {
					genresToFetch = ["Bollywood Top Hits", "Global Pop Hits", "Punjabi Top Hits"];
				}
			}

			const genrePromises = genresToFetch.map(async (g) => {
				const cleanQuery = g.includes("Hits") || g.includes("Dance") ? g : `${g} Hits`;
				const res = await searchOnlineMusic(cleanQuery, 8).catch(() => ({ tracks: [] }));
				return {
					title: g.includes("Hits") || g.includes("Dance") ? g : `${g} Mix`,
					kicker: taste.hasHistory ? "BASED ON YOUR VIBES" : "FEATURED VIBE",
					tracks: res.tracks ?? [],
				};
			});

			// 6. User playlists if authed
			const plPromise = getPlaylists().catch(() => ({ playlists: [] }));

			const [tr, mixes, becauseRes, genreRes, plRes] = await Promise.all([
				trPromise,
				Promise.all(artistPromises),
				becausePromise,
				Promise.all(genrePromises),
				plPromise,
			]);

			trendingTracks = tr.tracks ?? [];
			artistMixTracks = mixes.filter((m) => m.tracks.length > 0);
			becauseYouListened = becauseRes && becauseRes.tracks.length > 0 ? becauseRes : null;
			recommendedSections = genreRes.filter((s) => s.tracks.length > 0);
			userPlaylists = plRes.playlists ?? [];
		} catch {
			// ignore
		} finally {
			loading = false;
			homeContentLoading = false;
			if (homeContentQueued) {
				homeContentQueued = false;
				queueMicrotask(() => void loadHomeContent());
			}
		}
	}

	$effect(() => {
		// Reactive reload whenever user plays or likes tracks, or updates preferences
		void playerRecentlyPlayed.value.length;
		void likedStore.tracks.length;
		void userPreferences.languages.join(",");
		void userPreferences.favoriteArtists.join(",");
		loadHomeContent();
	});

	const GENRE_CARDS = [
		{ name: "Pop", color: "#8c1932", query: "pop" },
		{ name: "Hip-Hop", color: "#bc5900", query: "hip hop" },
		{ name: "Electronic", color: "#1e3264", query: "electronic" },
		{ name: "Indie / Alt", color: "#477d95", query: "indie" },
		{ name: "Bollywood", color: "#e91429", query: "bollywood" },
		{ name: "Rock", color: "#777777", query: "rock" },
		{ name: "Dance & EDM", color: "#d84000", query: "dance edm" },
		{ name: "R&B / Soul", color: "#e1118c", query: "r&b soul" },
	];
</script>

<svelte:head>
	<title>Home — Mezzo Web Player</title>
</svelte:head>

<div class="home-page">
	<!-- Atmospheric Ambient Header -->
	<div class="ambient-header">
		<div class="greeting-row">
			<div class="greeting-text">
				<h1 class="greeting-title">{greeting}, {userName}</h1>
				<div class="pref-meta-row">
					{#if userTaste.hasHistory && userTaste.topArtists.length > 0}
						<span class="pref-label">Your Vibes:</span>
						{#each userTaste.topArtists.slice(0, 3) as art}
							<span class="pref-pill artist">{art}</span>
						{/each}
						{#each userTaste.topGenres.slice(0, 2) as g}
							<span class="pref-pill">{g}</span>
						{/each}
					{:else}
						<span class="pref-label">Languages:</span>
						{#each userPreferences.languages as lang}
							<span class="pref-pill">{lang}</span>
						{/each}
						{#if userPreferences.favoriteArtists.length > 0}
							<span class="pref-label">• Favorites:</span>
							{#each userPreferences.favoriteArtists.slice(0, 3) as art}
								<span class="pref-pill artist">{art}</span>
							{/each}
							{#if userPreferences.favoriteArtists.length > 3}
								<span class="pref-pill more">+{userPreferences.favoriteArtists.length - 3}</span>
							{/if}
						{/if}
					{/if}
				</div>
			</div>

			<button
				type="button"
				class="customize-pref-btn"
				title="Customize music languages and favorite artists"
				onclick={() => userPreferences.openOnboarding()}
			>
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
				</svg>
				<span>Tune Feed</span>
			</button>
		</div>

		<!-- Spotify Quick Jump Grid (Top 6 Cards with Hover Play) -->
		<div class="quick-grid">
			<!-- 1. Liked Songs Card -->
			<a href="/playlists/liked" class="quick-tile">
				<div class="tile-art liked-art">
					<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="currentColor">
						<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
					</svg>
				</div>
				<span class="tile-title">Liked Songs</span>
				<div class="tile-play-btn" title="Play Liked Songs">
					<svg viewBox="0 0 24 24" width="1.3rem" height="1.3rem" fill="currentColor">
						<polygon points="6 4 20 12 6 20 6 4" />
					</svg>
				</div>
			</a>

			<!-- 2. Global Trending Card -->
			{#if trendingTracks.length > 0}
				<a href="/search" class="quick-tile">
					<div class="tile-art fire-art">
						<svg viewBox="0 0 24 24" width="1.6rem" height="1.6rem" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
						</svg>
					</div>
					<span class="tile-title">Global Trending Hits</span>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="tile-play-btn"
						title="Play All Global Trending"
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); playTracks(trendingTracks, 0); }}
					>
						<svg viewBox="0 0 24 24" width="1.3rem" height="1.3rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
					</div>
				</a>
			{/if}

			<!-- 3-6. Personalized Quick Jump Cards (Artist mixes & Language hits) -->
			{#each quickMixTiles as mix (mix.title)}
				<a href={mix.link} class="quick-tile">
					<img
						src={mix.coverUrl}
						alt={mix.title}
						class="tile-img"
						onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
					/>
					<span class="tile-title">{mix.title}</span>
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="tile-play-btn"
						title="Play {mix.title}"
						onclick={(e) => { e.preventDefault(); e.stopPropagation(); playTracks(mix.tracks, 0); }}
					>
						<svg viewBox="0 0 24 24" width="1.3rem" height="1.3rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
					</div>
				</a>
			{/each}
		</div>
	</div>

	{#if loading && trendingTracks.length === 0}
		<div class="home-loading">
			<div class="spotify-spinner"></div>
			<p>Loading recommendations & trending charts...</p>
		</div>
	{:else}
		<!-- 1. Section: Previously Listened Music ("Jump Back In") -->
		{#if playerRecentlyPlayed.value.length > 0}
			<section class="spotify-section">
				<div class="section-title-bar">
					<div>
						<span class="section-kicker">RECENTLY PLAYED</span>
						<h2 class="section-heading">Jump Back In</h2>
					</div>
					<div class="section-actions-row">
						<button class="spotify-play-btn" onclick={() => playTracks(playerRecentlyPlayed.value, 0)}>
							<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
								<polygon points="6 4 20 12 6 20 6 4" />
							</svg>
							<span>Play All</span>
						</button>
						<button class="clear-recent-btn" onclick={clearRecentlyPlayed} title="Clear recently played history">
							Clear
						</button>
					</div>
				</div>

				<div class="mix-cards-grid">
					{#each playerRecentlyPlayed.value.slice(0, 10) as track, i (track.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="mix-card" onclick={() => playTracks(playerRecentlyPlayed.value, i)}>
							<div class="card-cover-wrap">
								<img
									src={coverUrl(track)}
									alt={track.title}
									class="card-cover-img"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
								/>
								<div class="card-play-hover" title="Play {track.title}">
									<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
							<div class="card-meta">
								<h3 class="card-title">{track.title}</h3>
								<p class="card-subtitle">{track.artist || "Unknown Artist"}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 1. Section: Because You Listened (Adaptive to recent listening history) -->
		{#if becauseYouListened && becauseYouListened.tracks.length > 0}
			<section class="spotify-section">
				<div class="section-title-bar">
					<div>
						<span class="section-kicker">BECAUSE YOU LISTENED TO {becauseYouListened.artist.toUpperCase()}</span>
						<h2 class="section-heading">More by {becauseYouListened.artist} & Similar</h2>
					</div>
					<button class="spotify-play-btn" onclick={() => playTracks(becauseYouListened!.tracks, 0)}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
						<span>Play All</span>
					</button>
				</div>

				<div class="mix-cards-grid">
					{#each becauseYouListened.tracks.slice(0, 6) as track, i (track.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="mix-card" onclick={() => playTracks(becauseYouListened!.tracks, i)}>
							<div class="card-cover-wrap">
								<img
									src={track.cover_url || getArtistMeta(track.artist ?? "").image}
									alt={track.title}
									class="card-cover-img"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
								/>
								<div class="card-play-hover" title="Play {track.title}">
									<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
							<div class="card-meta">
								<h3 class="card-title">{track.title}</h3>
								<p class="card-subtitle">{track.artist || "Various Artists"}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 2. Section: Favorite Artist Mixes (Made For You) -->
		{#if artistMixTracks.length > 0}
			<section class="spotify-section">
				<div class="section-title-bar">
					<div>
						<span class="section-kicker">MADE FOR YOU</span>
						<h2 class="section-heading">Your Top Artist Mixes</h2>
					</div>
				</div>

				<div class="mix-cards-grid">
					{#each artistMixTracks as mix (mix.artist)}
						<a href="/artist/{encodeURIComponent(mix.artist)}" class="mix-card">
							<div class="card-cover-wrap">
								<img
									src={mix.coverUrl}
									alt={mix.artist}
									class="card-cover-img"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
								/>
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="card-play-hover"
									title="Play {mix.artist} Mix"
									onclick={(e) => { e.preventDefault(); e.stopPropagation(); playTracks(mix.tracks, 0); }}
								>
									<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
							<div class="card-meta">
								<h3 class="card-title">{mix.artist} Mix</h3>
								<p class="card-subtitle">{mix.tracks.length} tracks • By Mezzo</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- 3. Section: Dynamic Recommended / Vibe Discovery Mixes -->
		{#each recommendedSections as sec (sec.title)}
			<section class="spotify-section">
				<div class="section-title-bar">
					<div>
						<span class="section-kicker">{sec.kicker}</span>
						<h2 class="section-heading">{sec.title}</h2>
					</div>
					<button class="spotify-play-btn" onclick={() => playTracks(sec.tracks, 0)}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
						<span>Play All</span>
					</button>
				</div>

				<div class="mix-cards-grid">
					{#each sec.tracks.slice(0, 6) as track, i (track.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="mix-card" onclick={() => playTracks(sec.tracks, i)}>
							<div class="card-cover-wrap">
								<img
									src={track.cover_url || getArtistMeta(track.artist ?? "").image}
									alt={track.title}
									class="card-cover-img"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
								/>
								<div class="card-play-hover" title="Play {track.title}">
									<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
										<polygon points="6 4 20 12 6 20 6 4" />
									</svg>
								</div>
							</div>
							<div class="card-meta">
								<h3 class="card-title">{track.title}</h3>
								<p class="card-subtitle">{track.artist || "Various Artists"}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/each}

		<!-- 3. Section: Popular Artists (Positioned Below Trending Language Mixes) -->
		<section class="spotify-section">
			<div class="section-title-bar">
				<div>
					<span class="section-kicker">POPULAR ARTISTS</span>
					<h2 class="section-heading">Artists You Might Love</h2>
				</div>
			</div>

			<div class="artist-cards-grid">
				{#each sortedPopularArtists.slice(0, 8) as artist (artist.name)}
					<a href="/artist/{encodeURIComponent(artist.name)}" class="artist-card">
						<div class="artist-circle">
							<img
								src={artist.image}
								alt={artist.name}
								class="artist-circle-img"
								loading="lazy"
								onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'; }}
							/>
							<div class="card-play-hover" title="Play {artist.name}">
								<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</div>
						</div>
						<div class="artist-meta">
							<span class="artist-name">{artist.name}</span>
							<span class="artist-genre">{artist.genre}</span>
						</div>
					</a>
				{/each}
			</div>
		</section>

		<!-- 4. Section: Playlists Already Available (Featured & Community Playlists) -->
		<section class="spotify-section">
			<div class="section-title-bar">
				<div>
					<span class="section-kicker">FEATURED & PLAYLISTS</span>
					<h2 class="section-heading">Available Playlists</h2>
				</div>
				<a href="/playlists" class="view-all-link">View All</a>
			</div>

			<div class="mix-cards-grid">
				<!-- User playlists first if any -->
				{#each userPlaylists.slice(0, 2) as pl (pl.id)}
					<a href="/playlists/{pl.id}" class="mix-card">
						<div class="card-cover-wrap">
							<div class="custom-pl-art">
								<svg viewBox="0 0 24 24" width="2.5rem" height="2.5rem" fill="none" stroke="currentColor" stroke-width="1.5">
									<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
								</svg>
							</div>
							<button
								type="button"
								class="card-play-hover"
								title="Play {pl.name}"
								onclick={(e) => handlePlayUserPlaylist(e, pl.id)}
								aria-label="Play {pl.name}"
							>
								<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</button>
						</div>
						<div class="card-meta">
							<h3 class="card-title">{pl.name}</h3>
							<p class="card-subtitle">{pl.description || "Personal Playlist"}</p>
						</div>
					</a>
				{/each}

				<!-- Curated Featured Playlists -->
				{#each FEATURED_PLAYLISTS as pl (pl.id)}
					<a href="/playlists/{pl.id}" class="mix-card">
						<div class="card-cover-wrap">
							<img
								src={pl.cover}
								alt={pl.name}
								class="card-cover-img"
								loading="lazy"
								onerror={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'; }}
							/>
							<button
								type="button"
								class="card-play-hover"
								title="Play {pl.name}"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePlayFeatured(pl.query);
								}}
							>
								<svg viewBox="0 0 24 24" width="1.5rem" height="1.5rem" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</button>
						</div>
						<div class="card-meta">
							<h3 class="card-title">{pl.name}</h3>
							<p class="card-subtitle">{pl.description}</p>
						</div>
					</a>
				{/each}
			</div>
		</section>


		<!-- 6. Section: Top Global Trending Hits Table -->
		{#if trendingTracks.length > 0}
			<section class="spotify-section">
				<div class="section-title-bar">
					<div>
						<span class="section-kicker">CHARTS</span>
						<h2 class="section-heading">Top Global Trending</h2>
					</div>
					<button class="spotify-play-btn" onclick={() => playTracks(trendingTracks, 0)}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
						<span>Play All</span>
					</button>
				</div>

				<div class="tracks-table">
					<div class="table-header-row">
						<div class="th-num">#</div>
						<div class="th-title">Title</div>
						<div class="th-album">Genre / Tag</div>
						<div class="th-time">
							<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
							</svg>
						</div>
					</div>
					<div class="table-body">
						{#each trendingTracks.slice(0, 10) as track, i (track.id)}
							<TrackRow
								{track}
								index={i}
								playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
								onplay={() => playTracks(trendingTracks, i)}
							/>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- 7. Section: Browse by Genre / Vibe -->
		<section class="spotify-section">
			<div class="section-title-bar">
				<div>
					<span class="section-kicker">GENRES & MOODS</span>
					<h2 class="section-heading">Browse by Genre</h2>
				</div>
			</div>

			<div class="genres-grid">
				{#each GENRE_CARDS as g}
					<a href="/search?q={encodeURIComponent(g.query)}" class="genre-tile" style="background-color: {g.color};">
						<span class="genre-title">{g.name}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>



<style lang="scss">
	.home-page {
		display: flex;
		flex-direction: column;
		gap: 2.75rem;
		padding-bottom: 5rem;
		position: relative;
	}

	.ambient-header {
		margin: -1.25rem -1.75rem 0;
		padding: 1.75rem 1.75rem 1.25rem;
		background: linear-gradient(180deg, rgba(30, 75, 45, 0.4) 0%, rgba(20, 35, 25, 0.2) 60%, rgba(18, 18, 18, 0) 100%);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;

		@media screen and (max-width: 900px) {
			margin: -0.75rem -0.75rem 0;
			padding: 1.25rem 0.75rem 1rem;
		}
	}

	.greeting-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		flex-wrap: wrap;

		.greeting-title {
			color: #ffffff;
			font-size: 2.1rem;
			font-weight: 800;
			letter-spacing: -0.04em;
			margin: 0 0 0.45rem;
		}

		.pref-meta-row {
			display: flex;
			align-items: center;
			gap: 0.45rem;
			flex-wrap: wrap;
			color: #a7a7a7;
			font-size: 0.85rem;

			.pref-label {
				font-weight: 600;
				margin-right: 0.15rem;
			}

			.pref-pill {
				background: rgba(255, 255, 255, 0.1);
				color: #ffffff;
				font-size: 0.76rem;
				font-weight: 600;
				padding: 0.18rem 0.55rem;
				border-radius: 9999px;

				&.artist {
					background: rgba(30, 215, 96, 0.15);
					color: #1ed760;
					border: 1px solid rgba(30, 215, 96, 0.3);
				}

				&.more {
					background: rgba(255, 255, 255, 0.15);
					color: #fff;
				}
			}
		}

		.customize-pref-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			background: rgba(255, 255, 255, 0.08);
			border: 1px solid rgba(255, 255, 255, 0.15);
			border-radius: 9999px;
			padding: 0.45rem 1rem;
			color: #ffffff;
			font-size: 0.82rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 140ms ease;

			&:hover {
				background: #ffffff;
				color: #000000;
				transform: scale(1.03);
			}
		}
	}

	/* Spotify Quick Jump Grid */
	.quick-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 0.75rem;

		@media screen and (max-width: 600px) {
			grid-template-columns: 1fr 1fr;
			gap: 0.5rem;
		}
	}

	.quick-tile {
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.08);
		border-radius: 4px;
		overflow: hidden;
		height: 4.25rem;
		position: relative;
		cursor: pointer;
		text-decoration: none;
		color: #ffffff;
		transition: background 200ms ease;

		&:hover {
			background: rgba(255, 255, 255, 0.2);

			.tile-play-btn {
				opacity: 1;
				transform: translateY(0) scale(1);
			}
		}

		.tile-art {
			width: 4.25rem;
			height: 4.25rem;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			box-shadow: 4px 0 16px rgba(0, 0, 0, 0.3);

			&.liked-art {
				background: linear-gradient(135deg, #450af5 0%, #8e8ee5 50%, #c4efd9 100%);
				color: #ffffff;
			}

			&.fire-art {
				background: linear-gradient(135deg, #ff462d 0%, #fca311 100%);
				color: #ffffff;
			}
		}

		.tile-img {
			width: 4.25rem;
			height: 4.25rem;
			object-fit: cover;
			flex-shrink: 0;
		}

		.tile-title {
			padding: 0 1rem;
			font-size: 0.95rem;
			font-weight: 700;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			flex: 1;
		}

		.tile-play-btn {
			position: absolute;
			right: 0.85rem;
			width: 2.75rem;
			height: 2.75rem;
			border-radius: 50%;
			background: #1ed760;
			color: #000000;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
			opacity: 0;
			transform: translateY(4px) scale(0.9);
			transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);

			&:hover {
				transform: scale(1.08) !important;
				background: #1fdf64;
			}
		}
	}

	/* Sections */
	.spotify-section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.section-title-bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;

		.section-kicker {
			font-size: 0.72rem;
			font-weight: 800;
			letter-spacing: 0.08em;
			color: #b3b3b3;
			display: block;
			margin-bottom: 0.25rem;
		}

		.section-heading {
			color: #ffffff;
			font-size: 1.55rem;
			font-weight: 800;
			letter-spacing: -0.03em;
			margin: 0;
		}

		.section-actions-row {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			.clear-recent-btn {
				background: none;
				border: none;
				color: rgba(255, 255, 255, 0.45);
				font-size: 0.78rem;
				font-weight: 600;
				cursor: pointer;
				padding: 0.45rem 0.6rem;
				border-radius: 9999px;
				transition: all 140ms ease;

				&:hover {
					color: #ef4444;
					background: rgba(239, 68, 68, 0.1);
				}
			}
		}

		.spotify-play-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			background: rgba(255, 255, 255, 0.1);
			color: #ffffff;
			border: 1px solid rgba(255, 255, 255, 0.15);
			border-radius: 9999px;
			padding: 0.45rem 1rem;
			font-size: 0.82rem;
			font-weight: 700;
			cursor: pointer;
			transition: all 140ms ease;

			&:hover {
				background: #1ed760;
				color: #000000;
				border-color: #1ed760;
				transform: scale(1.04);
			}
		}

		.view-all-link {
			color: #b3b3b3;
			font-size: 0.85rem;
			font-weight: 700;
			text-decoration: none;
			transition: color 150ms;

			&:hover {
				color: #ffffff;
				text-decoration: underline;
			}
		}
	}

	/* Cards Horizontal Scroll Shelf */
	.mix-cards-grid {
		display: flex;
		flex-direction: row;
		gap: 0.9rem;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		padding: 0.25rem 0.25rem 0.75rem;
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

	.mix-card {
		flex: 0 0 138px;
		width: 138px;
		scroll-snap-align: start;
		background: #181818;
		padding: 0.65rem;
		border-radius: 0.55rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		text-decoration: none;
		color: inherit;
		transition: background-color 200ms ease, transform 150ms ease;

		&:hover {
			background-color: #242424;
			transform: translateY(-3px);

			.card-play-hover {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.card-cover-wrap {
			width: 100%;
			aspect-ratio: 1 / 1;
			border-radius: 0.35rem;
			overflow: hidden;
			position: relative;
			background: #282828;
			box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);

			.card-cover-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}

			.custom-pl-art {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(135deg, #1e293b, #0f172a);
				color: rgba(255, 255, 255, 0.4);
			}

			.card-play-hover {
				position: absolute;
				bottom: 0.45rem;
				right: 0.45rem;
				width: 2.3rem;
				height: 2.3rem;
				border-radius: 50%;
				background: #1ed760;
				color: #000000;
				border: none;
				cursor: pointer;
				outline: none;
				padding: 0;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
				opacity: 0;
				transform: translateY(6px);
				transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);

				&:hover {
					transform: scale(1.08) !important;
					background: #1fdf64;
				}
			}
		}

		.card-meta {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;

			.card-title {
				color: #ffffff;
				font-size: 0.84rem;
				font-weight: 700;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.card-subtitle {
				color: #a7a7a7;
				font-size: 0.74rem;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				line-height: 1.35;
			}
		}

		@media screen and (max-width: 600px) {
			flex: 0 0 118px;
			width: 118px;
			padding: 0.5rem;

			.card-meta {
				.card-title { font-size: 0.78rem; }
				.card-subtitle { font-size: 0.68rem; }
			}
		}
	}

	/* Artist Circular Cards Horizontal Scroll */
	.artist-cards-grid {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		overflow-x: auto;
		overflow-y: hidden;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		padding: 0.25rem 0.25rem 0.75rem;
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
		padding: 0.65rem;
		border-radius: 0.55rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.6rem;
		text-decoration: none;
		color: inherit;
		cursor: pointer;
		transition: background-color 200ms ease, transform 150ms ease;

		&:hover {
			background-color: #242424;
			transform: translateY(-3px);

			.card-play-hover {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.artist-circle {
			width: 100%;
			max-width: 96px;
			aspect-ratio: 1 / 1;
			border-radius: 50%;
			overflow: hidden;
			position: relative;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

			.artist-circle-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.card-play-hover {
				position: absolute;
				bottom: 0.4rem;
				right: 0.4rem;
				width: 2.65rem;
				height: 2.65rem;
				border-radius: 50%;
				background: #1ed760;
				color: #000000;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
				opacity: 0;
				transform: translateY(6px);
				transition: all 180ms ease;

				&:hover {
					transform: scale(1.08) !important;
					background: #1fdf64;
				}
			}
		}

		.artist-meta {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
			width: 100%;

			.artist-name {
				color: #ffffff;
				font-size: 0.92rem;
				font-weight: 700;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.artist-genre {
				color: #a7a7a7;
				font-size: 0.76rem;
			}
		}
	}

	/* Tracks Table */
	.tracks-table {
		display: flex;
		flex-direction: column;
		border-radius: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		overflow: hidden;

		.table-header-row {
			display: grid;
			grid-template-columns: 2.5rem 1fr 1fr 3rem;
			padding: 0.55rem 1rem;
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			color: #b3b3b3;
			font-size: 0.76rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;

			.th-num {
				text-align: center;
			}

			.th-time {
				text-align: right;
				display: flex;
				justify-content: flex-end;
			}
		}

		.table-body {
			display: flex;
			flex-direction: column;
		}
	}

	/* Genre Tiles Grid */
	.genres-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;

		@media screen and (max-width: 600px) {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.75rem;
		}
	}

	.genre-tile {
		aspect-ratio: 16 / 9;
		border-radius: 0.55rem;
		padding: 1rem;
		color: #ffffff;
		text-decoration: none;
		font-weight: 800;
		font-size: 1.15rem;
		position: relative;
		overflow: hidden;
		transition: transform 160ms ease;
		display: flex;
		align-items: flex-start;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);

		&:hover {
			transform: scale(1.03);
		}

		.genre-title {
			z-index: 1;
		}
	}

	.home-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 6rem 1rem;
		gap: 1rem;
		color: #b3b3b3;

		.spotify-spinner {
			width: 2.75rem;
			height: 2.75rem;
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
