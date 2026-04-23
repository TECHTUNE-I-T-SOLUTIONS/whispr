import type { Metadata } from "next"
import { CommunityClient } from "./community-client"

export const metadata: Metadata = {
  title: "Community — Whispr",
  description:
    "Lodge a complaint, ask a question or share a suggestion. Search existing issues first — our team replies quickly. No account required.",
}

export const dynamic = "force-dynamic"

export default function CommunityPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <header className="mb-8 sm:mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Community Help Centre
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            How can we help?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Search the community first — chances are someone has already raised a similar issue and our team has
            answered. If not, lodge a new one in seconds. No account required.
          </p>
        </header>

        <CommunityClient />
      </div>
    </div>
  )
}
