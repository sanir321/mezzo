import type { UniversalTrack } from "./saavn";

export async function searchDeezer(query: string, limit = 15): Promise<UniversalTrack[]> {
  try {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mezzo/1.0" } });
    if (!res.ok) return [];

    const json = (await res.json()) as any;
    const items = json.data || [];

    return items
      .map((item: any): UniversalTrack | null => {
        if (!item || !item.id) return null;
        return {
          id: `deezer_${item.id}`,
          title: item.title || "",
          artist: item.artist?.name || "Unknown Artist",
          album: item.album?.title || "Single",
          duration: Number(item.duration) || 0,
          coverUrl: item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium || "",
          streamUrl: item.preview || "",
          source: "deezer",
          quality: "AAC 320kbps",
        };
      })
      .filter((t: UniversalTrack | null): t is UniversalTrack => Boolean(t && t.title));
  } catch {
    return [];
  }
}
