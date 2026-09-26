// Video Studio service layer
// ---------------------------------------------------------------------------
// Pure server-side logic for the admin AI Video Studio. Kept framework-agnostic
// (no next/server imports) so it can be reused from thin API routes today and
// moved to Supabase Edge Functions later to take Vercel cost toward zero.
//
// Three responsibilities:
//   1. generateVideoPlan() — Gemini turns a poem/story into a structured,
//      teaser-only video plan (scenes, on-screen text, voiceover, keywords).
//   2. synthesizeSpeech()  — Gemini free-tier TTS → WAV bytes (base64).
//   3. searchImages()      — keyless stock image search (Openverse + Picsum),
//      so no image-provider API keys are ever required.
// ---------------------------------------------------------------------------

import { GoogleGenAI } from "@google/genai"
import { createSupabaseServer } from "@/lib/supabase-server"

const TEXT_MODEL = "gemini-2.5-flash"
const TTS_MODEL = "gemini-2.5-flash-preview-tts"

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")
  return new GoogleGenAI({ apiKey })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VideoScene = {
  text: string // short on-screen snippet (a line or two — NEVER the full piece)
  voiceover: string // narration for this scene (may be empty)
  imageKeywords: string[] // 1-3 keywords to source a background image
  durationSec: number // 3-8s per scene
}

export type VideoPlan = {
  title: string
  hook: string
  scenes: VideoScene[]
  outro: { text: string; cta: string }
  caption: string
  hashtags: string[]
}

export type StockImage = {
  id: string
  thumbUrl: string
  fullUrl: string
  author: string | null
  source: string // 'openverse' | 'picsum' | 'unsplash'
  provider: string
  type: 'image' | 'video'
  videoUrl?: string // for videos
  duration?: number // for videos in seconds
}

export type GeneratePlanInput = {
  title?: string
  content: string
  contentType?: string // 'poem' | 'story' | 'chronicle' | ...
  authorName?: string
  postUrl?: string
  targetSeconds?: number // desired total length (15-60)
}

// ---------------------------------------------------------------------------
// 1. Structured video plan
// ---------------------------------------------------------------------------

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    hook: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          voiceover: { type: "string" },
          imageKeywords: { type: "array", items: { type: "string" } },
          durationSec: { type: "number" },
        },
        required: ["text", "voiceover", "imageKeywords", "durationSec"],
      },
    },
    outro: {
      type: "object",
      properties: { text: { type: "string" }, cta: { type: "string" } },
      required: ["text", "cta"],
    },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["title", "hook", "scenes", "outro", "caption", "hashtags"],
}

export async function generateVideoPlan(input: GeneratePlanInput): Promise<VideoPlan> {
  const client = getClient()
  const target = Math.min(Math.max(input.targetSeconds || 30, 15), 60)
  // Reserve ~3s for the closing brand card; the rest is narrated scene time.
  const speakSeconds = Math.max(8, target - 3)
  // Natural narration runs ~2.5 words/sec. Budget the WHOLE script to the target
  // so the generated voiceover length matches the video length.
  const WORDS_PER_SEC = 2.5
  const wordBudget = Math.round(speakSeconds * WORDS_PER_SEC)
  // ~4.5s per scene → scene budget that fits the target length
  const maxScenes = Math.max(3, Math.min(10, Math.round((target - 4) / 4.5)))
  const perSceneWords = Math.max(6, Math.round(wordBudget / maxScenes))

  const prompt = `You are a charismatic social-media presenter and video director for "Whispr", a literary platform for poems and stories.
Turn the piece below into a SHORT, spoken teaser for Reels / Shorts / TikTok (target total length ~${target} seconds).

Write it like a real narrator talking straight to the viewer — warm, confident, flowing. It must feel like ONE continuous mini-story that pulls the viewer along, NOT a list of disconnected quotes.

NARRATIVE ARC (spread across the scenes in this order):
1. HOOK — open with a scroll-stopping line: a bold question, a striking image, or a "you won't believe…" tension. Make them stop scrolling.
2. BUILD — 1-2 scenes that deepen the intrigue and set the stakes or mood, flowing naturally from the hook.
3. CLIMAX — the most powerful, emotional or surprising beat of the piece. The peak moment.
4. CURIOSITY CUT — end on an unresolved, tantalising line that makes them NEED to read the rest. Do NOT give away the ending or resolution.
Each scene should hand off smoothly to the next (use natural connective flow — "but then…", "until…", "and that's when…" style transitions where it fits), so read end-to-end it sounds like a single narrated teaser.

HARD TIMING BUDGET (must obey — narration is read aloud at ~2.5 words/second):
- TOTAL words across ALL scene "text" fields must be AT MOST ${wordBudget} words, so the spoken audio stays close to ${speakSeconds}s. Count carefully.
- Produce AT MOST ${maxScenes} scenes. Aim for ~${perSceneWords} words per scene (short spoken lines).
- Each scene "durationSec" is 3-8s and roughly equals (that scene's word count ÷ 2.5). The sum of durationSec must be close to ${speakSeconds}.

STRICT FORMAT RULES:
- "text" = the exact words shown ON SCREEN AND read aloud verbatim. Shown text and narration are IDENTICAL. Keep each line short, spoken-sounding and quotable.
- "voiceover" = MUST be the exact same string as "text". Do not add or remove words.
- This is a TEASER: draw from the piece's own words/themes but you MAY lightly paraphrase into natural spoken lines. NEVER reproduce the full piece or reveal its resolution.
- "imageKeywords" = 1-3 concrete, visual English keywords for a fitting background photo that matches that beat's emotion (e.g. "misty forest dawn", "city rain neon", "old handwritten letter").
- "outro.text" = a short closing card inviting viewers to read the full piece on Whispr (shown, not narrated).
- "outro.cta" = a short call to action (e.g. "Full ${input.contentType || "piece"} on Whispr — link in bio").
- "caption" = a ready-to-post social caption WITHOUT the link (the admin appends it).
- "hashtags" = 4-8 relevant hashtags (each starting with #).

PIECE METADATA:
Title: ${input.title || "(untitled)"}
Type: ${input.contentType || "piece"}
Author: ${input.authorName || "a Whispr writer"}

PIECE CONTENT:
"""
${input.content.slice(0, 6000)}
"""`

  const result = await client.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: PLAN_SCHEMA as any,
    },
  })

  const raw = result.text || "{}"
  let plan: VideoPlan
  try {
    plan = JSON.parse(raw)
  } catch {
    throw new Error("Gemini returned an unparseable plan")
  }

  // Normalise / clamp so the client renderer always gets safe values.
  // The on-screen text is also the narration, so force voiceover === text.
  plan.scenes = (plan.scenes || []).slice(0, maxScenes).map((s) => {
    const text = String(s.text || "").slice(0, 240)
    const words = text.trim().split(/\s+/).filter(Boolean).length || 1
    // Duration derived from the spoken words so it matches the audio pace.
    const paced = words / WORDS_PER_SEC
    const durationSec = Math.min(Math.max(Number(s.durationSec) || paced, 2.5), 8)
    return {
      text,
      voiceover: text, // shown === spoken, for perfect correlation
      imageKeywords: Array.isArray(s.imageKeywords) ? s.imageKeywords.slice(0, 3).map(String) : [],
      durationSec,
    }
  })
  plan.hashtags = Array.isArray(plan.hashtags)
    ? plan.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).slice(0, 8)
    : []
  plan.hook = plan.hook || plan.title || ""
  plan.outro = plan.outro || { text: "Read the full piece on Whispr", cta: "Link in bio" }
  return plan
}

// ---------------------------------------------------------------------------
// 2. Gemini free-tier TTS  →  WAV bytes
// ---------------------------------------------------------------------------

// Gemini TTS returns raw signed 16-bit PCM, mono, 24kHz. Browsers/social apps
// want a container, so we prepend a minimal WAV header.
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const header = Buffer.alloc(44)
  header.write("RIFF", 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write("WAVE", 8)
  header.write("fmt ", 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write("data", 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

export type TtsInput = { text: string; voice?: string; style?: string }

// Default delivery direction so the read sounds like an engaging presenter
// telling a story, not a flat text-to-speech readout.
const DEFAULT_TTS_STYLE =
  "Read this like a captivating storyteller narrating a movie trailer — warm and intimate, with natural flow, gentle build in energy, and a pause of intrigue before the final line"

// Returns a base64 WAV data payload (no data: prefix) plus its mime type.
export async function synthesizeSpeech({ text, voice = "Kore", style }: TtsInput): Promise<{ base64: string; mimeType: string }> {
  if (!text || !text.trim()) throw new Error("No text to synthesize")
  const client = getClient()

  // Gemini TTS treats a leading natural-language directive (before the colon)
  // as delivery style, not spoken words.
  const directed = `${style || DEFAULT_TTS_STYLE}:\n\n${text.trim()}`

  const result = await client.models.generateContent({
    model: TTS_MODEL,
    contents: directed.slice(0, 4500),
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    } as any,
  })

  const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data)
  const data = part?.inlineData?.data
  if (!data) throw new Error("Gemini TTS returned no audio")

  const pcm = Buffer.from(data, "base64")
  const wav = pcmToWav(pcm)
  return { base64: wav.toString("base64"), mimeType: "audio/wav" }
}

// Prebuilt Gemini voices worth exposing in the UI.
export const TTS_VOICES = [
  { id: "Kore", label: "Kore — firm, warm" },
  { id: "Puck", label: "Puck — upbeat" },
  { id: "Charon", label: "Charon — deep, calm" },
  { id: "Aoede", label: "Aoede — breezy" },
  { id: "Fenrir", label: "Fenrir — intense" },
  { id: "Leda", label: "Leda — youthful" },
]

// ---------------------------------------------------------------------------
// 3. Stock image search — Unsplash (keyed, best relevance) → Openverse → Picsum
// ---------------------------------------------------------------------------

// Unsplash — highest-quality, most relevant results. Requires a free Access Key.
async function searchUnsplash(query: string, limit: number): Promise<StockImage[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return []
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query,
  )}&per_page=${limit}&orientation=portrait&content_filter=high`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
  })
  if (!res.ok) return []
  const json: any = await res.json()
  return (json.results || []).map((r: any) => ({
    id: `us_${r.id}`,
    // 9:16-friendly crop for the thumbnail; full-res 1080w for the background.
    thumbUrl: `${r.urls?.raw || r.urls?.regular}&w=400&h=711&fit=crop`,
    fullUrl: `${r.urls?.raw || r.urls?.regular}&w=1080&h=1920&fit=crop`,
    author: r.user?.name || null,
    source: "unsplash",
    provider: "unsplash",
    type: 'image' as const,
  }))
}

// Openverse — openly-licensed media aggregator, NO API key required.
async function searchOpenverse(query: string, limit: number): Promise<StockImage[]> {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${limit}&license_type=all&mature=false`
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) return []
  const json: any = await res.json()
  return (json.results || []).map((r: any) => ({
    id: `ov_${r.id}`,
    thumbUrl: r.thumbnail || r.url,
    fullUrl: r.url,
    author: r.creator || null,
    source: "openverse",
    provider: r.source || "openverse",
    type: 'image' as const,
  }))
}

// Lorem Picsum — keyless, always-available deterministic fallback so the picker
// is never empty even if the keyed/keyless providers are unreachable.
function picsumFallback(query: string, limit: number): StockImage[] {
  const seedBase = encodeURIComponent(query || "whispr")
  return Array.from({ length: limit }, (_, i) => {
    const seed = `${seedBase}-${i}`
    return {
      id: `ps_${seed}`,
      thumbUrl: `https://picsum.photos/seed/${seed}/400/711`,
      fullUrl: `https://picsum.photos/seed/${seed}/1080/1920`,
      author: "Lorem Picsum",
      source: "picsum",
      provider: "picsum",
      type: 'image' as const,
    }
  })
}

// Pexels - free stock videos (requires API key)
async function searchPexelsVideos(query: string, limit: number): Promise<StockImage[]> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.log('[AI Studio] PEXELS_API_KEY not configured, skipping Pexels videos')
    return []
  }
  
  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=portrait&size=small`
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
    })
    if (!res.ok) {
      console.log('[AI Studio] Pexels API error:', res.status)
      return []
    }
    const json: any = await res.json()
    console.log('[AI Studio] Pexels returned', json.videos?.length || 0, 'videos')
    return (json.videos || []).map((v: any) => ({
      id: `px_${v.id}`,
      thumbUrl: v.image || v.video_files?.[0]?.link || '',
      fullUrl: v.video_files?.[0]?.link || '',
      author: v.user?.name || null,
      source: 'pexels',
      provider: 'pexels',
      type: 'video' as const,
      videoUrl: v.video_files?.[0]?.link || '',
      duration: v.duration || 0,
    }))
  } catch (e) {
    console.log('[AI Studio] Pexels search error:', e)
    return []
  }
}

// Unsplash - NOTE: Unsplash does not have a public video search API (404 on /search/videos)
// We skip Unsplash for videos and use Pexels/Pixabay instead
async function searchUnsplashVideos(query: string, limit: number): Promise<StockImage[]> {
  console.log('[AI Studio] Skipping Unsplash videos (API endpoint not available)')
  return []
}

// Pixabay - free stock videos (requires API key but generous free tier)
async function searchPixabayVideos(query: string, limit: number): Promise<StockImage[]> {
  const apiKey = process.env.PIXABAY_API_KEY
  if (!apiKey) {
    console.log('[AI Studio] PIXABAY_API_KEY not configured, skipping Pixabay videos')
    return []
  }
  
  try {
    const url = `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=${limit}&video_type=film&orientation=vertical&safesearch=true`
    const res = await fetch(url)
    if (!res.ok) {
      console.log('[AI Studio] Pixabay API error:', res.status)
      return []
    }
    const json: any = await res.json()
    console.log('[AI Studio] Pixabay returned', json.hits?.length || 0, 'videos')
    return (json.hits || []).map((v: any) => ({
      id: `pxb_${v.id}`,
      thumbUrl: v.videos?.tiny?.url || v.videos?.small?.url || '',
      fullUrl: v.videos?.medium?.url || v.videos?.small?.url || '',
      author: v.user || null,
      source: 'pixabay',
      provider: 'pixabay',
      type: 'video' as const,
      videoUrl: v.videos?.medium?.url || v.videos?.small?.url || '',
      duration: v.duration || 0,
    }))
  } catch (e) {
    console.log('[AI Studio] Pixabay search error:', e)
    return []
  }
}

// Fallback to sample videos when no API keys are available
function videoFallback(query: string, limit: number): StockImage[] {
  console.log('[AI Studio] Using video fallback (no API keys configured)')
  const sampleVideos = [
    {
      id: 'fb_1',
      thumbUrl: 'https://images.pexels.com/videos/2759477/free-video-2759477.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/2759477/2759477-uhd_2560_1440_24fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/2759477/2759477-uhd_2560_1440_24fps.mp4',
      duration: 15,
    },
    {
      id: 'fb_2',
      thumbUrl: 'https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_25fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_25fps.mp4',
      duration: 20,
    },
    {
      id: 'fb_3',
      thumbUrl: 'https://images.pexels.com/videos/853809/free-video-853809.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/853809/853809-uhd_2560_1440_25fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/853809/853809-uhd_2560_1440_25fps.mp4',
      duration: 12,
    },
    {
      id: 'fb_4',
      thumbUrl: 'https://images.pexels.com/videos/2869519/free-video-2869519.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/2869519/2869519-uhd_2560_1440_25fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/2869519/2869519-uhd_2560_1440_25fps.mp4',
      duration: 18,
    },
    {
      id: 'fb_5',
      thumbUrl: 'https://images.pexels.com/videos/2759493/free-video-2759493.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/2759493/2759493-uhd_2560_1440_25fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/2759493/2759493-uhd_2560_1440_25fps.mp4',
      duration: 14,
    },
    {
      id: 'fb_6',
      thumbUrl: 'https://images.pexels.com/videos/2600265/free-video-2600265.jpg?auto=compress&cs=tinysrgb&dpr=1&w=400',
      fullUrl: 'https://videos.pexels.com/video-files/2600265/2600265-uhd_2560_1440_25fps.mp4',
      author: 'Pexels',
      source: 'fallback',
      provider: 'fallback',
      type: 'video' as const,
      videoUrl: 'https://videos.pexels.com/video-files/2600265/2600265-uhd_2560_1440_25fps.mp4',
      duration: 16,
    },
  ]
  return sampleVideos.slice(0, limit)
}

export async function searchImages(query: string, limit = 12, type: 'image' | 'video' | 'all' = 'image'): Promise<StockImage[]> {
  const q = (query || "").trim()
  console.log('[AI Studio] searchImages called with query:', q, 'type:', type, 'limit:', limit)
  if (!q) return picsumFallback("whispr", limit)

  // If requesting videos specifically, try multiple providers
  if (type === 'video') {
    console.log('[AI Studio] Searching for videos with query:', q)
    
    // Try Unsplash first (if API key exists)
    const usVideos = await searchUnsplashVideos(q, limit)
    console.log('[AI Studio] Unsplash returned', usVideos.length, 'videos')
    if (usVideos.length >= 3) return usVideos
    
    // Try Pexels (if API key exists)
    const pxVideos = await searchPexelsVideos(q, limit)
    console.log('[AI Studio] Pexels returned', pxVideos.length, 'videos')
    if (pxVideos.length >= 3) return pxVideos
    
    // Try Pixabay (if API key exists)
    const pxbVideos = await searchPixabayVideos(q, limit)
    console.log('[AI Studio] Pixabay returned', pxbVideos.length, 'videos')
    if (pxbVideos.length >= 3) return pxbVideos
    
    // If no API keys or all failed, use fallback
    console.log('[AI Studio] No video API keys configured or all failed, using fallback')
    return videoFallback(q, limit)
  }

  // If requesting both, mix images and videos
  if (type === 'all') {
    console.log('[AI Studio] Searching for images and videos with query:', q)
    const images = await searchImages(q, limit, 'image')
    const videos = await searchImages(q, Math.floor(limit / 2), 'video')
    return [...images, ...videos].slice(0, limit)
  }

  // 1) Unsplash first — most relevant when a key is configured.
  try {
    const us = await searchUnsplash(q, limit)
    if (us.length >= 3) return us
    // 2) Top up with Openverse for coverage, keeping Unsplash hits first.
    let combined = us
    try {
      const ov = await searchOpenverse(q, limit - us.length)
      combined = [...us, ...ov]
    } catch {
      /* ignore openverse failure */
    }
    if (combined.length >= 3) return combined
    // 3) Keyless deterministic fallback so the grid is never empty.
    return [...combined, ...picsumFallback(q, limit - combined.length)]
  } catch {
    // Unsplash threw (e.g. rate limit) — fall back to keyless providers.
    try {
      const ov = await searchOpenverse(q, limit)
      if (ov.length >= 3) return ov
      return [...ov, ...picsumFallback(q, limit - ov.length)]
    } catch {
      return picsumFallback(q, limit)
    }
  }
}

// Fetch a remote image and return raw bytes — used by the image proxy so the
// client canvas can draw cross-origin images without tainting (CORS-safe export).
export async function fetchImageBytes(url: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const res = await fetch(url, { headers: { "User-Agent": "WhisprVideoStudio/1.0" } })
  if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`)
  const contentType = res.headers.get("content-type") || "image/jpeg"
  const bytes = await res.arrayBuffer()
  return { bytes, contentType }
}

// ---------------------------------------------------------------------------
// 4. Content source picker — fetch published content the admin can turn into a
//    video, normalised across every content type with its public URL.
// ---------------------------------------------------------------------------

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com").replace(/\/$/, "")

export type ContentCategory =
  | "admin_poem"
  | "admin_blog"
  | "story"
  | "story_chapter"
  | "chronicles_post"

export type StudioContentItem = {
  id: string
  category: ContentCategory
  categoryLabel: string
  title: string
  excerpt: string // short preview for the list
  content: string // full text used to seed the plan
  authorName: string
  contentType: string // 'poem' | 'story' | 'blog' | ...
  coverImageUrl: string | null
  publicUrl: string
  publishedAt: string | null
}

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  admin_poem: "Whispr Poems",
  admin_blog: "Whispr Blog",
  story: "Stories",
  story_chapter: "Story Chapters",
  chronicles_post: "Chronicles Posts",
}

function stripHtml(s: string | null | undefined): string {
  if (!s) return ""
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function makeExcerpt(text: string, max = 160): string {
  const clean = stripHtml(text)
  return clean.length > max ? `${clean.slice(0, max).trim()}…` : clean
}

export type ListContentInput = {
  category?: ContentCategory | "all"
  query?: string
  limit?: number
}

// Fetches published content across all sources, newest first per source.
export async function listStudioContent(input: ListContentInput = {}): Promise<StudioContentItem[]> {
  const supabase = createSupabaseServer()
  const limit = Math.min(Math.max(input.limit || 40, 1), 100)
  const q = (input.query || "").trim()
  const cat = input.category || "all"
  const want = (c: ContentCategory) => cat === "all" || cat === c

  const tasks: Promise<StudioContentItem[]>[] = []

  // Admin poems + blogs (posts table)
  if (want("admin_poem") || want("admin_blog")) {
    tasks.push(
      (async () => {
        let query = supabase
          .from("posts")
          .select("id, title, content, excerpt, type, slug, published_at, media_files, admin:admin_id(full_name, username)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(limit)
        if (cat === "admin_poem") query = query.eq("type", "poem")
        else if (cat === "admin_blog") query = query.eq("type", "blog")
        if (q) query = query.ilike("title", `%${q}%`)
        const { data, error } = await query
        if (error || !data) return []
        return data
          .filter((p: any) => (cat === "all" ? p.type === "poem" || p.type === "blog" : true))
          .map((p: any): StudioContentItem => {
            const isPoem = p.type === "poem"
            const category: ContentCategory = isPoem ? "admin_poem" : "admin_blog"
            const cover = Array.isArray(p.media_files) && p.media_files[0]?.url ? p.media_files[0].url : null
            return {
              id: p.id,
              category,
              categoryLabel: CATEGORY_LABELS[category],
              title: p.title,
              excerpt: makeExcerpt(p.excerpt || p.content),
              content: stripHtml(p.content),
              authorName: p.admin?.full_name || p.admin?.username || "Whispr",
              contentType: isPoem ? "poem" : "blog",
              coverImageUrl: cover,
              publicUrl: `${SITE_URL}/${isPoem ? "poems" : "blog"}/${p.slug}`,
              publishedAt: p.published_at,
            }
          })
      })(),
    )
  }

  // Stories (unified admin + chronicle view)
  if (want("story")) {
    tasks.push(
      (async () => {
        let query = supabase
          .from("view_all_stories")
          .select("id, title, slug, description, excerpt, cover_image_url, author_name, published_at, status")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(limit)
        if (q) query = query.ilike("title", `%${q}%`)
        const { data, error } = await query
        if (error || !data) return []
        return data.map(
          (s: any): StudioContentItem => ({
            id: s.id,
            category: "story",
            categoryLabel: CATEGORY_LABELS.story,
            title: s.title,
            excerpt: makeExcerpt(s.description || s.excerpt),
            content: stripHtml(s.description || s.excerpt || s.title),
            authorName: s.author_name || "Whispr writer",
            contentType: "story",
            coverImageUrl: s.cover_image_url || null,
            publicUrl: `${SITE_URL}/stories/${s.slug}`,
            publishedAt: s.published_at,
          }),
        )
      })(),
    )
  }

  // Story chapters (admin + chronicles) — deep-linked under their parent story.
  // URL: /stories/{story-slug}/{chapter-slug}
  if (want("story_chapter")) {
    // Admin story chapters
    tasks.push(
      (async () => {
        let query = supabase
          .from("admin_story_chapters")
          .select(
            "id, title, slug, content, sequence, created_at, status, story:story_id(title, slug, cover_image_url, status, admin:admin_id(full_name, username))",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(limit)
        if (q) query = query.ilike("title", `%${q}%`)
        const { data, error } = await query
        if (error || !data) return []
        return data
          .filter((c: any) => c.story && c.story.status === "published" && c.story.slug)
          .map((c: any): StudioContentItem => {
            const story = c.story
            const author = story?.admin?.full_name || story?.admin?.username || "Whispr"
            return {
              id: c.id,
              category: "story_chapter",
              categoryLabel: CATEGORY_LABELS.story_chapter,
              title: `${story.title} — ${c.title}`,
              excerpt: makeExcerpt(c.content),
              content: stripHtml(c.content),
              authorName: author,
              contentType: "story",
              coverImageUrl: story?.cover_image_url || null,
              publicUrl: `${SITE_URL}/stories/${story.slug}/${c.slug}`,
              publishedAt: c.created_at,
            }
          })
      })(),
    )

    // Chronicles story chapters
    tasks.push(
      (async () => {
        let query = supabase
          .from("chronicles_story_chapters")
          .select(
            "id, title, slug, content, sequence, created_at, status, story:story_id(title, slug, cover_image_url, status, creator:creator_id(pen_name, display_name))",
          )
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(limit)
        if (q) query = query.ilike("title", `%${q}%`)
        const { data, error } = await query
        if (error || !data) return []
        return data
          .filter((c: any) => c.story && c.story.status === "published" && c.story.slug)
          .map((c: any): StudioContentItem => {
            const story = c.story
            const author = story?.creator?.display_name || story?.creator?.pen_name || "Chronicles creator"
            return {
              id: c.id,
              category: "story_chapter",
              categoryLabel: CATEGORY_LABELS.story_chapter,
              title: `${story.title} — ${c.title}`,
              excerpt: makeExcerpt(c.content),
              content: stripHtml(c.content),
              authorName: author,
              contentType: "story",
              coverImageUrl: story?.cover_image_url || null,
              publicUrl: `${SITE_URL}/stories/${story.slug}/${c.slug}`,
              publishedAt: c.created_at,
            }
          })
      })(),
    )
  }

  // Chronicles posts (creator content)
  if (want("chronicles_post")) {
    tasks.push(
      (async () => {
        let query = supabase
          .from("chronicles_posts")
          .select("id, title, slug, content, excerpt, cover_image_url, post_type, published_at, status, creator:creator_id(pen_name, display_name)")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(limit)
        if (q) query = query.ilike("title", `%${q}%`)
        const { data, error } = await query
        if (error || !data) return []
        return data.map(
          (p: any): StudioContentItem => ({
            id: p.id,
            category: "chronicles_post",
            categoryLabel: CATEGORY_LABELS.chronicles_post,
            title: p.title,
            excerpt: makeExcerpt(p.excerpt || p.content),
            content: stripHtml(p.content),
            authorName: p.creator?.display_name || p.creator?.pen_name || "Chronicles creator",
            contentType: p.post_type || "post",
            coverImageUrl: p.cover_image_url || null,
            publicUrl: `${SITE_URL}/chronicles/${p.slug}`,
            publishedAt: p.published_at,
          }),
        )
      })(),
    )
  }

  const results = await Promise.all(tasks)
  const merged = results.flat()
  // Sort newest first across all sources.
  merged.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return tb - ta
  })
  return merged
}

export { CATEGORY_LABELS }
