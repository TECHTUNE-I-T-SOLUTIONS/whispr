"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Plus,
  BarChart2,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Globe,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Search,
} from "lucide-react"

interface AdminStory {
  id: string
  title: string
  genre: string
  status: "draft" | "published"
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  chapters_count: number
  created_at: string
}

interface CreatorStory {
  id: string
  title: string
  genre: string
  status: "draft" | "published" | "archived"
  creator: {
    pen_name: string
  }
  views_count: number
  likes_count: number
  created_at: string
}

interface Hashtag {
  id: string
  name: string
  created_at: string
}

export default function AdminStoriesDashboard() {
  const { toast } = useToast()

  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState("admin-stories")

  // Lists
  const [adminStories, setAdminStories] = useState<AdminStory[]>([])
  const [loadingAdminStories, setLoadingAdminStories] = useState(true)

  const [creatorStories, setCreatorStories] = useState<CreatorStory[]>([])
  const [loadingCreatorStories, setLoadingCreatorStories] = useState(true)

  const [tags, setTags] = useState<Hashtag[]>([])
  const [loadingTags, setLoadingTags] = useState(true)
  
  // Hashtags additions
  const [newTagName, setNewTagName] = useState("")
  const [savingTag, setSavingTag] = useState(false)

  // Outline deletions
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    verifyAdminPrivileges()
  }, [])

  const verifyAdminPrivileges = async () => {
    setCheckingAdmin(true)
    try {
      const res = await fetch("/api/admin/stories")
      if (res.ok) {
        setIsAdmin(true)
        // Admin verified, fetch all tabs
        fetchAdminStories()
        fetchCreatorStories()
        fetchTags()
      } else {
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    } finally {
      setCheckingAdmin(false)
    }
  }

  const fetchAdminStories = async () => {
    setLoadingAdminStories(true)
    try {
      const res = await fetch("/api/admin/stories")
      if (res.ok) {
        const data = await res.json()
        setAdminStories(data.stories || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingAdminStories(false)
    }
  }

  const fetchCreatorStories = async () => {
    setLoadingCreatorStories(true)
    try {
      const res = await fetch("/api/admin/stories/moderation")
      if (res.ok) {
        const data = await res.json()
        setCreatorStories(data.stories || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCreatorStories(false)
    }
  }

  const fetchTags = async () => {
    setLoadingTags(true)
    try {
      const res = await fetch("/api/admin/stories/hashtags")
      if (res.ok) {
        const data = await res.json()
        setTags(data.tags || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTags(false)
    }
  }

  // Deletions
  const handleDeleteAdminStory = async () => {
    if (!deletingStoryId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/stories?storyId=${deletingStoryId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete story outline")
      
      toast({
        title: "Staff Story Deleted 🗑️",
        description: "Successfully pruned the story outline and associated episodes from Whispr servers.",
      })
      setAdminStories(prev => prev.filter(s => s.id !== deletingStoryId))
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setDeletingStoryId(null)
    }
  }

  // Creator stories moderation toggling
  const handleModerateCreatorStory = async (sid: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/stories/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId: sid, status: newStatus })
      })

      if (!res.ok) throw new Error("Moderation update failed")

      toast({
        title: `Story Moderated 🛡️`,
        description: `Successfully updated story status to "${newStatus}".`,
      })
      
      setCreatorStories(prev => prev.map(s => s.id === sid ? { ...s, status: newStatus as any } : s))
    } catch (err: any) {
      toast({
        title: "Moderation Failed",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Hashtag creation
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    setSavingTag(true)
    try {
      const res = await fetch("/api/admin/stories/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName })
      })

      if (!res.ok) throw new Error("Failed to create central hashtag")
      const data = await res.json()
      
      toast({
        title: "Hashtag Created",
        description: `Successfully indexed #${newTagName.toLowerCase()}.`,
      })
      setNewTagName("")
      fetchTags()
    } catch (err: any) {
      toast({
        title: "Tag Failed",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSavingTag(false)
    }
  }

  // Hashtag pruning
  const handleDeleteTag = async (tid: string) => {
    try {
      const res = await fetch(`/api/admin/stories/hashtags?tagId=${tid}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Tag pruning failed")

      toast({
        title: "Tag Pruned 🗑️",
        description: "Deleted tag index from central repository database.",
      })
      setTags(prev => prev.filter(t => t.id !== tid))
    } catch (err: any) {
      toast({
        title: "Pruning Failed",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20 px-4">
        <Card className="max-w-md w-full border border-red-500/20 bg-card text-center p-6 shadow-2xl rounded-2xl">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="font-serif text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">
            You do not possess the administrator permissions required to moderate, structure, or prune platform-owned stories.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/95 rounded-lg">
            <Link href="/">Return to Home</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Title banner */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Stories Console
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Manage staff-owned stories, moderate creators, and prune tags.</p>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/admin/stories/metrics">
                <BarChart2 className="h-4 w-4 mr-2" /> Global Analytics
              </Link>
            </Button>
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-lg">
              <Link href="/admin/stories/new">
                <Plus className="h-4 w-4 mr-1" /> New Staff Story
              </Link>
            </Button>
          </div>
        </div>

        {/* Tab Selection panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/20 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="admin-stories" className="rounded-lg px-4 py-2 font-semibold">
              👑 Staff Stories ({adminStories.length})
            </TabsTrigger>
            <TabsTrigger value="creator-moderation" className="rounded-lg px-4 py-2 font-semibold">
              🛡️ Chronicles Moderation ({creatorStories.length})
            </TabsTrigger>
            <TabsTrigger value="hashtags-central" className="rounded-lg px-4 py-2 font-semibold">
              🏷️ Central Hashtags ({tags.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STAFF STORIES */}
          <TabsContent value="admin-stories">
            <Card className="border border-border/10 bg-card rounded-2xl shadow-lg">
              <CardContent className="p-6">
                {loadingAdminStories ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : adminStories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No staff stories created yet.</div>
                ) : (
                  <div className="space-y-3">
                    {adminStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-4 bg-muted/15 border border-border/10 rounded-xl hover:bg-muted/20 hover:border-primary/20 transition-all flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge className="bg-primary/10 text-primary border-primary/25">{story.genre}</Badge>
                            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/40">
                              {story.chapters_count} Chapters
                            </Badge>
                            {story.status === "published" ? (
                              <span className="flex items-center gap-0.5 text-xs text-green-500 font-semibold">
                                <Globe className="h-3 w-3" /> Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                                <FileText className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif text-lg font-bold text-gray-900 dark:text-white truncate">{story.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {story.views_count || 0}</span>
                            <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {story.likes_count || 0}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {story.comments_count || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button asChild variant="outline" size="sm" className="rounded-lg">
                            <Link href={`/admin/stories/${story.id}`}>
                              <Edit className="h-4 w-4 mr-1" /> Edit Chapters
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingStoryId(story.id)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg h-9 w-9"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="border border-border/10 bg-card rounded-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif">Confirm Story Outline Deletion</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground">
                                  Permanently delete "{story.title}"? All staff chapters, metric analytics, and viewer comments will be destroyed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAdminStory}
                                  disabled={deleting}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                                >
                                  Delete Staff Story
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

          {/* TAB 2: CHRONICLES CREATOR MODERATION */}
          <TabsContent value="creator-moderation">
            <Card className="border border-border/10 bg-card rounded-2xl shadow-lg">
              <CardContent className="p-6">
                {loadingCreatorStories ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : creatorStories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No creator chronicles stories recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {creatorStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-4 bg-muted/15 border border-border/10 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">{story.genre}</Badge>
                            <span className="text-xs text-muted-foreground">
                              by <strong className="text-foreground">@{story.creator?.pen_name}</strong>
                            </span>
                          </div>
                          <h4 className="font-serif text-base font-bold text-gray-900 dark:text-white truncate">{story.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1">Submitted on {new Date(story.created_at).toLocaleDateString()}</p>
                        </div>

                        {/* Moderation Status togglers */}
                        <div className="flex items-center gap-2 shrink-0">
                          {story.status === "published" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleModerateCreatorStory(story.id, "draft")}
                              className="text-amber-500 border-amber-500/20 hover:bg-amber-500/10 text-xs rounded-lg font-semibold"
                            >
                              Unapprove Draft
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleModerateCreatorStory(story.id, "published")}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-semibold"
                            >
                              Approve Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CENTRAL HASHTAGS BOARD */}
          <TabsContent value="hashtags-central">
            <Card className="border border-border/10 bg-card rounded-2xl shadow-lg">
              <CardHeader className="p-6 pb-2 border-b border-border/10">
                <CardTitle className="font-serif text-lg">Hashtags Registry</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">Prune tag directories to clear inappropriate hashtags.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Hashtag Form */}
                <form onSubmit={handleCreateTag} className="flex gap-2 max-w-md">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="E.g. slowburn"
                      required
                      className="pl-9 bg-background/50 border-border/40 focus:ring-primary rounded-lg h-[38px] text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={savingTag} className="rounded-lg text-xs h-[38px] px-5">
                    {savingTag ? "Indexing..." : "Index Tag"}
                  </Button>
                </form>

                {/* Tags display */}
                {loadingTags ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No tags recorded. Create one above!</div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="bg-muted/30 border border-border/10 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs hover:border-primary/20 transition-all"
                      >
                        <span className="font-medium text-slate-300">#{tag.name}</span>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-0.5 rounded transition-colors"
                          title="Prune Tag"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
