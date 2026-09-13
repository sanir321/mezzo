// Inline SVG data URIs that never fail network requests, work offline, and prevent broken image icons.

export const DEFAULT_ALBUM_COVER = `data:image/svg+xml;utf8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
		<defs>
			<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#1f2937"/>
				<stop offset="50%" stop-color="#111827"/>
				<stop offset="100%" stop-color="#030712"/>
			</linearGradient>
			<radialGradient id="vinyl" cx="50%" cy="50%" r="50%">
				<stop offset="0%" stop-color="#2a2e39"/>
				<stop offset="70%" stop-color="#15171e"/>
				<stop offset="100%" stop-color="#090a0d"/>
			</radialGradient>
		</defs>
		<rect width="300" height="300" fill="url(#bg)"/>
		<circle cx="150" cy="150" r="110" fill="url(#vinyl)" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
		<circle cx="150" cy="150" r="85" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
		<circle cx="150" cy="150" r="60" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1.5"/>
		<circle cx="150" cy="150" r="34" fill="#1ed760" fill-opacity="0.9"/>
		<circle cx="150" cy="150" r="8" fill="#090a0d"/>
		<path d="M145 130 L158 123 V148 A9 9 0 1 1 149 139 V133 L145 135 Z" fill="#090a0d"/>
	</svg>`
)}`;

export const DEFAULT_PLAYLIST_COVER = `data:image/svg+xml;utf8,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
		<defs>
			<linearGradient id="plbg" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#3b0764"/>
				<stop offset="50%" stop-color="#1e1b4b"/>
				<stop offset="100%" stop-color="#09090b"/>
			</linearGradient>
		</defs>
		<rect width="300" height="300" fill="url(#plbg)"/>
		<g fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="8" stroke-linecap="round">
			<line x1="80" y1="100" x2="220" y2="100"/>
			<line x1="80" y1="145" x2="220" y2="145"/>
			<line x1="80" y1="190" x2="170" y2="190"/>
			<circle cx="205" cy="190" r="15" fill="rgba(255,255,255,0.7)" stroke="none"/>
			<line x1="220" y1="190" x2="220" y2="160" stroke-width="6"/>
		</g>
	</svg>`
)}`;

export function handleImageError(e: Event) {
	const target = e.currentTarget as HTMLImageElement;
	if (target && !target.dataset.fallbackApplied) {
		target.dataset.fallbackApplied = "true";
		target.src = DEFAULT_ALBUM_COVER;
	}
}

export function handlePlaylistImageError(e: Event) {
	const target = e.currentTarget as HTMLImageElement;
	if (target && !target.dataset.fallbackApplied) {
		target.dataset.fallbackApplied = "true";
		target.src = DEFAULT_PLAYLIST_COVER;
	}
}
