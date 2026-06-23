"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, ArrowLeft, Send, ShieldAlert, ShieldCheck, Plus } from "lucide-react"
import { SEOAnalyzer } from "@/components/seo/seo-analyzer"

const GENRES = [
  "Fantasy", "Sci-Fi", "Romance", "Mystery", "Adventure", "Comedy", "Thriller", "Drama", "Historical Fiction"
]

export default function NewStoryOutlinePage() {
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
  const [validationError, setValidationError] = useState("")

  // Optional First Chapter state
  const [addFirstChapter, setAddFirstChapter] = useState(false)
  const [chapTitle, setChapTitle] = useState("")
  const [chapContent, setChapContent] = useState("")
  const [chapStatus, setChapStatus] = useState<"draft" | "published">("published")

  // Redirect if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/session")
        if (!res.ok) {
          router.push("/chronicles/login")
        }
      } catch {
        router.push("/chronicles/login")
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setValidationError("")

    if (!title.trim() || !genre) {
      toast({
        title: "Missing Fields",
        description: "Please specify a title and genre for your story.",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    if (addFirstChapter && (!chapTitle.trim() || !chapContent.trim())) {
      toast({
        title: "Missing Chapter Content",
        description: "Please fill in the title and content for your first chapter.",
        variant: "destructive",
      })
      setSaving(false)
      return
    }

    // Process hashtags
    const hashtags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter((t) => t.length > 0)

    try {
      const res = await fetch("/api/chronicles/creator/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          genre,
          excerpt: excerpt.trim() || undefined,
          description: description.trim() || undefined,
          coverImageUrl: coverImageUrl.trim() || undefined,
          hashtags,
          status
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create story")
      }

      // If optional first chapter toggle is on, create the chapter
      if (addFirstChapter) {
        const chapRes = await fetch("/api/chronicles/creator/stories/chapters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: data.story.id,
            title: chapTitle.trim(),
            content: chapContent.trim(),
            status: chapStatus
          }),
        })
        
        const chapData = await chapRes.json()
        if (!chapRes.ok) {
          throw new Error(chapData.error || "Story outline saved, but first chapter validation failed.")
        }
      }

      toast({
        title: addFirstChapter ? "Story & First Chapter Saved! 🎉" : "Story Outline Saved! 🎉",
        description: addFirstChapter 
          ? `Successfully created "${title}" and its first chapter.`
          : `Successfully created "${title}" outline. Redirecting to chapters manager...`,
      })
      
      // Redirect to the edit/sequence manager page of this story
      router.push(`/chronicles/stories/${data.story.id}`)
    } catch (err: any) {
      setValidationError(err.message || "Failed to save outline or chapter.")
      toast({
        title: "Safety Shield Triggered 🛡️",
        description: err.message || "Could not publish outline. Review safe writing guidelines.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation breadcrumb */}
        <div className="mb-6">
          <Link
            href="/chronicles/stories"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stories
          </Link>
        </div>

        {/* Outline Form Card */}
        <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/15 p-6 bg-muted/10">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Create Story Outline
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Define the meta-structure, genre, and outline for your multi-chapter serialized story.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Safety alert */}
            {validationError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex gap-3 text-sm leading-relaxed">
                <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Moderation Restriction</h4>
                  <p>{validationError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Genre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Story Title</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. Shadow of the Whispering Wind"
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
                    placeholder="E.g. epic, adventure, romance"
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
                  placeholder="E.g. An ancient warrior embarks on a silent journey across forgotten realms."
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
                  placeholder="Summarize the core conflict, characters, and theme of your series..."
                  rows={5}
                  className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                />
              </div>

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

              {/* Optional First Chapter Section */}
              <div className="p-5 border border-border/10 rounded-2xl bg-muted/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                      Add First Chapter Now? <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Compose and draft/publish your introduction episode along with the story.</p>
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
                        placeholder="E.g. Chapter One: The Awakening"
                        required={addFirstChapter}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center justify-between">
                        <span>Chapter Content (supports Markdown)</span>
                        <span className="text-[10px] text-green-500 font-semibold flex items-center gap-0.5">
                          <ShieldCheck className="h-3 w-3 shrink-0" /> Safe Compliance Enabled
                        </span>
                      </label>
                      <Textarea
                        value={chapContent}
                        onChange={(e) => setChapContent(e.target.value)}
                        placeholder="Begin writing your serialized first chapter..."
                        required={addFirstChapter}
                        rows={10}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif leading-relaxed text-sm"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/10 rounded-xl text-xs">
                      <div>
                        <h5 className="font-semibold">First Chapter Visibility</h5>
                        <p className="text-muted-foreground text-[10px]">Draft chapters are hidden from public portal catalogs.</p>
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

              {/* Status outline option */}
              <div className="p-4 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Publish Outline Publicly?</h4>
                  <p className="text-xs text-muted-foreground">Draft outlines are hidden. Published outlines show up on listings pages even before adding chapters.</p>
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

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border/10">
                <Button asChild variant="outline" className="rounded-lg">
                  <Link href="/chronicles/stories">Cancel</Link>
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
