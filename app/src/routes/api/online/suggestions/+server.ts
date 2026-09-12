import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAppleMusicSuggestions } from "$lib/server/apple";

export const GET: RequestHandler = async ({ url }) => {
  const query = (url.searchParams.get("q") || "").trim();
  if (!query) {
    return json({ suggestions: [] });
  }

  const suggestionsSet = new Set<string>();

  try {
    // Concurrently query Apple Music and JioSaavn autocomplete for fast, rich suggestions
    const [appleRes, saavnRes] = await Promise.allSettled([
      getAppleMusicSuggestions(query, "in"),
      (async () => {
        const autoUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&ctx=web6dot0&query=${encodeURIComponent(query)}`;
        const res = await fetch(autoUrl, {
          headers: { "User-Agent": "Mezzo/1.0" },
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as any;
        const terms: string[] = [];
        for (const t of data.topquery?.data || []) {
          if (t.title) terms.push(t.title);
        }
        for (const s of data.songs?.data || []) {
          if (s.title) {
            terms.push(
              s.title
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&amp;/g, "&"),
            );
          }
        }
        return terms;
      })(),
    ]);

    if (appleRes.status === "fulfilled") {
      for (const term of appleRes.value) {
        suggestionsSet.add(term);
      }
    }

    if (saavnRes.status === "fulfilled") {
      for (const term of saavnRes.value) {
        suggestionsSet.add(term);
      }
    }

    // Clean and format suggestions
    const list: string[] = [];
    const lowerSeen = new Set<string>();

    for (const item of suggestionsSet) {
      const cleaned = item.trim();
      const lower = cleaned.toLowerCase();
      if (cleaned && !lowerSeen.has(lower)) {
        lowerSeen.add(lower);
        list.push(cleaned);
      }
      if (list.length >= 8) break;
    }

    return json({ suggestions: list });
  } catch (err: any) {
    console.warn("Suggestions endpoint error:", err);
    return json({ suggestions: [] });
  }
};
