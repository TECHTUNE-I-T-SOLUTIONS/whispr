import { Suspense } from "react"
import Link from "next/link"
import { CookieConsentModal } from "@/components/CookieConsentModal"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"
import DailyPoemModal from "@/components/daily-poem-modal"
import { AdsterraBanner } from "@/components/AdsterraBanner"
import { ChroniclesFeatureSection } from "@/components/chronicles-feature-section"
import { AIIntroductorySection } from "@/components/ai-introductory-section"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export default function HomePage() {

  return (
    <div className="whispr-gradient min-h-screen">
      {/* Cookie Consent Modal */}
      <Suspense fallback={null}>
        <CookieConsentModal />
      </Suspense>
      <DailyPoemModal />
      <HeroSection />

      {/* AI Introductory Section */}
      <AIIntroductorySection />

      {/* Chronicles Feature Section */}
      <ChroniclesFeatureSection />

      <section className="container py-10">
        <div className="rounded-3xl border border-border/60 bg-background/80 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" /> New on Whispr
              </div>
              <h2 className="text-3xl font-serif font-bold">Browse creative opportunities built for writers and artists.</h2>
              <p className="text-muted-foreground">
                Explore curated jobs, grants, residencies, commissions, and calls for submissions in one place.
              </p>
            </div>

            <Button asChild className="w-fit">
              <Link href="/opportunities">
                View opportunities <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <Suspense fallback={<div>Loading featured content...</div>}>
          <FeaturedPosts />
        </Suspense>
      </section>

      <section className="container py-16">
        <Suspense fallback={<div>Loading recent posts...</div>}>
          <RecentPosts />
        </Suspense>
      </section>

      {/* Adsterra banners below main content */}
      <AdsterraBanner />
    </div>
  );
}