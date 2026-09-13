<script lang="ts">
	import type { Track } from "$lib/stores/player.svelte";
	import { streamUrl, coverUrl, formatDuration, addToQueue, playNext } from "$lib/stores/player.svelte";
	import { DEFAULT_ALBUM_COVER, handleImageError } from "$lib/utils/image";
	import { likedStore } from "$lib/stores/liked.svelte";
	import { goto } from "$app/navigation";
	import AddToPlaylistModal from "$lib/components/AddToPlaylistModal.svelte";
	import EditTrackModal from "$lib/components/EditTrackModal.svelte";
	import { offlineStore } from "$lib/services/offline.svelte";
	import { triggerHaptic } from "$lib/utils/haptics";

	interface Props {
		track: Track;
		index?: number;
		onplay?: (track: Track) => void;
		ondelete?: (track: Track) => void;
		onremove?: (track: Track) => void;
		onupdated?: (track: Track) => void;
		playing?: boolean;
		showMenu?: boolean;
	}

	let { track, index, onplay, ondelete, onremove, onupdated, playing = false, showMenu = true }: Props = $props();

	let menuOpen = $state(false);
	let showPlaylistModal = $state(false);
	let showEditModal = $state(false);
	let copiedToast = $state(false);
	let isDownloading = $state(false);

	const isLiked = $derived(likedStore.isLiked(track.id));
	const isDownloaded = $derived(offlineStore.isTrackDownloaded(track.id));

	function handlePlay() {
		triggerHaptic("light");
		onplay?.(track);
	}

	function handleMenuToggle(e: MouseEvent) {
		e.stopPropagation();
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleToggleLike(e: MouseEvent) {
		e.stopPropagation();
		triggerHaptic("success");
		likedStore.toggle(track);
	}

	function handlePlayNext(e: MouseEvent) {
		e.stopPropagation();
		playNext(track);
		closeMenu();
	}

	function handleAddToQueue(e: MouseEvent) {
		e.stopPropagation();
		addToQueue(track);
		closeMenu();
	}

	function handleOpenAddToPlaylist(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		showPlaylistModal = true;
	}

	async function handleShare(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		const shareUrl = typeof window !== "undefined"
			? `${window.location.origin}/search?q=${encodeURIComponent(track.title + " " + (track.artist || ""))}`
			: "";

		if (typeof navigator !== "undefined" && navigator.share) {
			try {
				await navigator.share({
					title: track.title,
					text: `Listen to "${track.title}" by ${track.artist || "Unknown Artist"} on Mezzo Lossless`,
					url: shareUrl,
				});
				return;
			} catch {}
		}

		if (typeof navigator !== "undefined" && navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(shareUrl);
				copiedToast = true;
				setTimeout(() => {
					copiedToast = false;
				}, 2200);
			} catch {}
		}
	}

	function handleGoToArtist(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		if (track.artist) {
			goto(`/artist/${encodeURIComponent(track.artist)}`);
		}
	}

	async function handleRemoveOffline(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		await offlineStore.removeDownloadedTrack(track.id);
	}

	async function handleDownload(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		const targetUrl = track.stream_url || streamUrl(track);
		if (!targetUrl) return;
		isDownloading = true;
		triggerHaptic("medium");
		try {
			// Save offline to CacheStorage
			await offlineStore.downloadTrack(track).catch(() => {});

			const res = await fetch(targetUrl);
			if (!res.ok) throw new Error("Fetch failed");
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			setTimeout(() => URL.revokeObjectURL(url), 2000);
			triggerHaptic("success");
		} catch {
			const a = document.createElement("a");
			a.href = targetUrl;
			a.target = "_blank";
			const safeArtist = (track.artist || "Unknown").replace(/[/\\?%*:|"<>]/g, "");
			const safeTitle = (track.title || "Track").replace(/[/\\?%*:|"<>]/g, "");
			a.download = `${safeArtist} - ${safeTitle}.m4a`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			isDownloading = false;
		}
	}

	function handleOpenEdit(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		showEditModal = true;
	}

	function handleDelete(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		if (confirm(`Remove "${track.title}" from your library?`)) {
			ondelete?.(track);
		}
	}

	function handleRemove(e: MouseEvent) {
		e.stopPropagation();
		closeMenu();
		onremove?.(track);
	}
</script>

<svelte:window onclick={closeMenu} />

<div class="track-row" class:active={playing}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="row-click-area" onclick={handlePlay}>
		{#if index !== undefined}
			<div class="index-col">
				{#if playing}
					<div class="eq-icon">
						<span></span><span></span><span></span>
					</div>
				{:else}
					<span class="num">{index + 1}</span>
					<span class="hover-play-icon">
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="currentColor">
							<polygon points="6 4 20 12 6 20 6 4" />
						</svg>
					</span>
				{/if}
			</div>
		{/if}

		<div class="cover-col">
			<div class="track-cover">
				<img
					src={coverUrl(track) || DEFAULT_ALBUM_COVER}
					alt=""
					onerror={handleImageError}
					loading="lazy"
				/>
			</div>
		</div>

		<div class="meta-col">
			<span class="title" title={track.title}>
				{track.title}
				{#if isDownloaded}
					<span class="offline-badge" title="Saved offline">
						<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#1ed760" stroke-width="2.5">
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</span>
				{/if}
			</span>
			<span class="artist" title={track.artist ?? "Unknown Artist"}>
				{track.artist ?? "Unknown Artist"}
			</span>
		</div>

		<div class="album-col">
			<span class="album-text">{track.album || track.genre || "Single"}</span>
		</div>



		<div class="duration-col">
			<span>{formatDuration(track.duration)}</span>
		</div>
	</div>

	<!-- Like Heart Button -->
	<button
		class="like-btn"
		class:liked={isLiked}
		onclick={handleToggleLike}
		aria-label={isLiked ? "Unlike track" : "Like track"}
		title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
	>
		{#if isLiked}
			<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="#1ed760">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
			</svg>
		{/if}
	</button>

	{#if showMenu}
		<div class="menu-col">
			<button
				class="menu-btn"
				class:active={menuOpen}
				onclick={handleMenuToggle}
				aria-label="Track options"
				title="More options"
			>
				<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="currentColor">
					<circle cx="12" cy="5" r="1.75" />
					<circle cx="12" cy="12" r="1.75" />
					<circle cx="12" cy="19" r="1.75" />
				</svg>
			</button>

			{#if copiedToast}
				<div class="copied-badge">Link copied!</div>
			{/if}

			{#if menuOpen}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="dropdown-menu" onclick={(e) => e.stopPropagation()}>
					<button class="dropdown-item" onclick={handlePlayNext}>
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
							<polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" />
						</svg>
						Play next
					</button>
					<button class="dropdown-item" onclick={handleAddToQueue}>
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
						</svg>
						Add to queue
					</button>
					<button class="dropdown-item" onclick={handleOpenAddToPlaylist}>
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Add to playlist...
					</button>
					<div class="dropdown-divider"></div>
					<button class="dropdown-item" onclick={handleShare}>
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
							<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
							<line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
						</svg>
						Share song
					</button>
					{#if track.artist}
						<button class="dropdown-item" onclick={handleGoToArtist}>
							<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
							</svg>
							Go to artist
						</button>
					{/if}
					<button class="dropdown-item" onclick={handleDownload} disabled={isDownloading}>
						<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
						</svg>
						{isDownloading ? "Downloading..." : (isDownloaded ? "Saved Offline (Re-download)" : "Save Offline / Download")}
					</button>
					{#if isDownloaded}
						<button class="dropdown-item danger" onclick={handleRemoveOffline}>
							<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
							</svg>
							Remove from offline
						</button>
					{/if}
					{#if onupdated}
						<button class="dropdown-item" onclick={handleOpenEdit}>
							<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
							</svg>
							Edit details...
						</button>
					{/if}
					{#if onremove}
						<div class="dropdown-divider"></div>
						<button class="dropdown-item danger" onclick={handleRemove}>
							<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
								<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
							</svg>
							Remove from playlist
						</button>
					{/if}
					{#if ondelete}
						<div class="dropdown-divider"></div>
						<button class="dropdown-item danger" onclick={handleDelete}>
							<svg viewBox="0 0 24 24" width="0.95rem" height="0.95rem" fill="none" stroke="currentColor" stroke-width="2">
								<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
							</svg>
							Delete track
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<AddToPlaylistModal bind:open={showPlaylistModal} {track} />
<EditTrackModal bind:open={showEditModal} {track} onupdated={onupdated} />

<style lang="scss">
	.track-row {
		display: flex;
		align-items: center;
		width: 100%;
		border-radius: 4px;
		background: transparent;
		transition: background 120ms ease;
		position: relative;
		user-select: none;
		padding: 0 0.5rem;

		&:hover {
			background: rgba(255, 255, 255, 0.1);

			.like-btn, .menu-btn {
				opacity: 1;
			}
			.index-col .num {
				display: none;
			}
			.index-col .hover-play-icon {
				display: flex;
			}
		}

		&.active {
			background: rgba(255, 255, 255, 0.15);

			.title {
				color: #1ed760 !important;
				font-weight: 700;
			}
		}
	}

	.row-click-area {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.5rem 0;
		cursor: pointer;
		min-width: 0;
	}

	.index-col {
		width: 2rem;
		text-align: center;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #b3b3b3;
		font-size: 0.88rem;
		font-variant-numeric: tabular-nums;

		.hover-play-icon {
			display: none;
			color: #ffffff;
			align-items: center;
			justify-content: center;
		}

		.eq-icon {
			display: flex;
			align-items: flex-end;
			gap: 2px;
			height: 14px;

			span {
				width: 3px;
				background: #1ed760;
				border-radius: 1px;
				animation: eq 0.8s ease infinite alternate;

				&:nth-child(1) { height: 100%; animation-delay: 0.2s; }
				&:nth-child(2) { height: 50%; animation-delay: 0.4s; }
				&:nth-child(3) { height: 75%; animation-delay: 0.1s; }
			}
		}
	}

	@keyframes eq {
		0% { height: 20%; }
		100% { height: 100%; }
	}

	.cover-col {
		flex-shrink: 0;
	}

	.track-cover {
		position: relative;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 4px;
		overflow: hidden;
		background: #282828;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.meta-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		padding-right: 0.5rem;

		.title {
			color: #ffffff;
			font-size: 0.95rem;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;

			.offline-badge {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 15px;
				height: 15px;
				border-radius: 50%;
				background: rgba(30, 215, 96, 0.18);
				flex-shrink: 0;
			}
		}

		.artist {
			color: #b3b3b3;
			font-size: 0.82rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			&:hover {
				color: #ffffff;
				text-decoration: underline;
			}
		}
	}

	.album-col {
		flex: 0.8;
		min-width: 0;
		padding-right: 0.5rem;

		@media screen and (max-width: 768px) {
			display: none;
		}

		.album-text {
			color: #b3b3b3;
			font-size: 0.82rem;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			display: block;

			&:hover {
				color: #ffffff;
			}
		}
	}



	.duration-col {
		width: 3.5rem;
		text-align: right;
		flex-shrink: 0;
		color: #b3b3b3;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
	}

	.like-btn {
		background: transparent;
		border: none;
		color: #a7a7a7;
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0.4;
		transition: all 120ms ease;

		&.liked {
			opacity: 1 !important;
			color: #1ed760;
		}

		&:hover {
			opacity: 1 !important;
			color: #ffffff;
			transform: scale(1.1);
		}
	}

	.menu-col {
		position: relative;
		flex-shrink: 0;

		.copied-badge {
			position: absolute;
			right: 100%;
			top: 50%;
			transform: translateY(-50%);
			margin-right: 8px;
			background: #1ed760;
			color: #000000;
			font-size: 0.72rem;
			font-weight: 700;
			white-space: nowrap;
			padding: 0.25rem 0.6rem;
			border-radius: 9999px;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
			pointer-events: none;
			z-index: 150;
		}
	}

	.menu-btn {
		background: transparent;
		border: none;
		color: #a7a7a7;
		width: 2.25rem;
		height: 2.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0.4;
		transition: all 120ms ease;

		&.active {
			opacity: 1 !important;
			color: #ffffff;
		}

		&:hover {
			opacity: 1 !important;
			color: #ffffff;
			transform: scale(1.1);
		}
	}

	@media screen and (max-width: 640px) {


		.like-btn,
		.menu-btn {
			opacity: 0.75;
			width: 2rem;
			height: 2rem;
		}

		.duration-col {
			width: 2.75rem;
			font-size: 0.78rem;
		}
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		background: #282828;
		border-radius: 4px;
		padding: 4px;
		min-width: 12rem;
		box-shadow: 0 16px 24px rgba(0, 0, 0, 0.5);
		z-index: 100;
		display: flex;
		flex-direction: column;

		.dropdown-item {
			display: flex;
			align-items: center;
			gap: 0.65rem;
			background: transparent;
			border: none;
			color: #eaeaea;
			font-size: 0.85rem;
			font-weight: 500;
			text-align: left;
			padding: 0.6rem 0.75rem;
			border-radius: 2px;
			cursor: pointer;
			text-decoration: none;
			transition: background 100ms ease;

			&:hover {
				background: rgba(255, 255, 255, 0.1);
				color: #ffffff;
			}

			&.danger {
				color: #ef4444;

				&:hover {
					background: rgba(239, 68, 68, 0.15);
				}
			}
		}

		.dropdown-divider {
			height: 1px;
			background: rgba(255, 255, 255, 0.1);
			margin: 4px 0;
		}
	}
</style>
