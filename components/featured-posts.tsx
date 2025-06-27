import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User } from "lucide-react"

async function getFeaturedPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}/api/posts?featured=true&limit=3`, {
    next: { revalidate: 60 },
  })

    if (!response.ok) {
      console.error("Failed to fetch featured posts:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error("Error fetching featured posts:", error)
    return []
  }
}

export async function FeaturedPosts() {
  const posts = await getFeaturedPosts()

  if (!posts.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No featured posts available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">Featured</h2>
        <p className="text-muted-foreground">Highlighted pieces that capture the essence of whispered thoughts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any, index: number) => (
          <Card
            key={post.id}
            className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant={post.type === "poem" ? "default" : "secondary"}
                  className={post.type === "poem" ? "bg-primary/10 text-primary" : ""}
                >
                  {post.type === "poem" ? "✨ Poem" : "📝 Blog"}
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {post.reading_time || 5}m
                </div>
              </div>
              <h3 className="font-serif text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  {post.authors?.name || "Prayce"}
                </div>
                <Link
                  href={`/${post.type === "poem" ? "poems" : "blog"}/${post.id}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  Read {post.type === "poem" ? "poem" : "more"} →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
