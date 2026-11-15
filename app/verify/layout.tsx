import type { Metadata } from "next"
import { buildMetadata } from "@/lib/seo"

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = buildMetadata({
  title: "Verify a Piece — Authorship & Content Fingerprints",
  description:
    "Look up a Whispr article ID (WHP-XXXXXXXX) to confirm authorship, publication date, SHA-256 content fingerprint and version history for any poem or story.",
  path: "/verify",
  keywords: ["verify poem authorship", "content fingerprint", "copyright verification"],
})

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
