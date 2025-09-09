import { Suspense } from "react"
import { SpokenWordsGallery } from "@/components/spoken-words-gallery"

export const metadata = {
  title: "Spoken Words - Whispr",
  description: "Browse and enjoy our collection of audio and video spoken words",
}

export default function MediaPage() {
  return (
    <div className="whispr-gradient min-h-screen">
      <div className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Spoken Words
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our collection of audio and video spoken words. Listen, watch, and download your favorites.
          </p>
        </div>

        <Suspense fallback={<SpokenWordsSkeleton />}>
          <SpokenWordsGallery />
        </Suspense>
      </div>
    </div>
  )
}

function SpokenWordsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted/50 aspect-video rounded-lg mb-4"></div>
            <div className="bg-muted/50 h-4 rounded mb-2"></div>
            <div className="bg-muted/50 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
