import type { Metadata } from "next"
import Link from "next/link"
import { Lightbulb, ArrowRight } from "lucide-react"
import { CommunityClient } from "./community-client"
import { PinnedFeatureRequests } from "./pinned-feature-requests"

export const metadata: Metadata = {
  title: "Community — Whispr",
  description:
    "Lodge a complaint, ask a question or share a suggestion. Search existing issues first — our team replies quickly. No account required.",
}

export const dynamic = "force-dynamic"

export default async function CommunityPage() {
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

        {/* Feature request cross-link */}
        <Link
          href="/feature-requests"
          className="group mb-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 transition hover:border-primary/40 hover:bg-primary/10 sm:mb-8"
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lightbulb className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Have an idea for a new feature?</span>
            <span className="block text-xs text-muted-foreground sm:text-sm">
              Request features, suggest improvements and vote on ideas from the community.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition group-hover:translate-x-0.5" />
        </Link>

        {/* Admin-pinned feature requests preview */}
        <PinnedFeatureRequests />

        <CommunityClient />
      </div>
    </div>
  )
}
