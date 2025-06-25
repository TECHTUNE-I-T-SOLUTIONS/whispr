import { AboutHero } from "@/components/about-hero"
import { AboutContent } from "@/components/about-content"
import { AboutStats } from "@/components/about-stats"

export const metadata = {
  title: "About Prayce - Whispr | Meet the Writer & Poet",
  description:
    "Learn about Prayce, the talented writer and poet behind Whispr, her journey with words, and her passion for capturing life's quiet moments.",
}

export default function AboutPage() {
  return (
    <div className="whispr-gradient min-h-screen">
      <AboutHero />
      <AboutContent />
      <AboutStats />
    </div>
  )
}
