<script lang="ts">
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
	}

	// Desktop-only PWA install prompt. Shows a slim banner inviting desktop
	// (Chrome/Edge/Opera) users to install Mezzo as a desktop shortcut. Never
	// shown inside the Capacitor Android app, on mobile web, or when the app is
	// already running as an installed standalone app.
	const DISMISS_KEY = "mezzo_install_prompt_dismissed";

	let deferredPrompt: BeforeInstallPromptEvent | null = $state(null);
	let showBanner = $state(false);
	let isDismissed = $state(false);
	let installing = $state(false);

	function isNativeApp(): boolean {
		if (typeof window === "undefined") return false;
		const cap = (window as Window & { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
		if (!cap) return false;
		return cap.getPlatform?.() !== "web" || cap.isNativePlatform?.() === true;
	}

	function isStandalonePwa(): boolean {
		if (typeof window === "undefined") return false;
		return (
			window.matchMedia?.("(display-mode: standalone)").matches ||
			(window.navigator as { standalone?: boolean }).standalone === true
		);
	}

	function isDesktop(): boolean {
		if (typeof window === "undefined") return false;
		return window.matchMedia?.("(min-width: 1025px)").matches === true;
	}

	$effect(() => {
		if (typeof window === "undefined") return;
		isDismissed = localStorage.getItem(DISMISS_KEY) === "1";

		const onBeforeInstallPrompt = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e as BeforeInstallPromptEvent;
			if (!isDismissed && !isNativeApp() && !isStandalonePwa() && isDesktop()) {
				showBanner = true;
			}
		};
		const onAppInstalled = () => {
			showBanner = false;
		};
		window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
		window.addEventListener("appinstalled", onAppInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
			window.removeEventListener("appinstalled", onAppInstalled);
		};
	});

	async function handleInstall() {
		if (!deferredPrompt) return;
		installing = true;
		try {
			await deferredPrompt.prompt();
			const choice = await deferredPrompt.userChoice;
			if (choice?.outcome === "accepted") {
				showBanner = false;
			}
		} finally {
			installing = false;
			deferredPrompt = null;
		}
	}

	function handleDismiss() {
		isDismissed = true;
		showBanner = false;
		try {
			localStorage.setItem(DISMISS_KEY, "1");
		} catch {
			// ignore quota/sandbox errors
		}
	}
</script>

{#if showBanner}
	<div class="install-prompt" role="region" aria-label="Install Mezzo">
		<div class="install-icon">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 3v10m-4-4l4 4 4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
			</svg>
		</div>
		<div class="install-text">
			<strong>Install Mezzo</strong>
			<span>Add a shortcut to your desktop</span>
		</div>
		<button class="install-btn" onclick={handleInstall} disabled={installing}>
			{installing ? "Installing..." : "Install"}
		</button>
		<button class="install-close" onclick={handleDismiss} aria-label="Dismiss install banner">
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
				<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
			</svg>
		</button>
	</div>
{/if}

<style lang="scss">
	.install-prompt {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 3000;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.7rem;
		background: rgba(24, 24, 24, 0.96);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 9999px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
		animation: slideDown 220ms cubic-bezier(0.2, 0.8, 0.2, 1);

		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-8px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}

		.install-icon {
			width: 2rem;
			height: 2rem;
			border-radius: 50%;
			background: rgba(30, 215, 96, 0.16);
			color: #1ed760;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.install-text {
			display: flex;
			flex-direction: column;
			line-height: 1.15;

			strong {
				color: #ffffff;
				font-size: 0.82rem;
				font-weight: 700;
			}

			span {
				color: #a7a7a7;
				font-size: 0.72rem;
			}
		}

		.install-btn {
			background: #1ed760;
			color: #000000;
			border: none;
			border-radius: 9999px;
			padding: 0.45rem 1rem;
			font-size: 0.8rem;
			font-weight: 700;
			cursor: pointer;
			transition: transform 120ms ease, background 150ms ease;
			white-space: nowrap;

			&:hover {
				transform: scale(1.04);
				background: #32e77a;
			}

			&:disabled {
				opacity: 0.6;
				cursor: default;
				transform: none;
			}
		}

		.install-close {
			width: 1.7rem;
			height: 1.7rem;
			border-radius: 50%;
			background: transparent;
			border: none;
			color: #b3b3b3;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: color 150ms ease, background 150ms ease;

			&:hover {
				color: #ffffff;
				background: rgba(255, 255, 255, 0.08);
			}
		}
	}

	@media screen and (max-width: 1024px) {
		.install-prompt {
			display: none !important;
		}
	}
</style>