import type { Metadata } from "next"
import { buildMetadata } from "@/lib/seo"

// page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = buildMetadata({
  title: "Creator Tools & Features",
  description:
    "Every tool a writer needs on Whispr: browser editor, AI writing assistant, copyright fingerprinting, audio recital, analytics, serialized stories, push notifications and more.",
  path: "/features",
  keywords: [
    "writing platform features",
    "poetry editor online",
    "copyright protection for writers",
    "AI writing assistant for poets",
  ],
})

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children
}
