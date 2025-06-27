import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, User, ArrowRight } from "lucide-react"
import { createSupabaseServer } from "@/lib/supabase-server"

async function getRecentPosts() {
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from("posts")
      .select(`
        *,
        admin (
          full_name,
          username,
          avatar_url
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6)

    if (error) {
      console.error("Supabase error:", error.message)
      return []
    }

    return data?.map((post) => ({
      ...post,
      authors: {
        name: post.admin?.full_name || post.admin?.username || "Prayce",
      },
    })) || []
  } catch (err) {
    console.error("Error fetching recent posts:", err)
    return []
  }
}

export async function RecentPosts() {
  const posts = await getRecentPosts()

  if (!posts.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No recent posts available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-serif font-bold mb-4">Recent Whispers</h2>
        <p className="text-muted-foreground">Latest thoughts and musings from the quiet corners of creativity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post: any, index: number) => (
          <Card
            key={post.id}
            className="group hover:shadow-lg transition-all duration-300 animate-fade-in border-0 bg-card/30 backdrop-blur"
            style={{ animationDelay: `${index * 0.05}s` }}
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
              <h3 className="font-serif text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h3>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  {post.authors?.name}
                </div>
                <Link
                  href={`/${post.type === "poem" ? "poems" : "blog"}/${post.id}`}
                  className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                >
                  Read →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" className="bg-background text-foreground">
            <Link href="/blog">
              View All Blog Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-background text-foreground">
            <Link href="/poems">
              Explore All Poems
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
