<script lang="ts">
	import {
		playerQueue,
		playerPosition,
		playerPlaying,
		playerShowQueue,
		playerAutoRadio,
		toggleAutoRadio,
		playTracks,
		removeFromQueue,
		moveQueueItemUp,
		moveQueueItemDown,
		clearUpcomingQueue,
		clear,
		coverUrl,
		formatDuration,
	} from "$lib/stores/player.svelte";

	const currentTrack = $derived(
		playerPosition.value >= 0 && playerPosition.value < playerQueue.value.length
			? playerQueue.value[playerPosition.value]
			: null
	);

	const upcomingTracks = $derived(
		playerPosition.value >= 0
			? playerQueue.value.slice(playerPosition.value + 1)
			: playerQueue.value
	);

	function jumpTo(idx: number) {
		playTracks(playerQueue.value, idx);
	}

	function handleMoveUp(relativeIdx: number) {
		const absIdx = (playerPosition.value >= 0 ? playerPosition.value + 1 : 0) + relativeIdx;
		moveQueueItemUp(absIdx);
	}

	function handleMoveDown(relativeIdx: number) {
		const absIdx = (playerPosition.value >= 0 ? playerPosition.value + 1 : 0) + relativeIdx;
		moveQueueItemDown(absIdx);
	}

	function handleRemoveUpcoming(relativeIdx: number) {
		const absIdx = (playerPosition.value >= 0 ? playerPosition.value + 1 : 0) + relativeIdx;
		removeFromQueue(absIdx);
	}
</script>

{#if playerShowQueue.value}
	<div
		class="drawer-backdrop"
		onclick={() => (playerShowQueue.value = false)}
		onkeydown={(e) => e.key === "Escape" && (playerShowQueue.value = false)}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<aside class="queue-drawer" onclick={(e) => e.stopPropagation()} role="region" aria-label="Playback Queue">
			<header class="drawer-header">
				<div class="header-title">
					<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
						<circle cx="4" cy="6" r="1.5" fill="currentColor" /><circle cx="4" cy="12" r="1.5" fill="currentColor" /><circle cx="4" cy="18" r="1.5" fill="currentColor" />
					</svg>
					<h2>Queue</h2>
					<span class="badge">{playerQueue.value.length}</span>
				</div>
				<div class="header-actions">
					{#if upcomingTracks.length > 0}
						<button class="clear-btn" onclick={clearUpcomingQueue} title="Clear all upcoming tracks">Clear Up Next</button>
					{:else if playerQueue.value.length > 0}
						<button class="clear-btn" onclick={clear} title="Clear entire queue">Clear All</button>
					{/if}
					<button class="close-btn" onclick={() => (playerShowQueue.value = false)} aria-label="Close queue">
						<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
			</header>

			<!-- Autoplay Radio Toggle Card -->
			<div class="autoplay-radio-bar">
				<div class="radio-meta">
					<div class="radio-icon">
						<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
							<circle cx="12" cy="12" r="2" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
							<path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
						</svg>
					</div>
					<div>
						<span class="radio-title">Infinite Autoplay</span>
						<p class="radio-desc">Continue playing similar tracks when queue ends</p>
					</div>
				</div>
				<button
					class="radio-switch"
					class:active={playerAutoRadio.value}
					onclick={toggleAutoRadio}
					aria-label="Toggle Infinite Radio"
				>
					<span class="switch-thumb"></span>
				</button>
			</div>

			{#if playerQueue.value.length === 0}
				<div class="empty-queue">
					<div class="empty-icon-circle">
						<svg viewBox="0 0 24 24" width="2.2rem" height="2.2rem" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
						</svg>
					</div>
					<p>Your queue is empty</p>
					<span class="sub">Play songs from Search or your Library to populate your queue.</span>
				</div>
			{:else}
				<div class="queue-scroll-area">
					<!-- NOW PLAYING SECTION -->
					{#if currentTrack}
						<div class="queue-section-header">
							<span>NOW PLAYING</span>
						</div>
						<div class="queue-item current">
							<div class="item-status">
								{#if playerPlaying.value}
									<span class="eq-bars">
										<i></i><i></i><i></i>
									</span>
								{:else}
									<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="#1ed760">
										<polygon points="5 3 19 12 5 21 5 3" />
									</svg>
								{/if}
							</div>

							<div class="item-cover">
								<img src={coverUrl(currentTrack)} alt="" onerror={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')} />
							</div>

							<div class="item-meta">
								<span class="title">{currentTrack.title}</span>
								<span class="artist">{currentTrack.artist ?? "Unknown Artist"}</span>
							</div>

							<span class="duration">{formatDuration(currentTrack.duration)}</span>
						</div>
					{/if}

					<!-- UP NEXT SECTION -->
					<div class="queue-section-header next-header">
						<span>UP NEXT</span>
						<span class="section-count">{upcomingTracks.length} tracks</span>
					</div>

					{#if upcomingTracks.length === 0}
						<div class="empty-up-next">
							<p>Nothing queued up next.</p>
							{#if playerAutoRadio.value}
								<span class="radio-hint">Infinite Autoplay is active &bull; Similar tracks will play automatically.</span>
							{/if}
						</div>
					{:else}
						<div class="queue-list">
							{#each upcomingTracks as track, rIdx (track.id + '-' + rIdx)}
								<div class="queue-item upcoming">
									<button class="item-main" onclick={() => jumpTo((playerPosition.value >= 0 ? playerPosition.value + 1 : 0) + rIdx)}>
										<span class="index">{rIdx + 1}</span>

										<div class="item-cover">
											<img src={coverUrl(track)} alt="" onerror={(e) => ((e.currentTarget as HTMLElement).style.display = 'none')} />
										</div>

										<div class="item-meta">
											<span class="title">{track.title}</span>
											<span class="artist">{track.artist ?? "Unknown Artist"}</span>
										</div>

										<span class="duration">{formatDuration(track.duration)}</span>
									</button>

									<!-- Queue Item Controls: Move Up, Move Down, Remove -->
									<div class="item-actions">
										{#if rIdx > 0}
											<button
												class="reorder-btn"
												onclick={() => handleMoveUp(rIdx)}
												title="Move up in queue"
												aria-label="Move up"
											>
												<svg viewBox="0 0 24 24" width="0.9rem" height="0.9rem" fill="none" stroke="currentColor" stroke-width="2">
													<polyline points="18 15 12 9 6 15" />
												</svg>
											</button>
										{/if}

										{#if rIdx < upcomingTracks.length - 1}
											<button
												class="reorder-btn"
												onclick={() => handleMoveDown(rIdx)}
												title="Move down in queue"
												aria-label="Move down"
											>
												<svg viewBox="0 0 24 24" width="0.9rem" height="0.9rem" fill="none" stroke="currentColor" stroke-width="2">
													<polyline points="6 9 12 15 18 9" />
												</svg>
											</button>
										{/if}

										<button
											class="remove-btn"
											onclick={() => handleRemoveUpcoming(rIdx)}
											title="Remove from queue"
											aria-label="Remove from queue"
										>
											<svg viewBox="0 0 24 24" width="0.85rem" height="0.85rem" fill="none" stroke="currentColor" stroke-width="2">
												<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
											</svg>
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</aside>
	</div>
{/if}

<style lang="scss">
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 2500;
		display: flex;
		justify-content: flex-end;
		animation: fadeIn 200ms ease;
	}

	.queue-drawer {
		width: 100%;
		max-width: 26rem;
		height: 100%;
		background: #12151c;
		border-left: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		animation: slideInRight 240ms cubic-bezier(0.16, 1, 0.3, 1);
		box-shadow: -10px 0 35px rgba(0, 0, 0, 0.6);
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		.header-title {
			display: flex;
			align-items: center;
			gap: 0.65rem;

			svg {
				color: #1ed760;
			}

			h2 {
				margin: 0;
				font-size: 1.15rem;
				font-weight: 700;
				color: #fff;
			}

			.badge {
				background: rgba(255, 255, 255, 0.1);
				color: rgba(255, 255, 255, 0.8);
				font-size: 0.72rem;
				font-weight: 700;
				padding: 0.15rem 0.5rem;
				border-radius: 9999px;
			}
		}

		.header-actions {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.clear-btn {
				background: none;
				border: none;
				color: rgba(255, 255, 255, 0.6);
				font-size: 0.8rem;
				font-weight: 600;
				cursor: pointer;
				padding: 0.3rem 0.6rem;
				border-radius: 4px;
				transition: color 150ms;

				&:hover {
					color: #ef4444;
				}
			}

			.close-btn {
				background: none;
				border: none;
				color: rgba(255, 255, 255, 0.7);
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.35rem;
				border-radius: 50%;
				transition: all 150ms;

				&:hover {
					color: #fff;
					background: rgba(255, 255, 255, 0.1);
				}
			}
		}
	}

	.autoplay-radio-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.85rem 1.25rem;
		background: rgba(255, 255, 255, 0.03);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);

		.radio-meta {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.radio-icon {
				width: 2rem;
				height: 2rem;
				border-radius: 50%;
				background: rgba(30, 215, 96, 0.12);
				color: #1ed760;
				display: flex;
				align-items: center;
				justify-content: center;
				flex-shrink: 0;
			}

			.radio-title {
				display: block;
				font-size: 0.88rem;
				font-weight: 600;
				color: #fff;
			}

			.radio-desc {
				margin: 0;
				font-size: 0.72rem;
				color: rgba(255, 255, 255, 0.5);
			}
		}

		.radio-switch {
			width: 2.6rem;
			height: 1.45rem;
			border-radius: 9999px;
			background: rgba(255, 255, 255, 0.2);
			border: none;
			padding: 2px;
			cursor: pointer;
			position: relative;
			transition: background 200ms ease;
			flex-shrink: 0;

			.switch-thumb {
				display: block;
				width: 1.2rem;
				height: 1.2rem;
				border-radius: 50%;
				background: #fff;
				transition: transform 200ms ease;
			}

			&.active {
				background: #1ed760;

				.switch-thumb {
					transform: translateX(1.15rem);
				}
			}
		}
	}

	.empty-queue {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.5);

		.empty-icon-circle {
			width: 4rem;
			height: 4rem;
			border-radius: 50%;
			background: rgba(255, 255, 255, 0.05);
			display: flex;
			align-items: center;
			justify-content: center;
			margin-bottom: 1rem;
			color: rgba(255, 255, 255, 0.3);
		}

		p {
			margin: 0 0 0.4rem;
			font-size: 1rem;
			font-weight: 600;
			color: #fff;
		}

		.sub {
			font-size: 0.82rem;
			max-width: 18rem;
			line-height: 1.4;
		}
	}

	.queue-scroll-area {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 0.75rem 2rem;
	}

	.queue-section-header {
		padding: 0.6rem 0.5rem 0.35rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: rgba(255, 255, 255, 0.45);
		display: flex;
		justify-content: space-between;
		align-items: center;

		&.next-header {
			margin-top: 1rem;
			border-top: 1px solid rgba(255, 255, 255, 0.06);
			padding-top: 0.85rem;
		}

		.section-count {
			font-size: 0.7rem;
			font-weight: 500;
			color: rgba(255, 255, 255, 0.35);
		}
	}

	.empty-up-next {
		padding: 1.25rem 0.5rem;
		text-align: center;

		p {
			margin: 0 0 0.25rem;
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.5);
		}

		.radio-hint {
			font-size: 0.75rem;
			color: #86efac;
		}
	}

	.queue-item {
		display: flex;
		align-items: center;
		padding: 0.45rem 0.5rem;
		border-radius: 0.5rem;
		gap: 0.6rem;
		transition: background 150ms;

		&:hover {
			background: rgba(255, 255, 255, 0.05);

			.item-actions {
				opacity: 1;
			}
		}

		&.current {
			background: rgba(30, 215, 96, 0.1);
			border: 1px solid rgba(30, 215, 96, 0.2);

			.item-meta .title {
				color: #1ed760;
				font-weight: 700;
			}
		}

		.item-main {
			flex: 1;
			display: flex;
			align-items: center;
			gap: 0.65rem;
			background: none;
			border: none;
			color: inherit;
			text-align: left;
			cursor: pointer;
			padding: 0;
			min-width: 0;
		}

		.item-status {
			width: 1.4rem;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.index {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.4);
			font-weight: 600;
			width: 1.4rem;
			text-align: center;
			flex-shrink: 0;
		}

		.item-cover {
			width: 2.4rem;
			height: 2.4rem;
			border-radius: 4px;
			overflow: hidden;
			background: #181c24;
			flex-shrink: 0;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.item-meta {
			flex: 1;
			display: flex;
			flex-direction: column;
			min-width: 0;

			.title {
				font-size: 0.85rem;
				font-weight: 600;
				color: #fff;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}

			.artist {
				font-size: 0.74rem;
				color: rgba(255, 255, 255, 0.5);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
		}

		.duration {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.45);
			margin-right: 0.25rem;
		}

		.item-actions {
			display: flex;
			align-items: center;
			gap: 0.2rem;
			opacity: 0.7;
			transition: opacity 150ms;

			button {
				background: none;
				border: none;
				color: rgba(255, 255, 255, 0.5);
				padding: 0.25rem;
				border-radius: 4px;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 120ms;

				&:hover {
					color: #fff;
					background: rgba(255, 255, 255, 0.1);
				}

				&.remove-btn:hover {
					color: #ef4444;
					background: rgba(239, 68, 68, 0.12);
				}
			}
		}

		.eq-bars {
			display: flex;
			align-items: flex-end;
			gap: 2px;
			height: 12px;

			i {
				width: 2.5px;
				background: #1ed760;
				border-radius: 1px;
				animation: eqDance 0.8s ease-in-out infinite alternate;

				&:nth-child(1) { height: 60%; animation-delay: 0s; }
				&:nth-child(2) { height: 100%; animation-delay: 0.2s; }
				&:nth-child(3) { height: 40%; animation-delay: 0.4s; }
			}
		}
	}

	@keyframes eqDance {
		0% { height: 20%; }
		100% { height: 100%; }
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
