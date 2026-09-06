import CryptoJS from "crypto-js";

const SAAVN_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "X-Forwarded-For": "49.36.0.1",
  "CF-IPCountry": "IN",
};

export function decryptSaavnMediaUrl(encryptedMediaUrl: string): string {
  if (!encryptedMediaUrl) return "";
  try {
    const key = CryptoJS.enc.Utf8.parse("38346591");
    const decrypted = CryptoJS.DES.decrypt(encryptedMediaUrl, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const raw = decrypted.toString(CryptoJS.enc.Utf8);
    if (!raw || !raw.startsWith("http")) return "";
    return raw.replace(/_96\.mp4$/, "_320.mp4");
  } catch {
    return "";
  }
}

export interface UniversalTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl: string;
  streamUrl: string;
  source: "saavn" | "youtube" | "deezer" | "tidal";
  quality: string;
}

export async function searchSaavn(query: string, limit = 20): Promise<UniversalTrack[]> {
  try {
    const cleanQ = query.trim();
    const url = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=${limit}&p=1&q=${encodeURIComponent(cleanQ)}`;
    const res = await fetch(url, { headers: SAAVN_HEADERS });
    if (!res.ok) return [];

    const json = (await res.json()) as any;
    const results = json.results || [];

    return results
      .map((item: any): UniversalTrack | null => {
        const enc = item.encrypted_media_url || item.more_info?.encrypted_media_url || "";
        const stream = decryptSaavnMediaUrl(enc);
        const image = (item.image || "")
          .replace(/150x150/g, "500x500")
          .replace(/http:\/\//, "https://");

        return {
          id: `saavn_${item.id}`,
          title: item.song || item.title || "",
          artist: item.primary_artists || item.singers || item.music || "Unknown Artist",
          album: item.album || "Single",
          duration: Number(item.duration) || 0,
          coverUrl: image,
          streamUrl: stream,
          source: "saavn",
          quality: "320kbps CD-Quality",
        };
      })
      .filter((t: UniversalTrack | null): t is UniversalTrack => Boolean(t && t.title));
  } catch (err) {
    console.warn("Saavn search error:", err);
    return [];
  }
}

export async function resolveSaavnTrack(title: string, artist?: string): Promise<string | null> {
  const q = artist ? `${title} ${artist}` : title;
  const tracks = await searchSaavn(q, 5);
  if (tracks.length > 0 && tracks[0].streamUrl) {
    return tracks[0].streamUrl;
  }
  return null;
}
