/**
 * One-off SEO normaliser.
 *
 * The audit found 174 URLs sharing duplicate page titles and no self-referencing
 * canonicals. This rewrites every static top-level page's metadata block so it
 * carries:
 *   - a single, unique, un-branded title (the root layout template adds "| Whispr")
 *   - a self-referencing canonical
 *
 * Run:  node scripts/seo-normalize-titles.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const APP = join(ROOT, "app")
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://whisprwords.com").replace(/\/$/, "")
const DRY = process.argv.includes("--dry")

const BRAND_SUFFIXES = [
  /\s*[|\-–—]\s*Whispr'?s?\s+(Thoughts\s*&\s*Musings|Poetry Collection|AI-Powered creative platform|Know about Whispr).*$/i,
  /\s*[|\-–—]\s*Know about Whispr.*$/i,
  /\s*[|\-–—]\s*Whispr\s*$/i,
  /\s*[|\-–—]\s*Creative Reading Platform\s*$/i,
]

const TITLE_OVERRIDES = {
  about: "About Whispr — a home for original poetry and stories",
  blog: "Writing Craft Blog — Essays on Poetry & Creative Process",
  changelog: "Changelog — What's New on Whispr",
  chronicles: "Chronicles — Creator Portfolios & Serialized Writing",
  community: "Community — Reader & Writer Discussions",
  download: "Download the Whispr App",
  "feature-requests": "Feature Requests — Help Shape Whispr",
  features: "Creator Tools & Features",
  media: "Spoken Words — Listen to Poems Read Aloud",
  opportunities: "Creative Opportunities for Writers & Artists",
  poems: "Original Poems — Love, Loss, Healing & Hope",
  privacy: "Privacy Policy",
  stories: "Whisper Stories — Serialized Fiction to Read Online",
  terms: "Terms of Service",
  trends: "Trending on Whispr — What Readers Are Reading",
  welcome: "Welcome to Whispr",
  "whispr-wall": "The Whispr Wall — Reader Notes & Whispers",
  "why-publish": "Why Publish on Whispr — Keep Your Copyright",
  verify: "Verify a Piece — Authorship & Content Fingerprints",
}

/** Locate `export const metadata = { ... }` and return its bounds. */
function findMetadataBlock(src) {
  const m = /export\s+const\s+metadata\s*(:\s*Metadata)?\s*=\s*\{/.exec(src)
  if (!m) return null
  const start = m.index + m[0].length
  let depth = 1
  for (let i = start; i < src.length; i++) {
    const ch = src[i]
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return { start, end: i, full: m.index }
    }
  }
  return null
}

function cleanTitle(raw) {
  let title = raw
  for (const re of BRAND_SUFFIXES) title = title.replace(re, "")
  return title.trim().replace(/\s+/g, " ")
}

const report = []

for (const seg of readdirSync(APP)) {
  const pagePath = join(APP, seg, "page.tsx")
  try {
    if (!statSync(pagePath).isFile()) continue
  } catch {
    continue
  }

  let src = readFileSync(pagePath, "utf8")
  const block = findMetadataBlock(src)
  if (!block) {
    report.push({ seg, status: "no metadata export — skipped" })
    continue
  }

  const inner = src.slice(block.start, block.end)
  const titleMatch = /(title\s*:\s*)(["'`])([\s\S]*?)\2/.exec(inner)
  const oldTitle = titleMatch ? titleMatch[3] : null

  // A title containing an escaped quote (e.g. Whispr\'s) defeats the simple
  // matcher — skip those and edit them by hand.
  if (oldTitle && oldTitle.endsWith("\\")) {
    report.push({ seg, status: "escaped quote in title — skipped" })
    continue
  }

  const desired = TITLE_OVERRIDES[seg]
  const hasCanonical = /alternates\s*:\s*\{[^}]*canonical/.test(inner) || /canonical\s*:/.test(inner)

  let next = inner

  if (titleMatch && desired) {
    next = next.replace(titleMatch[0], `${titleMatch[1]}${JSON.stringify(desired)}`)
  } else if (titleMatch && oldTitle) {
    const cleaned = cleanTitle(oldTitle)
    if (cleaned !== oldTitle) {
      next = next.replace(titleMatch[0], `${titleMatch[1]}${JSON.stringify(cleaned)}`)
    }
  }

  if (!hasCanonical) {
    const canonicalLine = `  alternates: { canonical: ${JSON.stringify(`${SITE_URL}/${seg}`)} },\n`
    next = `${canonicalLine}${next}`
  }

  if (next === inner) {
    report.push({ seg, status: "unchanged" })
    continue
  }

  src = src.slice(0, block.start) + next + src.slice(block.end)
  if (!DRY) writeFileSync(pagePath, src, "utf8")
  report.push({ seg, status: `title: ${JSON.stringify(oldTitle)} -> ${JSON.stringify(desired ?? cleanTitle(oldTitle ?? ""))}` })
}

for (const r of report) console.log(`${r.seg.padEnd(18)} ${r.status}`)
