<script lang="ts">
	import { getPlaylists, addTrackToPlaylist, createPlaylist } from "$lib/api";
	import type { Playlist, Track } from "$lib/stores/player.svelte";

	interface Props {
		open?: boolean;
		track?: Track | null;
		onclose?: () => void;
	}

	let { open = $bindable(false), track = null, onclose }: Props = $props();

	let playlists = $state<Playlist[]>([]);
	let loading = $state(true);
	let newName = $state("");
	let showCreate = $state(false);
	let busyId = $state("");
	let successMsg = $state("");
	let errorMsg = $state("");

	async function load() {
		loading = true;
		errorMsg = "";
		try {
			const res = await getPlaylists();
			playlists = res.playlists ?? [];
		} catch (e: any) {
			errorMsg = e.message ?? "Failed to load playlists";
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (open) {
			successMsg = "";
			errorMsg = "";
			showCreate = false;
			load();
		}
	});

	async function handleAdd(playlistId: string) {
		if (!track) return;
		busyId = playlistId;
		errorMsg = "";
		try {
			await addTrackToPlaylist(playlistId, track);
			successMsg = "Added to playlist!";
			setTimeout(() => {
				open = false;
				onclose?.();
			}, 800);
		} catch (e: any) {
			errorMsg = e.message ?? "Failed to add track";
		} finally {
			busyId = "";
		}
	}

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName.trim() || !track) return;
		errorMsg = "";
		try {
			const { id } = await createPlaylist(newName.trim());
			await addTrackToPlaylist(id, track);
			successMsg = `Created playlist & added track!`;
			setTimeout(() => {
				open = false;
				onclose?.();
			}, 800);
		} catch (e: any) {
			errorMsg = e.message ?? "Failed to create playlist";
		}
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			open = false;
			onclose?.();
		}
	}
</script>

{#if open && track}
	<div
		class="modal-backdrop"
		onclick={handleBackdrop}
		onkeydown={(e) => e.key === "Escape" && (open = false)}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
	>
		<div class="modal-card">
			<header class="modal-header">
				<div>
					<h3>Add to Playlist</h3>
					<p class="track-title">{track.title} {track.artist ? `· ${track.artist}` : ""}</p>
				</div>
				<button class="close-btn" onclick={() => { open = false; onclose?.(); }} aria-label="Close">
					<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</header>

			{#if successMsg}
				<div class="success-banner">
					<svg viewBox="0 0 24 24" width="1.2rem" height="1.2rem" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="20 6 9 17 4 12" />
					</svg>
					<span>{successMsg}</span>
				</div>
			{:else}
				{#if errorMsg}
					<div class="error-banner">{errorMsg}</div>
				{/if}

				{#if !showCreate}
					<button class="new-pl-btn" onclick={() => (showCreate = true)}>
						<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						New Playlist
					</button>
				{:else}
					<form onsubmit={handleCreate} class="create-form">
						<input
							bind:value={newName}
							type="text"
							placeholder="Playlist name..."
							required
						/>
						<div class="create-actions">
							<button type="button" class="cancel-btn" onclick={() => (showCreate = false)}>Cancel</button>
							<button type="submit" class="confirm-btn">Create & Add</button>
						</div>
					</form>
				{/if}

				<div class="playlist-scroller">
					{#if loading}
						<p class="status">Loading playlists...</p>
					{:else if playlists.length === 0}
						<p class="status">No playlists yet. Create one above!</p>
					{:else}
						{#each playlists as pl (pl.id)}
							<button
								class="pl-row"
								onclick={() => handleAdd(pl.id)}
								disabled={busyId === pl.id}
							>
								<div class="pl-icon">
									<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
									</svg>
								</div>
								<span class="pl-name">{pl.name}</span>
								{#if busyId === pl.id}
									<span class="adding">Adding...</span>
								{/if}
							</button>
						{/each}
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.82);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		z-index: 10050;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		animation: fadeIn 150ms ease-out;
	}

	.modal-card {
		width: 100%;
		max-width: 24rem;
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.85);
		display: flex;
		flex-direction: column;
		max-height: 80vh;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.25rem;

		h3 {
			margin: 0;
			font-size: 1.15rem;
			font-weight: 700;
			color: #ffffff;
		}

		.track-title {
			margin: 0.25rem 0 0;
			font-size: 0.82rem;
			color: rgba(255, 255, 255, 0.5);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			max-width: 16rem;
		}
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		display: flex;
		padding: 0.35rem;
		border-radius: 50%;
		transition: all 120ms ease;

		&:hover {
			color: #ffffff;
			background: rgba(255, 255, 255, 0.1);
		}
	}

	.new-pl-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: rgba(30, 215, 96, 0.1);
		border: 1px dashed rgba(30, 215, 96, 0.35);
		color: #1ed760;
		border-radius: 9999px;
		padding: 0.65rem 1rem;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
		margin-bottom: 1rem;
		transition: all 140ms ease;

		&:hover {
			background: rgba(30, 215, 96, 0.18);
			border-color: #1ed760;
			color: #ffffff;
		}
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: #242424;
		padding: 1rem;
		border-radius: 0.75rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.08);

		input {
			background: #181818;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 9999px;
			padding: 0.55rem 0.95rem;
			color: #ffffff;
			font-size: 0.88rem;
			outline: none;

			&:focus {
				border-color: #1ed760;
			}
		}
	}

	.create-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.cancel-btn, .confirm-btn {
		border: none;
		border-radius: 9999px;
		padding: 0.45rem 1rem;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 120ms ease;
	}

	.cancel-btn {
		background: transparent;
		color: rgba(255, 255, 255, 0.6);

		&:hover {
			color: #ffffff;
			background: rgba(255, 255, 255, 0.08);
		}
	}

	.confirm-btn {
		background: #1ed760;
		color: #000000;
		font-weight: 700;

		&:hover {
			background: #1fdf64;
			transform: scale(1.02);
		}
	}

	.playlist-scroller {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: 14rem;
		scrollbar-width: thin;
	}

	.pl-row {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.65em 0.75em;
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		color: #e0e0e0;
		cursor: pointer;
		text-align: left;
		transition: background 120ms;

		&:hover:not(:disabled) {
			background: rgba(255, 255, 255, 0.07);
			color: #fff;
		}

		&:disabled {
			opacity: 0.6;
		}
	}

	.pl-icon {
		width: 2rem;
		height: 2rem;
		background: rgba(255, 255, 255, 0.06);
		border-radius: 0.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.5);
	}

	.pl-name {
		flex: 1;
		font-size: 0.9em;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.adding {
		font-size: 0.75em;
		color: #1ed760;
	}

	.status {
		text-align: center;
		padding: 2em;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.85em;
		margin: 0;
	}

	.success-banner {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6em;
		padding: 2.5em 1em;
		color: #34d399;
		font-weight: 600;
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #fca5a5;
		padding: 0.5em 0.75em;
		border-radius: 0.4rem;
		font-size: 0.82em;
		margin-bottom: 0.75em;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
