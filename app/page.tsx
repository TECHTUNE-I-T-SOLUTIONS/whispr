import { Suspense } from "react"
import { CookieConsentModal } from "@/components/CookieConsentModal"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"
import { DailyPoemModal } from "@/components/daily-poem-modal"
import { AdsterraBanner } from "@/components/AdsterraBanner"
import { ChroniclesFeatureSection } from "@/components/chronicles-feature-section"

export default function HomePage() {

  return (
    <div className="whispr-gradient min-h-screen">
      {/* Cookie Consent Modal */}
      <Suspense fallback={null}>
        <CookieConsentModal />
      </Suspense>
      <DailyPoemModal />
      <HeroSection />

      {/* Chronicles Feature Section */}
      <ChroniclesFeatureSection />

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


