import { Suspense } from "react"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"

export default function HomePage() {
  return (
    <div className="whispr-gradient min-h-screen">
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
