"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, ArrowLeft, Send, ShieldCheck, Plus, Loader2, AlertTriangle } from "lucide-react"
import { SEOAnalyzer } from "@/components/seo/seo-analyzer"

const GENRES = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Adventure", "Comedy", "Thriller", "Drama", "Historical Fiction"]

export default function NewAdminStoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [description, setDescription] = useState("")
  const [genre, setGenre] = useState("Fantasy")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [saving, setSaving] = useState(false)

  // Optional First Chapter state
  const [addFirstChapter, setAddFirstChapter] = useState(false)
  const [chapTitle, setChapTitle] = useState("")
  const [chapContent, setChapContent] = useState("")
  const [chapStatus, setChapStatus] = useState<"draft" | "published">("published")

  // Content authenticity state
  const [authenticityCheck, setAuthenticityCheck] = useState<any>(null)
  const [checkingAuthenticity, setCheckingAuthenticity] = useState(false)

  const checkContentAuthenticity = async (content: string) => {
    setCheckingAuthenticity(true)
    try {
      const response = await fetch('/api/content/authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const result = await response.json()
      setAuthenticityCheck(result)
      return result
    } catch (error) {
      console.error('Authenticity check failed:', error)
      return null
    } finally {
      setCheckingAuthenticity(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    if (!title.trim() || !genre) {
      toast({
        title: "Missing Fields",
        description: "Please specify a title and genre for your story outline.",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    if (addFirstChapter && (!chapTitle.trim() || !chapContent.trim())) {
      toast({
        title: "Missing Chapter Fields",
        description: "Please enter the title and content for your official first chapter.",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    // Check authenticity for description if publishing
    if (status === 'published' && description.trim()) {
      const descCheck = await checkContentAuthenticity(description.trim())
      if (descCheck && !descCheck.canProceed) {
        toast({
          variant: "destructive",
          title: "Content Authenticity Check",
          description: descCheck.recommendation,
        })
        setSaving(false)
        return
      }
    }

    // Check authenticity for chapter content if publishing and adding chapter
    if (addFirstChapter && chapStatus === 'published' && chapContent.trim()) {
      const chapCheck = await checkContentAuthenticity(chapContent.trim())
      if (chapCheck && !chapCheck.canProceed) {
        toast({
          variant: "destructive",
          title: "Chapter Content Authenticity Check",
          description: chapCheck.recommendation,
        })
        setSaving(false)
        return
      }
    }

    const hashtags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter((t) => t.length > 0)

    try {
      const res = await fetch("/api/admin/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre,
          excerpt: excerpt.trim() || undefined,
          description: description.trim() || undefined,
          coverImageUrl: coverImageUrl.trim() || undefined,
          hashtags,
          status,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create story outline")
      }

      // If optional first chapter toggle is active
      if (addFirstChapter) {
        const chapRes = await fetch("/api/admin/stories/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: data.story.id,
            title: chapTitle.trim(),
            content: chapContent.trim(),
            status: chapStatus,
          }),
        })

        const chapData = await chapRes.json()
        if (!chapRes.ok) {
          throw new Error(chapData.error || "Outline saved, but official chapter creation failed.")
        }
      }

      toast({
        title: addFirstChapter ? "Official Story & Chapter Created! 🎉" : "Staff Outline Created 🎉",
        description: addFirstChapter
          ? `Successfully indexed "${title}" and its introductory episode.`
          : `Successfully indexed "${title}". Redirecting to chapters sequence board...`,
      })
      
      router.push(`/admin/stories/${data.story.id}`)
    } catch (err: any) {
      toast({
        title: "Creation Failed",
        description: err.message || "Failed to save outline. Review console errors.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin/stories"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stories Console
          </Link>
        </div>

        {/* Outline Creation Card */}
        <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/15 p-6 bg-muted/10">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Compose Staff Story Outline
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define the title, cover art, and genre metadata configurations for this official Whispr stories series.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Genre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Story Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Chronology of the Lost Empire"
                    required
                    maxLength={100}
                    className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="bg-background/60 border border-border/40 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary w-full h-[40px] text-foreground"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover image & hashtags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Cover Image URL</label>
                  <Input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Hashtags (Comma-separated)</label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="E.g. sci-fi, cyberpunk, gritty"
                    className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Excerpt (One-sentence summary)</label>
                <Input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="E.g. In a dying neon city, an AI researcher unlocks an ancient cognitive simulation."
                  maxLength={160}
                  className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Story Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Draft the central theme, plot arc, and target reader profile..."
                  rows={5}
                  className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                />
              </div>

              {/* SEO Analyzer Integration */}
              <SEOAnalyzer 
                title={title}
                content={description}
                excerpt={excerpt}
                tags={tagsInput.split(",").map(t => t.trim()).filter(t => t)}
                type="story"
                genre={genre}
                onApplyTitle={setTitle}
                onApplyTags={(newTags) => {
                  const currentTags = tagsInput.split(",").map(t => t.trim()).filter(t => t)
                  const combined = Array.from(new Set([...currentTags, ...newTags]))
                  setTagsInput(combined.join(", "))
                }}
              />

              {/* Content Authenticity Checker */}
              <div className="p-5 border border-border/10 rounded-2xl bg-muted/20 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    Content Authenticity Checker
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Check your content for AI-generated patterns before publishing.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => description && checkContentAuthenticity(description)}
                    disabled={checkingAuthenticity || !description}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {checkingAuthenticity ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-3 w-3" />
                        Check Description
                      </>
                    )}
                  </Button>
                  {addFirstChapter && (
                    <Button
                      onClick={() => chapContent && checkContentAuthenticity(chapContent)}
                      disabled={checkingAuthenticity || !chapContent}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {checkingAuthenticity ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-2 h-3 w-3" />
                          Check Chapter
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {authenticityCheck && (
                  <div className="space-y-3">
                    {/* Overall Score */}
                    <div className={`p-3 rounded-lg border ${
                      authenticityCheck.authenticityScore >= 80
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs">
                          Authenticity Score: {authenticityCheck.authenticityScore}%
                        </span>
                        {authenticityCheck.authenticityScore >= 80 ? (
                          <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {authenticityCheck.recommendation}
                      </p>
                      {authenticityCheck.authenticityScore < 80 && (
                        <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mt-1">
                          Publishing is blocked until authenticity reaches 80%+
                        </p>
                      )}
                    </div>

                    {/* AI-Flagged Sections */}
                    {authenticityCheck.aiSections && authenticityCheck.aiSections.length > 0 && (
                      <div className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                        <h4 className="font-semibold text-xs mb-2 flex items-center gap-2 text-orange-800 dark:text-orange-300">
                          <AlertTriangle className="h-3 w-3" />
                          AI-Flagged Sections ({authenticityCheck.aiSections.length})
                        </h4>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          These sections show significant AI patterns. Please rewrite them with your own voice:
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {authenticityCheck.aiSections.map((section: any, idx: number) => (
                            <div key={idx} className="p-2 rounded bg-white dark:bg-black/30 border border-orange-100 dark:border-orange-900/50">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-medium text-orange-700 dark:text-orange-400">
                                  Section {section.lineNumber}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {Math.round(section.authenticityScore)}% authentic
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {section.text.substring(0, 150)}{section.text.length > 150 ? '...' : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Section Analysis */}
                    {authenticityCheck.sectionAnalysis && authenticityCheck.sectionAnalysis.length > 0 && (
                      <details className="group">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                          <span>View detailed section analysis ({authenticityCheck.sectionAnalysis.length} sections)</span>
                          <span className="transform group-open:rotate-180 transition-transform text-[10px]">▼</span>
                        </summary>
                        <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                          {authenticityCheck.sectionAnalysis.map((section: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`p-2 rounded text-[10px] ${
                                section.isAIGenerated
                                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                  : section.authenticityScore >= 80
                                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium">Section {section.lineNumber}</span>
                                <span className={section.isAIGenerated ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                                  {Math.round(section.authenticityScore)}%
                                </span>
                              </div>
                              <p className="text-muted-foreground line-clamp-1">
                                {section.text.substring(0, 80)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {/* Optional First Chapter Section */}
              <div className="p-5 border border-border/10 rounded-2xl bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                      Add First Chapter Now? <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Compose official serialized first chapter along with this story creation.</p>
                  </div>
                  <Button
                    type="button"
                    variant={addFirstChapter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAddFirstChapter(!addFirstChapter)}
                    className="text-xs rounded-lg transition-all"
                  >
                    {addFirstChapter ? "Remove Chapter" : "Add First Chapter"}
                  </Button>
                </div>

                {addFirstChapter && (
                  <div className="space-y-4 pt-4 border-t border-border/10">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chapter Title</label>
                      <Input
                        value={chapTitle}
                        onChange={(e) => setChapTitle(e.target.value)}
                        placeholder="E.g. Chapter One: The Genesis"
                        required={addFirstChapter}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center justify-between">
                        <span>Chapter Content (supports Markdown)</span>
                        <span className="text-[10px] text-green-500 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3 shrink-0" /> Official Staff Mode Enabled
                        </span>
                      </label>
                      <Textarea
                        value={chapContent}
                        onChange={(e) => setChapContent(e.target.value)}
                        placeholder="Begin writing official staff first chapter..."
                        required={addFirstChapter}
                        rows={10}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif leading-relaxed text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/10 rounded-xl text-xs">
                      <div>
                        <h5 className="font-semibold">First Chapter Visibility</h5>
                        <p className="text-muted-foreground text-[10px]">Draft chapters are hidden from sitemap indexes.</p>
                      </div>
                      <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/20 shrink-0">
                        <Button
                          type="button"
                          variant={chapStatus === "draft" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setChapStatus("draft")}
                          className="text-[10px] px-2.5 h-7 rounded"
                        >
                          Draft
                        </Button>
                        <Button
                          type="button"
                          variant={chapStatus === "published" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setChapStatus("published")}
                          className="text-[10px] px-2.5 h-7 rounded"
                        >
                          Publish
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status visibility options */}
              <div className="p-4 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Publish Outline immediately?</h4>
                  <p className="text-xs text-muted-foreground">Draft outlines are hidden from indices. Published outlines are indexed by sitemap/listings publicly.</p>
                </div>
                <div className="flex bg-muted/40 p-1 rounded-lg border border-border/20">
                  <Button
                    type="button"
                    variant={status === "draft" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatus("draft")}
                    className="text-xs px-3 rounded-md"
                  >
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant={status === "published" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatus("published")}
                    className="text-xs px-3 rounded-md"
                  >
                    Publish
                  </Button>
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border/10">
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href="/admin/stories">Cancel</Link>
                </Button>
                <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/95 rounded-lg flex items-center gap-1">
                  {saving ? "Saving..." : addFirstChapter ? "Create Story & First Chapter" : "Create Story Outline"}
                  <Send className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
