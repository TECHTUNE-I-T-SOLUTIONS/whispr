import { AboutHero } from "@/components/about-hero"
import { AboutContent } from "@/components/about-content"
import { AboutStats } from "@/components/about-stats"
import { metadata } from "./metadata"
import { AdsterraBanner } from "@/components/AdsterraBanner"

  export default function AboutPage() {
    return (
      <div className="whispr-gradient min-h-screen w-full">
        <AboutHero />
        <AboutStats />
        <AboutContent />
        {/* Adsterra banners below main content */}
        <AdsterraBanner />
      </div>
    );
  }
