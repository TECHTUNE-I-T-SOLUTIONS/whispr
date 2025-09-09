"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Save,
  Eye,
  Upload,
  X,
  Plus,
  Loader2,
  FileText,
  Sparkles,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"
import { MediaPlayer } from "@/components/media-player"
import { marked } from "marked"
import { useToast } from "@/hooks/use-toast"
import DOMPurify from "dompurify"
import { MediaSelector } from "@/components/admin/media-selector"
marked.setOptions({ breaks: true })


interface PostEditorProps {
  type?: "blog" | "poem"
  postId?: string
  initialData?: any
}

interface FormData {
  title: string
  content: string
  excerpt: string
  type: "blog" | "poem"
  status: "draft" | "published"
  featured: boolean
  tags: string[]
  seoTitle: string
  seoDescription: string
}

export function PostEditor({ type: initialType, postId, initialData }: PostEditorProps) {
  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    type: initialData?.type || initialType || "blog",
    status: initialData?.status || "draft",
    featured: initialData?.featured || false,
    tags: initialData?.tags || [],
    seoTitle: initialData?.seo_title || "",
    seoDescription: initialData?.seo_description || "",
  })
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>(initialData?.media_files || [])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const escapeRegExp = (string: string) =>
    string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const formatText = (wrap: string, prefix = wrap, suffix = wrap) => {
    const el = contentRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    let selectedText = el.value.slice(start, end)
    let before = el.value.slice(0, start)
    let after = el.value.slice(end)

    const divMatch = selectedText.match(/^<div style="text-align:(.*?)">([\s\S]*?)<\/div>$/)

    if (divMatch) {
      // If text is aligned, unwrap, apply formatting, rewrap
      const alignment = divMatch[1]
      const inner = divMatch[2]

      const regex = new RegExp(`^${escapeRegExp(prefix)}(.*?)${escapeRegExp(suffix)}$`)
      const newInner = regex.test(inner)
        ? inner.replace(regex, '$1')
        : `${prefix}${inner}${suffix}`

      selectedText = `<div style="text-align:${alignment}">${newInner}</div>`
    } else {
      const regex = new RegExp(`^${escapeRegExp(prefix)}(.*?)${escapeRegExp(suffix)}$`)
      selectedText = regex.test(selectedText)
        ? selectedText.replace(regex, '$1')
        : `${prefix}${selectedText}${suffix}`
    }

    const newText = before + selectedText + after
    setFormData((prev) => ({ ...prev, content: newText }))
  }


  const handleAlignment = (type: string) => {
    const el = contentRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    let selectedText = el.value.slice(start, end)

    const divRegex = /^<div style="text-align:(.*?)">([\s\S]*)<\/div>$/
    const match = selectedText.match(divRegex)
    if (match) {
      selectedText = match[2] // unwrap inner content only
    }

    // Apply alignment
    const alignedText = `<div style="text-align:${type}">${selectedText}</div>`
    const newText = el.value.slice(0, start) + alignedText + el.value.slice(end)

    setFormData((prev) => ({ ...prev, content: newText }))
  }

  const handleSubmit = async (status: "draft" | "published") => {
    setIsLoading(true)
    try {
      const url = postId ? `/api/admin/posts/${postId}` : "/api/admin/posts"
      const method = postId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status,
          mediaFiles: uploadedFiles,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          variant: "success",
          title: `${formData.type === "poem" ? "Poem" : "Post"} ${postId ? "updated" : status === "published" ? "published" : "saved"}!`,
          description: `Your ${formData.type} has been successfully ${postId ? "updated" : status === "published" ? "published" : "saved as draft"}.`,
        })

        // Send push notification if published and it's a new post
        if (status === "published" && !postId) {
          try {
            const notificationType = formData.type === "poem" ? "poem" : "blog";
            await fetch(`/api/push/notify/${notificationType}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: formData.title,
                content: formData.excerpt || formData.content.substring(0, 200),
                author: "Whispr Admin", // You can get this from user session
                url: formData.type === "poem" ? `/poems/${data.id}` : `/blog/${data.id}`,
              }),
            });
          } catch (notificationError) {
            console.error("Failed to send push notification:", notificationError);
            // Don't show error to user as the post was successfully created
          }
        }

        router.push("/admin/posts")
      } else {
        throw new Error(`Failed to ${postId ? "update" : "save"} post`)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${postId ? "update" : "save"} the post. Please try again.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setUploadedFiles((prev) => [...prev, data])
          toast({
            variant: "success",
            title: "File uploaded",
            description: `${file.name} has been uploaded successfully.`,
          })
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `Failed to upload ${file.name}.`,
        })
      }
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            {formData.type === "poem" ? (
              <Sparkles className="h-8 w-8 text-primary" />
            ) : (
              <FileText className="h-8 w-8 text-primary" />
            )}
            {postId ? "Edit" : "Create New"} {formData.type === "poem" ? "Poem" : "Blog Post"}
          </h1>
          <p className="text-muted-foreground">
            {postId
              ? `Update your ${formData.type === "poem" ? "poem" : "blog post"}`
              : formData.type === "poem"
                ? "Compose a beautiful poem to share with your readers"
                : "Write and publish a new blog post"}
          </p>
        </div>
        <Select
          value={formData.type}
          onValueChange={(value: "blog" | "poem") => setFormData((prev) => ({ ...prev, type: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blog">📝 Blog Post</SelectItem>
            <SelectItem value="poem">✨ Poem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={formData.type === "poem" ? "Enter poem title..." : "Enter post title..."}
                  className="text-lg font-serif"
                />
              </div>

              {/* Formatting toolbar */}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={() => formatText("**")}>
                  {" "}
                  <Bold className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => formatText("_")}>
                  {" "}
                  <Italic className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => formatText("<u>", "<u>", "</u>")}>
                  {" "}
                  <Underline className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleAlignment("left")}>
                  {" "}
                  <AlignLeft className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleAlignment("center")}>
                  {" "}
                  <AlignCenter className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleAlignment("right")}>
                  {" "}
                  <AlignRight className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => handleAlignment("justify")}>
                  {" "}
                  <AlignJustify className="h-4 w-4" />{" "}
                </Button>
              </div>

              <div>
                <Label htmlFor="content">{formData.type === "poem" ? "Poem Content" : "Post Content"}</Label>
                <Textarea
                  ref={contentRef}
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={
                    formData.type === "poem" ? "Write your poem here..." : "Write your blog post content here..."
                  }
                  className={`min-h-[400px] resize-none ${formData.type === "poem" ? "font-serif leading-relaxed" : ""}`}
                />
              </div>

              {formData.content && (
                <div>
                  <Label className="block mt-6 mb-2">Live Preview</Label>
                  <div
                    className="prose prose-neutral dark:prose-invert max-w-none border rounded-md p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(marked.parse(formData.content) as string),
                    }}
                  />
                </div>
              )}


              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description or preview..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media Upload Section */}
          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Media Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-label="Upload media files"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Files
                  </Button>
                  <MediaSelector
                    onSelect={(selected) => setUploadedFiles(selected)}
                    selectedMedia={uploadedFiles}
                    trigger={
                      <Button type="button" variant="outline" className="flex-1">
                        <Plus className="mr-2 h-4 w-4" />
                        Select Existing
                      </Button>
                    }
                  />
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="relative group border rounded-lg p-4">
                      {file.file_type?.startsWith("image/") ? (
                        <div className="space-y-2">
                          <img
                            src={file.file_url || "/placeholder.svg"}
                            alt={file.original_name}
                            className="w-full h-32 object-cover rounded"
                          />
                          <p className="text-sm font-medium truncate">{file.original_name}</p>
                        </div>
                      ) : (file.file_type?.startsWith("video/") || file.file_type?.startsWith("audio/")) ? (
                        <div className="space-y-2">
                          <MediaPlayer
                            media={file}
                            showControls={true}
                            showDownload={false}
                            className="w-full"
                          />
                          <p className="text-sm font-medium truncate">{file.original_name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium truncate">{file.original_name}</p>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Post</Label>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, featured: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" size="sm" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive" title={`Remove ${tag}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO optimized title..."
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="SEO meta description..."
                  className="min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={() => handleSubmit("published")}
              disabled={isLoading || !formData.title || !formData.content}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
              {postId ? "Update" : "Publish"} {formData.type === "poem" ? "Poem" : "Post"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isLoading || !formData.title}
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
