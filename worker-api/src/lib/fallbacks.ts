import type { Bindings } from '../env'
import { getCountryCode } from '../env'
import { searchSaavn, type UniversalTrack } from './providers/saavn'
import { searchDeezer } from './providers/deezer'
import { searchYouTube, resolveYouTubeStream } from './providers/youtube'
import { tidalJsonRequest } from './tidal/client'
import { resolveSaavnTrack } from './providers/saavn'

export interface TrackMeta {
  title: string
  artist: string
  album?: string
  cover?: string
}

export async function tidalTrackMeta(env: Bindings, id: number): Promise<TrackMeta | null> {
  try {
    const { data } = await tidalJsonRequest({
      env,
      url: `https://api.tidal.com/v1/tracks/${id}/`,
      params: {
        countryCode: getCountryCode(env),
      },
    })
    if (!data) return null
    return {
      title: data.title ?? '',
      artist: data.artist?.name ?? data.artists?.[0]?.name ?? '',
      album: data.album?.title,
      cover: data.album?.cover,
    }
  } catch {
    return null
  }
}

export async function tidalVideoMeta(env: Bindings, id: number): Promise<TrackMeta | null> {
  try {
    const { data } = await tidalJsonRequest({
      env,
      url: `https://api.tidal.com/v1/videos/${id}/`,
      params: {
        countryCode: getCountryCode(env),
      },
    })
    if (!data) return null
    return {
      title: data.title ?? '',
      artist: data.artists?.[0]?.name ?? data.artist?.name ?? '',
      cover: data.image?.large ?? data.image?.medium,
    }
  } catch {
    return null
  }
}

export async function providerTrackFeed(query: string, limit = 20): Promise<UniversalTrack[]> {
  const [saavn, deezer, yt] = await Promise.allSettled([
    searchSaavn(query, limit),
    searchDeezer(query, Math.max(1, Math.ceil(limit / 2))),
    searchYouTube(query, Math.max(1, Math.ceil(limit / 2))),
  ])

  const merged: UniversalTrack[] = []
  const seen = new Set<string>()

  for (const res of [saavn, deezer, yt]) {
    if (res.status !== 'fulfilled') continue
    for (const track of res.value) {
      const key = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(track)
      }
    }
  }

  return merged.slice(0, limit)
}

export interface ResolvedStream {
  url: string
  source: string
  quality: string
}

export async function resolveProviderStream(
  env: Bindings,
  title: string,
  artist?: string,
): Promise<ResolvedStream | null> {
  const query = (title && artist ? `${title} ${artist}` : title).trim()
  if (!query) return null

  try {
    const saavnUrl = await resolveSaavnTrack(title, artist)
    if (saavnUrl) return { url: saavnUrl, source: 'saavn', quality: '320kbps CD-Quality' }
  } catch {}

  try {
    const ytUrl = await resolveYouTubeStream(query)
    if (ytUrl) return { url: ytUrl, source: 'youtube', quality: 'Opus 160kbps' }
  } catch {}

  return null
}

export interface LrcLyrics {
  trackName: string
  artistName: string
  albumName: string
  duration: number
  plainLyrics: string | null
  syncedLyrics: string | null
}

export async function lyricsFromLrclib(title: string, artist: string): Promise<LrcLyrics | null> {
  try {
    const params = new URLSearchParams({ track_name: title, artist_name: artist })
    const res = await fetch(`https://lrclib.net/api/search?${params.toString()}`, {
      headers: { 'User-Agent': 'Mezzo/1.0' },
    })
    if (!res.ok) return null

    const arr = (await res.json()) as any[]
    if (!Array.isArray(arr) || arr.length === 0) return null

    const best = arr[0]
    return {
      trackName: best.trackName ?? title,
      artistName: best.artistName ?? artist,
      albumName: best.albumName ?? '',
      duration: Number(best.duration) || 0,
      plainLyrics: best.plainLyrics ?? null,
      syncedLyrics: best.syncedLyrics ?? null,
    }
  } catch {
    return null
  }
}

export async function deezerChartTracks(limit = 25): Promise<UniversalTrack[]> {
  try {
    const res = await fetch('https://api.deezer.com/chart/0', {
      headers: { 'User-Agent': 'Mezzo/1.0' },
    })
    if (!res.ok) return []

    const json = (await res.json()) as any
    const items = Array.isArray(json?.tracks?.data) ? json.tracks.data : []
    return items
      .slice(0, limit)
      .map((item: any): UniversalTrack | null => {
        if (!item?.id) return null
        return {
          id: `deezer_${item.id}`,
          title: item.title || '',
          artist: item.artist?.name || 'Unknown Artist',
          album: item.album?.title || 'Single',
          duration: Number(item.duration) || 0,
          coverUrl: item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium || '',
          streamUrl: '',
          source: 'deezer',
          quality: 'Metadata only (full stream via Saavn/YouTube)',
        }
      })
      .filter((t: UniversalTrack | null): t is UniversalTrack => Boolean(t && t.title))
  } catch {
    return []
  }
}