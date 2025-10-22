import { Suspense, useEffect, useRef } from "react"
import { BlogList } from "@/components/blog-list"
import { BlogHero } from "@/components/blog-hero"

export const metadata = {
  title: "Blog - Whispr | Prayce's Thoughts & Musings",
  description:
    "Explore Prayce's collection of thoughtful blog posts about writing, creativity, and life's quiet moments.",
}

export default function BlogPage() {
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
      <BlogHero />
      <section className="container py-16">
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
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

function BlogListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted/50 h-48 rounded-lg mb-4"></div>
          <div className="bg-muted/50 h-4 rounded mb-2"></div>
          <div className="bg-muted/50 h-4 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}
