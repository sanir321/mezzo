<script lang="ts">
	import { page } from "$app/stores";
	import {
		playTracks,
		playerCurrentTrack,
		playerPlaying,
		playerShuffle,
		toggleShuffle,
	} from "$lib/stores/player.svelte";
	import type { Track } from "$lib/stores/player.svelte";
	import { useSession } from "$lib/auth-client";
	import { authModal } from "$lib/stores/auth-modal.svelte";
	import { userPreferences, getArtistMeta } from "$lib/stores/preferences.svelte";
	import { searchOnlineMusic, getOnlineTrending } from "$lib/api";
	import TrackRow from "$lib/components/TrackRow.svelte";

	const sessionAtom = useSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const isLoggedIn = $derived(sessionData?.data?.user != null);
	const artistName = $derived(decodeURIComponent($page.params.name || "The Weeknd"));
	const artistMeta = $derived(getArtistMeta(artistName));
	let tracks = $state<Track[]>([]);
	let relatedTracks = $state<Track[]>([]);
	let loading = $state(true);
	let isFollowing = $state(false);

	const heroImage = $derived(
		artistMeta.image && !artistMeta.image.includes("unsplash.com")
			? artistMeta.image
			: tracks[0]?.cover_url || artistMeta.image
	);

	$effect(() => {
		if (artistName) {
			isFollowing = userPreferences.hasArtist(artistName);
		}
	});

	async function loadArtistData() {
		loading = true;
		try {
			const [searchRes, trendRes] = await Promise.all([
				searchOnlineMusic(artistName, 15).catch(() => ({ tracks: [] })),
				getOnlineTrending(6).catch(() => ({ tracks: [] })),
			]);
			tracks = searchRes.tracks ?? [];
			relatedTracks = trendRes.tracks ?? [];
		} catch {
			tracks = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (artistName) {
			loadArtistData();
		}
	});

	function handleToggleFollow() {
		if (!isLoggedIn) {
			authModal.open();
			return;
		}
		userPreferences.toggleArtist(artistName);
		isFollowing = userPreferences.hasArtist(artistName);
	}
</script>

<svelte:head>
	<title>{artistName} — Mezzo Artist Profile</title>
</svelte:head>

<div class="artist-page">
	<!-- Spotify Artist Hero Header -->
	<div class="artist-hero" style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(18, 18, 18, 0.95) 100%), url('{heroImage}');">
		<div class="hero-content">
			<div class="verified-badge">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="#3b82f6">
					<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
				</svg>
				<span>Verified Artist</span>
			</div>
			<h1 class="artist-hero-name">{artistName}</h1>
			<p class="hero-listeners">{artistMeta.monthlyListeners} monthly listeners</p>
		</div>
	</div>

	<!-- Action Controls Bar -->
	<div class="artist-actions-bar">
		<button
			class="spotify-hero-play"
			onclick={() => tracks.length > 0 && playTracks(tracks, 0)}
			aria-label="Play {artistName}"
			title="Play"
		>
			{#if playerPlaying.value && tracks.some((t) => t.id === playerCurrentTrack.value?.id)}
				<svg viewBox="0 0 24 24" width="1.75rem" height="1.75rem" fill="currentColor">
					<rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
				</svg>
			{:else}
				<svg viewBox="0 0 24 24" width="1.75rem" height="1.75rem" fill="currentColor">
					<polygon points="6 4 20 12 6 20 6 4" />
				</svg>
			{/if}
		</button>

		<button
			class="follow-btn"
			class:following={isFollowing}
			onclick={handleToggleFollow}
		>
			{isFollowing ? "Following" : "Follow"}
		</button>

		<button
			class="icon-action-btn"
			class:active={playerShuffle.value}
			onclick={toggleShuffle}
			title="Shuffle"
		>
			<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
				<polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
			</svg>
		</button>
	</div>

	<!-- Popular Section -->
	<section class="artist-section">
		<h2 class="section-title">Popular</h2>

		{#if loading && tracks.length === 0}
			<div class="section-loading">
				<div class="spinner"></div>
				<p>Loading popular tracks...</p>
			</div>
		{:else if tracks.length === 0}
			<div class="empty-state">
				<p>No tracks found for this artist right now.</p>
			</div>
		{:else}
			<div class="popular-tracks-list">
				{#each tracks.slice(0, 10) as track, i (track.id)}
					<TrackRow
						{track}
						index={i}
						playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
						onplay={() => playTracks(tracks, i)}
					/>
				{/each}
			</div>
		{/if}
	</section>

	<!-- About Artist Card -->
	<section class="artist-section">
		<h2 class="section-title">About</h2>
		<div class="about-card" style="background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(24, 24, 24, 0.95) 100%), url('{artistMeta.image}');">
			<div class="about-card-body">
				<div class="about-stat">
					<span class="stat-number">{artistMeta.monthlyListeners}</span>
					<span class="stat-label">MONTHLY LISTENERS</span>
				</div>
				<p class="about-bio">{artistMeta.bio}</p>
				<span class="about-genre-tag">{artistMeta.genre}</span>
			</div>
		</div>
	</section>

	<!-- Related Artists & Mixes -->
	{#if relatedTracks.length > 0}
		<section class="artist-section">
			<h2 class="section-title">Fans Also Like</h2>
			<div class="related-grid">
				{#each relatedTracks.slice(0, 6) as relTrack (relTrack.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="rel-card" onclick={() => playTracks([relTrack], 0)}>
						<div class="rel-cover-wrap">
							<img src={relTrack.cover_url || artistMeta.image} alt={relTrack.title} class="rel-img" loading="lazy" />
							<div class="rel-play-btn" title="Play {relTrack.title}">
								<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							</div>
						</div>
						<div class="rel-meta">
							<h3 class="rel-title">{relTrack.title}</h3>
							<p class="rel-artist">{relTrack.artist || "Featured Artist"}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style lang="scss">
	.artist-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 5rem;
		margin: -1.25rem -1.75rem 0;

		@media screen and (max-width: 1024px) {
			margin: -0.75rem -0.75rem 0;
		}
	}

	.artist-hero {
		height: 38vh;
		min-height: 18rem;
		max-height: 28rem;
		background-size: cover;
		background-position: center 25%;
		display: flex;
		align-items: flex-end;
		padding: 2rem 2rem 1.5rem;
		position: relative;

		@media screen and (max-width: 768px) {
			height: 30vh;
			padding: 1.5rem 1rem 1rem;
		}

		.hero-content {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			z-index: 2;

			.verified-badge {
				display: flex;
				align-items: center;
				gap: 0.45rem;
				color: #ffffff;
				font-size: 0.88rem;
				font-weight: 600;
			}

			.artist-hero-name {
				color: #ffffff;
				font-size: clamp(2.5rem, 5.5vw, 5rem);
				font-weight: 900;
				letter-spacing: -0.04em;
				margin: 0;
				line-height: 1.05;
				text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
			}

			.hero-listeners {
				color: #ffffff;
				font-size: 0.95rem;
				font-weight: 600;
				margin: 0.25rem 0 0;
				text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
			}
		}
	}

	.artist-actions-bar {
		display: flex;
		align-items: center;
		gap: 1.75rem;
		padding: 0 2rem;

		@media screen and (max-width: 768px) {
			padding: 0 1rem;
			gap: 1.25rem;
		}

		.spotify-hero-play {
			width: 3.5rem;
			height: 3.5rem;
			border-radius: 50%;
			background: #1ed760;
			color: #000000;
			border: none;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
			transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);

			&:hover {
				transform: scale(1.08);
				background: #1fdf64;
			}
		}

		.follow-btn {
			background: transparent;
			border: 1px solid rgba(255, 255, 255, 0.4);
			border-radius: 9999px;
			color: #ffffff;
			font-size: 0.88rem;
			font-weight: 700;
			padding: 0.55rem 1.4rem;
			cursor: pointer;
			transition: all 150ms ease;

			&:hover {
				border-color: #ffffff;
				transform: scale(1.04);
			}

			&.following {
				border-color: #1ed760;
				color: #1ed760;
			}
		}

		.icon-action-btn {
			background: transparent;
			border: none;
			color: #b3b3b3;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 150ms ease;

			&:hover,
			&.active {
				color: #1ed760;
				transform: scale(1.1);
			}
		}
	}

	.artist-section {
		padding: 0 2rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;

		@media screen and (max-width: 768px) {
			padding: 0 1rem;
		}

		.section-title {
			color: #ffffff;
			font-size: 1.5rem;
			font-weight: 800;
			letter-spacing: -0.03em;
			margin: 0;
		}
	}

	.popular-tracks-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	/* About Card */
	.about-card {
		height: 20rem;
		border-radius: 12px;
		background-size: cover;
		background-position: center;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		padding: 2rem;
		position: relative;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);

		.about-card-body {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			max-width: 36rem;

			.about-stat {
				display: flex;
				flex-direction: column;

				.stat-number {
					color: #ffffff;
					font-size: 1.5rem;
					font-weight: 800;
				}

				.stat-label {
					color: #b3b3b3;
					font-size: 0.75rem;
					font-weight: 700;
					letter-spacing: 0.08em;
				}
			}

			.about-bio {
				color: #e2e8f0;
				font-size: 0.95rem;
				line-height: 1.5;
				margin: 0;
			}

			.about-genre-tag {
				display: inline-block;
				background: rgba(255, 255, 255, 0.12);
				color: #ffffff;
				font-size: 0.8rem;
				font-weight: 600;
				padding: 0.25rem 0.75rem;
				border-radius: 9999px;
				width: fit-content;
			}
		}
	}

	/* Related Grid */
	.related-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
		gap: 1.25rem;
	}

	.rel-card {
		background: #181818;
		padding: 0.95rem;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		cursor: pointer;
		position: relative;
		transition: background 200ms ease;

		&:hover {
			background: #282828;

			.rel-play-btn {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.rel-cover-wrap {
			width: 100%;
			aspect-ratio: 1;
			border-radius: 6px;
			overflow: hidden;
			position: relative;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

			.rel-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.rel-play-btn {
				position: absolute;
				right: 0.6rem;
				bottom: 0.6rem;
				width: 3rem;
				height: 3rem;
				border-radius: 50%;
				background: #1ed760;
				color: #000000;
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
				opacity: 0;
				transform: translateY(8px);
				transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);

				&:hover {
					transform: scale(1.08) !important;
					background: #1fdf64;
				}
			}
		}

		.rel-meta {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;

			.rel-title {
				font-size: 0.95rem;
				font-weight: 700;
				color: #ffffff;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.rel-artist {
				font-size: 0.8rem;
				color: #a7a7a7;
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}
	}

	.section-loading {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 3rem 0;
		color: #a7a7a7;

		.spinner {
			width: 2rem;
			height: 2rem;
			border: 3px solid rgba(255, 255, 255, 0.1);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 800ms linear infinite;
		}
	}

	.empty-state {
		padding: 2rem 0;
		color: #a7a7a7;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
