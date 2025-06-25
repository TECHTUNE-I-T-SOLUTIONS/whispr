import { Suspense } from "react"
import { PoemsList } from "@/components/poems-list"
import { PoemsHero } from "@/components/poems-hero"

export const metadata = {
  title: "Poems - Whispr | Prayce's Poetry Collection",
  description:
    "Discover Prayce's beautiful collection of poems that capture emotions, moments, and whispered thoughts in verse.",
}

export default function PoemsPage() {
  return (
    <div className="whispr-gradient min-h-screen">
      <PoemsHero />
      <section className="container py-16">
        <Suspense fallback={<PoemsListSkeleton />}>
          <PoemsList />
        </Suspense>
      </section>
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
