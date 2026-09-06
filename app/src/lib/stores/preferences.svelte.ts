export interface PopularArtist {
	name: string;
	genre: string;
	languages: string[];
	color: string;
	gradient: string;
	image: string;
	monthlyListeners: string;
	bio: string;
}

export interface LanguageOption {
	code: string;
	name: string;
	native: string;
	emoji: string;
	category: "South Asian" | "International";
}

export const POPULAR_LANGUAGES: LanguageOption[] = [
	{ code: "hi", name: "Hindi", native: "हिन्दी", emoji: "🇮🇳", category: "South Asian" },
	{ code: "en", name: "English", native: "English", emoji: "🌐", category: "International" },
	{ code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", emoji: "🇮🇳", category: "South Asian" },
	{ code: "ne", name: "Nepali", native: "नेपाली", emoji: "🇳🇵", category: "South Asian" },
	{ code: "ta", name: "Tamil", native: "தமிழ்", emoji: "🇮🇳", category: "South Asian" },
	{ code: "te", name: "Telugu", native: "తెలుగు", emoji: "🇮🇳", category: "South Asian" },
	{ code: "ml", name: "Malayalam", native: "മലയാളം", emoji: "🇮🇳", category: "South Asian" },
	{ code: "kn", name: "Kannada", native: "ಕನ್ನಡ", emoji: "🇮🇳", category: "South Asian" },
	{ code: "bn", name: "Bengali", native: "বাংলা", emoji: "🇮🇳", category: "South Asian" },
	{ code: "bho", name: "Bhojpuri", native: "भोजपुरी", emoji: "🇮🇳", category: "South Asian" },
	{ code: "mr", name: "Marathi", native: "मराठी", emoji: "🇮🇳", category: "South Asian" },
	{ code: "gu", name: "Gujarati", native: "ગુજરાતી", emoji: "🇮🇳", category: "South Asian" },
	{ code: "ur", name: "Urdu", native: "اردو", emoji: "🇵🇰", category: "South Asian" },
	{ code: "es", name: "Spanish", native: "Español", emoji: "🇪🇸", category: "International" },
	{ code: "ko", name: "Korean", native: "한국어", emoji: "🇰🇷", category: "International" },
	{ code: "ja", name: "Japanese", native: "日本語", emoji: "🇯🇵", category: "International" },
	{ code: "fr", name: "French", native: "Français", emoji: "🇫🇷", category: "International" },
	{ code: "de", name: "German", native: "Deutsch", emoji: "🇩🇪", category: "International" },
	{ code: "ar", name: "Arabic", native: "العربية", emoji: "🇦🇪", category: "International" },
	{ code: "pt", name: "Portuguese", native: "Português", emoji: "🇧🇷", category: "International" },
	{ code: "it", name: "Italian", native: "Italiano", emoji: "🇮🇹", category: "International" },
];

export const LANGUAGE_SEARCH_TERMS: Record<string, string> = {
	Hindi: "Bollywood Top Hits",
	English: "Global Pop Hits",
	Punjabi: "Punjabi Top Hits",
	Nepali: "Nepali Top Songs",
	Tamil: "Tamil Top Hits",
	Telugu: "Telugu Top Hits",
	Malayalam: "Malayalam Top Hits",
	Kannada: "Kannada Top Hits",
	Bengali: "Bengali Top Hits",
	Bhojpuri: "Bhojpuri Top Hits",
	Marathi: "Marathi Top Hits",
	Gujarati: "Gujarati Top Hits",
	Urdu: "Urdu Top Hits",
	Spanish: "Latin Pop Hits",
	Korean: "K-Pop Top Hits",
	Japanese: "J-Pop Top Hits",
	French: "French Pop Hits",
	German: "German Pop Hits",
	Arabic: "Arabic Top Hits",
	Portuguese: "Portuguese Pop Hits",
	Italian: "Italian Pop Hits",
};

export const POPULAR_ARTISTS: PopularArtist[] = [
	// Hindi / Bollywood
	{
		name: "Arijit Singh",
		genre: "Bollywood / Romantic",
		languages: ["Hindi", "Bengali"],
		color: "#ef4444",
		gradient: "linear-gradient(135deg, #ef4444 0%, #450a0a 100%)",
		image: "https://resources.tidal.com/images/7acc064d/1a50/4664/b834/244a4637d6b2/750x750.jpg",
		monthlyListeners: "48,200,000",
		bio: "The voice of modern romantic Indian cinema and one of the most streamed artists globally."
	},
	{
		name: "Shreya Ghoshal",
		genre: "Playback / Classical",
		languages: ["Hindi", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Bhojpuri"],
		color: "#f43f5e",
		gradient: "linear-gradient(135deg, #f43f5e 0%, #881337 100%)",
		image: "https://resources.tidal.com/images/e1030ee4/6795/4035/9985/a32b38e67cf1/750x750.jpg",
		monthlyListeners: "32,800,000",
		bio: "Beloved five-time National Film Award winner with timeless multilingual chartbusters."
	},
	{
		name: "Pritam",
		genre: "Bollywood / Composer",
		languages: ["Hindi", "Bengali"],
		color: "#06b6d4",
		gradient: "linear-gradient(135deg, #06b6d4 0%, #164e63 100%)",
		image: "https://resources.tidal.com/images/eaed9a4c/eab6/428c/a7cd/a5bafea15a3e/750x750.jpg",
		monthlyListeners: "34,500,000",
		bio: "Prolific music director behind monumental Bollywood soundtracks of the last two decades."
	},
	{
		name: "Atif Aslam",
		genre: "Sufi Pop / Romantic",
		languages: ["Hindi", "Urdu", "Punjabi"],
		color: "#10b981",
		gradient: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
		image: "https://resources.tidal.com/images/6a5565a7/523b/46ad/91e2/6e98640627d5/750x750.jpg",
		monthlyListeners: "26,100,000",
		bio: "Acclaimed singer with a distinct vocal texture that shaped modern South Asian romantic anthems."
	},
	{
		name: "KK",
		genre: "Bollywood / Soul Rock",
		languages: ["Hindi", "Tamil", "Telugu"],
		color: "#ca8a04",
		gradient: "linear-gradient(135deg, #ca8a04 0%, #422006 100%)",
		image: "https://resources.tidal.com/images/0c07f9e8/7d58/4787/8939/3941b5ade01a/750x750.jpg",
		monthlyListeners: "19,400,000",
		bio: "Legendary singer whose emotive and soaring vocals defined generations of youth anthems."
	},
	{
		name: "Sonu Nigam",
		genre: "Bollywood / Classical Pop",
		languages: ["Hindi", "Kannada", "Bengali"],
		color: "#3b82f6",
		gradient: "linear-gradient(135deg, #3b82f6 0%, #172554 100%)",
		image: "https://resources.tidal.com/images/8c06ad96/baaf/46a8/9e4f/d98abdd800a9/750x750.jpg",
		monthlyListeners: "22,500,000",
		bio: "The Lord of Chords, one of India's most technically gifted and versatile playback vocalists."
	},

	// Punjabi
	{
		name: "Diljit Dosanjh",
		genre: "Punjabi / Global Pop",
		languages: ["Punjabi", "Hindi"],
		color: "#f97316",
		gradient: "linear-gradient(135deg, #f97316 0%, #7c2d12 100%)",
		image: "https://resources.tidal.com/images/c70a70c3/d3aa/42e1/88fe/28013dfa12e1/750x750.jpg",
		monthlyListeners: "24,800,000",
		bio: "International Punjabi superstar headlining global stadiums, Coachella, and worldwide charts."
	},
	{
		name: "Sidhu Moose Wala",
		genre: "Punjabi / Desi Hip-Hop",
		languages: ["Punjabi"],
		color: "#b91c1c",
		gradient: "linear-gradient(135deg, #b91c1c 0%, #450a0a 100%)",
		image: "https://resources.tidal.com/images/9d9e3b88/8acb/4249/ae01/150f2650dd8e/750x750.jpg",
		monthlyListeners: "21,600,000",
		bio: "Trailblazing Punjabi rapper and songwriter whose raw lyrics and anthems created a global phenomenon."
	},
	{
		name: "AP Dhillon",
		genre: "Punjabi / Synth Wave",
		languages: ["Punjabi"],
		color: "#8b5cf6",
		gradient: "linear-gradient(135deg, #8b5cf6 0%, #2e1065 100%)",
		image: "https://resources.tidal.com/images/36037aee/6132/406a/86c9/4ec5f5086ab1/750x750.jpg",
		monthlyListeners: "16,400,000",
		bio: "Pioneering the fusion of 80s synth-pop, R&B, and contemporary Punjabi folk hooks."
	},
	{
		name: "Karan Aujla",
		genre: "Punjabi / Trap Beats",
		languages: ["Punjabi"],
		color: "#ec4899",
		gradient: "linear-gradient(135deg, #ec4899 0%, #831843 100%)",
		image: "https://resources.tidal.com/images/bf910b77/31bf/4263/9648/f21b80a7c30c/750x750.jpg",
		monthlyListeners: "19,200,000",
		bio: "Lyrical powerhouse bringing high-octane flow and global collaborations to modern Punjabi music."
	},

	// Nepali
	{
		name: "Sajjan Raj Vaidya",
		genre: "Nepali / Indie Melodies",
		languages: ["Nepali", "English"],
		color: "#06b6d4",
		gradient: "linear-gradient(135deg, #06b6d4 0%, #164e63 100%)",
		image: "https://resources.tidal.com/images/65882f8f/2dd5/4a0d/a239/c858c918f52b/750x750.jpg",
		monthlyListeners: "3,850,000",
		bio: "Acclaimed singer-songwriter known for soulful masterpieces like Chitthi Bhitra, Dhairya, and Hataarindai."
	},
	{
		name: "Bipul Chettri",
		genre: "Nepali / Himalayan Folk",
		languages: ["Nepali"],
		color: "#f59e0b",
		gradient: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
		image: "https://resources.tidal.com/images/9433fe28/24b3/41d4/b1ae/1b95412848a6/750x750.jpg",
		monthlyListeners: "2,800,000",
		bio: "Iconic Himalayan contemporary folk singer celebrated for Wildfire, Asaar, and Siris Ma."
	},
	{
		name: "Sushant KC",
		genre: "Nepali / Pop Ballads",
		languages: ["Nepali"],
		color: "#ec4899",
		gradient: "linear-gradient(135deg, #ec4899 0%, #831843 100%)",
		image: "https://resources.tidal.com/images/f0f5787e/cc80/4789/9d82/42a276ced6b9/750x750.jpg",
		monthlyListeners: "4,600,000",
		bio: "Leading modern Nepali music artist behind viral anthems like Risaune Bhaye, Sarangi, and Maya."
	},

	// Tamil & South Indian
	{
		name: "Anirudh Ravichander",
		genre: "Tamil / Rockstar",
		languages: ["Tamil", "Telugu", "Hindi"],
		color: "#e11d48",
		gradient: "linear-gradient(135deg, #e11d48 0%, #4c0519 100%)",
		image: "https://resources.tidal.com/images/f22f6445/4ab0/4b10/bbf6/281a47d5761f/750x750.jpg",
		monthlyListeners: "21,450,200",
		bio: "Superstar music director and singer behind viral chartbusters for Leo, Jailer, Vikram, and Jawan."
	},
	{
		name: "A.R. Rahman",
		genre: "World / Film Score",
		languages: ["Tamil", "Hindi", "Telugu", "English"],
		color: "#10b981",
		gradient: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
		image: "https://resources.tidal.com/images/dbee8685/bd4f/4e3a/be46/b098af33578f/750x750.jpg",
		monthlyListeners: "25,890,100",
		bio: "Two-time Oscar and Grammy Award-winning maestro redefining Indian and global cinema scoring."
	},
	{
		name: "Sid Sriram",
		genre: "Carnatic / Playback",
		languages: ["Tamil", "Telugu", "Kannada", "Malayalam"],
		color: "#06b6d4",
		gradient: "linear-gradient(135deg, #06b6d4 0%, #164e63 100%)",
		image: "https://resources.tidal.com/images/926e6f7d/1cfb/48af/8a1e/cdf10d5ec0a9/750x750.jpg",
		monthlyListeners: "15,800,000",
		bio: "Carnatic virtuoso and leading playback singer in Tamil, Telugu, and South Indian cinema."
	},
	{
		name: "Yuvan Shankar Raja",
		genre: "Tamil / Youth Anthem",
		languages: ["Tamil", "Telugu"],
		color: "#f43f5e",
		gradient: "linear-gradient(135deg, #f43f5e 0%, #881337 100%)",
		image: "https://resources.tidal.com/images/f02cb97c/ee53/4110/83f1/a3d22ea85896/750x750.jpg",
		monthlyListeners: "11,900,000",
		bio: "Acclaimed composer and singer dubbed 'Youth Icon' with hundreds of legendary Tamil film scores."
	},

	// Telugu
	{
		name: "Devi Sri Prasad",
		genre: "Telugu / Mass Beats",
		languages: ["Telugu", "Tamil", "Hindi"],
		color: "#f59e0b",
		gradient: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
		image: "https://resources.tidal.com/images/6b890d2a/dce4/4e5b/99e6/a77c1de1ea50/750x750.jpg",
		monthlyListeners: "13,600,000",
		bio: "Renowned Indian composer and singer known as 'Rockstar DSP', creator of iconic hits for Pushpa."
	},
	{
		name: "Thaman S",
		genre: "Telugu / Electronic Fusion",
		languages: ["Telugu", "Tamil"],
		color: "#10b981",
		gradient: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
		image: "https://resources.tidal.com/images/ce72e92d/0e93/412d/844e/4bb51b23a475/750x750.jpg",
		monthlyListeners: "12,800,000",
		bio: "Leading South Indian music director behind mega-blockbusters like Ala Vaikunthapurramuloo."
	},

	// Kannada
	{
		name: "Ravi Basrur",
		genre: "Kannada / Epic Score",
		languages: ["Kannada", "Hindi", "Telugu", "Tamil"],
		color: "#3b82f6",
		gradient: "linear-gradient(135deg, #3b82f6 0%, #172554 100%)",
		image: "https://resources.tidal.com/images/852a20ac/a095/45d3/96bc/ba9569a795f2/750x750.jpg",
		monthlyListeners: "7,900,000",
		bio: "Composer behind the monumental, pulse-pounding scores of KGF Chapter 1 & 2 and Salaar."
	},
	{
		name: "Vijay Prakash",
		genre: "Kannada / Playback",
		languages: ["Kannada", "Telugu", "Tamil"],
		color: "#14b8a6",
		gradient: "linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)",
		image: "https://resources.tidal.com/images/ecb012db/fc65/413c/89cb/382d95490e9e/750x750.jpg",
		monthlyListeners: "6,900,000",
		bio: "Versatile Indian playback singer and composer celebrated across Kannada, Tamil, and Telugu cinema."
	},
	{
		name: "Sanjith Hegde",
		genre: "Kannada / Indie Pop",
		languages: ["Kannada", "Tamil", "Telugu", "Hindi"],
		color: "#ec4899",
		gradient: "linear-gradient(135deg, #ec4899 0%, #831843 100%)",
		image: "https://resources.tidal.com/images/ad2cf9a3/39c5/4549/9a9d/96fb32acd6b6/750x750.jpg",
		monthlyListeners: "6,100,000",
		bio: "Charismatic Kannada singer, songwriter, and performer with chart-topping indie melodies."
	},

	// Malayalam
	{
		name: "Sushin Shyam",
		genre: "Malayalam / Indie Beats",
		languages: ["Malayalam"],
		color: "#8b5cf6",
		gradient: "linear-gradient(135deg, #8b5cf6 0%, #2e1065 100%)",
		image: "https://resources.tidal.com/images/d800be4d/3fbc/47b9/afce/823b7113a32c/750x750.jpg",
		monthlyListeners: "6,500,000",
		bio: "Visionary Malayalam composer and singer behind pathbreaking modern Malayalam cinema hits."
	},
	{
		name: "Hesham Abdul Wahab",
		genre: "Malayalam / Melodic Score",
		languages: ["Malayalam", "Telugu"],
		color: "#f59e0b",
		gradient: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
		image: "https://resources.tidal.com/images/afa000b4/819d/44b7/aa70/4b527a3c28bb/750x750.jpg",
		monthlyListeners: "5,800,000",
		bio: "Renowned composer and singer behind the pan-Indian viral soundtrack for Hridayam and Hi Nanna."
	},
	{
		name: "K.S. Chithra",
		genre: "Carnatic / Melody",
		languages: ["Malayalam", "Tamil", "Telugu", "Kannada"],
		color: "#d946ef",
		gradient: "linear-gradient(135deg, #d946ef 0%, #701a75 100%)",
		image: "https://resources.tidal.com/images/fbe6520b/7a3b/424f/b929/8da8c09400a6/750x750.jpg",
		monthlyListeners: "9,200,000",
		bio: "The Nightingale of South India with six National Film Awards and timeless melodies."
	},

	// English / Global
	{
		name: "The Weeknd",
		genre: "Pop / R&B",
		languages: ["English"],
		color: "#e11d48",
		gradient: "linear-gradient(135deg, #e11d48 0%, #4c0519 100%)",
		image: "https://resources.tidal.com/images/5598dc62/acf6/49f1/b468/192ad3555278/750x750.jpg",
		monthlyListeners: "108,842,910",
		bio: "Canadian singer-songwriter known for dark lyricism, cinematic disco, and dominating global charts."
	},
	{
		name: "Taylor Swift",
		genre: "Pop / Singer-Songwriter",
		languages: ["English"],
		color: "#ec4899",
		gradient: "linear-gradient(135deg, #ec4899 0%, #831843 100%)",
		image: "https://resources.tidal.com/images/acce3554/c0dd/428b/b39a/18a06897a7c3/750x750.jpg",
		monthlyListeners: "101,412,044",
		bio: "Global pop phenomenon and songwriter with record-breaking worldwide stadium tours and album streams."
	},
	{
		name: "Drake",
		genre: "Hip-Hop / Rap",
		languages: ["English"],
		color: "#f59e0b",
		gradient: "linear-gradient(135deg, #f59e0b 0%, #78350f 100%)",
		image: "https://resources.tidal.com/images/3812d980/630e/4948/a72e/f21a546ec2e3/750x750.jpg",
		monthlyListeners: "82,520,318",
		bio: "Chart-topping hip-hop icon credited with popularizing the melodic rap sound across the globe."
	},
	{
		name: "Billie Eilish",
		genre: "Alt Pop",
		languages: ["English"],
		color: "#10b981",
		gradient: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
		image: "https://resources.tidal.com/images/b2a74265/ad7f/4e14/b170/cc31e0ed8a4e/750x750.jpg",
		monthlyListeners: "91,140,550",
		bio: "Multi-Grammy and Oscar-winning pop sensation celebrated for introspective lyricism and unique sound."
	},
	{
		name: "Post Malone",
		genre: "Hip-Hop / Pop",
		languages: ["English"],
		color: "#14b8a6",
		gradient: "linear-gradient(135deg, #14b8a6 0%, #134e4a 100%)",
		image: "https://resources.tidal.com/images/039dedb4/2e50/41df/ae8f/54ad371a31f3/750x750.jpg",
		monthlyListeners: "78,120,500",
		bio: "Multi-genre artist seamlessly blending hip-hop, pop, rock, and heartfelt country hooks."
	},
	{
		name: "Dua Lipa",
		genre: "Dance Pop",
		languages: ["English"],
		color: "#d946ef",
		gradient: "linear-gradient(135deg, #d946ef 0%, #701a75 100%)",
		image: "https://resources.tidal.com/images/28047130/6ada/4955/b3b9/65bed4508618/750x750.jpg",
		monthlyListeners: "71,900,430",
		bio: "British pop heavyweight known for disco-infused dance pop hits and international anthems."
	},
	{
		name: "Coldplay",
		genre: "Alt Rock / Stadium Pop",
		languages: ["English"],
		color: "#3b82f6",
		gradient: "linear-gradient(135deg, #3b82f6 0%, #172554 100%)",
		image: "https://resources.tidal.com/images/b4579672/5b91/4679/a27a/288f097a4da5/750x750.jpg",
		monthlyListeners: "86,300,000",
		bio: "British rock legends known for euphoric stadium anthems like Yellow, Fix You, and Viva La Vida."
	},
	{
		name: "Kendrick Lamar",
		genre: "Hip-Hop",
		languages: ["English"],
		color: "#64748b",
		gradient: "linear-gradient(135deg, #64748b 0%, #0f172a 100%)",
		image: "https://resources.tidal.com/images/84d81b7a/a12e/4a3e/bda4/d0527cb1c8cf/750x750.jpg",
		monthlyListeners: "68,300,100",
		bio: "Pulitzer Prize-winning hip-hop artist acclaimed for narrative depth and cultural impact."
	},
	{
		name: "Travis Scott",
		genre: "Trap / Hip-Hop",
		languages: ["English"],
		color: "#ca8a04",
		gradient: "linear-gradient(135deg, #ca8a04 0%, #422006 100%)",
		image: "https://resources.tidal.com/images/da110c26/386a/4023/83cf/a739baee2e79/750x750.jpg",
		monthlyListeners: "69,800,900",
		bio: "Houston rapper and visionary producer renowned for atmospheric psychedelic trap soundscapes."
	},
	{
		name: "Ariana Grande",
		genre: "Pop / R&B",
		languages: ["English"],
		color: "#f43f5e",
		gradient: "linear-gradient(135deg, #f43f5e 0%, #881337 100%)",
		image: "https://resources.tidal.com/images/9b18dc21/95ea/4dd9/9c5b/46ef012ec00d/750x750.jpg",
		monthlyListeners: "79,450,000",
		bio: "Powerhouse pop vocalist with a four-octave vocal range and numerous multi-platinum releases."
	},
	{
		name: "Ed Sheeran",
		genre: "Pop / Acoustic",
		languages: ["English"],
		color: "#eab308",
		gradient: "linear-gradient(135deg, #eab308 0%, #713f12 100%)",
		image: "https://resources.tidal.com/images/05d72ae4/319f/4237/821f/1d7af9ec8acf/750x750.jpg",
		monthlyListeners: "74,800,000",
		bio: "English singer-songwriter with ubiquitous acoustic-pop anthems topping global streaming records."
	},
	{
		name: "Bruno Mars",
		genre: "Funk / Pop",
		languages: ["English"],
		color: "#d97706",
		gradient: "linear-gradient(135deg, #d97706 0%, #78350f 100%)",
		image: "https://resources.tidal.com/images/00b6904f/7ef7/4f79/8c53/2cb170d23c32/750x750.jpg",
		monthlyListeners: "84,600,000",
		bio: "Multiple Grammy Award winner celebrated for vintage soul, infectious funk grooves, and pop mastery."
	},

	// K-Pop & Spanish
	{
		name: "BTS",
		genre: "K-Pop",
		languages: ["Korean", "English"],
		color: "#c084fc",
		gradient: "linear-gradient(135deg, #c084fc 0%, #581c87 100%)",
		image: "https://resources.tidal.com/images/8d1918b7/1abc/416e/bccf/e3d8a95697fc/750x750.jpg",
		monthlyListeners: "33,800,000",
		bio: "South Korean boy band breaking international milestones and leading the global Hallyu wave."
	},
	{
		name: "Bad Bunny",
		genre: "Latin / Reggaeton",
		languages: ["Spanish"],
		color: "#f97316",
		gradient: "linear-gradient(135deg, #f97316 0%, #7c2d12 100%)",
		image: "https://resources.tidal.com/images/860038f2/c3e1/4df6/a62e/ead97285672e/750x750.jpg",
		monthlyListeners: "76,320,110",
		bio: "Puerto Rican superstar shaping contemporary Latin trap, reggaeton, and global mainstream culture."
	}
];

const PREF_STORAGE_KEY = "mezzo_user_preferences";

export interface UserPreferencesState {
	languages: string[];
	favoriteArtists: string[];
	customArtists?: Record<string, PopularArtist>;
	onboardingCompleted: boolean;
}

class UserPreferencesStore {
	private _languages = $state<string[]>(["English"]);
	private _favoriteArtists = $state<string[]>([]);
	private _customArtists = $state<Record<string, PopularArtist>>({});
	private _onboardingCompleted = $state<boolean>(false);
	public showOnboarding = $state<boolean>(false);

	constructor() {
		this.loadFromStorage();
	}

	public loadFromStorage(userKey?: string) {
		if (typeof localStorage === "undefined") return;
		try {
			// Check user-specific onboarding record
			if (userKey) {
				const userDone = localStorage.getItem(`mezzo_onboarding_completed_${userKey}`);
				if (userDone === "true") {
					this._onboardingCompleted = true;
				}
			}
			const globalDone = localStorage.getItem("mezzo_onboarding_completed");
			if (globalDone === "true") {
				this._onboardingCompleted = true;
			}

			const saved = localStorage.getItem(PREF_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed.languages) && parsed.languages.length > 0) this._languages = parsed.languages;
				if (Array.isArray(parsed.favoriteArtists)) this._favoriteArtists = parsed.favoriteArtists;
				if (parsed.customArtists && typeof parsed.customArtists === "object") {
					this._customArtists = parsed.customArtists;
				}
				if (typeof parsed.onboardingCompleted === "boolean") {
					this._onboardingCompleted = this._onboardingCompleted || parsed.onboardingCompleted;
				}
			}
		} catch {
			// ignore storage load error
		}
	}

	public isUserOnboarded(userKey?: string): boolean {
		if (this._onboardingCompleted) return true;
		if (typeof localStorage === "undefined") return false;
		try {
			if (localStorage.getItem("mezzo_onboarding_completed") === "true") return true;
			if (userKey && localStorage.getItem(`mezzo_onboarding_completed_${userKey}`) === "true") return true;
		} catch {}
		return false;
	}

	public openOnboarding() {
		this.showOnboarding = true;
	}

	public closeOnboarding() {
		this.showOnboarding = false;
	}

	private saveToStorage(userKey?: string) {
		if (typeof localStorage === "undefined") return;
		try {
			const payload: UserPreferencesState = {
				languages: this._languages,
				favoriteArtists: this._favoriteArtists,
				customArtists: this._customArtists,
				onboardingCompleted: this._onboardingCompleted,
			};
			localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(payload));
			if (this._onboardingCompleted) {
				localStorage.setItem("mezzo_onboarding_completed", "true");
				if (userKey) {
					localStorage.setItem(`mezzo_onboarding_completed_${userKey}`, "true");
				}
			}
		} catch {
			// ignore storage save error
		}
	}

	get languages(): string[] {
		return this._languages;
	}

	get favoriteArtists(): string[] {
		return this._favoriteArtists;
	}

	get customArtists(): Record<string, PopularArtist> {
		return this._customArtists;
	}

	get onboardingCompleted(): boolean {
		return this._onboardingCompleted;
	}

	get hasCompletedOnboarding(): boolean {
		return this._onboardingCompleted;
	}

	toggleLanguage(lang: string) {
		if (this._languages.includes(lang)) {
			if (this._languages.length > 1) {
				this._languages = this._languages.filter((l) => l !== lang);
			}
		} else {
			this._languages = [...this._languages, lang];
		}
		this.saveToStorage();
	}

	hasLanguage(lang: string): boolean {
		return this._languages.includes(lang);
	}

	setLanguages(langs: string[]) {
		this._languages = langs.length > 0 ? langs : ["English"];
		this.saveToStorage();
	}

	toggleArtist(artistName: string) {
		if (this._favoriteArtists.includes(artistName)) {
			this._favoriteArtists = this._favoriteArtists.filter((a) => a !== artistName);
		} else {
			this._favoriteArtists = [...this._favoriteArtists, artistName];
		}
		this.saveToStorage();
	}

	hasArtist(artistName: string): boolean {
		return this._favoriteArtists.includes(artistName);
	}

	setFavoriteArtists(artists: string[]) {
		this._favoriteArtists = artists;
		this.saveToStorage();
	}

	addCustomArtist(artist: PopularArtist) {
		this._customArtists = {
			...this._customArtists,
			[artist.name.toLowerCase()]: artist,
		};
		if (!this._favoriteArtists.includes(artist.name)) {
			this._favoriteArtists = [...this._favoriteArtists, artist.name];
		}
		this.saveToStorage();
	}

	completeOnboarding(userKey?: string) {
		this._onboardingCompleted = true;
		this.showOnboarding = false;
		this.saveToStorage(userKey);
	}

	resetPreferences() {
		this._languages = ["English"];
		this._favoriteArtists = [];
		this._customArtists = {};
		this._onboardingCompleted = false;
		this.saveToStorage();
	}
}

export const userPreferences = new UserPreferencesStore();

export function getArtistMeta(name: string): PopularArtist {
	const lower = name.toLowerCase();
	const found = POPULAR_ARTISTS.find((a) => a.name.toLowerCase() === lower);
	if (found) return found;

	const custom = userPreferences.customArtists[lower];
	if (custom) return custom;

	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	const hue = Math.abs(hash % 360);
	const listenerCount = 5000000 + Math.abs(hash % 45000000);
	return {
		name,
		genre: "Artist",
		languages: ["English"],
		color: `hsl(${hue}, 75%, 50%)`,
		gradient: `linear-gradient(135deg, hsl(${hue}, 75%, 50%) 0%, hsl(${(hue + 45) % 360}, 85%, 20%) 100%)`,
		image: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80`,
		monthlyListeners: listenerCount.toLocaleString(),
		bio: `Popular global artist with millions of online streams.`
	};
}
