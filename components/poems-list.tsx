import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Calendar, PenTool } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type Poem = {
  id: string
  title: string
  content: string
  excerpt?: string
  type: "poem" | "blog"
  status: "draft" | "published" | "archived"
  admin_id?: string
  featured?: boolean
  reading_time?: number
  tags?: string[]
  media_files?: any
  seo_title?: string
  seo_description?: string
  slug?: string
  view_count?: number
  created_at?: string
  updated_at?: string
  published_at?: string
  admin?: {
    full_name?: string
    username?: string
    avatar_url?: string
  }
}

interface PoemsListProps {
  poems: Poem[]
}

export const PoemsList: React.FC<PoemsListProps> = ({ poems }) => {
  if (!poems.length) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
            <PenTool className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-serif font-semibold mb-2">No poems yet</h3>
          <p className="text-muted-foreground">Words are forming... Soon, verses will be whispered.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">All Poems</h2>
        <p className="text-muted-foreground">
          {poems.length} {poems.length === 1 ? "poem" : "poems"} in Whispr's whispering vault
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {poems.map((poem, index) => (
          <Card
            key={poem.id}
            className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="bg-secondary/50">
                  ✨ Poem
                </Badge>
                {poem.featured && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">⭐ Featured</Badge>
                )}
              </div>
              <h3 className="font-serif text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {poem.title}
              </h3>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                {poem.excerpt || poem.content.replace(/<[^>]*>/g, '').trim().substring(0, 150)}
              </p>

              {poem.tags && poem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {poem.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {poem.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{poem.tags.length - 3} more</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {poem.admin?.full_name || poem.admin?.username || "Whispr"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {poem.reading_time || 2}m
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {poem.created_at
                    ? formatDistanceToNow(new Date(poem.created_at), { addSuffix: true })
                    : "Recently"}
                </div>
              </div>

              <Link
                href={`/poems/${poem.id}`}
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
