import { AboutHero } from "@/components/about-hero"
import { AboutContent } from "@/components/about-content"
import { AboutStats } from "@/components/about-stats"
import { AdsterraBanner } from "@/components/AdsterraBanner"

// metadata here
export const metadata = {  alternates: { canonical: "https://whisprwords.com/about" },

  title: "About Whispr — a home for original poetry and stories",
  description:
    "Learn about Whispr, the innovative platform for sharing stories and experiences, and discover what makes it special.",
}

// then the page's body
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
