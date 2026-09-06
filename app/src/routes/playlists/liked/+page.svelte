<script lang="ts">
	import { useSession } from "$lib/auth-client";
	import {
		playTracks,
		playerCurrentTrack,
		playerPlaying,
		playerShuffle,
		toggleShuffle,
		formatDuration,
	} from "$lib/stores/player.svelte";
	import { likedStore } from "$lib/stores/liked.svelte";
	import TrackRow from "$lib/components/TrackRow.svelte";

	const sessionAtom = useSession();
	let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

	$effect(() => {
		return sessionAtom.subscribe((value) => {
			sessionData = value;
		});
	});

	const user = $derived(sessionData?.data?.user ?? null);
	const userName = $derived(user?.name || "Music Lover");

	let searchQuery = $state("");

	const tracks = $derived(likedStore.tracks);
	const totalDuration = $derived(tracks.reduce((acc, t) => acc + (t.duration || 0), 0));

	const filteredTracks = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return tracks;
		return tracks.filter(
			(t) =>
				t.title.toLowerCase().includes(q) ||
				(t.artist ?? "").toLowerCase().includes(q) ||
				(t.album ?? "").toLowerCase().includes(q)
		);
	});
</script>

<svelte:head>
	<title>Liked Songs — Mezzo Web Player</title>
</svelte:head>

<div class="liked-page">
	<!-- Spotify Liked Songs Hero Header -->
	<div class="liked-hero">
		<div class="hero-cover-art">
			<svg viewBox="0 0 24 24" width="4.5rem" height="4.5rem" fill="currentColor">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		</div>

		<div class="hero-meta">
			<span class="hero-type">PLAYLIST</span>
			<h1 class="hero-title">Liked Songs</h1>
			<div class="hero-info-row">
				<div class="user-avatar-tiny">
					{userName[0].toUpperCase()}
				</div>
				<span class="user-name-bold">{userName}</span>
				<span class="bullet">•</span>
				<span class="songs-count">{tracks.length} song{tracks.length !== 1 ? 's' : ''}</span>
				{#if totalDuration > 0}
					<span class="bullet">•</span>
					<span class="total-duration">{formatDuration(totalDuration)}</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Action Controls -->
	<div class="action-bar">
		<button
			class="spotify-play-circle"
			disabled={tracks.length === 0}
			onclick={() => tracks.length > 0 && playTracks(tracks, 0)}
			aria-label="Play liked songs"
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
			class="icon-btn"
			class:active={playerShuffle.value}
			onclick={toggleShuffle}
			title="Shuffle"
		>
			<svg viewBox="0 0 24 24" width="1.35rem" height="1.35rem" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
				<polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
			</svg>
		</button>

		<div class="search-filter-wrap">
			<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.5" class="search-ico">
				<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" />
			</svg>
			<input
				type="search"
				placeholder="Search in Liked Songs"
				bind:value={searchQuery}
				class="filter-input"
			/>
		</div>
	</div>

	<!-- Track Table -->
	{#if tracks.length === 0}
		<div class="empty-liked-state">
			<div class="empty-icon">
				<svg viewBox="0 0 24 24" width="3.5rem" height="3.5rem" fill="none" stroke="currentColor" stroke-width="1.5">
					<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
				</svg>
			</div>
			<h2>Songs you like will appear here</h2>
			<p>Save songs by tapping the heart icon when listening to any track.</p>
			<a href="/search" class="btn-find-songs">Find Songs</a>
		</div>
	{:else}
		<div class="tracks-table">
			<div class="table-header-row">
				<div class="th-num">#</div>
				<div class="th-title">Title</div>
				<div class="th-album">Album / Genre</div>
				<div class="th-time">
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
					</svg>
				</div>
			</div>
			<div class="table-body">
				{#each filteredTracks as track, i (track.id)}
					<TrackRow
						{track}
						index={i}
						playing={playerCurrentTrack.value?.id === track.id && playerPlaying.value}
						onplay={() => playTracks(filteredTracks, i)}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.liked-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 5rem;
		margin: -1.25rem -1.75rem 0;

		@media screen and (max-width: 1024px) {
			margin: -0.75rem -0.75rem 0;
		}
	}

	.liked-hero {
		background: linear-gradient(180deg, #471ab3 0%, rgba(30, 15, 80, 0.7) 60%, rgba(18, 18, 18, 0) 100%);
		display: flex;
		align-items: flex-end;
		gap: 2rem;
		padding: 3rem 2rem 1.5rem;

		@media screen and (max-width: 768px) {
			flex-direction: column;
			align-items: center;
			text-align: center;
			padding: 2rem 1rem 1rem;
			gap: 1.25rem;
		}

		.hero-cover-art {
			width: 14.5rem;
			height: 14.5rem;
			min-width: 14.5rem;
			border-radius: 6px;
			background: linear-gradient(135deg, #450af5 0%, #8e8ee5 50%, #c4efd9 100%);
			display: flex;
			align-items: center;
			justify-content: center;
			color: #ffffff;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);

			@media screen and (max-width: 768px) {
				width: 11rem;
				height: 11rem;
				min-width: 11rem;
			}
		}

		.hero-meta {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;

			.hero-type {
				color: #ffffff;
				font-size: 0.8rem;
				font-weight: 800;
				letter-spacing: 0.08em;
			}

			.hero-title {
				color: #ffffff;
				font-size: clamp(2.5rem, 5vw, 5rem);
				font-weight: 900;
				letter-spacing: -0.04em;
				margin: 0;
				line-height: 1.05;
			}

			.hero-info-row {
				display: flex;
				align-items: center;
				gap: 0.45rem;
				color: #e2e8f0;
				font-size: 0.9rem;
				margin-top: 0.5rem;

				@media screen and (max-width: 768px) {
					justify-content: center;
				}

				.user-avatar-tiny {
					width: 1.5rem;
					height: 1.5rem;
					border-radius: 50%;
					background: #535353;
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 0.75rem;
					font-weight: 800;
					color: #ffffff;
				}

				.user-name-bold {
					font-weight: 700;
				}

				.bullet {
					color: #a7a7a7;
				}
			}
		}
	}

	.action-bar {
		display: flex;
		align-items: center;
		gap: 1.75rem;
		padding: 0 2rem;

		@media screen and (max-width: 768px) {
			padding: 0 1rem;
			gap: 1.25rem;
			flex-wrap: wrap;
		}

		.spotify-play-circle {
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

			&:hover:not(:disabled) {
				transform: scale(1.08);
				background: #1fdf64;
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		.icon-btn {
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

		.search-filter-wrap {
			position: relative;
			display: flex;
			align-items: center;
			margin-left: auto;

			@media screen and (max-width: 768px) {
				margin-left: 0;
				width: 100%;
			}

			.search-ico {
				position: absolute;
				left: 0.75rem;
				color: #b3b3b3;
				pointer-events: none;
			}

			.filter-input {
				background: rgba(255, 255, 255, 0.08);
				border: 1px solid transparent;
				border-radius: 9999px;
				padding: 0.45rem 1rem 0.45rem 2.25rem;
				color: #ffffff;
				font-size: 0.85rem;
				outline: none;
				transition: all 150ms ease;

				&:focus {
					background: #242424;
					border-color: #ffffff;
				}

				&::placeholder {
					color: #a7a7a7;
				}
			}
		}
	}

	.tracks-table {
		padding: 0 2rem;
		display: flex;
		flex-direction: column;

		@media screen and (max-width: 768px) {
			padding: 0 1rem;
		}

		.table-header-row {
			display: flex;
			align-items: center;
			padding: 0.5rem 0.5rem;
			color: #b3b3b3;
			font-size: 0.8rem;
			font-weight: 600;
			letter-spacing: 0.05em;
			border-bottom: 1px solid rgba(255, 255, 255, 0.1);
			margin-bottom: 0.5rem;

			.th-num {
				width: 2.5rem;
				text-align: center;
			}

			.th-title {
				flex: 1;
				padding-left: 0.5rem;
			}

			.th-album {
				flex: 0.8;
				padding-left: 0.5rem;

				@media screen and (max-width: 768px) {
					display: none;
				}
			}

			.th-time {
				width: 5rem;
				text-align: right;
				padding-right: 2.5rem;
			}
		}

		.table-body {
			display: flex;
			flex-direction: column;
			gap: 0.15rem;
		}
	}

	.empty-liked-state {
		padding: 4rem 2rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		color: #a7a7a7;

		.empty-icon {
			color: #ffffff;
			margin-bottom: 0.5rem;
		}

		h2 {
			color: #ffffff;
			font-size: 1.75rem;
			font-weight: 800;
			margin: 0;
		}

		p {
			margin: 0;
			font-size: 0.95rem;
		}

		.btn-find-songs {
			margin-top: 1rem;
			background: #ffffff;
			color: #000000;
			text-decoration: none;
			font-size: 0.95rem;
			font-weight: 700;
			padding: 0.75rem 2rem;
			border-radius: 9999px;
			transition: transform 150ms ease;

			&:hover {
				transform: scale(1.05);
			}
		}
	}
</style>
