import Link from "next/link"
import Image from "next/image"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getPublishedStories, getTopHashtags } from "@/lib/stories"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Flame, BookOpen, Clock, Heart, Eye, MessageSquare, Tag, PenTool, Sparkles, Wand2, Rocket, Compass, Zap, Theater, Landmark, Shield, Smile } from "lucide-react"

interface StoriesPageProps {
  searchParams: Promise<{
    genre?: string
    tag?: string
    search?: string
    sort?: "latest" | "likes" | "views"
  }>
}

const GENRES = [
  { value: "all", label: "All Genres", icon: "Sparkles" },
  { value: "Fantasy", label: "Fantasy", icon: "Wand2" },
  { value: "Sci-Fi", label: "Sci-Fi", icon: "Rocket" },
  { value: "Romance", label: "Romance", icon: "Heart" },
  { value: "Mystery", label: "Mystery", icon: "Search" },
  { value: "Adventure", label: "Adventure", icon: "Compass" },
  { value: "Comedy", label: "Comedy", icon: "Smile" },
  { value: "Thriller", label: "Thriller", icon: "Zap" },
  { value: "Drama", label: "Drama", icon: "Theater" },
  { value: "Historical Fiction", label: "Historical", icon: "Landmark" },
]

function getGenreIcon(name: string) {
  switch (name) {
    case "Sparkles": return <Sparkles className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-primary" />
    case "Wand2": return <Wand2 className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-amber-400" />
    case "Rocket": return <Rocket className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-blue-400" />
    case "Heart": return <Heart className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-pink-500 fill-pink-500/20" />
    case "Search": return <Search className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-purple-400" />
    case "Compass": return <Compass className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-emerald-400" />
    case "Smile": return <Smile className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-yellow-400" />
    case "Zap": return <Zap className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-rose-400" />
    case "Theater": return <Theater className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-pink-400" />
    case "Landmark": return <Landmark className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0 text-slate-400" />
    default: return <BookOpen className="h-3.5 w-3.5 mr-1.5 inline-block shrink-0" />
  }
}

function getGenreBadgeIcon(genre: string) {
  switch (genre) {
    case "Fantasy": return <Wand2 className="h-3 w-3 mr-1 inline-block shrink-0 text-amber-400" />
    case "Sci-Fi": return <Rocket className="h-3 w-3 mr-1 inline-block shrink-0 text-blue-400" />
    case "Romance": return <Heart className="h-3 w-3 mr-1 inline-block shrink-0 text-pink-500 fill-pink-500/20" />
    case "Mystery": return <Search className="h-3 w-3 mr-1 inline-block shrink-0 text-purple-400" />
    case "Adventure": return <Compass className="h-3 w-3 mr-1 inline-block shrink-0 text-emerald-400" />
    case "Comedy": return <Smile className="h-3 w-3 mr-1 inline-block shrink-0 text-yellow-400" />
    case "Thriller": return <Zap className="h-3 w-3 mr-1 inline-block shrink-0 text-rose-400" />
    case "Drama": return <Theater className="h-3 w-3 mr-1 inline-block shrink-0 text-pink-400" />
    case "Historical Fiction": return <Landmark className="h-3 w-3 mr-1 inline-block shrink-0 text-slate-400" />
    default: return <BookOpen className="h-3 w-3 mr-1 inline-block shrink-0" />
  }
}

export const metadata = {
  title: "Whispering Stories - Creative Reading Platform",
  description: "Explore immersive, community-written stories across fantasy, sci-fi, adventure, mystery, and more on Whispr. Strictly moderated, family-friendly high-quality literature.",
}

export default async function StoriesPage({ searchParams }: StoriesPageProps) {
  const params = await searchParams
  const activeGenre = params.genre || "all"
  const activeTag = params.tag || ""
  const activeSearch = params.search || ""
  const activeSort = params.sort || "latest"

  const supabase = createSupabaseServer()

  // Fetch stories with options
  const stories = await getPublishedStories(supabase, {
    genre: activeGenre,
    hashtag: activeTag || undefined,
    query: activeSearch || undefined,
    sortBy: activeSort,
  })

  // Fetch tags
  const trendingTags = await getTopHashtags(supabase, 8)

  return (
    <div className="whispr-gradient min-h-screen pb-12 pt-6">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Banner Section */}
        <div className="relative rounded-2xl overflow-hidden mb-10 bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-blue-900/60 p-8 md:p-12 border border-purple-500/20 shadow-2xl backdrop-blur-md animate-fade-in">
          <div className="relative z-10 max-w-2xl">
            <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 px-3 py-1 text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5 w-fit">
              <BookOpen className="h-3.5 w-3.5" />
              Whispering Stories
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Immerse Yourself in Shared Chronicles
            </h1>
            <p className="text-slate-300 text-lg mb-6 leading-relaxed">
              Discover stories, sagas, and series written by elite Whispr creators and administrators. Dive into premium reading without distractions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-lg">
                <Link href="#listings">Explore Library</Link>
              </Button>
              <Button asChild variant="outline" className="border-border/60 hover:bg-white/10 rounded-lg">
                <Link href="/chronicles/stories/new">
                  <PenTool className="h-4 w-4 mr-2" />
                  Write a Story
                </Link>
              </Button>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none p-4 hidden md:block">
            <BookOpen className="h-80 w-80 text-white" />
          </div>
        </div>

        {/* Core Content Grid */}
        <div id="listings" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Listings - Left 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Sort Toolbar */}
            <Card className="border-0 bg-card/40 backdrop-blur shadow-md p-4">
              <form method="GET" action="/stories" className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="search"
                    defaultValue={activeSearch}
                    placeholder="Search by title, author, or keyword..."
                    className="pl-10 bg-background/50 border-border/40 focus-visible:ring-primary rounded-lg"
                  />
                </div>

                {/* Genre persistence */}
                {activeGenre !== "all" && <input type="hidden" name="genre" value={activeGenre} />}
                {activeTag && <input type="hidden" name="tag" value={activeTag} />}

                {/* Sort dropdown */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <select
                    name="sort"
                    defaultValue={activeSort}
                    className="bg-background/60 border border-border/40 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-40 text-foreground"
                  >
                    <option value="latest">Latest Releases</option>
                    <option value="likes">Most Liked</option>
                    <option value="views">Most Viewed</option>
                  </select>
                  <Button type="submit" className="rounded-lg">Search</Button>
                </div>
              </form>
            </Card>

            {/* Genre Filter Tabs */}
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <Tabs defaultValue={activeGenre} className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-muted/30 border border-border/20 rounded-lg flex gap-1">
                  {GENRES.map((g) => (
                    <TabsTrigger
                      key={g.value}
                      value={g.value}
                      asChild
                      className="px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-all whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Link
                        href={{
                          pathname: "/stories",
                          query: {
                            ...(activeSearch ? { search: activeSearch } : {}),
                            ...(activeSort !== "latest" ? { sort: activeSort } : {}),
                            ...(activeTag ? { tag: activeTag } : {}),
                            genre: g.value,
                          },
                        }}
                        className="flex items-center justify-center"
                      >
                        {getGenreIcon(g.icon)}
                        <span>{g.label}</span>
                      </Link>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Stories Grid */}
            {stories.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-muted/50 bg-transparent">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Stories Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  We couldn't find any stories matching your filters. Try adjusting your search query, selecting another category, or writing one yourself!
                </p>
                {(activeGenre !== "all" || activeSearch || activeTag) && (
                  <Button asChild variant="outline" className="mt-6 rounded-lg">
                    <Link href="/stories">Reset All Filters</Link>
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => (
                  <Card
                    key={story.id}
                    className="group border-0 bg-card/45 backdrop-blur hover:bg-card/70 hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover Photo */}
                      <div className="relative h-48 w-full overflow-hidden bg-muted/20">
                        {story.cover_image_url ? (
                          <Image
                            src={story.cover_image_url}
                            alt={story.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-pink-900/30 flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-white/20" />
                          </div>
                        )}
                        <Badge className="absolute top-3 right-3 bg-black/60 text-white border-0 text-xs px-2.5 py-1 backdrop-blur-md flex items-center gap-1">
                          {getGenreBadgeIcon(story.genre)}
                          {story.genre}
                        </Badge>
                      </div>

                      <CardHeader className="pb-2 pt-4">
                        {/* Author line */}
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          {story.author_avatar ? (
                            <img
                              src={story.author_avatar}
                              alt={story.author_name}
                              className="h-5 w-5 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[9px] text-white font-bold">
                              {story.author_name?.charAt(0).toUpperCase() || "W"}
                            </div>
                          )}
                          <span className="font-semibold text-slate-300">@{story.author_username}</span>
                          <span>•</span>
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                            {story.author_type === "admin" ? "Admin" : "Creator"}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-serif text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                          {story.title}
                        </h3>
                      </CardHeader>

                      <CardContent className="pb-2">
                        {/* Excerpt */}
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                          {story.excerpt || story.description || "Embark on an epic adventure with this captivating chronicle."}
                        </p>
                      </CardContent>
                    </div>

                    <CardContent className="pt-2">
                      {/* Stats & Chapters */}
                      <div className="flex items-center justify-between border-t border-border/20 pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-pink-500" />
                            {story.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {story.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {story.comments_count || 0}
                          </span>
                        </div>
                        <Badge variant="outline" className="border-border/30 bg-muted/20 text-muted-foreground">
                          {story.chapters_count || 0} Chapters
                        </Badge>
                      </div>

                      {/* Read Link */}
                      <div className="mt-4">
                        <Button asChild className="w-full bg-muted/60 hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-lg" variant="ghost">
                          <Link href={`/stories/${story.slug}`}>Read Story →</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Right 1 col */}
          <div className="space-y-6">
            {/* Creator CTA */}
            <Card className="border-0 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 p-5 rounded-xl shadow-lg border border-purple-500/20 text-center">
              <PenTool className="h-8 w-8 text-primary mx-auto mb-3" />
              <h4 className="font-serif text-lg font-bold mb-1">Become a Chronicle Creator</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Share your original poems, blogs, and serialized stories with thousands of readers in the Whispr ecosystem.
              </p>
              <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-xs font-semibold rounded-lg">
                <Link href="/chronicles/dashboard">Go to Creator Hub</Link>
              </Button>
            </Card>

            {/* Trending tags */}
            <Card className="border-0 bg-card/45 backdrop-blur p-5 rounded-xl shadow-md">
              <h4 className="font-serif text-md font-bold mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Trending Tags
              </h4>
              {trendingTags.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tags recorded yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={activeTag === tag.name ? "default" : "secondary"}
                      className={`text-xs cursor-pointer px-2.5 py-1 rounded transition-colors ${
                        activeTag === tag.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                      asChild
                    >
                      <Link
                        href={{
                          pathname: "/stories",
                          query: {
                            ...(activeGenre !== "all" ? { genre: activeGenre } : {}),
                            ...(activeSearch ? { search: activeSearch } : {}),
                            ...(activeSort !== "latest" ? { sort: activeSort } : {}),
                            tag: tag.name,
                          },
                        }}
                      >
                        <Tag className="h-3 w-3 mr-1" />#{tag.name}
                      </Link>
                    </Badge>
                  ))}
                </div>
              )}
              {activeTag && (
                <Button asChild variant="link" size="sm" className="mt-4 p-0 text-xs text-primary hover:underline">
                  <Link href="/stories">Clear Tag Filter</Link>
                </Button>
              )}
            </Card>

            {/* Library guidelines */}
            <Card className="border-0 bg-card/40 backdrop-blur p-5 rounded-xl shadow-md text-xs text-muted-foreground leading-relaxed">
              <h4 className="font-serif text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary shrink-0" />
                Whispr Moderation Shield
              </h4>
              <p className="mb-2">
                All submitted stories are strictly monitored to align with our community safety and literary standards.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>No R-rated/explicit/erotic stories</li>
                <li>PG-13 style action, fantasy, & mystery</li>
                <li>Plagiarism is strictly prohibited</li>
                <li>Respect intellectual properties</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
