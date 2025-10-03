import { Suspense } from "react"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"
<<<<<<< HEAD
=======
import { DailyPoemModal } from "@/components/daily-poem-modal"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

export default function HomePage() {
  return (
    <div className="whispr-gradient min-h-screen">
<<<<<<< HEAD
=======
      <DailyPoemModal />
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
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
