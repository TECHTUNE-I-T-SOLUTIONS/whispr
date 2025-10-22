import { Suspense, useEffect, useRef } from "react"
import { FeaturedPosts } from "@/components/featured-posts"
import { RecentPosts } from "@/components/recent-posts"
import { HeroSection } from "@/components/hero-section"
import { DailyPoemModal } from "@/components/daily-poem-modal"

export default function HomePage() {
  const adRef1 = useRef<HTMLDivElement>(null)
  const adRef2 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Adsterra iframe banner
    if (adRef1.current) {
      const script1 = document.createElement('script');
      script1.type = 'text/javascript';
      script1.innerHTML = `
        atOptions = {
          'key' : 'cf4f74123f08a93fa2b9c21405fb0da4',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      adRef1.current.appendChild(script1);
      const script2 = document.createElement('script');
      script2.type = 'text/javascript';
      script2.src = 'https://www.highperformanceformat.com/cf4f74123f08a93fa2b9c21405fb0da4/invoke.js';
      adRef1.current.appendChild(script2);
    }
    // Adsterra async banner
    if (adRef2.current) {
      const script3 = document.createElement('script');
      script3.async = true;
      script3.setAttribute('data-cfasync', 'false');
      script3.src = 'https://pl27902130.effectivegatecpm.com/595afd21b56559223443ca3b653978bd/invoke.js';
      adRef2.current.appendChild(script3);
      const div = document.createElement('div');
      div.id = 'container-595afd21b56559223443ca3b653978bd';
      adRef2.current.appendChild(div);
    }
  }, [])

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

      {/* Adsterra banners below main content */}
      <div className="flex flex-col items-center gap-6 py-8">
        <div ref={adRef1} />
        <div ref={adRef2} />
      </div>
    </div>
  )
}

