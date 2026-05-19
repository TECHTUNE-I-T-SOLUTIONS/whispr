"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Menu, ChevronLeft, ChevronRight, Settings, ZoomIn, ZoomOut, Maximize2, X, Sparkles } from "lucide-react"

interface ChapterClientPageProps {
  story: any
  chapter: any
  allChapters: any[]
  prevChapterSlug: string | null
  nextChapterSlug: string | null
}

type FontSize = "sm" | "base" | "lg" | "xl"

export default function ChapterClientPage({
  story,
  chapter,
  allChapters,
  prevChapterSlug,
  nextChapterSlug,
}: ChapterClientPageProps) {
  const router = useRouter()

  const [scrollProgress, setScrollProgress] = useState(0)
  const [fontSize, setFontSize] = useState<FontSize>("base")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [immersiveMode, setImmersiveMode] = useState(false)

  // 1. Monitor scroll coordinates to compute horizontal progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100
        setScrollProgress(progress)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Class helper for font size
  const getFontSizeClass = () => {
    switch (fontSize) {
      case "sm":
        return "text-base md:text-md"
      case "lg":
        return "text-xl md:text-2xl"
      case "xl":
        return "text-2xl md:text-3xl"
      case "base":
      default:
        return "text-lg md:text-xl"
    }
  }

  return (
    <div className={`whispr-gradient min-h-screen pb-16 transition-all duration-500 ${immersiveMode ? "pt-4" : "pt-8"}`}>
      {/* 1. SCROLL PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 z-50 transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Immersive Top Bar */}
      <div className="container max-w-3xl mx-auto px-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!immersiveMode && (
            <Link
              href={`/stories/${story.slug}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Outline
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 bg-background/40 backdrop-blur border border-border/10 p-1.5 rounded-full shadow-lg">
          {/* Chapter list drawer trigger */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDrawerOpen(true)}
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            title="Table of Contents"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Sizing controls */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setFontSize((prev) => (prev === "sm" ? "base" : prev === "base" ? "lg" : prev === "lg" ? "xl" : "sm"))}
            className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
            title="Adjust Font Size"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Immersive mode trigger */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setImmersiveMode((prev) => !prev)}
            className={`h-8 w-8 rounded-full transition-all ${
              immersiveMode ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 hover:text-primary"
            }`}
            title="Focus Mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Immersive Floating Title */}
      {immersiveMode && (
        <div className="fixed top-4 left-6 z-40 hidden md:block bg-background/50 backdrop-blur border border-border/10 px-3 py-1.5 rounded-lg text-xs text-muted-foreground animate-slide-in">
          {story.title} • Chapter {chapter.sequence}
        </div>
      )}

      {/* Main Immersive Reading Block */}
      <article className="container max-w-2xl mx-auto px-4 mt-8">
        <header className="mb-8 text-center">
          <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs uppercase px-3 py-0.5 rounded-full mb-3">
            ✨ Chapter {chapter.sequence}
          </Badge>
          <h1 className="font-serif text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent leading-tight mb-2">
            {chapter.title}
          </h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            From "{story.title}"
          </p>
        </header>

        {/* Immersive Reading Canvas */}
        <Card className="border-0 bg-card/35 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden mb-12">
          <CardContent className="p-8 md:p-12">
            <div
              className={`prose prose-invert max-w-none leading-relaxed font-serif ${getFontSizeClass()} text-slate-200 focus:outline-none scroll-smooth`}
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </CardContent>
        </Card>

        {/* Immersive Footer Navigation */}
        <div className="flex items-center justify-between bg-card/45 backdrop-blur border border-border/20 p-4 rounded-2xl shadow-xl">
          {prevChapterSlug ? (
            <Button
              asChild
              variant="ghost"
              className="hover:bg-primary/10 hover:text-primary transition-all rounded-xl pl-2 text-sm"
            >
              <Link href={`/stories/${story.slug}/${prevChapterSlug}`}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Chapter
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" disabled className="opacity-30 rounded-xl pl-2 text-sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              First Chapter
            </Button>
          )}

          <div className="text-xs text-muted-foreground hidden sm:block">
            Chapter {chapter.sequence} of {allChapters.length}
          </div>

          {nextChapterSlug ? (
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl pr-2 text-sm font-semibold"
            >
              <Link href={`/stories/${story.slug}/${nextChapterSlug}`}>
                Next Chapter
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-all rounded-xl pr-2 text-sm font-semibold"
            >
              <Link href={`/stories/${story.slug}`}>
                Finish Story
                <Sparkles className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </article>

      {/* 2. TABLE OF CONTENTS COLLAPSIBLE SIDE DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-80 h-full bg-card/90 backdrop-blur-md border-l border-border/20 p-6 flex flex-col justify-between animate-slide-in shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-border/10 pb-4 mb-6">
                <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-primary" />
                  Table of Contents
                </h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Story Outline preview */}
              <div className="p-3 bg-muted/20 border border-border/10 rounded-xl mb-6">
                <h4 className="text-xs text-muted-foreground font-semibold uppercase mb-1">Outline</h4>
                <p className="text-sm font-bold truncate">{story.title}</p>
                <p className="text-[10px] text-muted-foreground font-semibold">by @{story.author_username}</p>
              </div>

              {/* Chapters list */}
              <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-1">
                {allChapters.map((c) => {
                  const isCurrent = c.id === chapter.id
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setDrawerOpen(false)
                        router.push(`/stories/${story.slug}/${c.slug}`)
                      }}
                      className={`w-full text-left p-2.5 rounded-lg text-sm transition-all duration-300 flex items-center gap-3 ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-primary/10 hover:text-primary text-muted-foreground"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isCurrent ? "bg-white/20 text-white" : "bg-muted/40 text-muted-foreground"
                      }`}>
                        {c.sequence}
                      </span>
                      <span className="truncate flex-1">{c.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border/10 text-center">
              <Button asChild variant="link" size="sm" className="text-xs">
                <Link href={`/stories/${story.slug}`}>Go back to outline details</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
