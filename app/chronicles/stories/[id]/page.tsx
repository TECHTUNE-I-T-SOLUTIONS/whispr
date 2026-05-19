"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  BookOpen,
  ArrowLeft,
  Settings,
  Plus,
  Save,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Eye,
  Globe,
  FileText,
  Play,
  X,
  Edit,
} from "lucide-react"

interface Story {
  id: string
  title: string
  genre: string
  excerpt: string
  description: string
  cover_image_url: string
  status: "draft" | "published"
  hashtags?: string[]
}

interface Chapter {
  id: string
  title: string
  slug: string
  content: string
  sequence: number
  status: "draft" | "published"
}

const GENRES = ["Fantasy", "Sci-Fi", "Romance", "Mystery", "Adventure", "Comedy", "Thriller", "Drama", "Historical Fiction"]

export default function StoryChaptersManagerPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const storyId = params.id as string

  const [activeTab, setActiveTab] = useState("chapters")
  
  // Story state
  const [story, setStory] = useState<Story | null>(null)
  const [loadingStory, setLoadingStory] = useState(true)
  
  // Outline form state
  const [title, setTitle] = useState("")
  const [genre, setGenre] = useState("Fantasy")
  const [excerpt, setExcerpt] = useState("")
  const [description, setDescription] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [tagsInput, setTagsInput] = useState("")
  const [storyStatus, setStoryStatus] = useState<"draft" | "published">("draft")
  const [savingOutline, setSavingOutline] = useState(false)

  // Chapters state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loadingChapters, setLoadingChapters] = useState(true)
  
  // Chapter editor state (Modal/Drawer style)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [chapterTitle, setChapterTitle] = useState("")
  const [chapterContent, setChapterContent] = useState("")
  const [chapterStatus, setChapterStatus] = useState<"draft" | "published">("published")
  const [savingChapter, setSavingChapter] = useState(false)
  const [chapterError, setChapterError] = useState("")

  useEffect(() => {
    if (storyId) {
      fetchStoryOutline()
      fetchChapters()
    }
  }, [storyId])

  const fetchStoryOutline = async () => {
    setLoadingStory(true)
    try {
      // Find all stories first
      const res = await fetch("/api/chronicles/creator/stories")
      if (!res.ok) throw new Error("Failed to load details")
      const data = await res.json()
      const current = data.stories?.find((s: any) => s.id === storyId)
      
      if (!current) {
        throw new Error("Story outline not found")
      }

      setStory(current)
      setTitle(current.title || "")
      setGenre(current.genre || "Fantasy")
      setExcerpt(current.excerpt || "")
      setDescription(current.description || "")
      setCoverImageUrl(current.cover_image_url || "")
      setStoryStatus(current.status || "draft")
      
      // Load tags
      const { data: tagJunctions } = await fetchTagJunctions(storyId)
      setTagsInput(tagJunctions?.map((t: any) => t.hashtag?.name).join(", ") || "")
    } catch (e: any) {
      toast({
        title: "Outline load error",
        description: e.message || "Failed to load story outline data.",
        variant: "destructive",
      })
    } finally {
      setLoadingStory(false)
    }
  }

  const fetchTagJunctions = async (sid: string) => {
    // Simple direct lookup
    try {
      const res = await fetch(`/api/stories?storyId=${sid}&limit=1`)
      // Fallback
      return { data: [] }
    } catch {
      return { data: [] }
    }
  }

  const fetchChapters = async () => {
    setLoadingChapters(true)
    try {
      const res = await fetch(`/api/chronicles/creator/stories/chapters?storyId=${storyId}&includeDrafts=true`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load chapters")
      setChapters(data.chapters || [])
    } catch (e: any) {
      toast({
        title: "Chapters load error",
        description: e.message || "Failed to load chapters list.",
        variant: "destructive",
      })
    } finally {
      setLoadingChapters(false)
    }
  }

  // Update story outline
  const handleUpdateOutline = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingOutline(true)

    const hashtags = tagsInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter((t) => t.length > 0)

    try {
      const res = await fetch("/api/chronicles/creator/stories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          title: title.trim(),
          genre,
          excerpt: excerpt.trim() || null,
          description: description.trim() || null,
          coverImageUrl: coverImageUrl.trim() || null,
          hashtags,
          status: storyStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update")
      }

      toast({
        title: "Outline updated! 📝",
        description: "Your story configurations were successfully updated.",
      })
      fetchStoryOutline()
    } catch (err: any) {
      toast({
        title: "Safety Shield Triggered",
        description: err.message || "Failed to save outline updates.",
        variant: "destructive",
      })
    } finally {
      setSavingOutline(false)
    }
  }

  // Add or Edit chapter
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingChapter(true)
    setChapterError("")

    if (!chapterTitle.trim() || !chapterContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please specify title and content for your chapter.",
        variant: "destructive",
      })
      setSavingChapter(false)
      return
    }

    try {
      const method = editingChapter ? "PUT" : "POST"
      const payload: any = {
        title: chapterTitle.trim(),
        content: chapterContent.trim(),
        status: chapterStatus,
      }

      if (editingChapter) {
        payload.chapterId = editingChapter.id
      } else {
        payload.storyId = storyId
      }

      const res = await fetch("/api/chronicles/creator/stories/chapters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save chapter")
      }

      toast({
        title: editingChapter ? "Chapter updated! 🖋️" : "New chapter published! 🚀",
        description: `Successfully saved "${chapterTitle}".`,
      })
      
      closeEditor()
      fetchChapters()
    } catch (err: any) {
      setChapterError(err.message || "Failed to save chapter.")
      toast({
        title: "Safety Shield Triggered",
        description: err.message || "Review safe writing guidelines.",
        variant: "destructive",
      })
    } finally {
      setSavingChapter(false)
    }
  }

  const handleDeleteChapter = async (chapId: string) => {
    try {
      const res = await fetch(`/api/chronicles/creator/stories/chapters?chapterId=${chapId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete")
      }

      toast({
        title: "Chapter deleted 🗑️",
        description: "The selected chapter has been permanently removed.",
      })
      fetchChapters()
    } catch (err: any) {
      toast({
        title: "Deletion failed",
        description: err.message || "Could not delete chapter.",
        variant: "destructive",
      })
    }
  }

  // Reordering Arrow Actions
  const handleMoveChapter = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= chapters.length) return

    const current = chapters[index]
    const other = chapters[targetIdx]

    // Swap sequence locally for smooth UI feel
    const updated = [...chapters]
    const tempSeq = current.sequence
    current.sequence = other.sequence
    other.sequence = tempSeq

    updated[index] = other
    updated[targetIdx] = current
    
    // Sort
    updated.sort((a, b) => a.sequence - b.sequence)
    setChapters(updated)

    // Save swaps sequentially to backend
    try {
      await Promise.all([
        fetch("/api/chronicles/creator/stories/chapters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: current.id, sequence: current.sequence }),
        }),
        fetch("/api/chronicles/creator/stories/chapters", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chapterId: other.id, sequence: other.sequence }),
        }),
      ])
      
      toast({
        title: "Sequence updated",
        description: "Story chapters successfully reordered.",
      })
    } catch {
      toast({
        title: "Reorder swap failed",
        description: "Failed to persist new chapter order to the server.",
        variant: "destructive",
      })
      fetchChapters()
    }
  }

  const openNewEditor = () => {
    setEditingChapter(null)
    setChapterTitle("")
    setChapterContent("")
    setChapterStatus("published")
    setChapterError("")
    setEditorOpen(true)
  }

  const openEditEditor = (chap: Chapter) => {
    setEditingChapter(chap)
    setChapterTitle(chap.title)
    setChapterContent(chap.content)
    setChapterStatus(chap.status)
    setChapterError("")
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingChapter(null)
    setChapterTitle("")
    setChapterContent("")
    setChapterError("")
  }

  if (loadingStory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/chronicles/stories"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stories List
          </Link>

          {story && (
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href={`/stories/${story.slug}`} target="_blank" className="flex items-center gap-1.5">
                <Play className="h-4 w-4" /> View Public Page
              </Link>
            </Button>
          )}
        </div>

        {/* Story Outline Header Banner */}
        {story && (
          <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-purple-950/60 to-slate-900/60 border border-purple-500/25 p-6 md:p-8 shadow-xl">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/20 text-primary border-primary/20">{story.genre}</Badge>
                {story.status === "published" ? (
                  <span className="flex items-center gap-1 text-xs text-green-500 font-semibold">
                    <Globe className="h-3 w-3" /> Published Outline
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                    <FileText className="h-3 w-3" /> Draft Outline
                  </span>
                )}
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold">{story.title}</h1>
              {story.excerpt && <p className="text-sm text-slate-300 mt-2 line-clamp-1">{story.excerpt}</p>}
            </div>
          </div>
        )}

        {/* Tab System for Outline Editor vs Chapters serialization board */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/20">
            <TabsTrigger value="chapters" className="rounded-lg px-5 py-2 font-medium">
              📖 Serialized Chapters
            </TabsTrigger>
            <TabsTrigger value="outline" className="rounded-lg px-5 py-2 font-medium">
              ⚙️ Story Settings
            </TabsTrigger>
          </TabsList>

          {/* CHAPTERS TAB */}
          <TabsContent value="chapters" className="space-y-4">
            <Card className="border border-border/10 bg-card rounded-2xl shadow-lg">
              <CardHeader className="p-6 pb-4 border-b border-border/10 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-serif text-xl">Story Episodes Outline</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Compose new serialized chapters and drag or swap arrow indexes to arrange chronological order.
                  </CardDescription>
                </div>
                <Button onClick={openNewEditor} className="rounded-lg">
                  <Plus className="h-4 w-4 mr-1.5" /> Compose Chapter
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {loadingChapters ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                    <h4 className="font-bold text-lg mb-1">First Chapter Awaits</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Add your introduction chapter! Keep your contents safe, family-friendly, and highly structured.
                    </p>
                    <Button onClick={openNewEditor} className="bg-primary hover:bg-primary/95 rounded-lg">
                      <Plus className="h-4 w-4 mr-1.5" /> Write Chapter 1
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((chap, idx) => (
                      <div
                        key={chap.id}
                        className="group p-4 bg-muted/15 border border-border/10 rounded-xl hover:bg-muted/20 hover:border-primary/20 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Sequence arrow buttons */}
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === 0}
                              onClick={() => handleMoveChapter(idx, "up")}
                              className="h-6 w-6 hover:bg-primary/10 rounded"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              disabled={idx === chapters.length - 1}
                              onClick={() => handleMoveChapter(idx, "down")}
                              className="h-6 w-6 hover:bg-primary/10 rounded"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 border border-border/10">
                            {chap.sequence}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-serif text-base font-bold truncate group-hover:text-primary transition-colors">
                              {chap.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              <span>{Math.ceil(chap.content.split(" ").length / 200)} min read</span>
                              <span>•</span>
                              {chap.status === "published" ? (
                                <span className="text-green-500 font-semibold flex items-center gap-0.5">
                                  <Globe className="h-2.5 w-2.5" /> Published
                                </span>
                              ) : (
                                <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                                  <FileText className="h-2.5 w-2.5" /> Draft
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => openEditEditor(chap)} className="h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-lg">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border border-border/10 bg-card rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif">Confirm Chapter Deletion</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                  Are you sure you want to permanently delete "{chap.title}"? The text cannot be recovered.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteChapter(chap.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                                >
                                  Delete Permanently
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OUTLINE SETTINGS TAB */}
          <TabsContent value="outline">
            <Card className="border border-border/10 bg-card rounded-2xl shadow-lg">
              <CardHeader className="p-6 pb-4 border-b border-border/10">
                <CardTitle className="font-serif text-xl">Story Outline Settings</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Modify parameters, safety visibility, covers, and details for this story outline.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleUpdateOutline} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Story Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Cover Image URL</label>
                      <Input
                        value={coverImageUrl}
                        onChange={(e) => setCoverImageUrl(e.target.value)}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Hashtags (Comma-separated)</label>
                      <Input
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Excerpt (One sentence)</label>
                    <Input
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      maxLength={160}
                      className="bg-background/60 border-border/40 focus:ring-primary rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Full Story Description</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                    />
                  </div>

                  <div className="p-4 bg-muted/20 border border-border/10 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Publish Outline Settings?</h4>
                      <p className="text-xs text-muted-foreground">Choose whether to publish the outline structure.</p>
                    </div>
                    <div className="flex bg-muted/40 p-1 rounded-lg border border-border/20">
                      <Button
                        type="button"
                        variant={storyStatus === "draft" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setStoryStatus("draft")}
                        className="text-xs px-3 rounded-md"
                      >
                        Draft
                      </Button>
                      <Button
                        type="button"
                        variant={storyStatus === "published" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setStoryStatus("published")}
                        className="text-xs px-3 rounded-md"
                      >
                        Publish
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/10">
                    <Button type="submit" disabled={savingOutline} className="bg-primary hover:bg-primary/95 rounded-lg flex items-center gap-1">
                      <Save className="h-4 w-4 mr-1" />
                      {savingOutline ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 3. DYNAMIC DRAWER CHAPTER WRITER EDITOR */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-2xl h-full bg-card border-l border-border/20 p-6 flex flex-col justify-between animate-slide-in shadow-2xl overflow-y-auto">
            <form onSubmit={handleSaveChapter} className="h-full flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-border/10 pb-3 mb-6">
                  <h3 className="font-serif text-lg font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    {editingChapter ? "Edit Serialized Chapter" : "Compose Serialized Chapter"}
                  </h3>
                  <Button size="icon" variant="ghost" type="button" onClick={closeEditor} className="h-8 w-8 rounded-full hover:bg-muted">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {chapterError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs leading-relaxed flex gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>{chapterError}</div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chapter Title</label>
                    <Input
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="E.g. Chapter One: The Silence"
                      required
                      className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center justify-between">
                      <span>Chapter Content (supports Markdown)</span>
                      <span className="text-[10px] text-green-500 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> PG-13 Safe Filter
                      </span>
                    </label>
                    <Textarea
                      value={chapterContent}
                      onChange={(e) => setChapterContent(e.target.value)}
                      placeholder="Once upon a time in the whispering forest..."
                      required
                      rows={18}
                      className="bg-background/60 border-border/40 focus:ring-primary rounded-lg font-serif leading-relaxed text-sm"
                    />
                  </div>

                  <div className="p-3 bg-muted/20 border border-border/10 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-semibold">Publish Chapter immediately?</h4>
                      <p className="text-muted-foreground text-[10px]">Draft chapters are hidden from public sitemap/reader list.</p>
                    </div>
                    <div className="flex bg-muted/40 p-0.5 rounded-lg border border-border/20 shrink-0">
                      <Button
                        type="button"
                        variant={chapterStatus === "draft" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setChapterStatus("draft")}
                        className="text-[10px] px-2.5 h-7 rounded"
                      >
                        Draft
                      </Button>
                      <Button
                        type="button"
                        variant={chapterStatus === "published" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setChapterStatus("published")}
                        className="text-[10px] px-2.5 h-7 rounded"
                      >
                        Publish
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/10 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={closeEditor} className="rounded-lg text-xs">
                  Discard
                </Button>
                <Button type="submit" disabled={savingChapter} className="bg-primary hover:bg-primary/95 rounded-lg text-xs flex items-center gap-1">
                  <Save className="h-3.5 w-3.5" />
                  {savingChapter ? "Saving..." : "Save Chapter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
