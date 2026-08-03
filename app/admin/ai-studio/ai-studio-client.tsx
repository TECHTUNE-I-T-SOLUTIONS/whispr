"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Sparkles,
  Loader2,
  Wand2,
  ImageIcon,
  Upload,
  Search,
  Volume2,
  Film,
  Download,
  Check,
  RefreshCw,
  Library,
  PenLine,
  X,
} from "lucide-react"
import { renderVideo, type RenderScene, WHISPR_LOGO_URL } from "@/lib/video/canvas-renderer"
import type { VideoPlan, VideoScene, StockImage, StudioContentItem, ContentCategory } from "@/lib/services/video-studio"

const TTS_VOICES = [
  { id: "Kore", label: "Kore — firm, warm" },
  { id: "Puck", label: "Puck — upbeat" },
  { id: "Charon", label: "Charon — deep, calm" },
  { id: "Aoede", label: "Aoede — breezy" },
  { id: "Fenrir", label: "Fenrir — intense" },
  { id: "Leda", label: "Leda — youthful" },
]

// Category filter chips for the content picker.
const CATEGORY_FILTERS: { id: ContentCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "admin_poem", label: "Poems" },
  { id: "admin_blog", label: "Blog" },
  { id: "story", label: "Stories" },
  { id: "story_chapter", label: "Chapters" },
  { id: "chronicles_post", label: "Chronicles" },
]

// Route a remote image through our proxy so the canvas stays CORS-clean.
function proxied(url: string): string {
  if (url.startsWith("data:") || url.startsWith("blob:")) return url
  return `/api/admin/ai-studio/image-proxy?url=${encodeURIComponent(url)}`
}

type SceneState = VideoScene & {
  imageUrl: string | null // chosen background (proxied/data/blob), null = gradient
  isLogo?: boolean // render imageUrl as a centred Whispr logo, not a cover photo
}

export function AiStudioClient() {
  const { toast } = useToast()

  // ----- content picker -----
  const [pickerCategory, setPickerCategory] = useState<ContentCategory | "all">("all")
  const [pickerQuery, setPickerQuery] = useState("")
  const [pickerItems, setPickerItems] = useState<StudioContentItem[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [selected, setSelected] = useState<StudioContentItem | null>(null)
  const [manualMode, setManualMode] = useState(false)

  // ----- source content (auto-filled from selection, editable in manual mode) -----
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [contentType, setContentType] = useState("poem")
  const [content, setContent] = useState("")
  const [postUrl, setPostUrl] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [targetSeconds, setTargetSeconds] = useState(30)

  // ----- generated plan -----
  const [plan, setPlan] = useState<VideoPlan | null>(null)
  const [scenes, setScenes] = useState<SceneState[]>([])
  const [generating, setGenerating] = useState(false)

  // ----- image picker -----
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null)
  const [imgQuery, setImgQuery] = useState("")
  const [imgResults, setImgResults] = useState<StockImage[]>([])
  const [imgLoading, setImgLoading] = useState(false)
  const uploadRef = useRef<HTMLInputElement>(null)

  // ----- audio -----
  const [voice, setVoice] = useState("Kore")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState<number | null>(null)
  const [ttsLoading, setTtsLoading] = useState(false)

  // ----- render -----
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoExt, setVideoExt] = useState<"webm" | "mp4">("webm")

  // The narration is exactly the on-screen scene text (in order), so the words
  // heard always match the words shown. Hook/CTA are visual-only, not spoken.
  const narration = useMemo(() => {
    if (!plan) return ""
    return scenes
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(". ")
  }, [plan, scenes])

  const caption = useMemo(() => {
    if (!plan) return ""
    const link = postUrl.trim()
    const parts = [
      plan.caption,
      "",
      plan.outro?.cta || "Read the full piece on Whispr.",
      link ? `👉 ${link}` : "👉 Read more on Whispr",
      "",
      (plan.hashtags || []).join(" "),
    ]
    return parts.filter((p) => p !== undefined).join("\n")
  }, [plan, postUrl])

  // -------------------------------------------------------------------------
  // Content picker — fetch published content
  // -------------------------------------------------------------------------
  const loadContent = useCallback(async (category: ContentCategory | "all", q: string) => {
    setPickerLoading(true)
    try {
      const params = new URLSearchParams()
      if (category !== "all") params.set("category", category)
      if (q.trim()) params.set("q", q.trim())
      params.set("limit", "60")
      const res = await fetch(`/api/admin/ai-studio/content?${params.toString()}`)
      const j = await res.json()
      if (j.ok) setPickerItems(j.items)
      else throw new Error(j.error || "Failed to load content")
    } catch (e: any) {
      toast({ title: "Couldn't load content", description: e.message, variant: "destructive" })
    } finally {
      setPickerLoading(false)
    }
  }, [toast])

  // Initial + category-change load (search is debounced separately).
  useEffect(() => {
    void loadContent(pickerCategory, pickerQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerCategory])

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => void loadContent(pickerCategory, pickerQuery), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerQuery])

  const selectItem = useCallback((item: StudioContentItem) => {
    setSelected(item)
    setManualMode(false)
    setTitle(item.title)
    setAuthor(item.authorName)
    setContentType(item.contentType)
    setContent(item.content)
    setPostUrl(item.publicUrl)
    setCoverImageUrl(item.coverImageUrl)
    // reset any previous plan
    setPlan(null)
    setScenes([])
    setAudioUrl(null)
    setAudioDuration(null)
    setVideoUrl(null)
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(null)
    setManualMode(false)
    setTitle("")
    setAuthor("")
    setContent("")
    setPostUrl("")
    setCoverImageUrl(null)
    setPlan(null)
    setScenes([])
  }, [])

  const startManual = useCallback(() => {
    setSelected(null)
    setManualMode(true)
    setTitle("")
    setAuthor("")
    setContent("")
    setPostUrl("")
    setCoverImageUrl(null)
    setContentType("poem")
    setPlan(null)
    setScenes([])
  }, [])

  // -------------------------------------------------------------------------
  // Generate plan
  // -------------------------------------------------------------------------
  const generate = useCallback(async () => {
    if (content.trim().length < 20) {
      toast({ title: "Add more content", description: "Pick a piece with at least a few lines of text.", variant: "destructive" })
      return
    }
    setGenerating(true)
    setVideoUrl(null)
    try {
      const res = await fetch("/api/admin/ai-studio/video-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, contentType, authorName: author, postUrl, targetSeconds }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed to generate")
      const p: VideoPlan = j.plan
      setPlan(p)
      // Seed each scene with the piece's cover image as a sensible default background.
      const defaultBg = coverImageUrl ? proxied(coverImageUrl) : null
      setScenes(p.scenes.map((s) => ({ ...s, imageUrl: defaultBg })))
      setAudioUrl(null)
      setAudioDuration(null)
      toast({ title: "Plan ready", description: `${p.scenes.length} scenes generated.` })
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }, [content, title, author, contentType, postUrl, targetSeconds, coverImageUrl, toast])

  // -------------------------------------------------------------------------
  // Image picker
  // -------------------------------------------------------------------------
  const openPicker = useCallback((sceneIdx: number) => {
    setPickerOpenFor(sceneIdx)
    const kws = scenes[sceneIdx]?.imageKeywords || []
    const q = kws.join(" ") || title || "literature"
    setImgQuery(q)
    void runImageSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes, title])

  async function runImageSearch(q: string) {
    setImgLoading(true)
    try {
      const res = await fetch(`/api/admin/ai-studio/images?q=${encodeURIComponent(q)}&limit=18`)
      const j = await res.json()
      if (j.ok) setImgResults(j.images)
    } catch {
      /* ignore */
    } finally {
      setImgLoading(false)
    }
  }

  function chooseImage(sceneIdx: number, url: string) {
    setScenes((prev) => prev.map((s, i) => (i === sceneIdx ? { ...s, imageUrl: url ? proxied(url) : null, isLogo: false } : s)))
    setPickerOpenFor(null)
  }

  function chooseLogo(sceneIdx: number) {
    setScenes((prev) => prev.map((s, i) => (i === sceneIdx ? { ...s, imageUrl: WHISPR_LOGO_URL, isLogo: true } : s)))
    setPickerOpenFor(null)
  }

  function onUpload(sceneIdx: number, file: File) {
    const url = URL.createObjectURL(file)
    setScenes((prev) => prev.map((s, i) => (i === sceneIdx ? { ...s, imageUrl: url, isLogo: false } : s)))
    setPickerOpenFor(null)
  }

  function applyCoverToAll() {
    if (!coverImageUrl) return
    const bg = proxied(coverImageUrl)
    setScenes((prev) => prev.map((s) => ({ ...s, imageUrl: bg, isLogo: false })))
    toast({ title: "Cover applied", description: "Piece cover set as background for every scene." })
  }

  function updateSceneText(idx: number, text: string) {
    setScenes((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)))
  }
  function updateSceneDuration(idx: number, durationSec: number) {
    setScenes((prev) => prev.map((s, i) => (i === idx ? { ...s, durationSec } : s)))
  }

  // -------------------------------------------------------------------------
  // TTS
  // -------------------------------------------------------------------------
  const generateAudio = useCallback(async () => {
    if (!narration.trim()) return
    setTtsLoading(true)
    try {
      const res = await fetch("/api/admin/ai-studio/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: narration, voice }),
      })
      const j = await res.json()
      if (!res.ok || !j.ok) throw new Error(j.error || "TTS failed")
      setAudioUrl(j.audio)
      // Measure the real narration length so the UI duration matches the render.
      try {
        const probe = new Audio()
        probe.src = j.audio
        probe.addEventListener(
          "loadedmetadata",
          () => {
            if (Number.isFinite(probe.duration) && probe.duration > 0) setAudioDuration(probe.duration)
          },
          { once: true },
        )
      } catch {
        /* ignore probe failure */
      }
      toast({ title: "Voiceover ready", description: "Narration generated with Gemini TTS." })
    } catch (e: any) {
      toast({ title: "Voiceover failed", description: e.message, variant: "destructive" })
    } finally {
      setTtsLoading(false)
    }
  }, [narration, voice, toast])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const doRender = useCallback(async () => {
    if (!plan || !scenes.length) return
    setRendering(true)
    setRenderProgress(0)
    setVideoUrl(null)
    try {
      const renderScenes: RenderScene[] = scenes.map((s) => ({
        text: s.text,
        imageUrl: s.imageUrl,
        durationSec: s.durationSec,
        logo: s.isLogo,
      }))
      const { blob } = await renderVideo(renderScenes, {
        audioUrl,
        outro: plan.outro,
        brand: "Whispr",
        onProgress: (f) => setRenderProgress(Math.round(f * 100)),
      })
      const url = URL.createObjectURL(blob)
      setVideoUrl(url)
      setVideoExt("webm")
      toast({ title: "Video rendered", description: "Preview below. Download when happy." })
    } catch (e: any) {
      toast({ title: "Render failed", description: e.message, variant: "destructive" })
    } finally {
      setRendering(false)
    }
  }, [plan, scenes, audioUrl, toast])

  function copyCaption() {
    navigator.clipboard.writeText(caption)
    toast({ title: "Caption copied" })
  }

  // When a voiceover exists, the render follows its real length; otherwise the
  // planned scene durations. Keep the header estimate honest either way.
  const totalDuration = useMemo(() => {
    const outro = plan?.outro ? 3 : 0
    if (audioDuration && audioDuration > 0) return Math.round(audioDuration + 0.4 + outro)
    return Math.round(scenes.reduce((a, s) => a + s.durationSec, 0) + outro)
  }, [scenes, plan, audioDuration])

  const hasSource = manualMode || !!selected

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,400px)_1fr]">
      {/* ---------------- LEFT: pick content + settings ---------------- */}
      <div className="space-y-4">
        {/* Content picker */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Library className="h-4 w-4 text-primary" /> Choose content
            </div>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={startManual}>
              <PenLine className="h-3.5 w-3.5" /> Manual
            </Button>
          </div>

          {/* category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_FILTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setPickerCategory(c.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  pickerCategory === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Search by title…"
              className="h-9 pl-8"
            />
          </div>

          {/* results list */}
          <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
            {pickerLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : pickerItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No published content found.</div>
            ) : (
              pickerItems.map((item) => {
                const active = selected?.id === item.id && selected?.category === item.category
                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    onClick={() => selectItem(item)}
                    className={`flex w-full items-start gap-2.5 rounded-lg border p-2 text-left transition-colors ${
                      active ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-muted"
                    }`}
                  >
                    <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                      {item.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-4 w-4" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{item.title}</span>
                        {active && <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{item.categoryLabel}</Badge>
                        <span className="truncate text-[11px] text-muted-foreground">{item.authorName}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{item.excerpt}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* Selected / manual source summary + settings */}
        {hasSource && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> {manualMode ? "Manual entry" : "Selected piece"}
              </div>
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" /> Clear
              </Button>
            </div>

            {manualMode ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Piece title" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Author</Label>
                    <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Writer" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="poem">Poem</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                        <SelectItem value="blog">Blog</SelectItem>
                        <SelectItem value="chronicle">Chronicle</SelectItem>
                        <SelectItem value="spoken-word">Spoken word</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Content</Label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={7}
                    placeholder="Paste the poem or story here. The AI only uses a teaser — never the full text."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Post link (for caption)</Label>
                  <Input value={postUrl} onChange={(e) => setPostUrl(e.target.value)} placeholder="https://whisprwords.com/poems/slug" />
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                  {coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-5 w-5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-serif text-sm font-semibold leading-tight">{title}</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{selected?.categoryLabel}</Badge>
                    <span className="text-[11px] text-muted-foreground">{author}</span>
                  </div>
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-[11px] text-primary hover:underline"
                  >
                    {postUrl}
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs flex justify-between">
                <span>Target length</span>
                <span className="text-muted-foreground">{targetSeconds}s</span>
              </Label>
              <Slider min={15} max={60} step={5} value={[targetSeconds]} onValueChange={(v) => setTargetSeconds(v[0])} />
            </div>
            <Button onClick={generate} disabled={generating} className="w-full gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {generating ? "Generating…" : plan ? "Regenerate plan" : "Generate video plan"}
            </Button>
          </Card>
        )}

        {plan && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Volume2 className="h-4 w-4 text-primary" /> Voiceover (Gemini TTS)
            </div>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TTS_VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={generateAudio} disabled={ttsLoading} variant="secondary" className="w-full gap-2">
              {ttsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              {audioUrl ? "Regenerate voiceover" : "Generate voiceover"}
            </Button>
            {audioUrl && <audio controls src={audioUrl} className="w-full" />}
            <p className="text-[11px] text-muted-foreground">
              {audioDuration
                ? `Narration is ${audioDuration.toFixed(1)}s — the video auto-syncs each scene to the words spoken.`
                : "The voiceover reads the on-screen scene text word-for-word, and the video length follows the narration."}
            </p>
          </Card>
        )}
      </div>

      {/* ---------------- RIGHT: scenes + render ---------------- */}
      <div className="space-y-4">
        {!plan ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground sm:p-12">
            <Film className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm max-w-sm">
              Pick a poem, story or chronicle from the list on the left and generate a plan. You'll then choose
              backgrounds, add narration and export — all free, right here in your browser.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-serif text-lg font-semibold">{plan.title}</div>
                  <div className="truncate text-xs text-muted-foreground italic">“{plan.hook}”</div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {coverImageUrl && (
                    <Button size="sm" variant="outline" className="hidden gap-1 text-xs sm:inline-flex" onClick={applyCoverToAll}>
                      <ImageIcon className="h-3.5 w-3.5" /> Cover to all
                    </Button>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Film className="h-3 w-3" /> ~{totalDuration}s
                  </Badge>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              {scenes.map((s, idx) => (
                <Card key={idx} className="p-3">
                  <div className="flex gap-3">
                    {/* thumbnail */}
                    <button
                      onClick={() => openPicker(idx)}
                      className="relative h-28 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted"
                      title="Choose background"
                    >
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.imageUrl}
                          alt=""
                          className={s.isLogo ? "h-full w-full bg-[#12081f] object-contain p-2" : "h-full w-full object-cover"}
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[10px] text-white">
                        Scene {idx + 1}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1 space-y-2">
                      <Textarea
                        value={s.text}
                        onChange={(e) => updateSceneText(idx, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex flex-1 items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-14">{s.durationSec.toFixed(0)}s</span>
                          <Slider
                            min={2}
                            max={8}
                            step={1}
                            value={[s.durationSec]}
                            onValueChange={(v) => updateSceneDuration(idx, v[0])}
                            className="flex-1"
                          />
                        </div>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => openPicker(idx)}>
                          <ImageIcon className="h-3.5 w-3.5" /> Background
                        </Button>
                      </div>
                      {s.imageKeywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.imageKeywords.map((k) => (
                            <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* inline image picker */}
                  {pickerOpenFor === idx && (
                    <div className="mt-3 rounded-md border bg-muted/30 p-3">
                      <div className="flex flex-wrap gap-2">
                        <div className="relative min-w-[160px] flex-1">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={imgQuery}
                            onChange={(e) => setImgQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && runImageSearch(imgQuery)}
                            placeholder="Search free images (no key needed)…"
                            className="h-9 pl-8"
                          />
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => runImageSearch(imgQuery)} disabled={imgLoading}>
                          {imgLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => uploadRef.current?.click()} className="gap-1">
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                        <input
                          ref={uploadRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => e.target.files?.[0] && onUpload(idx, e.target.files[0])}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                        <button
                          onClick={() => chooseImage(idx, "")}
                          className="flex aspect-[9/16] items-center justify-center rounded border border-dashed text-[10px] text-muted-foreground hover:bg-muted"
                          title="No image (gradient)"
                        >
                          None
                        </button>
                        <button
                          onClick={() => chooseLogo(idx)}
                          className="group relative flex aspect-[9/16] items-center justify-center overflow-hidden rounded border-2 border-primary/40 bg-[#12081f] hover:ring-2 hover:ring-primary"
                          title="Whispr logo on branded backdrop"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={WHISPR_LOGO_URL} alt="" className="h-3/5 w-3/5 object-contain" loading="lazy" />
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                            Logo
                          </span>
                        </button>
                        {coverImageUrl && (
                          <button
                            onClick={() => chooseImage(idx, coverImageUrl)}
                            className="group relative aspect-[9/16] overflow-hidden rounded border-2 border-primary/40 hover:ring-2 hover:ring-primary"
                            title="Piece cover"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coverImageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[9px] text-white">
                              Cover
                            </span>
                          </button>
                        )}
                        {imgResults.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => chooseImage(idx, img.fullUrl)}
                            className="group relative aspect-[9/16] overflow-hidden rounded border hover:ring-2 hover:ring-primary"
                            title={img.author ? `by ${img.author} (${img.provider})` : img.provider}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.thumbUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setPickerOpenFor(null)}>Close</Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* render + export */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Film className="h-4 w-4 text-primary" /> Render &amp; export
              </div>
              {rendering && (
                <div className="space-y-1">
                  <Progress value={renderProgress} />
                  <div className="text-xs text-muted-foreground text-center">Rendering in your browser… {renderProgress}%</div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button onClick={doRender} disabled={rendering} className="gap-2">
                  {rendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  {videoUrl ? "Re-render" : "Render video"}
                </Button>
                {videoUrl && (
                  <a href={videoUrl} download={`whispr-${(plan.title || "video").replace(/\s+/g, "-").toLowerCase()}.${videoExt}`}>
                    <Button variant="secondary" className="gap-2">
                      <Download className="h-4 w-4" /> Download .{videoExt}
                    </Button>
                  </a>
                )}
              </div>
              {videoUrl && (
                <video src={videoUrl} controls className="mx-auto max-h-[70vh] w-auto rounded-lg border" />
              )}
              <p className="text-[11px] text-muted-foreground">
                Exports as WebM (works on all social platforms via upload). Rendering uses your device — no server cost.
              </p>
            </Card>

            {/* caption */}
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RefreshCw className="h-4 w-4 text-primary" /> Post caption
                </div>
                <Button size="sm" variant="ghost" className="gap-1" onClick={copyCaption}>
                  <Check className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <Textarea readOnly value={caption} rows={6} className="text-sm" />
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
