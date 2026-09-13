<script lang="ts">
	import {
		userPreferences,
		POPULAR_LANGUAGES,
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

	let step = $state<1 | 2>(1);
	let languageCategory = $state<"all" | "South Asian" | "International">("all");
	let languageQuery = $state("");

	let artistFilter = $state("");
	let artistLanguageTab = $state<string>("all");
	let isSearchingOnline = $state(false);
	let onlineArtistResults = $state<PopularArtist[]>([]);
	let searchTimeout: any = null;

	const selectedLanguages = $derived(userPreferences.languages);
	const selectedArtists = $derived(userPreferences.favoriteArtists);
	const minArtistsRequired = 3;
	const canFinish = $derived(selectedArtists.length >= minArtistsRequired);

	// Filtered languages by search and category
	const filteredLanguages = $derived.by(() => {
		const q = languageQuery.trim().toLowerCase();
		return POPULAR_LANGUAGES.filter((lang) => {
			const matchesCategory = languageCategory === "all" || lang.category === languageCategory;
			const matchesQuery = !q ||
				lang.name.toLowerCase().includes(q) ||
				lang.native.toLowerCase().includes(q) ||
				lang.code.toLowerCase().includes(q);
			return matchesCategory && matchesQuery;
		});
	});

	// Dynamic artist tabs based on user's selected languages
	const availableArtistTabs = $derived.by(() => {
		const tabs = ["all"];
		for (const lang of selectedLanguages) {
			if (!tabs.includes(lang)) tabs.push(lang);
		}
		return tabs;
	});

	// Curated artists matching selected language tab and local text query
	const filteredCuratedArtists = $derived.by(() => {
		const q = artistFilter.trim().toLowerCase();
		return POPULAR_ARTISTS.filter((artist) => {
			// Tab filtering
			let matchesTab = true;
			if (artistLanguageTab !== "all") {
				matchesTab = artist.languages.some(
					(l) => l.toLowerCase() === artistLanguageTab.toLowerCase()
				);
			} else {
				// In "all", prioritize artists from selected languages if any match
				// but still allow global fallback
			}

			// Query filtering
			const matchesQuery = !q ||
				artist.name.toLowerCase().includes(q) ||
				artist.genre.toLowerCase().includes(q) ||
				artist.languages.some((l) => l.toLowerCase().includes(q));

			return matchesTab && matchesQuery;
		}).sort((a, b) => {
			// If in "all" tab, bump artists from user's selected languages to top
			const aMatchLang = a.languages.some((l) => selectedLanguages.includes(l));
			const bMatchLang = b.languages.some((l) => selectedLanguages.includes(l));
			if (aMatchLang && !bMatchLang) return -1;
			if (!aMatchLang && bMatchLang) return 1;
			return 0;
		});
	});

	// Combined list of display artists (local + online search)
	const displayArtists = $derived.by(() => {
		const q = artistFilter.trim().toLowerCase();
		if (!q) return filteredCuratedArtists;

		// Merge curated results with online search results without duplicates
		const seen = new Set(filteredCuratedArtists.map((a) => a.name.toLowerCase()));
		const additional = onlineArtistResults.filter((a) => !seen.has(a.name.toLowerCase()));
		return [...filteredCuratedArtists, ...additional];
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
						image: art.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
						monthlyListeners: (art.trackCount ? art.trackCount * 250000 : 5000000).toLocaleString(),
						bio: `Online streaming artist matching "${q}".`,
					}));
				} else {
					onlineArtistResults = [];
				}
			} catch {
				onlineArtistResults = [];
			} finally {
				isSearchingOnline = false;
			}
		}, 300);
	}

	function handleToggleLanguage(name: string) {
		userPreferences.toggleLanguage(name);
	}

	function handleSelectPreset(preset: "hindi_english" | "punjabi_hindi" | "south_indian" | "global" | "clear") {
		if (preset === "hindi_english") {
			userPreferences.setLanguages(["Hindi", "English"]);
		} else if (preset === "punjabi_hindi") {
			userPreferences.setLanguages(["Punjabi", "Hindi", "English"]);
		} else if (preset === "south_indian") {
			userPreferences.setLanguages(["Tamil", "Telugu", "Malayalam", "Kannada", "English"]);
		} else if (preset === "global") {
			userPreferences.setLanguages(["English", "Spanish", "Korean"]);
		} else if (preset === "clear") {
			userPreferences.setLanguages(["English"]);
		}
	}

	function handleToggleArtist(artist: PopularArtist) {
		if (userPreferences.hasArtist(artist.name)) {
			userPreferences.toggleArtist(artist.name);
		} else {
			userPreferences.addCustomArtist(artist);
		}
	}

	function handleRemoveSelectedArtist(artistName: string) {
		if (userPreferences.hasArtist(artistName)) {
			userPreferences.toggleArtist(artistName);
		}
	}

	function handleNextStep() {
		if (selectedLanguages.length === 0) {
			userPreferences.setLanguages(["English"]);
		}
		// Reset tab to "all" when transitioning to artists
		artistLanguageTab = "all";
		artistFilter = "";
		onlineArtistResults = [];
		step = 2;
	}

	function handlePrevStep() {
		step = 1;
	}

	function handleFinish() {
		if (!canFinish) return;
		userPreferences.completeOnboarding();
		open = false;
		oncompleted?.();
		onclose?.();
	}

	function handleSkip() {
		userPreferences.completeOnboarding();
		open = false;
		onclose?.();
	}

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleSkip();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="onboarding-overlay" onclick={handleOverlayClick}>
		<div class="onboarding-modal" role="dialog" aria-modal="true">
			<!-- Header Progress Bar -->
			<div class="progress-bar">
				<div class="progress-fill" style="width: {step === 1 ? '50%' : '100%'}"></div>
			</div>

			<!-- Modal Header -->
			<div class="modal-head">
				<div class="step-badge">Step {step} of 2</div>
				<button class="skip-btn" onclick={handleSkip}>Skip for now</button>
			</div>

			{#if step === 1}
				<!-- STEP 1: LANGUAGES -->
				<div class="step-content">
					<div class="step-header-wrap">
						<h2 class="step-title">What languages do you listen to?</h2>
						<p class="step-desc">
							Select the languages you love. Mezzo will curate your daily mixes, hit charts, and artist radios around your choices.
						</p>
					</div>

					<!-- Quick Presets Row -->
					<div class="presets-row">
						<span class="preset-label">Quick select:</span>
						<button type="button" class="preset-pill" onclick={() => handleSelectPreset("hindi_english")}>
							🔥 Hindi + English
						</button>
						<button type="button" class="preset-pill" onclick={() => handleSelectPreset("punjabi_hindi")}>
							⚡ Punjabi + Hindi
						</button>
						<button type="button" class="preset-pill" onclick={() => handleSelectPreset("south_indian")}>
							🌴 South Indian
						</button>
						<button type="button" class="preset-pill" onclick={() => handleSelectPreset("global")}>
							🌐 Global Hits
						</button>
						{#if selectedLanguages.length > 1}
							<button type="button" class="preset-pill clear-pill" onclick={() => handleSelectPreset("clear")}>
								Reset
							</button>
						{/if}
					</div>

					<!-- Search and Category Filters -->
					<div class="controls-row">
						<div class="search-input-wrap compact">
							<svg viewBox="0 0 24 24" width="1.05rem" height="1.05rem" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
								<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								type="text"
								placeholder="Search languages (e.g. Hindi, Punjabi, Spanish...)"
								bind:value={languageQuery}
								class="compact-search"
							/>
							{#if languageQuery}
								<button class="clear-search" onclick={() => (languageQuery = "")}>✕</button>
							{/if}
						</div>

						<div class="category-tabs">
							<button
								type="button"
								class="tab-btn"
								class:active={languageCategory === "all"}
								onclick={() => (languageCategory = "all")}
							>
								All ({POPULAR_LANGUAGES.length})
							</button>
							<button
								type="button"
								class="tab-btn"
								class:active={languageCategory === "South Asian"}
								onclick={() => (languageCategory = "South Asian")}
							>
								🇮🇳 South Asian
							</button>
							<button
								type="button"
								class="tab-btn"
								class:active={languageCategory === "International"}
								onclick={() => (languageCategory = "International")}
							>
								🌐 International
							</button>
						</div>
					</div>

					<!-- Selection Counter -->
					<div class="selection-status-row">
						<span class="status-indicator">
							<strong>{selectedLanguages.length}</strong> {selectedLanguages.length === 1 ? "language" : "languages"} selected
						</span>
					</div>

					<!-- Languages Grid -->
					<div class="languages-grid">
						{#each filteredLanguages as lang (lang.code)}
							{@const selected = userPreferences.hasLanguage(lang.name)}
							<button
								type="button"
								class="lang-chip"
								class:selected
								onclick={() => handleToggleLanguage(lang.name)}
							>
								<span class="lang-emoji">{lang.emoji}</span>
								<div class="lang-text">
									<span class="lang-name">{lang.name}</span>
									<span class="lang-native">{lang.native}</span>
								</div>
								{#if selected}
									<div class="check-circle">
										<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="3">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									</div>
								{/if}
							</button>
						{/each}
					</div>

					<!-- Footer Actions -->
					<div class="footer-actions">
						<button class="primary-btn continue-btn" onclick={handleNextStep}>
							<span>Next: Choose Artists</span>
							<span class="count-pill">({selectedLanguages.length} picked)</span>
							<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</button>
					</div>
				</div>
			{:else}
				<!-- STEP 2: ARTISTS -->
				<div class="step-content">
					<div class="artists-header-row">
						<div>
							<h2 class="step-title">Choose 3 or more artists you love</h2>
							<p class="step-desc">Pick your favorites or search any artist in the world to shape your personalized home feed.</p>
						</div>
						<div class="counter-badge" class:ready={canFinish}>
							{#if canFinish}
								✓ {selectedArtists.length} selected
							{:else}
								{selectedArtists.length} / {minArtistsRequired} selected
							{/if}
						</div>
					</div>

					<!-- Selected Artists Shelf (Tags Row) -->
					{#if selectedArtists.length > 0}
						<div class="selected-shelf">
							<span class="shelf-label">Selected:</span>
							<div class="shelf-chips">
								{#each selectedArtists as artName (artName)}
									<span class="artist-pill-chip">
										<span class="chip-name">{artName}</span>
										<button
											type="button"
											class="chip-remove-btn"
											title="Remove {artName}"
											onclick={() => handleRemoveSelectedArtist(artName)}
										>✕</button>
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Search & Language Filter Controls -->
					<div class="search-input-wrap">
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
							<circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<input
							type="text"
							placeholder="Search any artist (e.g. Arijit Singh, Diljit, Taylor Swift, Coldplay...)"
							value={artistFilter}
							oninput={handleSearchInput}
							class="artist-search"
						/>
						{#if isSearchingOnline}
							<div class="search-spinner" title="Searching online..."></div>
						{/if}
						{#if artistFilter}
							<button class="clear-search" onclick={() => { artistFilter = ""; onlineArtistResults = []; }}>✕</button>
						{/if}
					</div>

					<!-- Dynamic Language Filter Pills based on Step 1 selections -->
					{#if availableArtistTabs.length > 1}
						<div class="artist-lang-filter-bar">
							<span class="filter-kicker">Filter by language:</span>
							<div class="filter-pills-row">
								{#each availableArtistTabs as tab (tab)}
									<button
										type="button"
										class="filter-pill-btn"
										class:active={artistLanguageTab === tab}
										onclick={() => (artistLanguageTab = tab)}
									>
										{tab === "all" ? "All Selected" : tab}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Artist Grid -->
					<div class="artists-picker-grid">
						{#each displayArtists as artist (artist.name)}
							{@const isPicked = userPreferences.hasArtist(artist.name)}
							<button
								type="button"
								class="artist-tile"
								class:picked={isPicked}
								onclick={() => handleToggleArtist(artist)}
							>
								<div class="avatar-circle">
									<img
										src={artist.image}
										alt={artist.name}
										class="artist-avatar-img"
										loading="lazy"
										onerror={(e) => {
											(e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
										}}
									/>
									{#if isPicked}
										<div class="picked-overlay">
											<svg viewBox="0 0 24 24" width="1.4rem" height="1.4rem" fill="none" stroke="#fff" stroke-width="3">
												<polyline points="20 6 9 17 4 12" />
											</svg>
										</div>
									{/if}
								</div>
								<span class="artist-tile-name" title={artist.name}>{artist.name}</span>
								<span class="artist-tile-genre">{artist.genre}</span>
							</button>
						{/each}

						{#if displayArtists.length === 0 && !isSearchingOnline}
							<div class="no-artists-found">
								<p>No matching artists found for "{artistFilter}".</p>
								<span>Try searching for another artist name above.</span>
							</div>
						{/if}
					</div>

					<div class="footer-actions footer-actions-between">
						<button class="secondary-btn back-btn" onclick={handlePrevStep}>
							<svg viewBox="0 0 24 24" width="1.05rem" height="1.05rem" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="15 18 9 12 15 6" />
							</svg>
							<span>Back to Languages</span>
						</button>

						<button
							class="primary-btn finish-btn"
							class:disabled={!canFinish}
							onclick={handleFinish}
						>
							{#if canFinish}
								<span>Start Listening & Discover</span>
								<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
									<polygon points="6 4 20 12 6 20 6 4" />
								</svg>
							{:else}
								<span>Pick {minArtistsRequired - selectedArtists.length} more artist{minArtistsRequired - selectedArtists.length === 1 ? "" : "s"}</span>
							{/if}
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
		height: 100dvh;
		background: #000000;
		z-index: 100060;
		display: flex;
		flex-direction: column;
		padding: 0;
		margin: 0;
		overflow: hidden;
		animation: fadeIn 180ms ease;
	}

	.onboarding-modal {
		background: radial-gradient(circle at 50% -10%, #163621 0%, #0d1711 40%, #060807 85%);
		border: none;
		border-radius: 0;
		width: 100vw;
		height: 100dvh;
		max-width: 100vw;
		max-height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: none;
		animation: fadeIn 200ms ease;
	}

	.progress-bar {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.08);
		flex-shrink: 0;

		.progress-fill {
			height: 100%;
			background: #1ed760;
			transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1);
		}
	}

	.modal-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 58rem;
		margin: 0 auto;
		padding: max(1.2rem, env(safe-area-inset-top)) 2rem 0.6rem;
		flex-shrink: 0;
		box-sizing: border-box;

		.step-badge {
			font-size: 0.82rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: #1ed760;
			background: rgba(30, 215, 96, 0.12);
			padding: 0.3rem 0.85rem;
			border-radius: 9999px;
			border: 1px solid rgba(30, 215, 96, 0.25);
		}

		.skip-btn {
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
			color: rgba(255, 255, 255, 0.7);
			font-size: 0.88rem;
			font-weight: 600;
			cursor: pointer;
			padding: 0.45rem 1rem;
			border-radius: 9999px;
			transition: all 140ms;

			&:hover {
				color: #fff;
				background: rgba(255, 255, 255, 0.15);
				border-color: rgba(255, 255, 255, 0.25);
			}
		}
	}

	.step-content {
		flex: 1;
		width: 100%;
		max-width: 58rem;
		margin: 0 auto;
		padding: 0.5rem 2rem max(1.5rem, env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		max-height: none;
		box-sizing: border-box;
		-webkit-overflow-scrolling: touch;

		.step-title {
			color: #fff;
			font-size: clamp(1.6rem, 3vw, 2.2rem);
			font-weight: 800;
			margin: 0 0 0.45rem;
			letter-spacing: -0.025em;
		}

		.step-desc {
			color: rgba(255, 255, 255, 0.65);
			font-size: clamp(0.92rem, 1.3vw, 1.05rem);
			margin: 0 0 1.25rem;
			line-height: 1.5;
			max-width: 44rem;
		}
	}

	/* Presets row */
	.presets-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;

		.preset-label {
			font-size: 0.78rem;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.45);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		.preset-pill {
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.12);
			color: rgba(255, 255, 255, 0.85);
			border-radius: 9999px;
			padding: 0.3rem 0.75rem;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 140ms ease;

			&:hover {
				background: rgba(255, 255, 255, 0.14);
				border-color: rgba(255, 255, 255, 0.25);
				color: #fff;
				transform: translateY(-1px);
			}

			&.clear-pill {
				color: rgba(255, 100, 100, 0.85);
				border-color: rgba(255, 100, 100, 0.25);

				&:hover {
					background: rgba(255, 100, 100, 0.15);
					color: #ff8888;
				}
			}
		}
	}

	/* Controls row: search + category tabs */
	.controls-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.85rem;
		flex-wrap: wrap;

		.compact {
			flex: 1;
			min-width: 14rem;
			margin-bottom: 0;
		}
	}

	.category-tabs {
		display: flex;
		gap: 0.35rem;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem;
		border-radius: 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.08);

		.tab-btn {
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.6);
			border-radius: 0.5rem;
			padding: 0.4rem 0.75rem;
			font-size: 0.8rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 140ms ease;

			&:hover {
				color: #fff;
			}

			&.active {
				background: rgba(255, 255, 255, 0.15);
				color: #ffffff;
			}
		}
	}

	.selection-status-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.85rem;

		.status-indicator {
			font-size: 0.82rem;
			color: rgba(255, 255, 255, 0.55);

			strong {
				color: #1ed760;
			}
		}
	}

	/* Languages Grid */
	.languages-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13.5rem, 1fr));
		gap: 0.85rem;
		max-height: none;
		overflow: visible;
		padding: 0.25rem 0.1rem;
		margin-bottom: 2rem;
	}

	.lang-chip {
		display: flex;
		align-items: center;
		gap: 0.95rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 0.9rem 1.15rem;
		cursor: pointer;
		text-align: left;
		transition: all 160ms cubic-bezier(0.2, 0, 0, 1);

		&:hover {
			background: rgba(255, 255, 255, 0.09);
			border-color: rgba(255, 255, 255, 0.24);
			transform: translateY(-2px);
		}

		&.selected {
			background: rgba(30, 215, 96, 0.12);
			border-color: #1ed760;
			box-shadow: 0 0 20px rgba(30, 215, 96, 0.2);

			.lang-name {
				color: #fff;
				font-weight: 700;
			}

			.check-circle {
				background: #1ed760;
				color: #000;
			}
		}

		.lang-emoji {
			font-size: 1.55rem;
		}

		.lang-text {
			display: flex;
			flex-direction: column;
			flex: 1;

			.lang-name {
				color: rgba(255, 255, 255, 0.95);
				font-size: 1rem;
				font-weight: 600;
			}

			.lang-native {
				color: rgba(255, 255, 255, 0.45);
				font-size: 0.8rem;
			}
		}

		.check-circle {
			width: 1.45rem;
			height: 1.45rem;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.1);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-left: auto;
			color: #fff;
			transition: all 140ms ease;
		}
	}

	/* Step 2: Artists Header & Counter */
	.artists-header-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1.25rem;
		margin-bottom: 1rem;

		.counter-badge {
			display: flex;
			align-items: center;
			gap: 0.45rem;
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 9999px;
			padding: 0.4rem 0.95rem;
			font-size: 0.85rem;
			font-weight: 700;
			color: rgba(255, 255, 255, 0.7);
			white-space: nowrap;
			flex-shrink: 0;

			&.ready {
				background: rgba(30, 215, 96, 0.15);
				border-color: rgba(30, 215, 96, 0.4);
				color: #1ed760;
			}
		}
	}

	/* Selected Artists Shelf */
	.selected-shelf {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 0.85rem;
		padding: 0.55rem 0.85rem;
		margin-bottom: 0.85rem;
		overflow-x: auto;

		.shelf-label {
			font-size: 0.76rem;
			font-weight: 700;
			text-transform: uppercase;
			color: #1ed760;
			letter-spacing: 0.05em;
			white-space: nowrap;
		}

		.shelf-chips {
			display: flex;
			gap: 0.45rem;
			align-items: center;
			flex-wrap: nowrap;
		}

		.artist-pill-chip {
			display: inline-flex;
			align-items: center;
			gap: 0.4rem;
			background: rgba(30, 215, 96, 0.12);
			border: 1px solid rgba(30, 215, 96, 0.3);
			border-radius: 9999px;
			padding: 0.25rem 0.65rem;
			font-size: 0.78rem;
			font-weight: 600;
			color: #ffffff;
			white-space: nowrap;

			.chip-remove-btn {
				background: transparent;
				border: none;
				color: rgba(255, 255, 255, 0.6);
				cursor: pointer;
				font-size: 0.72rem;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0;

				&:hover {
					color: #ff7777;
				}
			}
		}
	}

	/* Filter by language pills for Step 2 */
	.artist-lang-filter-bar {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.85rem;
		flex-wrap: wrap;

		.filter-kicker {
			font-size: 0.75rem;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.45);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		.filter-pills-row {
			display: flex;
			gap: 0.35rem;
			flex-wrap: wrap;
		}

		.filter-pill-btn {
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 9999px;
			padding: 0.25rem 0.75rem;
			font-size: 0.78rem;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.7);
			cursor: pointer;
			transition: all 130ms ease;

			&:hover {
				color: #fff;
				border-color: rgba(255, 255, 255, 0.25);
			}

			&.active {
				background: #ffffff;
				color: #000000;
				border-color: #ffffff;
			}
		}
	}

	/* Search input wrap */
	.search-input-wrap {
		position: relative;
		margin-bottom: 0.85rem;
		display: flex;
		align-items: center;

		.search-icon {
			position: absolute;
			left: 1rem;
			color: rgba(255, 255, 255, 0.4);
			pointer-events: none;
		}

		.artist-search, .compact-search {
			width: 100%;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 0.75rem;
			padding: 0.7rem 2.5rem 0.7rem 2.65rem;
			color: #fff;
			font-size: 0.92rem;
			outline: none;
			transition: border-color 150ms;

			&:focus {
				border-color: #1ed760;
				background: rgba(255, 255, 255, 0.08);
			}

			&::placeholder {
				color: rgba(255, 255, 255, 0.38);
			}
		}

		.search-spinner {
			position: absolute;
			right: 2.25rem;
			width: 0.9rem;
			height: 0.9rem;
			border: 2px solid rgba(255, 255, 255, 0.2);
			border-top-color: #1ed760;
			border-radius: 50%;
			animation: spin 600ms linear infinite;
		}

		.clear-search {
			position: absolute;
			right: 0.75rem;
			background: transparent;
			border: none;
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.85rem;
			cursor: pointer;
			padding: 0.25rem 0.5rem;

			&:hover {
				color: #fff;
			}
		}
	}

	/* Artists Picker Grid */
	.artists-picker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
		gap: 1.1rem;
		max-height: none;
		overflow: visible;
		padding: 0.4rem 0.1rem;
		margin-bottom: 2rem;
	}

	.artist-tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid transparent;
		border-radius: 1rem;
		padding: 0.9rem 0.5rem;
		cursor: pointer;
		transition: all 180ms cubic-bezier(0.2, 0, 0, 1);

		&:hover {
			background: rgba(255, 255, 255, 0.07);
			transform: translateY(-3px);
		}

		&.picked {
			background: rgba(30, 215, 96, 0.1);
			border-color: #1ed760;

			.avatar-circle {
				box-shadow: 0 0 0 3px #1ed760, 0 0 20px rgba(30, 215, 96, 0.45);
			}
			.artist-tile-name {
				color: #fff;
				font-weight: 700;
			}
		}

		.avatar-circle {
			position: relative;
			width: 5.2rem;
			height: 5.2rem;
			border-radius: 50%;
			overflow: hidden;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 0.65rem;
			background: #242424;
			transition: all 160ms;

			.artist-avatar-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.picked-overlay {
				position: absolute;
				inset: 0;
				border-radius: 50%;
				background: rgba(30, 215, 96, 0.82);
				display: flex;
				align-items: center;
				justify-content: center;
				animation: popIn 150ms ease;
			}
		}

		.artist-tile-name {
			color: rgba(255, 255, 255, 0.9);
			font-size: 0.88rem;
			font-weight: 600;
			line-height: 1.25;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			width: 100%;
			margin-bottom: 0.15rem;
		}

		.artist-tile-genre {
			color: rgba(255, 255, 255, 0.42);
			font-size: 0.74rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			width: 100%;
		}
	}

	.no-artists-found {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2.5rem 1rem;
		color: rgba(255, 255, 255, 0.6);

		p {
			font-size: 0.95rem;
			font-weight: 600;
			color: #ffffff;
			margin: 0 0 0.25rem;
		}

		span {
			font-size: 0.82rem;
			color: rgba(255, 255, 255, 0.4);
		}
	}

	/* Footer Actions */
	.footer-actions {
		display: flex;
		justify-content: flex-end;
		padding: 1.15rem 0 max(1.25rem, env(safe-area-inset-bottom));
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		position: sticky;
		bottom: 0;
		background: linear-gradient(180deg, rgba(8, 10, 9, 0.4) 0%, rgba(6, 8, 7, 0.95) 45%, #060807 100%);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		z-index: 20;
		margin-top: auto;
		width: 100%;

		&.footer-actions-between {
			justify-content: space-between;
			align-items: center;
		}
	}

	.primary-btn {
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 0.85rem 1.85rem;
		font-weight: 800;
		font-size: 0.98rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		transition: all 140ms ease;
		box-shadow: 0 4px 18px rgba(30, 215, 96, 0.25);

		.count-pill {
			font-size: 0.82rem;
			opacity: 0.85;
		}

		&:hover:not(.disabled) {
			background: #22e366;
			transform: scale(1.025);
			box-shadow: 0 6px 24px rgba(30, 215, 96, 0.4);
		}

		&.disabled {
			opacity: 0.35;
			cursor: not-allowed;
			box-shadow: none;
		}
	}

	.secondary-btn {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
		border-radius: 9999px;
		padding: 0.8rem 1.45rem;
		font-weight: 700;
		font-size: 0.95rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 140ms ease;

		&:hover {
			border-color: #fff;
			background: rgba(255, 255, 255, 0.08);
		}
	}

	@media (max-width: 640px) {
		.onboarding-overlay {
			padding: 0 !important;
			align-items: stretch !important;
		}

		.onboarding-modal {
			max-width: 100% !important;
			max-height: 100dvh !important;
			height: 100dvh !important;
			border-radius: 0 !important;
			border: none !important;
		}

		.modal-head {
			padding: max(1rem, env(safe-area-inset-top)) 1.25rem 0.5rem !important;
		}

		.step-content {
			padding: 0.4rem 1.25rem 1rem !important;
			max-height: calc(100dvh - 5.5rem) !important;
		}

		.step-title {
			font-size: 1.4rem !important;
		}

		.step-desc {
			font-size: 0.88rem !important;
			margin-bottom: 0.85rem !important;
		}

		.presets-row {
			gap: 0.4rem !important;
			margin-bottom: 0.75rem !important;

			.preset-pill {
				font-size: 0.78rem !important;
				padding: 0.3rem 0.65rem !important;
			}
		}

		.controls-row {
			flex-direction: column !important;
			align-items: stretch !important;
			gap: 0.5rem !important;

			.compact {
				min-width: 100% !important;
			}

			.category-tabs {
				width: 100% !important;
				justify-content: space-between !important;

				.tab-btn {
					flex: 1 !important;
					text-align: center !important;
					padding: 0.4rem 0.5rem !important;
					font-size: 0.78rem !important;
				}
			}
		}

		.languages-grid {
			grid-template-columns: repeat(2, 1fr) !important;
			gap: 0.6rem !important;
			margin-bottom: 1.5rem !important;
			max-height: none !important;
		}

		.lang-chip {
			padding: 0.75rem 0.85rem !important;
			gap: 0.6rem !important;
			border-radius: 0.85rem !important;

			.lang-emoji {
				font-size: 1.35rem !important;
			}

			.lang-text .lang-name {
				font-size: 0.88rem !important;
			}

			.lang-text .lang-native {
				font-size: 0.72rem !important;
			}
		}

		.artists-picker-grid {
			grid-template-columns: repeat(3, 1fr) !important;
			gap: 0.6rem !important;
			margin-bottom: 1.5rem !important;
			max-height: none !important;
		}

		.artist-tile {
			padding: 0.6rem 0.3rem !important;

			.avatar-circle {
				width: 4.2rem !important;
				height: 4.2rem !important;
			}

			.artist-tile-name {
				font-size: 0.78rem !important;
			}
		}

		.footer-actions {
			padding: 0.85rem 0 max(1.15rem, env(safe-area-inset-bottom)) !important;
			box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.8) !important;

			.primary-btn {
				width: 100%;
				justify-content: center;
				padding: 0.85rem 1.4rem;
			}

			&.footer-actions-between {
				flex-direction: column !important;
				gap: 0.6rem !important;

				.secondary-btn, .primary-btn {
					width: 100% !important;
					justify-content: center !important;
				}
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes popIn {
		from { transform: scale(0.96); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
