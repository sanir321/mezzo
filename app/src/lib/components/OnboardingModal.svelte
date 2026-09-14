<script lang="ts">
	import {
		userPreferences,
		POPULAR_ARTISTS,
		type PopularArtist
	} from "$lib/stores/preferences.svelte";
	import { searchOnlineMusic } from "$lib/api";

	interface Props {
		open?: boolean;
		onclose?: () => void;
		oncompleted?: () => void;
	}

	let { open = $bindable(false), onclose, oncompleted }: Props = $props();

	let step = $state<"select_artists" | "playlist_ready">("select_artists");
	let artistFilter = $state("");
	let isSearchingOnline = $state(false);
	let onlineArtistResults = $state<PopularArtist[]>([]);
	let searchTimeout: any = null;

	const selectedArtists = $derived(userPreferences.favoriteArtists);
	const minArtistsRequired = 3;
	const canProceed = $derived(selectedArtists.length >= minArtistsRequired);

	// Curated artists matching local text query
	const filteredCuratedArtists = $derived.by(() => {
		const q = artistFilter.trim().toLowerCase();
		if (!q) {
			const userLangs = userPreferences.languages.map((l) => l.toLowerCase());
			if (userLangs.length === 0) return POPULAR_ARTISTS;
			return [...POPULAR_ARTISTS].sort((a, b) => {
				const aMatch = a.languages.some((l) => userLangs.includes(l.toLowerCase()));
				const bMatch = b.languages.some((l) => userLangs.includes(l.toLowerCase()));
				if (aMatch && !bMatch) return -1;
				if (!aMatch && bMatch) return 1;
				return 0;
			});
		}
		return POPULAR_ARTISTS.filter(
			(a) =>
				a.name.toLowerCase().includes(q) ||
				a.genre.toLowerCase().includes(q) ||
				a.languages.some((l) => l.toLowerCase().includes(q))
		);
	});

	// Display list combining curated + online search
	const displayArtists = $derived.by(() => {
		const q = artistFilter.trim().toLowerCase();
		if (!q) return filteredCuratedArtists;

		const seen = new Set(filteredCuratedArtists.map((a) => a.name.toLowerCase()));
		const additional = onlineArtistResults.filter((a) => !seen.has(a.name.toLowerCase()));
		return [...filteredCuratedArtists, ...additional];
	});

	// Get preview artist items for the "Playlist Ready" screen
	const selectedArtistObjects = $derived.by(() => {
		const objs: PopularArtist[] = [];
		for (const name of selectedArtists) {
			const found =
				POPULAR_ARTISTS.find((a) => a.name.toLowerCase() === name.toLowerCase()) ||
				onlineArtistResults.find((a) => a.name.toLowerCase() === name.toLowerCase()) ||
				userPreferences.customArtists[name.toLowerCase()];
			if (found) objs.push(found);
			else {
				objs.push({
					name,
					genre: "Artist",
					languages: ["Global"],
					color: "#1ed760",
					gradient: "linear-gradient(135deg, #1ed760 0%, #064e3b 100%)",
					image: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=181818&color=1ed760&bold=true`,
					monthlyListeners: "Popular",
					bio: "",
				});
			}
		}
		return objs.slice(0, 4);
	});

	function handleSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		artistFilter = val;

		if (searchTimeout) clearTimeout(searchTimeout);
		const q = val.trim();
		if (q.length < 2) {
			onlineArtistResults = [];
			isSearchingOnline = false;
			return;
		}

		isSearchingOnline = true;
		searchTimeout = setTimeout(async () => {
			try {
				const res = await searchOnlineMusic(q, 10);
				if (res.artists && res.artists.length > 0) {
					onlineArtistResults = res.artists.map((art) => ({
						name: art.name,
						genre: art.role || "Artist",
						languages: ["Global"],
						color: "#1ed760",
						gradient: "linear-gradient(135deg, #1ed760 0%, #064e3b 100%)",
						image: art.image || "",
						monthlyListeners: "Popular",
						bio: "",
					}));
				}
			} catch {
				onlineArtistResults = [];
			} finally {
				isSearchingOnline = false;
			}
		}, 300);
	}

	function handleToggleArtist(artist: PopularArtist) {
		if (artist.image && !POPULAR_ARTISTS.some((a) => a.name === artist.name)) {
			userPreferences.addCustomArtist(artist);
		} else {
			userPreferences.toggleArtist(artist.name);
		}
	}

	function handleContinue() {
		if (!canProceed) return;
		step = "playlist_ready";
	}

	function handleFinish() {
		userPreferences.completeOnboarding();
		if (typeof localStorage !== "undefined") {
			try {
				localStorage.setItem("mezzo_onboarded_v1", "true");
				localStorage.setItem("mezzo_onboarding_completed", "true");
			} catch {}
		}
		open = false;
		oncompleted?.();
		onclose?.();
	}

	function handleSkip() {
		userPreferences.completeOnboarding();
		if (typeof localStorage !== "undefined") {
			try {
				localStorage.setItem("mezzo_onboarded_v1", "true");
				localStorage.setItem("mezzo_onboarding_completed", "true");
			} catch {}
		}
		open = false;
		onclose?.();
	}
</script>

{#if open}
	<div class="onboarding-overlay" role="dialog" aria-modal="true">
		<div class="onboarding-container">
			{#if step === "select_artists"}
				<!-- Top Bar -->
				<header class="top-nav">
					<div class="nav-left">
						<button class="icon-nav-btn" onclick={handleSkip} aria-label="Skip">
							<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2">
								<polyline points="15 18 9 12 15 6" />
							</svg>
						</button>
					</div>

					<div class="nav-center">
						<span class="selection-pill" class:active={selectedArtists.length > 0}>
							{selectedArtists.length} selected
						</span>
					</div>

					<div class="nav-right">
						<button class="text-skip-btn" onclick={handleSkip}>
							Skip
						</button>
					</div>
				</header>

				<!-- Header Titles (Exact Reference Style) -->
				<div class="header-titles">
					<h1 class="main-title">Choose your favorite artists</h1>
					<p class="sub-title">pick at least 3</p>
				</div>

				<!-- Search Input -->
				<div class="search-box-wrap">
					<div class="search-box">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" stroke-width="2.2" class="search-icon">
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							type="search"
							placeholder="Search"
							value={artistFilter}
							oninput={handleSearchInput}
							class="search-input"
						/>
					</div>
				</div>

				<!-- Circular Artists Grid (3 Columns on Mobile, Scalable on Desktop) -->
				<div class="artists-scroll-area">
					<div class="artists-grid">
						{#each displayArtists as artist (artist.name)}
							{@const isSelected = userPreferences.hasArtist(artist.name)}
							<button
								type="button"
								class="artist-item"
								class:selected={isSelected}
								onclick={() => handleToggleArtist(artist)}
								aria-label={`Select ${artist.name}`}
							>
								<div class="avatar-wrap">
									<img
										src={artist.image}
										alt={artist.name}
										class="avatar-img"
										loading="lazy"
										onerror={(e) => {
											(e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=242424&color=ffffff&bold=true`;
										}}
									/>
									{#if isSelected}
										<div class="selected-badge" aria-hidden="true">
											<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#000000" stroke-width="3.5">
												<polyline points="20 6 9 17 4 12" />
											</svg>
										</div>
									{/if}
								</div>
								<span class="artist-name">{artist.name}</span>
							</button>
						{/each}
					</div>

					{#if displayArtists.length === 0 && !isSearchingOnline}
						<div class="empty-results">
							<p>No artists found for "{artistFilter}".</p>
						</div>
					{/if}
				</div>

				<!-- Bottom Sticky Action Bar -->
				<footer class="bottom-action-bar">
					<button
						class="continue-btn"
						class:disabled={!canProceed}
						disabled={!canProceed}
						onclick={handleContinue}
					>
						{#if canProceed}
							Continue
						{:else}
							Pick {minArtistsRequired - selectedArtists.length} more
						{/if}
					</button>
				</footer>
			{:else}
				<!-- Step 2: Your Playlist Is Ready (Screen 4 from Reference) -->
				<div class="ready-screen">
					<div class="ready-content">
						<!-- Stacked Overlapping Artist Avatars -->
						<div class="stacked-avatars">
							{#each selectedArtistObjects as art, i (art.name)}
								<div
									class="stacked-avatar"
									style="z-index: {10 - i}; transform: translateX({(i - (selectedArtistObjects.length - 1) / 2) * 26}px);"
								>
									<img
										src={art.image}
										alt={art.name}
										class="stacked-img"
										onerror={(e) => {
											(e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(art.name)}&background=181818&color=1ed760&bold=true`;
										}}
									/>
								</div>
							{/each}
						</div>

						<h1 class="ready-title">Your Playlist Is Ready</h1>
						<p class="ready-sub">we created something special for you</p>

						<button class="start-listening-btn" onclick={handleFinish}>
							Start Listening
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.onboarding-overlay {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		height: 100dvh;
		background: #121212;
		color: #ffffff;
		z-index: 100080;
		display: flex;
		flex-direction: column;
		align-items: center;
		overflow: hidden;
		user-select: none;
		animation: fadeIn 150ms ease-out;
	}

	.onboarding-container {
		width: 100%;
		max-width: 32rem;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: relative;
		box-sizing: border-box;
	}

	/* Top Navigation */
	.top-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: max(1rem, env(safe-area-inset-top)) 1.25rem 0.5rem;
		flex-shrink: 0;
	}

	.icon-nav-btn {
		background: transparent;
		border: none;
		color: #ffffff;
		padding: 0.4rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 120ms;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	.selection-pill {
		font-size: 0.8rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.5);
		background: rgba(255, 255, 255, 0.08);
		padding: 0.35rem 0.85rem;
		border-radius: 9999px;
		transition: all 150ms;

		&.active {
			color: #1ed760;
			background: rgba(30, 215, 96, 0.15);
		}
	}

	.text-skip-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.6);
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.4rem 0.6rem;

		&:hover {
			color: #ffffff;
		}
	}

	/* Title Section */
	.header-titles {
		padding: 0.75rem 1.5rem 0.5rem;
		text-align: left;
		flex-shrink: 0;

		.main-title {
			font-size: 1.45rem;
			font-weight: 800;
			letter-spacing: -0.02em;
			margin: 0;
			color: #ffffff;
			line-height: 1.25;
		}

		.sub-title {
			font-size: 0.88rem;
			color: rgba(255, 255, 255, 0.5);
			margin: 0.25rem 0 0;
			font-weight: 500;
		}
	}

	/* Search Bar */
	.search-box-wrap {
		padding: 0.75rem 1.5rem 0.5rem;
		flex-shrink: 0;
	}

	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		background: #ffffff;
		border-radius: 0.75rem;
		box-sizing: border-box;

		.search-icon {
			position: absolute;
			left: 1rem;
			pointer-events: none;
		}

		.search-input {
			width: 100%;
			background: transparent;
			border: none;
			outline: none;
			padding: 0.8rem 1rem 0.8rem 2.75rem;
			font-size: 0.95rem;
			color: #121212;
			font-weight: 500;
			border-radius: 0.75rem;

			&::placeholder {
				color: #6b7280;
			}
		}
	}

	/* Artists Grid */
	.artists-scroll-area {
		flex: 1;
		overflow-y: auto;
		padding: 1rem 1.25rem 6rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
	}

	.artists-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.25rem 0.75rem;
		justify-items: center;
	}

	.artist-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 0.25rem;
		width: 100%;
		max-width: 6.5rem;
		text-align: center;
		transition: transform 120ms ease;

		&:active {
			transform: scale(0.95);
		}

		&.selected {
			.avatar-img {
				border-color: #1ed760;
				box-shadow: 0 0 0 2px #1ed760;
			}
		}
	}

	.avatar-wrap {
		position: relative;
		width: 5.5rem;
		height: 5.5rem;
		margin-bottom: 0.45rem;

		@media screen and (max-width: 380px) {
			width: 4.8rem;
			height: 4.8rem;
		}

		.avatar-img {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			object-fit: cover;
			background: #242424;
			border: 2px solid transparent;
			transition: all 150ms ease;
		}

		.selected-badge {
			position: absolute;
			top: 0;
			right: 0;
			width: 1.5rem;
			height: 1.5rem;
			border-radius: 50%;
			background: #1ed760;
			display: flex;
			align-items: center;
			justify-content: center;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
			animation: scaleIn 140ms ease-out;
		}
	}

	.artist-name {
		font-size: 0.78rem;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	.empty-results {
		text-align: center;
		padding: 3rem 1rem;
		color: rgba(255, 255, 255, 0.45);
		font-size: 0.9rem;
	}

	/* Sticky Bottom Action Bar */
	.bottom-action-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1.25rem 1.5rem max(1.25rem, env(safe-area-inset-bottom));
		background: linear-gradient(180deg, rgba(18, 18, 18, 0) 0%, rgba(18, 18, 18, 0.95) 40%, #121212 100%);
		display: flex;
		justify-content: center;
		z-index: 50;
	}

	.continue-btn {
		width: 100%;
		max-width: 16rem;
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 0.85rem 1.5rem;
		font-size: 0.95rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 4px 16px rgba(30, 215, 96, 0.35);
		transition: all 150ms ease;

		&:hover:not(:disabled) {
			background: #1fdf64;
			transform: scale(1.02);
		}

		&.disabled,
		&:disabled {
			background: rgba(255, 255, 255, 0.15);
			color: rgba(255, 255, 255, 0.4);
			box-shadow: none;
			cursor: not-allowed;
		}
	}

	/* Screen 2: Playlist Ready */
	.ready-screen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		text-align: center;
	}

	.ready-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 24rem;
	}

	.stacked-avatars {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 6.5rem;
		margin-bottom: 2rem;
		position: relative;
		width: 100%;

		.stacked-avatar {
			position: absolute;
			width: 5.5rem;
			height: 5.5rem;
			border-radius: 50%;
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);

			.stacked-img {
				width: 100%;
				height: 100%;
				border-radius: 50%;
				object-fit: cover;
				border: 3px solid #121212;
				background: #242424;
			}
		}
	}

	.ready-title {
		font-size: 1.85rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: #ffffff;
		margin: 0 0 0.5rem;
	}

	.ready-sub {
		font-size: 0.92rem;
		color: rgba(255, 255, 255, 0.5);
		margin: 0 0 2.25rem;
	}

	.start-listening-btn {
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 0.9rem 2.5rem;
		font-size: 1rem;
		font-weight: 800;
		cursor: pointer;
		box-shadow: 0 4px 20px rgba(30, 215, 96, 0.4);
		transition: all 150ms ease;

		&:hover {
			background: #1fdf64;
			transform: scale(1.04);
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleIn {
		from { transform: scale(0.6); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
