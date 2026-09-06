import { browser } from "$app/environment";

export interface EqBand {
	freq: number;
	label: string;
	gain: number; // -12 to +12 dB
}

export interface EqPreset {
	name: string;
	gains: number[];
}

export const EQ_PRESETS: EqPreset[] = [
	{ name: "Flat", gains: [0, 0, 0, 0, 0] },
	{ name: "Bass Boost", gains: [7, 5, 0, -1, -2] },
	{ name: "Vocal Booster", gains: [-2, 1, 4, 3, 0] },
	{ name: "Electronic", gains: [5, 3, -1, 3, 4] },
	{ name: "Rock", gains: [4, 2, -2, 2, 5] },
	{ name: "Acoustic", gains: [3, 2, 1, 2, 3] },
	{ name: "Lo-Fi", gains: [3, 4, 1, -4, -7] },
	{ name: "Classical", gains: [4, 2, 0, 2, 4] },
];

const STORAGE_KEY_EQ = "mezzo_eq_state";

const DEFAULT_BANDS: EqBand[] = [
	{ freq: 60, label: "60 Hz", gain: 0 },
	{ freq: 230, label: "230 Hz", gain: 0 },
	{ freq: 910, label: "910 Hz", gain: 0 },
	{ freq: 3600, label: "3.6 kHz", gain: 0 },
	{ freq: 14000, label: "14 kHz", gain: 0 },
];

class EqualizerStore {
	isOpen = $state(false);
	enabled = $state(false);
	currentPreset = $state("Flat");
	bands = $state<EqBand[]>(DEFAULT_BANDS.map((b) => ({ ...b })));

	private audioCtx: AudioContext | null = null;
	private filters: BiquadFilterNode[] = [];
	private sourceNode: MediaElementAudioSourceNode | null = null;
	private analyserNode: AnalyserNode | null = null;
	private limiterNode: DynamicsCompressorNode | null = null;
	private isConnected = false;
	private boundAudioEl: HTMLAudioElement | null = null;

	constructor() {
		if (browser) {
			this.loadState();
		}
	}

	private loadState() {
		try {
			const saved = localStorage.getItem(STORAGE_KEY_EQ);
			if (saved) {
				const data = JSON.parse(saved);
				const hasCustomGains = Array.isArray(data.gains) && data.gains.some((g: number) => g !== 0);
				const isNonFlat = typeof data.currentPreset === "string" && data.currentPreset !== "Flat";
				// Only keep enabled if user had an actual non-flat preset or non-zero gains
				this.enabled = Boolean(data.enabled && (hasCustomGains || isNonFlat));
				if (typeof data.currentPreset === "string") this.currentPreset = data.currentPreset;
				if (Array.isArray(data.gains) && data.gains.length === 5) {
					this.bands.forEach((b, i) => {
						b.gain = typeof data.gains[i] === "number" ? data.gains[i] : 0;
					});
				}
			}
		} catch {}
	}

	private saveState() {
		if (!browser) return;
		try {
			localStorage.setItem(
				STORAGE_KEY_EQ,
				JSON.stringify({
					enabled: this.enabled,
					currentPreset: this.currentPreset,
					gains: this.bands.map((b) => b.gain),
				})
			);
		} catch {}
	}

	attachAudioElement(audioEl: HTMLAudioElement) {
		if (!browser || !audioEl) return;
		this.boundAudioEl = audioEl;

		// Pure native audio by default: NEVER hijack audioEl into Web Audio API
		// unless user explicitly enabled the Equalizer with an active custom preset
		if (!this.enabled || (this.currentPreset === "Flat" && this.bands.every((b) => b.gain === 0))) {
			return;
		}

		if (this.isConnected && this.sourceNode) {
			this.resumeAudioContext();
			return;
		}

		try {
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			if (!AudioContextClass) return;

			if (!this.audioCtx) {
				this.audioCtx = new AudioContextClass();
			}

			// Add global user-gesture listeners to unlock AudioContext seamlessly on any interaction
			if (typeof window !== "undefined" && !(window as any).__mezzoEqUnlocked) {
				(window as any).__mezzoEqUnlocked = true;
				const unlock = () => {
					this.resumeAudioContext();
				};
				window.addEventListener("pointerdown", unlock, { passive: true, once: true });
				window.addEventListener("keydown", unlock, { passive: true, once: true });
				window.addEventListener("touchstart", unlock, { passive: true, once: true });
			}

			if ((audioEl as any).__mezzoSourceNode) {
				this.sourceNode = (audioEl as any).__mezzoSourceNode;
			} else {
				try {
					this.sourceNode = this.audioCtx.createMediaElementSource(audioEl);
					(audioEl as any).__mezzoSourceNode = this.sourceNode;
				} catch {
					return;
				}
			}

			if (this.sourceNode && this.audioCtx) {
				// Build 5 biquad filters
				const types: BiquadFilterType[] = ["lowshelf", "peaking", "peaking", "peaking", "highshelf"];
				this.filters = this.bands.map((b, i) => {
					const f = this.audioCtx!.createBiquadFilter();
					f.type = types[i];
					f.frequency.value = b.freq;
					f.gain.value = this.enabled ? b.gain : 0;
					if (types[i] === "peaking") {
						f.Q.value = 1.0;
					}
					return f;
				});

				// Fast-response brickwall limiter prevents audio clipping, crackling, or distortion
				// even on bass boost or +12dB peaks
				this.limiterNode = this.audioCtx.createDynamicsCompressor();
				this.limiterNode.threshold.setValueAtTime(-0.5, this.audioCtx.currentTime);
				this.limiterNode.knee.setValueAtTime(3, this.audioCtx.currentTime);
				this.limiterNode.ratio.setValueAtTime(20, this.audioCtx.currentTime);
				this.limiterNode.attack.setValueAtTime(0.001, this.audioCtx.currentTime);
				this.limiterNode.release.setValueAtTime(0.05, this.audioCtx.currentTime);

				this.analyserNode = this.audioCtx.createAnalyser();
				this.analyserNode.fftSize = 64;
				this.analyserNode.smoothingTimeConstant = 0.8;

				// Connect chain: source -> filter0 -> ... -> filter4 -> limiter -> analyser -> destination
				let prevNode: AudioNode = this.sourceNode;
				for (const filter of this.filters) {
					prevNode.connect(filter);
					prevNode = filter;
				}
				prevNode.connect(this.limiterNode);
				this.limiterNode.connect(this.analyserNode);
				this.analyserNode.connect(this.audioCtx.destination);

				this.isConnected = true;
				this.resumeAudioContext();
			}
		} catch (e) {
			// Fail-safe: audio will continue playing normally through standard audio tag
			this.isConnected = false;
		}
	}

	getAnalyser(): AnalyserNode | null {
		return this.analyserNode;
	}

	resumeAudioContext() {
		if (this.audioCtx && this.audioCtx.state === "suspended") {
			this.audioCtx.resume().catch(() => {});
		}
	}

	private updateFilterGains() {
		this.resumeAudioContext();
		if (this.filters.length === 5 && this.audioCtx) {
			const now = this.audioCtx.currentTime;
			this.bands.forEach((b, i) => {
				const filter = this.filters[i];
				if (filter) {
					const targetGain = this.enabled ? b.gain : 0;
					try {
						filter.gain.setTargetAtTime(targetGain, now, 0.015);
					} catch {
						filter.gain.value = targetGain;
					}
				}
			});
		}
		this.saveState();
	}

	setGain(index: number, gain: number) {
		if (index >= 0 && index < this.bands.length) {
			this.bands[index].gain = Math.max(-12, Math.min(12, gain));
			this.currentPreset = "Custom";
			this.updateFilterGains();
		}
	}

	setPreset(name: string) {
		const preset = EQ_PRESETS.find((p) => p.name.toLowerCase() === name.toLowerCase());
		if (preset) {
			this.currentPreset = preset.name;
			preset.gains.forEach((g, i) => {
				if (this.bands[i]) this.bands[i].gain = g;
			});
			if (name.toLowerCase() !== "flat" && !this.enabled) {
				this.enabled = true;
			}
			if (this.boundAudioEl) {
				this.attachAudioElement(this.boundAudioEl);
			}
			this.updateFilterGains();
		}
	}

	toggleEnabled() {
		this.enabled = !this.enabled;
		if (this.enabled && this.boundAudioEl) {
			this.attachAudioElement(this.boundAudioEl);
		}
		this.updateFilterGains();
	}

	reset() {
		this.setPreset("Flat");
	}

	open() {
		this.isOpen = true;
		if (this.boundAudioEl) {
			this.attachAudioElement(this.boundAudioEl);
		}
		this.resumeAudioContext();
	}

	close() {
		this.isOpen = false;
	}

	toggle() {
		this.isOpen ? this.close() : this.open();
	}
}

export const equalizerStore = new EqualizerStore();
