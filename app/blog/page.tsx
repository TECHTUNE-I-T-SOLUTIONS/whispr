import { Suspense } from "react"
import { BlogList } from "@/components/blog-list"
import { BlogHero } from "@/components/blog-hero"

export const metadata = {
  title: "Blog - Whispr | Prayce's Thoughts & Musings",
  description:
    "Explore Prayce's collection of thoughtful blog posts about writing, creativity, and life's quiet moments.",
}

export default function BlogPage() {
  return (
    <div className="whispr-gradient min-h-screen">
      <BlogHero />
      <section className="container py-16">
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </section>
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
