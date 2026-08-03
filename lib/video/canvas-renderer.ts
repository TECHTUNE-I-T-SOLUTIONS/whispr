// Client-side video renderer — Canvas + MediaRecorder
// ---------------------------------------------------------------------------
// Renders the video ENTIRELY in the admin's browser. No server compute, no
// paid renderer, no license. Draws each scene as a Ken Burns image + animated
// text, mixes in the (optional) narration audio, and captures the canvas +
// audio into a single WebM blob via MediaRecorder.
//
// Duration: unrestricted (30-60s is fine). Output: WebM (VP8/9 + Opus).
// Optional MP4 transcode lives in ./mp4-transcode (lazy, only if installed).
// ---------------------------------------------------------------------------

export type RenderScene = {
  text: string
  imageUrl: string | null // already same-origin (proxied) or a data/blob URL
  durationSec: number
  logo?: boolean // draw imageUrl as a centred brand logo on a gradient, not cover-fit
}

export type RenderOptions = {
  width?: number
  height?: number
  fps?: number
  audioUrl?: string | null // data: or blob: URL of narration (WAV)
  outro?: { text: string; cta: string } | null
  brand?: string
  accent?: string // hex accent colour
  onProgress?: (fraction: number) => void
}

const DEFAULTS = { width: 1080, height: 1920, fps: 30, brand: "Whispr", accent: "#7c3aed" }

// Sentinel imageUrl meaning "use the Whispr logo on a branded backdrop".
// Same-origin public asset — never proxied, never taints the canvas.
export const WHISPR_LOGO_URL = "/lightlogo.png"

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = url
  })
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs="vp9,opus"',
    'video/webm;codecs="vp8,opus"',
    "video/webm",
  ]
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c
  }
  return "video/webm"
}

// Draw an image with a subtle Ken Burns zoom/pan, cover-fit to canvas.
function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  progress: number, // 0..1 within the scene
) {
  const zoomStart = 1.05
  const zoomEnd = 1.18
  const zoom = zoomStart + (zoomEnd - zoomStart) * progress
  const scale = Math.max(w / img.width, h / img.height) * zoom
  const dw = img.width * scale
  const dh = img.height * scale
  // slow diagonal pan
  const panX = (w - dw) / 2 - (dw - w) * 0.08 * (progress - 0.5)
  const panY = (h - dh) / 2 - (dh - h) * 0.08 * (progress - 0.5)
  ctx.drawImage(img, panX, panY, dw, dh)
}

function drawGradientOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, "rgba(0,0,0,0.35)")
  g.addColorStop(0.45, "rgba(0,0,0,0.15)")
  g.addColorStop(1, "rgba(0,0,0,0.75)")
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

// Word-wrap helper.
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// Draw a logo contained (never stretched) into the middle-upper area with a
// gentle fade + scale-in. Used for the brand/logo scene option.
function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, progress: number) {
  const appear = Math.min(1, progress / 0.3)
  const disappear = progress > 0.88 ? 1 - (progress - 0.88) / 0.12 : 1
  const alpha = Math.max(0, Math.min(1, appear * disappear))

  // Fit within a box ~55% width / 32% height, centred a bit above middle.
  const boxW = w * 0.55
  const boxH = h * 0.32
  const scale = Math.min(boxW / img.width, boxH / img.height) * (0.94 + 0.06 * appear)
  const dw = img.width * scale
  const dh = img.height * scale
  const cx = w / 2
  const cy = h * 0.4
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
  ctx.restore()
}

// Animated centre text: fade + slight rise, word-wrapped. `centerYFraction`
// sets the vertical centre (0..1 of height); defaults to 0.5.
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  progress: number,
  accent: string,
  centerYFraction = 0.5,
) {
  if (!text) return
  const fontSize = Math.round(w * 0.072)
  ctx.font = `700 ${fontSize}px Georgia, 'Times New Roman', serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  const maxWidth = w * 0.82
  const lines = wrapLines(ctx, text, maxWidth)
  const lineHeight = fontSize * 1.25

  // ease-in for first 25% of the scene, ease-out for last 12%
  const appear = Math.min(1, progress / 0.25)
  const disappear = progress > 0.88 ? 1 - (progress - 0.88) / 0.12 : 1
  const alpha = Math.max(0, Math.min(1, appear * disappear))
  const rise = (1 - appear) * fontSize * 0.6

  const totalH = lines.length * lineHeight
  const startY = h * centerYFraction - totalH / 2 + lineHeight / 2 + rise

  ctx.save()
  ctx.globalAlpha = alpha
  // accent bar above text
  ctx.fillStyle = accent
  ctx.fillRect(w / 2 - w * 0.06, startY - lineHeight, w * 0.12, Math.max(3, w * 0.006))

  ctx.shadowColor = "rgba(0,0,0,0.55)"
  ctx.shadowBlur = fontSize * 0.35
  ctx.fillStyle = "#ffffff"
  lines.forEach((ln, i) => ctx.fillText(ln, w / 2, startY + i * lineHeight))
  ctx.restore()
}

function drawBrand(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  brand: string,
  logo?: HTMLImageElement | null,
) {
  ctx.save()
  ctx.globalAlpha = 0.92
  const fontSize = Math.round(w * 0.032)
  ctx.font = `600 ${fontSize}px Georgia, serif`
  ctx.textBaseline = "middle"
  const y = h * 0.06

  const textW = ctx.measureText(brand).width
  const iconSize = fontSize * 1.35
  const gap = logo ? fontSize * 0.4 : 0
  const iconW = logo ? iconSize + gap : 0
  const totalW = iconW + textW
  const startX = w / 2 - totalW / 2

  // subtle shadow so the mark reads on any background
  ctx.shadowColor = "rgba(0,0,0,0.5)"
  ctx.shadowBlur = fontSize * 0.4

  if (logo) {
    ctx.drawImage(logo, startX, y - iconSize / 2, iconSize, iconSize)
  }
  ctx.textAlign = "left"
  ctx.fillStyle = "#ffffff"
  ctx.fillText(brand, startX + iconW, y)
  ctx.restore()
}

function drawOutro(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  outro: { text: string; cta: string },
  accent: string,
  brand: string,
  progress: number,
  logo?: HTMLImageElement | null,
) {
  ctx.fillStyle = "#0b0b12"
  ctx.fillRect(0, 0, w, h)
  const appear = Math.min(1, progress / 0.3)
  ctx.save()
  ctx.globalAlpha = appear
  ctx.textBaseline = "middle"

  // brand row: icon + wordmark, centred
  const brandFont = Math.round(w * 0.05)
  ctx.font = `700 ${brandFont}px Georgia, serif`
  const brandTextW = ctx.measureText(brand).width
  const iconSize = brandFont * 1.4
  const gap = logo ? brandFont * 0.4 : 0
  const iconW = logo ? iconSize + gap : 0
  const rowStartX = w / 2 - (iconW + brandTextW) / 2
  if (logo) ctx.drawImage(logo, rowStartX, h * 0.4 - iconSize / 2, iconSize, iconSize)
  ctx.textAlign = "left"
  ctx.fillStyle = accent
  ctx.fillText(brand, rowStartX + iconW, h * 0.4)

  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.font = `700 ${Math.round(w * 0.062)}px Georgia, serif`
  const lines = wrapLines(ctx, outro.text, w * 0.8)
  const lh = w * 0.078
  lines.forEach((ln, i) => ctx.fillText(ln, w / 2, h * 0.5 + i * lh))

  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.font = `500 ${Math.round(w * 0.036)}px Georgia, serif`
  ctx.fillText(outro.cta, w / 2, h * 0.68)
  ctx.restore()
}

export type RenderResult = { blob: Blob; mimeType: string; durationSec: number }

// Renders the full timeline in real time and returns a WebM blob.
export async function renderVideo(scenes: RenderScene[], options: RenderOptions = {}): Promise<RenderResult> {
  const opts = { ...DEFAULTS, ...options }
  const { width: w, height: h, fps } = opts
  const accent = opts.accent || DEFAULTS.accent

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D | null
  if (!ctx) throw new Error("Canvas 2D context unavailable")
  const c: CanvasRenderingContext2D = ctx

  // Preload scene images (null → gradient-only scene).
  const images = await Promise.all(
    scenes.map((s) => (s.imageUrl ? loadImage(s.imageUrl).catch(() => null) : Promise.resolve(null))),
  )

  // Preload the small brand mark shown next to the "Whispr" wordmark.
  const brandLogo = await loadImage(WHISPR_LOGO_URL).catch(() => null)

  // ----- audio wiring (loaded first so the timeline can follow its real length) -----
  let audioEl: HTMLAudioElement | null = null
  let audioCtx: AudioContext | null = null
  let destNode: MediaStreamAudioDestinationNode | null = null
  const canvasStream = canvas.captureStream(fps)
  let audioDuration = 0

  if (opts.audioUrl) {
    audioEl = new Audio()
    audioEl.src = opts.audioUrl
    audioEl.crossOrigin = "anonymous"
    await new Promise<void>((resolve) => {
      // Prefer metadata (gives duration fast); fall back to canplaythrough/error.
      audioEl!.addEventListener("loadedmetadata", () => resolve(), { once: true })
      audioEl!.addEventListener("canplaythrough", () => resolve(), { once: true })
      audioEl!.addEventListener("error", () => resolve(), { once: true })
      audioEl!.load()
    })
    const d = audioEl.duration
    if (Number.isFinite(d) && d > 0) audioDuration = d
    try {
      audioCtx = new AudioContext()
      const srcNode = audioCtx.createMediaElementSource(audioEl)
      destNode = audioCtx.createMediaStreamDestination()
      srcNode.connect(destNode)
      destNode.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t))
    } catch {
      // if audio graph fails, continue video-only
    }
  }

  // ----- timeline -----
  const OUTRO_SEC = opts.outro ? 3 : 0
  const rawSceneTimes = scenes.map((s) => Math.max(2, s.durationSec))
  const rawTotal = rawSceneTimes.reduce((a, b) => a + b, 0) || 1
  // When there's narration, scale the scenes so they span exactly the audio's
  // real duration — the words shown then always match the words being spoken.
  // A little tail (0.4s) keeps the last line from cutting off on its final word.
  const sceneSpan = audioDuration > 0 ? audioDuration + 0.4 : rawTotal
  const scaleFactor = sceneSpan / rawTotal
  const sceneTimes = rawSceneTimes.map((t) => t * scaleFactor)
  const totalSec = sceneTimes.reduce((a, b) => a + b, 0) + OUTRO_SEC

  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: 6_000_000 })
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data)

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
  })

  recorder.start(100)
  if (audioEl && audioCtx) {
    try {
      await audioCtx.resume()
      await audioEl.play()
    } catch {
      /* autoplay may fail silently; video still records */
    }
  }

  const startTs = performance.now()

  await new Promise<void>((resolve) => {
    function frame() {
      const elapsed = (performance.now() - startTs) / 1000
      if (elapsed >= totalSec) return resolve()

      // Find current scene.
      let acc = 0
      let idx = -1
      let sceneProgress = 0
      for (let i = 0; i < sceneTimes.length; i++) {
        if (elapsed < acc + sceneTimes[i]) {
          idx = i
          sceneProgress = (elapsed - acc) / sceneTimes[i]
          break
        }
        acc += sceneTimes[i]
      }

      c.fillStyle = "#000000"
      c.fillRect(0, 0, w, h)

      if (idx === -1) {
        // outro segment
        const outroProgress = (elapsed - acc) / Math.max(0.001, OUTRO_SEC)
        if (opts.outro) drawOutro(c, w, h, opts.outro, accent, opts.brand || "Whispr", outroProgress, brandLogo)
      } else {
        const img = images[idx]
        if (img && scenes[idx].logo) {
          // Branded logo scene: gradient backdrop + centred, contained logo.
          const g = c.createLinearGradient(0, 0, w, h)
          g.addColorStop(0, "#1a1030")
          g.addColorStop(1, "#0b0b12")
          c.fillStyle = g
          c.fillRect(0, 0, w, h)
          drawLogo(c, img, w, h, sceneProgress)
          drawText(c, scenes[idx].text, w, h, sceneProgress, accent, 0.72)
          drawBrand(c, w, h, opts.brand || "Whispr", brandLogo)
        } else if (img) {
          drawKenBurns(c, img, w, h, sceneProgress)
          drawGradientOverlay(c, w, h)
          drawText(c, scenes[idx].text, w, h, sceneProgress, accent)
          drawBrand(c, w, h, opts.brand || "Whispr", brandLogo)
        } else {
          const g = c.createLinearGradient(0, 0, w, h)
          g.addColorStop(0, "#1a1030")
          g.addColorStop(1, "#0b0b12")
          c.fillStyle = g
          c.fillRect(0, 0, w, h)
          drawGradientOverlay(c, w, h)
          drawText(c, scenes[idx].text, w, h, sceneProgress, accent)
          drawBrand(c, w, h, opts.brand || "Whispr", brandLogo)
        }
      }

      opts.onProgress?.(Math.min(1, elapsed / totalSec))
      requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  })

  recorder.stop()
  const blob = await done
  try {
    audioEl?.pause()
    await audioCtx?.close()
  } catch {
    /* ignore */
  }
  opts.onProgress?.(1)
  return { blob, mimeType, durationSec: totalSec }
}
