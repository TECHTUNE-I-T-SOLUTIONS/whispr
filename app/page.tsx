import { Suspense } from "react"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"
import { DailyPoemModal } from "@/components/daily-poem-modal"

export default function HomePage() {
  return (
    <div className="whispr-gradient min-h-screen">
      <DailyPoemModal />
      <HeroSection />

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
    </div>
  )
}
