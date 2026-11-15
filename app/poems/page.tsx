import React, { Suspense } from "react"
import { PoemsHero } from "@/components/poems-hero"
import { PoemsList } from "@/components/poems-list"
import { createSupabaseServer } from "@/lib/supabase-server"
import { AdsterraBanner } from "@/components/AdsterraBanner"
import { JsonLd } from "@/components/json-ld"
import { absoluteUrl, clampText, plainText, breadcrumbJsonLd } from "@/lib/seo"

export const metadata = {  alternates: { canonical: "https://whisprwords.com/poems" },

  title: "Original Poems — Love, Loss, Healing & Hope",
  description: "Browse and read poems on Whispr",
}

export const revalidate = 60

async function getPoems() {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from("posts")
    .select("*, admin:admin_id(id, username, full_name, avatar_url)")
    .eq("status", "published")
    .eq("type", "poem")
    .order("created_at", { ascending: false })

  if (error || !data) return []

  return data
}

export default async function PoemsPage() {
  const poems = await getPoems();

  // CollectionPage + ItemList so search engines and AI answer engines can see
  // the full poem index in one hop, not just the rendered cards.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": absoluteUrl("/poems"),
    name: "Original Poems on Whispr",
    description:
      "Original poetry about love, loss, healing, faith and hope, published by independent poets on Whispr.",
    url: absoluteUrl("/poems"),
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: poems.length,
      itemListElement: poems.slice(0, 60).map((poem: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/poems/${poem.slug || poem.id}`),
        name: poem.title,
        description: clampText(plainText(poem.excerpt || poem.content), 120) || undefined,
      })),
    },
  }

  return (
    <div className="whispr-gradient min-h-screen">
      <JsonLd
        data={[
          collectionJsonLd,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Poems", path: "/poems" },
          ]),
        ]}
      />
      <PoemsHero />
      <section className="container py-16">
        <Suspense fallback={<PoemsListSkeleton />}>
          <PoemsList poems={poems} />
        </Suspense>
      </section>
      {/* Adsterra banners below main content */}
      <AdsterraBanner />
    </div>
  );
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
