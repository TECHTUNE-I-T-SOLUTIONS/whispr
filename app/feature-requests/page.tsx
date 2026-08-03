import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FeatureRequestsClient } from "./feature-requests-client"

export const metadata: Metadata = {
  title: "Feature Requests — Whispr",
  description:
    "Suggest a feature, request an improvement, or vote on ideas from the Whispr community. No account required — help shape what we build next.",
}

export const dynamic = "force-dynamic"

export default function FeatureRequestsPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />
      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <header className="mb-8 sm:mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Shape the future of Whispr
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Request a feature
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Have an idea that would make Whispr better? Share it, browse what others have suggested, and upvote the ones
            you love. Our team reviews every request. No account required.
          </p>
          <div className="mt-5 flex items-center justify-center gap-4 text-sm">
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Link>
          </div>
        </header>

        <FeatureRequestsClient />
      </div>
    </div>
  )
}
