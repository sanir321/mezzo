import { Hono } from 'hono'
import type { Bindings } from '../env'
import { API_VERSION, DEFAULT_COUNTRY_CODE } from '../constants'
import { getInt, getString } from '../lib/query'
import { ApiError } from '../lib/errors'
import { tidalJsonRequest } from '../lib/tidal/client'
import { searchYouTubeTrending, resolveYouTubeStream } from '../lib/providers/youtube'
import { tidalVideoMeta } from '../lib/fallbacks'

const app = new Hono<{ Bindings: Bindings }>({ strict: false })

function mapYoutubeTrending(track: {
  title: string
  artist: string
  duration: number
  coverUrl: string
  id: string
}): Record<string, unknown> {
  return {
    videoId: track.id,
    title: track.title,
    duration: Math.round(track.duration),
    artists: [{ name: track.artist }],
    image: { large: track.coverUrl, medium: track.coverUrl, small: track.coverUrl },
    source: 'youtube',
  }
}

app.get('/topvideos', async (c) => {
  const searchParams = new URL(c.req.url).searchParams
  const countryCode = getString(searchParams, 'countryCode') ?? DEFAULT_COUNTRY_CODE
  const locale = getString(searchParams, 'locale') ?? 'en_US'
  const deviceType = getString(searchParams, 'deviceType') ?? 'BROWSER'
  const limit = getInt(searchParams, 'limit', { defaultValue: 25, min: 1, max: 100 })
  const offset = getInt(searchParams, 'offset', { defaultValue: 0, min: 0 })

  const videos: any[] = []
  let source = 'tidal'

  const collectTidal = async () => {
    const { data } = await tidalJsonRequest({
      env: c.env,
      url: 'https://api.tidal.com/v1/pages/mymusic_recommended_videos',
      params: {
        countryCode,
        locale,
        deviceType,
      },
    })

    for (const row of data?.rows ?? []) {
      for (const module of row?.modules ?? []) {
        const type = module?.type
        if (type === 'VIDEO_PLAYLIST' || type === 'VIDEO_ROW' || type === 'PAGED_LIST') {
          for (const item of module?.pagedList?.items ?? []) {
            videos.push(item?.item ?? item)
          }
        } else if (type === 'VIDEO' || String(type ?? '').toLowerCase().includes('video')) {
          if (module?.item && typeof module.item === 'object') {
            videos.push(module.item)
          }
        }
      }
    }
  }

  try {
    await collectTidal()
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
  }

  if (videos.length === 0) {
    const trending = await searchYouTubeTrending(limit)
    for (const t of trending) {
      videos.push(mapYoutubeTrending(t))
    }
    source = 'youtube'
  }

  return c.json({
    version: API_VERSION,
    videos: videos.slice(offset, offset + limit),
    total: videos.length,
    source,
  })
})

app.get('/video', async (c) => {
  const searchParams = new URL(c.req.url).searchParams
  const id = getInt(searchParams, 'id', { required: true })
  const quality = getString(searchParams, 'quality') ?? 'HIGH'
  const mode = getString(searchParams, 'mode') ?? 'STREAM'
  const presentation = getString(searchParams, 'presentation') ?? 'FULL'

  try {
    const { data } = await tidalJsonRequest({
      env: c.env,
      url: `https://api.tidal.com/v1/videos/${id}/playbackinfo`,
      params: {
        videoquality: quality,
        playbackmode: mode,
        assetpresentation: presentation,
      },
    })

    return c.json({
      version: API_VERSION,
      video: data,
    })
  } catch (error) {
    if (!(error instanceof ApiError)) throw error

    const meta = await tidalVideoMeta(c.env, id)
    const streamUrl = meta?.title ? await resolveYouTubeStream(meta.title) : null

    return c.json({
      version: API_VERSION,
      video: {
        videoId: id,
        title: meta?.title ?? '',
        streamType: 'ON_DEMAND',
        assetPresentation: streamUrl ? 'FULL' : 'PREVIEW',
        videoQuality: quality,
        image: meta?.cover ? { large: meta.cover, medium: meta.cover, small: meta.cover } : null,
        streamUrl: streamUrl ?? null,
        source: streamUrl ? 'youtube' : null,
      },
    })
  }
})

export default app