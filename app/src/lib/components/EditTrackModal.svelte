<script lang="ts">
	import type { Track } from "$lib/stores/player.svelte";
	import { updateTrack } from "$lib/api";

	interface Props {
		open?: boolean;
		track?: Track | null;
		onupdated?: (track: Track) => void;
		onclose?: () => void;
	}

	let { open = $bindable(false), track = null, onupdated, onclose }: Props = $props();

	let title = $state("");
	let artist = $state("");
	let album = $state("");
	let genre = $state("");
	let year = $state<number | undefined>(undefined);
	let saving = $state(false);
	let error = $state("");

	$effect(() => {
		if (open && track) {
			title = track.title || "";
			artist = track.artist || "";
			album = track.album || "";
			genre = track.genre || "";
			year = track.year ?? undefined;
			error = "";
		}
	});

	function close() {
		open = false;
		onclose?.();
	}

	async function handleSave(e: Event) {
		e.preventDefault();
		if (!track) return;
		saving = true;
		error = "";
		try {
			await updateTrack(track.id, {
				title: title.trim(),
				artist: artist.trim() || null,
				album: album.trim() || null,
				genre: genre.trim() || null,
				year: year ? Number(year) : null,
			});
			const updated: Track = {
				...track,
				title: title.trim(),
				artist: artist.trim() || null,
				album: album.trim() || null,
				genre: genre.trim() || null,
				year: year ? Number(year) : null,
			};
			onupdated?.(updated);
			close();
		} catch (err: any) {
			error = err.message ?? "Failed to save track metadata";
		} finally {
			saving = false;
		}
	}
</script>

{#if open && track}
	<div
		class="modal-backdrop"
		onclick={close}
		onkeydown={(e) => e.key === "Escape" && close()}
		tabindex="-1"
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<div class="header-title">
					<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="title-icon">
						<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
					</svg>
					<h3>Edit Track Details</h3>
				</div>
				<button class="close-btn" onclick={close} aria-label="Close modal">
					<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<form onsubmit={handleSave} class="modal-body">
				<div class="form-group">
					<label for="track-title">Title</label>
					<input id="track-title" bind:value={title} type="text" required placeholder="Track title" />
				</div>

				<div class="form-group">
					<label for="track-artist">Artist</label>
					<input id="track-artist" bind:value={artist} type="text" placeholder="Artist name" />
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="track-album">Album</label>
						<input id="track-album" bind:value={album} type="text" placeholder="Album name" />
					</div>

					<div class="form-group sm">
						<label for="track-year">Year</label>
						<input id="track-year" bind:value={year} type="number" min="1900" max="2100" placeholder="YYYY" />
					</div>
				</div>

				<div class="form-group">
					<label for="track-genre">Genre</label>
					<input id="track-genre" bind:value={genre} type="text" placeholder="e.g. Synthwave, Rock, Classical" />
				</div>

				{#if error}
					<div class="error-box">{error}</div>
				{/if}

				<div class="modal-footer">
					<button type="button" class="btn-cancel" onclick={close}>Cancel</button>
					<button type="submit" class="btn-save" disabled={saving}>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		z-index: 210;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		animation: fadeIn 150ms ease;
	}

	.modal-card {
		width: 100%;
		max-width: 28rem;
		background: #151821;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.25rem;
		box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
		overflow: hidden;
		animation: scaleUp 150ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		.header-title {
			display: flex;
			align-items: center;
			gap: 0.6rem;

			.title-icon {
				color: #1ed760;
			}

			h3 {
				margin: 0;
				font-size: 1.15rem;
				font-weight: 700;
				color: #fff;
			}
		}

		.close-btn {
			background: rgba(255, 255, 255, 0.05);
			border: none;
			border-radius: 50%;
			width: 2rem;
			height: 2rem;
			display: flex;
			align-items: center;
			justify-content: center;
			color: rgba(255, 255, 255, 0.5);
			cursor: pointer;
			transition: all 120ms;

			&:hover {
				background: rgba(255, 255, 255, 0.15);
				color: #fff;
			}
		}
	}

	.modal-body {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;

		&.sm {
			width: 6rem;
		}

		label {
			font-size: 0.8rem;
			font-weight: 600;
			color: rgba(255, 255, 255, 0.7);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		input {
			background: rgba(255, 255, 255, 0.06);
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 0.6rem;
			padding: 0.7rem 0.9rem;
			color: #fff;
			font-size: 0.95rem;
			outline: none;
			transition: all 140ms;

			&:focus {
				border-color: #1ed760;
				background: rgba(255, 255, 255, 0.09);
			}

			&::placeholder {
				color: rgba(255, 255, 255, 0.25);
			}
		}
	}

	.form-row {
		display: flex;
		gap: 1rem;

		.form-group:first-child {
			flex: 1;
		}
	}

	.error-box {
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.5rem;
		padding: 0.6rem 0.8rem;
		color: #fca5a5;
		font-size: 0.85rem;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 0.6rem;
		padding: 0.65rem 1.1rem;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 120ms;

		&:hover {
			background: rgba(255, 255, 255, 0.06);
			color: #fff;
		}
	}

	.btn-save {
		background: #1ed760;
		border: none;
		border-radius: 9999px;
		padding: 0.65rem 1.4rem;
		color: #000;
		font-size: 0.88rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(30, 215, 96, 0.35);
		transition: all 120ms;

		&:hover:not(:disabled) {
			background: #1fdf64;
			transform: translateY(-1px);
			opacity: 0.95;
		}

		&:disabled {
			opacity: 0.5;
			cursor: default;
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes scaleUp {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}
</style>
