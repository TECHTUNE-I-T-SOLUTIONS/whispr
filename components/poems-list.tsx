import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Heart, Calendar, Sparkles } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Feather } from "lucide-react"

async function getPoems() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/posts?type=poem`, {
      cache: "no-store",
    })

    if (!response.ok) {
      console.error("Failed to fetch poems:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching poems:", error)
    return []
  }
}

export async function PoemsList() {
  const poems = await getPoems()

  if (!poems.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <Feather className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-serif font-semibold mb-2">No poems yet</h3>
          <p className="text-muted-foreground">Prayce's verses are taking shape. Soon, whispers will become words.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">All Poems</h2>
        <p className="text-muted-foreground">
          {poems.length} {poems.length === 1 ? "verse" : "verses"} whispered into existence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {poems.map((poem: any, index: number) => (
          <Card
            key={poem.id}
            className="group hover:shadow-2xl transition-all duration-500 animate-slide-up border-0 bg-gradient-to-br from-card/60 via-card/40 to-card/60 backdrop-blur hover:from-card/80 hover:via-card/60 hover:to-card/80 overflow-hidden"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <CardHeader className="pb-4 relative">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>

              <div className="flex items-center justify-between mb-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">✨ Poem</Badge>
                {poem.featured && (
                  <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              <h3 className="font-serif text-2xl font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                {poem.title}
              </h3>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="relative">
                <div className="poem-preview bg-muted/20 p-4 rounded-lg border-l-4 border-primary/30">
                  <p className="font-serif text-muted-foreground italic leading-relaxed line-clamp-4 text-sm">
                    {poem.excerpt}
                  </p>
                </div>
                <div className="absolute -top-2 -left-2 text-primary/20 text-4xl font-serif">"</div>
                <div className="absolute -bottom-2 -right-2 text-primary/20 text-4xl font-serif rotate-180">"</div>
              </div>

              {poem.tags && poem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {poem.tags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs bg-primary/5 text-primary px-2 py-1 rounded-full border border-primary/10"
                    >
                      <Heart className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                  {poem.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground italic">+{poem.tags.length - 3} more themes</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span className="font-serif italic">by</span>
                    <span className="font-medium">Prayce</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {poem.reading_time || 2}m read
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {poem.created_at ? formatDistanceToNow(new Date(poem.created_at), { addSuffix: true }) : "Recently"}
                </div>
              </div>

              <Link
                href={`/poems/${poem.id}`}
                className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-all duration-200 group-hover:translate-x-2 transform font-serif"
              >
                Read the full verse →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
