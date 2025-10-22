import React, { Suspense, useEffect, useRef } from "react"
import { PoemsHero } from "@/components/poems-hero"
import { PoemsList } from "@/components/poems-list"
import { createSupabaseServer } from "@/lib/supabase-server"

export const metadata = {
  title: "Poems - Whispr | Prayce's Poetry Collection",
  description:
    "Discover Prayce's beautiful collection of poems that capture emotions, moments, and whispered thoughts in verse.",
}

async function getPoems() {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .eq("type", "poem")
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data
}

export default function PoemsPage() {
  const adRef1 = useRef<HTMLDivElement>(null)
  const adRef2 = useRef<HTMLDivElement>(null)
  const [poems, setPoems] = React.useState<any[]>([])

  useEffect(() => {
    // Fetch poems client-side
    (async () => {
      const res = await fetch('/api/poems')
      const data = await res.json()
      setPoems(data)
    })()
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
      <PoemsHero />
      <section className="container py-16">
        <Suspense fallback={<PoemsListSkeleton />}>
          <PoemsList poems={poems} />
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

function PoemsListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted/50 h-64 rounded-lg mb-4"></div>
          <div className="bg-muted/50 h-4 rounded mb-2"></div>
          <div className="bg-muted/50 h-4 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )
}
