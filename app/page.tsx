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
import { ArrowRight, Sparkles, BookOpen, Wand2, Rocket, Search, Compass } from "lucide-react"

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

      {/* Whispering Stories Showcase Section */}
      <section className="container py-12 md:py-16">
        <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-indigo-950/20 via-background/90 to-purple-950/25 p-8 md:p-12 shadow-2xl backdrop-blur overflow-hidden">
          {/* Glowing ambient blobs */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary border border-primary/25">
              <BookOpen className="h-3.5 w-3.5 shrink-0" /> INTRODUCING MULTI-CHAPTER STORIES
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-slate-600 to-background  dark:bg-gradient-to-r dark:from-foreground dark:via-slate-100 dark:to-primary">
              Whisper Stories
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl mt-2">
              Embark on serialized journeys crafted by Whispr staff and community creators. Immerse yourself in our customized reading canvas with fixed chapter sequence navigators, reading speed estimation, and dark-ambient glass themes.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 max-w-xl">
              {[
                { label: "Fantasy", icon: <Wand2 className="h-4 w-4 text-amber-400 shrink-0" />, bg: "from-amber-500/10 to-amber-500/0 hover:border-amber-500/30" },
                { label: "Sci-Fi", icon: <Rocket className="h-4 w-4 text-blue-400 shrink-0" />, bg: "from-blue-500/10 to-blue-500/0 hover:border-blue-500/30" },
                { label: "Mystery", icon: <Search className="h-4 w-4 text-purple-400 shrink-0" />, bg: "from-purple-500/10 to-purple-500/0 hover:border-purple-500/30" },
                { label: "Adventure", icon: <Compass className="h-4 w-4 text-emerald-400 shrink-0" />, bg: "from-emerald-500/10 to-emerald-500/0 hover:border-emerald-500/30" }
              ].map((genre, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border border-border/20 bg-gradient-to-b ${genre.bg} text-center text-xs font-semibold hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-1.5`}>
                  {genre.icon}
                  <span>{genre.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 flex flex-wrap gap-4">
              <Button asChild className="bg-primary hover:bg-primary/95 text-white px-6 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-1.5 transition-transform duration-300 hover:scale-[1.03]">
                <Link href="/stories">
                  Explore Stories Hub <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

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