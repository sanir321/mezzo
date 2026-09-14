<script lang="ts">
import { performLogout } from "$lib/auth-client";
import { useSharedSession } from "$lib/session.svelte";
import { authModal } from "$lib/stores/auth-modal.svelte";
import { equalizerStore } from "$lib/stores/equalizer.svelte";
import { playerCrossfade, playerAutoRadio } from "$lib/stores/player.svelte";
import { offlineStore } from "$lib/services/offline.svelte";
import { isHapticsEnabled, setHapticsEnabled, triggerHaptic } from "$lib/utils/haptics";
import { updateService } from "$lib/services/updater.svelte";

const sessionAtom = useSharedSession();
let sessionData = $state<{ data: any; isPending: boolean } | undefined>(undefined);

$effect(() => {
	return sessionAtom.subscribe((value) => {
		sessionData = value;
	});
});

const user = $derived(sessionData?.data?.user ?? null);
const isLoggedIn = $derived(user != null);

// Preferences state in localStorage
let preferredQuality = $state("lossless");
let autoPlayNext = $state(true);
let hapticsActive = $state(true);
let saveNotification = $state(false);

$effect(() => {
	if (typeof localStorage !== "undefined") {
		preferredQuality = localStorage.getItem("mezzo_quality_pref") || "lossless";
		autoPlayNext = localStorage.getItem("mezzo_autoplay_pref") !== "false";
		hapticsActive = isHapticsEnabled();
	}
});

function toggleHaptics(enabled: boolean) {
	hapticsActive = enabled;
	setHapticsEnabled(enabled);
	if (enabled) {
		triggerHaptic("medium");
	}
	saveNotification = true;
	setTimeout(() => {
		saveNotification = false;
	}, 2000);
}

function savePreference(key: string, value: string) {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(key, value);
		saveNotification = true;
		setTimeout(() => {
			saveNotification = false;
		}, 2000);
	}
}

function clearPlayerState() {
	if (typeof localStorage !== "undefined") {
		localStorage.removeItem("mezzo_volume");
		localStorage.removeItem("mezzo_shuffle");
		localStorage.removeItem("mezzo_repeat");
		alert("Player cache and playback settings reset successfully.");
	}
}

async function handleLogout() {
	await performLogout();
}
</script>

<svelte:head>
	<title>Settings — Mezzo</title>
</svelte:head>

<div class="settings-page">
	<div class="settings-header">
		<h1 class="page-title">Settings</h1>
		<p class="page-subtitle">Manage your account and playback preferences.</p>
	</div>

	{#if saveNotification}
		<div class="toast-notice">
			<svg viewBox="0 0 24 24" width="1.1rem" height="1.1rem" fill="none" stroke="currentColor" stroke-width="2">
				<polyline points="20 6 9 17 4 12" />
			</svg>
			<span>Preferences saved</span>
		</div>
	{/if}

	<div class="settings-grid">
		<!-- App Updates & Version Card (Prominent Top Level) -->
		<section class="settings-card full-width update-card-featured">
			<div class="card-header">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				<h2>App Version &amp; Updates</h2>
			</div>

			<div class="update-check-row">
				<div class="update-info">
					<span class="update-version-label">Current App Version: <strong>v{updateService.currentVersion}</strong></span>
					{#if updateService.statusMessage}
						<span class="update-status-text" class:has-update={updateService.updateAvailable}>
							{updateService.statusMessage}
						</span>
					{:else}
						<span class="update-status-text">Tap below to check GitHub for the latest release and APK build.</span>
					{/if}
				</div>
				<div class="update-btn-wrap">
					{#if updateService.updateAvailable}
						<button
							type="button"
							class="btn-update-now"
							onclick={() => {
								triggerHaptic("medium");
								updateService.openUpdateModal();
							}}
						>
							🚀 Update Available!
						</button>
					{:else}
						<button
							type="button"
							class="btn-check-updates"
							disabled={updateService.isChecking}
							onclick={() => {
								triggerHaptic("light");
								updateService.checkForUpdate(true);
							}}
						>
							{#if updateService.isChecking}
								Checking...
							{:else}
								Check for Updates
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</section>

		<!-- Account Section -->
		<section class="settings-card">
			<div class="card-header">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
				</svg>
				<h2>Account Profile</h2>
			</div>

			{#if isLoggedIn}
				<div class="profile-info">
					<div class="profile-avatar">
						{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
					</div>
					<div class="profile-details">
						<h3 class="profile-name">{user.name || "Music Explorer"}</h3>
						<p class="profile-email">{user.email}</p>
						<span class="badge verified">Active Account</span>
					</div>
				</div>

				<div class="card-actions">
					<button class="danger-btn" onclick={handleLogout}>
						<svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
						</svg>
						Sign Out
					</button>
				</div>
			{:else}
				<div class="guest-banner">
					<p>Sign in or create a free account to sync playlists, liked tracks, and personalized music recommendations across all your devices.</p>
					<button class="primary-btn" onclick={() => authModal.open()}>
						Sign In / Create Account
					</button>
				</div>
			{/if}
		</section>

		<!-- Playback & Audio Settings -->
		<section class="settings-card">
			<div class="card-header">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
				</svg>
				<h2>Audio & Playback</h2>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Streaming Audio Quality</h4>
					<p>Stream directly from high-fidelity FLAC/ALAC lossless audio.</p>
				</div>
				<select
					class="select-input"
					bind:value={preferredQuality}
					onchange={() => savePreference("mezzo_quality_pref", preferredQuality)}
				>
					<option value="lossless">Original / Lossless (Direct Stream)</option>
					<option value="high">High Quality (320kbps)</option>
					<option value="auto">Auto (Adaptive)</option>
				</select>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Auto-play Next Track</h4>
					<p>Automatically advance to the next song in the queue or playlist.</p>
				</div>
				<label class="switch">
					<input
						type="checkbox"
						bind:checked={autoPlayNext}
						onchange={() => savePreference("mezzo_autoplay_pref", String(autoPlayNext))}
					/>
					<span class="slider"></span>
				</label>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Infinite Autoplay Radio</h4>
					<p>When your queue ends, automatically discover and play similar tracks in your preferred genres.</p>
				</div>
				<label class="switch">
					<input
						type="checkbox"
						checked={playerAutoRadio.value}
						onchange={() => {
							playerAutoRadio.value = !playerAutoRadio.value;
							saveNotification = true;
							setTimeout(() => { saveNotification = false; }, 2000);
						}}
					/>
					<span class="slider"></span>
				</label>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Crossfade & Gapless Transition</h4>
					<p>Smoothly blend the end of one song into the beginning of the next track.</p>
				</div>
				<select
					class="select-input"
					value={playerCrossfade.value}
					onchange={(e) => {
						playerCrossfade.value = parseInt((e.target as HTMLSelectElement).value, 10);
						saveNotification = true;
						setTimeout(() => { saveNotification = false; }, 2000);
					}}
				>
					<option value={0}>Off (Instant Transition)</option>
					<option value={1}>1 second</option>
					<option value={2}>2 seconds</option>
					<option value={3}>3 seconds (Studio Blend)</option>
					<option value={5}>5 seconds (Smooth Crossfade)</option>
					<option value={8}>8 seconds (Club DJ Mix)</option>
					<option value={12}>12 seconds (Long Ambient Blend)</option>
				</select>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Haptic Feedback (Vibration)</h4>
					<p>Tactile response when tapping play/pause, skipping tracks, or liking songs.</p>
				</div>
				<label class="switch">
					<input
						type="checkbox"
						checked={hapticsActive}
						onchange={(e) => toggleHaptics((e.target as HTMLInputElement).checked)}
					/>
					<span class="slider"></span>
				</label>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Audio Equalizer (DSP)</h4>
					<p>Fine-tune 5-band frequencies and choose studio acoustic presets.</p>
				</div>
				<button class="primary-btn small-cta" onclick={() => equalizerStore.open()}>
					Configure EQ
				</button>
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Offline Downloads ({offlineStore.downloadedTracks.length} saved)</h4>
					<p>Tracks saved for offline playback in CacheStorage.</p>
				</div>
				{#if offlineStore.downloadedTracks.length > 0}
					<button
						class="secondary-btn"
						onclick={async () => {
							await offlineStore.clearAllOfflineData();
							saveNotification = true;
							setTimeout(() => { saveNotification = false; }, 2000);
						}}
					>
						Clear Offline Cache
					</button>
				{:else}
					<span class="status-pill offline-empty">0 tracks cached</span>
				{/if}
			</div>

			<div class="setting-item">
				<div class="setting-text">
					<h4>Reset Player Cache</h4>
					<p>Clear saved volume, shuffle, repeat, and queue states.</p>
				</div>
				<button class="secondary-btn" onclick={clearPlayerState}>
					Reset State
				</button>
			</div>
		</section>



		<!-- Keyboard Shortcuts -->
		<section class="settings-card full-width">
			<div class="card-header">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
					<rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
				</svg>
				<h2>Keyboard Shortcuts</h2>
			</div>

			<div class="shortcuts-grid">
				<div class="shortcut-item">
					<span class="shortcut-label">Play / Pause</span>
					<div class="kbd-wrap"><kbd>Space</kbd></div>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-label">Next Track</span>
					<div class="kbd-wrap"><kbd>Ctrl</kbd> + <kbd>→</kbd></div>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-label">Previous Track</span>
					<div class="kbd-wrap"><kbd>Ctrl</kbd> + <kbd>←</kbd></div>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-label">Volume Up / Down</span>
					<div class="kbd-wrap"><kbd>Ctrl</kbd> + <kbd>↑</kbd> / <kbd>↓</kbd></div>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-label">Mute / Unmute</span>
					<div class="kbd-wrap"><kbd>M</kbd></div>
				</div>
				<div class="shortcut-item">
					<span class="shortcut-label">Quick Search</span>
					<div class="kbd-wrap"><kbd>⌘</kbd> + <kbd>K</kbd></div>
				</div>
			</div>
		</section>


		<!-- Architecture & About -->
		<section class="settings-card full-width">
			<div class="card-header">
				<svg viewBox="0 0 24 24" width="1.25rem" height="1.25rem" fill="none" stroke="currentColor" stroke-width="2" class="section-icon">
					<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
				</svg>
				<h2>About Mezzo</h2>
			</div>

			<p class="about-text">
				Mezzo is an open-source, serverless personal music streaming platform built on
				<strong>Svelte 5 (Runes)</strong> and powered by <strong>Cloudflare's Zero-Cost Stack</strong>.
				Stream millions of official tracks with 0$ egress fees and sub-second global response times.
			</p>

			<div class="tech-stack-row">
				<span class="tech-pill">SvelteKit 2</span>
				<span class="tech-pill">Svelte 5 Runes</span>
				<span class="tech-pill">Cloudflare Pages</span>
				<span class="tech-pill">Cloudflare D1 (SQLite)</span>
				<span class="tech-pill">Hi-Fi Catalog</span>
				<span class="tech-pill">Better-Auth</span>
			</div>
		</section>
	</div>
</div>

<style lang="scss">
	.settings-page {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding-bottom: 8rem;
		max-width: 58rem;
	}

	.settings-header {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.page-title {
		margin: 0;
		font-size: 2.2rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.page-subtitle {
		margin: 0;
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.95rem;
	}

	.toast-notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(34, 197, 94, 0.15);
		border: 1px solid rgba(34, 197, 94, 0.35);
		border-radius: 0.65rem;
		padding: 0.65rem 1rem;
		color: #86efac;
		font-size: 0.9rem;
		font-weight: 500;
		animation: fadeIn 200ms ease;
	}

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr));
		gap: 1.5rem;

		@media screen and (max-width: 600px) {
			grid-template-columns: 1fr;
		}
	}

	.settings-card {
		background: #181818;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);

		&.full-width {
			grid-column: 1 / -1;
		}

		&.update-card-featured {
			background: linear-gradient(135deg, rgba(30, 215, 96, 0.08) 0%, #181818 60%);
			border: 1px solid rgba(30, 215, 96, 0.25);
			box-shadow: 0 4px 20px rgba(30, 215, 96, 0.08);
		}
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);

		.section-icon {
			color: #1ed760;
		}

		h2 {
			margin: 0;
			font-size: 1.15rem;
			font-weight: 700;
			color: #fff;
		}
	}

	.profile-info {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}

	.profile-avatar {
		width: 3.8rem;
		height: 3.8rem;
		background: #282828;
		border: 2px solid rgba(255, 255, 255, 0.15);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 700;
		color: #1ed760;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		flex-shrink: 0;
	}

	.profile-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		.profile-name {
			margin: 0;
			font-size: 1.1rem;
			font-weight: 700;
			color: #fff;
		}

		.profile-email {
			margin: 0;
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.5);
			word-break: break-all;
		}

		.badge.verified {
			display: inline-block;
			align-self: flex-start;
			margin-top: 0.35rem;
			font-size: 0.72rem;
			font-weight: 600;
			color: #34d399;
			background: rgba(52, 211, 153, 0.12);
			border: 1px solid rgba(52, 211, 153, 0.25);
			border-radius: 1rem;
			padding: 0.15rem 0.6rem;
		}
	}

	.card-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: auto;
	}

	.guest-banner {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			margin: 0;
			font-size: 0.92rem;
			color: rgba(255, 255, 255, 0.65);
			line-height: 1.5;
		}
	}

	.primary-btn {
		background: #1ed760;
		color: #000000;
		border: none;
		border-radius: 9999px;
		padding: 0.75rem 1.4rem;
		font-weight: 700;
		font-size: 0.92rem;
		cursor: pointer;
		transition: all 150ms;
		box-shadow: 0 4px 14px rgba(30, 215, 96, 0.3);
		white-space: nowrap;
		flex-shrink: 0;

		&.small-cta {
			padding: 0.55rem 1.15rem;
			font-size: 0.85rem;
		}

		&:hover {
			background: #1fdf64;
			transform: scale(1.02);
		}
	}

	.danger-btn {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		background: rgba(239, 68, 68, 0.12);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 0.55rem;
		color: #f87171;
		padding: 0.55rem 1rem;
		font-size: 0.88rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms;

		&:hover {
			background: rgba(239, 68, 68, 0.2);
			color: #fca5a5;
		}
	}

	.secondary-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.55rem;
		color: #e2e8f0;
		padding: 0.5rem 0.95rem;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 140ms;

		&:hover {
			background: rgba(255, 255, 255, 0.12);
			color: #fff;
		}
	}

	.setting-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 0.95rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);

		&:last-of-type {
			border-bottom: none;
			padding-bottom: 0;
		}

		.setting-text {
			flex: 1;
			min-width: 0;

			h4 {
				margin: 0 0 0.25rem;
				font-size: 0.95rem;
				font-weight: 600;
				color: #fff;
			}

			p {
				margin: 0;
				font-size: 0.82rem;
				color: rgba(255, 255, 255, 0.5);
				line-height: 1.4;
			}
		}

		.select-input {
			background: #242424 !important;
			border: 1px solid rgba(255, 255, 255, 0.15) !important;
			border-radius: 0.6rem !important;
			padding: 0.55rem 0.85rem !important;
			color: #ffffff !important;
			font-size: 0.85rem !important;
			font-weight: 500 !important;
			outline: none !important;
			cursor: pointer !important;
			flex-shrink: 0;
			min-width: 170px;
			max-width: 250px;

			option {
				background: #242424;
				color: #ffffff;
			}
		}

		@media screen and (max-width: 640px) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.85rem;

			.select-input {
				width: 100% !important;
				max-width: 100% !important;
			}

			.primary-btn.small-cta,
			.secondary-btn {
				width: 100%;
				text-align: center;
			}
		}
	}

	/* Switch component */
	.switch {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		flex-shrink: 0;

		input {
			opacity: 0;
			width: 0;
			height: 0;
		}

		.slider {
			position: absolute;
			cursor: pointer;
			inset: 0;
			background: rgba(255, 255, 255, 0.15);
			border-radius: 24px;
			transition: 200ms;

			&::before {
				position: absolute;
				content: "";
				height: 18px;
				width: 18px;
				left: 3px;
				bottom: 3px;
				background-color: white;
				border-radius: 50%;
				transition: 200ms;
			}
		}

		input:checked + .slider {
			background-color: #1ed760;
		}

		input:checked + .slider:before {
			transform: translateX(20px);
		}
	}

	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 1rem;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 0.65rem;
		padding: 0.65rem 0.85rem;

		.shortcut-label {
			font-size: 0.85rem;
			color: rgba(255, 255, 255, 0.7);
		}

		.kbd-wrap {
			display: flex;
			align-items: center;
			gap: 0.25rem;
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.4);

			kbd {
				background: rgba(255, 255, 255, 0.1);
				border: 1px solid rgba(255, 255, 255, 0.15);
				border-radius: 0.35rem;
				padding: 0.2rem 0.45rem;
				font-family: inherit;
				font-weight: 600;
				color: #e2e8f0;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
			}
		}
	}

	.about-text {
		margin: 0;
		color: rgba(255, 255, 255, 0.7);
		font-size: 0.92rem;
		line-height: 1.6;

		strong {
			color: #fff;
		}
	}

	.tech-stack-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}



	.update-check-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.25rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.06);
		padding: 1rem 1.25rem;
		border-radius: 0.85rem;

		@media (max-width: 600px) {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.85rem;
		}

		.update-info {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;

			.update-version-label {
				font-size: 0.95rem;
				color: #ffffff;

				strong {
					color: #1ed760;
				}
			}

			.update-status-text {
				font-size: 0.82rem;
				color: rgba(255, 255, 255, 0.5);

				&.has-update {
					color: #1ed760;
					font-weight: 600;
				}
			}
		}

		.update-btn-wrap {
			flex-shrink: 0;

			@media (max-width: 600px) {
				width: 100%;
			}

			.btn-check-updates {
				background: rgba(255, 255, 255, 0.08);
				border: 1px solid rgba(255, 255, 255, 0.15);
				color: #ffffff;
				font-size: 0.85rem;
				font-weight: 600;
				padding: 0.55rem 1.1rem;
				border-radius: 9999px;
				cursor: pointer;
				transition: all 0.2s ease;

				&:hover:not(:disabled) {
					background: rgba(255, 255, 255, 0.16);
					border-color: rgba(255, 255, 255, 0.3);
				}

				&:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				@media (max-width: 600px) {
					width: 100%;
				}
			}

			.btn-update-now {
				background: #1ed760;
				color: #000000;
				border: none;
				font-size: 0.85rem;
				font-weight: 700;
				padding: 0.55rem 1.25rem;
				border-radius: 9999px;
				cursor: pointer;
				transition: all 0.2s ease;
				box-shadow: 0 0 15px rgba(30, 215, 96, 0.3);

				&:hover {
					background: #22e668;
					transform: translateY(-1px);
				}

				@media (max-width: 600px) {
					width: 100%;
				}
			}
		}
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-4px); }
		to { opacity: 1; transform: translateY(0); }
	}
</style>
