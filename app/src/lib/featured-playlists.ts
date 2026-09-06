export interface FeaturedPlaylist {
	id: string;
	name: string;
	description: string;
	cover: string;
	color: string;
	query: string;
	badge?: string;
}

export const FEATURED_PLAYLISTS: FeaturedPlaylist[] = [
	{
		id: "todays-top-hits",
		name: "Today's Top Hits",
		description: "The biggest global chartbusters and streaming sensations right now.",
		cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #1d4ed8 0%, #1e1b4b 60%, #0f172a 100%)",
		query: "Top Global Hits",
		badge: "GLOBAL TOP 50",
	},
	{
		id: "bollywood-blast",
		name: "Bollywood Romance & Dance",
		description: "Soulful Hindi melodies, chart-topping romantic ballads, and club anthems.",
		cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #be123c 0%, #4c0519 60%, #0f172a 100%)",
		query: "Bollywood Hits",
		badge: "DESI HITS",
	},
	{
		id: "chill-lounge",
		name: "Chill Lounge & Lo-Fi",
		description: "Gentle beats to study, relax, focus, and unwind.",
		cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #065f46 0%, #064e3b 60%, #022c22 100%)",
		query: "Lo-Fi Beats Chill",
		badge: "DEEP FOCUS",
	},
	{
		id: "south-indian-mass",
		name: "South Indian Mass & Melody",
		description: "High-octane blockbusters and soulful tracks across Tamil, Telugu, and Malayalam.",
		cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #701a75 0%, #4a044e 60%, #1f0426 100%)",
		query: "Tamil Telugu Hits",
		badge: "SOUTH HITS",
	},
	{
		id: "punjabi-party",
		name: "Punjabi Party & Dhol",
		description: "Energetic Bhangra anthems, urban Punjabi rap, and bass-boosted party bangers.",
		cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #c2410c 0%, #7c2d12 60%, #431407 100%)",
		query: "Punjabi Hits",
		badge: "BHANGRA & RAP",
	},
	{
		id: "pop-essentials",
		name: "Pop & Synthwave Essentials",
		description: "Addictive electronic hooks, nostalgic synthwave, and chart-topping dance anthems.",
		cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #9333ea 0%, #581c87 60%, #2e1065 100%)",
		query: "Pop Hits Essentials",
		badge: "POP & SYNTH",
	},
	{
		id: "hip-hop-heavyweights",
		name: "Hip-Hop Heavyweights",
		description: "The hardest 808s, lyrical storytelling, drill bangers, and global rap royalty.",
		cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #1e1b4b 0%, #172554 60%, #030712 100%)",
		query: "Hip Hop Hits",
		badge: "RAP & TRAP",
	},
	{
		id: "workout-energy",
		name: "Workout Energy & EDM",
		description: "High-BPM electro, motivational beats, and festival anthems for peak performance.",
		cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #15803d 0%, #14532d 60%, #052e16 100%)",
		query: "Workout Gym EDM",
		badge: "PUMP & BASS",
	},
	{
		id: "rock-classics",
		name: "Rock & Indie Anthems",
		description: "Iconic electric guitar riffs, alternative indie melodies, and stadium rock legends.",
		cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #374151 0%, #1f2937 60%, #111827 100%)",
		query: "Rock Classics",
		badge: "ROCK & INDIE",
	},
	{
		id: "acoustic-melodies",
		name: "Late Night Melodies",
		description: "Peaceful acoustic guitar, unplugged vocals, and serene nighttime instrumentals.",
		cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
		color: "linear-gradient(135deg, #312e81 0%, #1e1b4b 60%, #0f172a 100%)",
		query: "Acoustic Guitar Calm",
		badge: "UNPLUGGED",
	},
];

export function getFeaturedPlaylistById(id: string): FeaturedPlaylist | undefined {
	return FEATURED_PLAYLISTS.find(
		(p) => p.id === id || p.id.replace(/-/g, "") === id.replace(/-/g, "")
	);
}
