import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, PenTool } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createSupabaseServer } from "@/lib/supabase-server"

async function getBlogPosts() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        admin (
          full_name,
          username
        )
      `)
      .eq("status", "published")
      .eq("type", "blog")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) {
      console.error("Supabase error (blog posts):", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching blog posts:", error)
    return []
  }
}

export async function BlogList() {
  const posts = await getBlogPosts()

  if (!posts.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-serif font-semibold mb-2">No blog posts yet</h3>
          <p className="text-muted-foreground">Whispr's thoughts are taking shape. Soon, whispers will become words.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">All Blog Posts</h2>
        <p className="text-muted-foreground">
          {posts.length} {posts.length === 1 ? "post" : "posts"} sharing Whispr's insights and musings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post: any, index: number) => (
          <Card
            key={post.id}
            className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-secondary/50">
                  📝 Blog
                </Badge>
                {post.featured && <Badge className="bg-primary/10 text-primary border-primary/20">⭐ Featured</Badge>}
              </div>
              <h3 className="font-serif text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{post.excerpt}</p>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{post.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.admin?.username ?? post.admin?.full_name ?? "Unknown"}
                    </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.reading_time || 5}m
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : "Recently"}
                </div>
              </div>

              <Link
                href={`/blog/${post.id}`}
                className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors group-hover:translate-x-1 transform"
              >
                Read more →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
