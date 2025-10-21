/* eslint-disable */
// @ts-nocheck
"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  Image,
  Link as LinkIcon,
} from "lucide-react"
import { MediaPlayer } from "@/components/media-player"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  // Convert initial content to HTML if it's markdown; if it's already HTML, use as-is
  const initialContent = initialData?.content
    ? initialData.content.trim().startsWith("<")
      ? initialData.content
      : marked.parse(initialData.content)
    : ""

  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || "",
    content: initialContent || "",
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
  const contentRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Use document.execCommand for simple rich-text operations (widely supported despite deprecation)
  const exec = (command: string, value?: string) => {
    // Focus editable area before executing command so selection works
    contentRef.current?.focus()
    try {
      document.execCommand(command, false, value)
    } catch (e) {
      // ignore
    }
    // Sync content back to state
    const html = contentRef.current?.innerHTML || ""
    setFormData((prev) => ({ ...prev, content: html }))
  }

  // Save/restore selection so dialogs can open without losing caret position
  const savedSelectionRef = useRef<Range | null>(null)

  const saveSelection = () => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    savedSelectionRef.current = sel.getRangeAt(0).cloneRange()
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (!sel || !savedSelectionRef.current) return
    sel.removeAllRanges()
    sel.addRange(savedSelectionRef.current)
  }

  // Dialog states
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageDialogLoading, setImageDialogLoading] = useState(false)
  const [imageDialogError, setImageDialogError] = useState<string | null>(null)
  const [imageDialogMedia, setImageDialogMedia] = useState<any[]>([])
  const [selectedImageForInsert, setSelectedImageForInsert] = useState<any | null>(null)
  const [imageAltText, setImageAltText] = useState("")
  const [imageSizeOption, setImageSizeOption] = useState<"small"|"medium"|"large"|"full">("medium")
  const [imageAlignment, setImageAlignment] = useState<"center"|"left"|"right">("center")
  const [imageCaption, setImageCaption] = useState("")
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")
  const [selectedFigure, setSelectedFigure] = useState<HTMLElement | null>(null)
  // toolbar positioning will be set using CSS variables on the editor container
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionInput, setCaptionInput] = useState("")

  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`

  const fetchImageDialogMedia = async () => {
    setImageDialogLoading(true)
    setImageDialogError(null)
    try {
      const query = new URLSearchParams({ page: '1', limit: '20' })
      const res = await fetch(`/api/admin/media?${query.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch media')
      const data = await res.json()
      const media = (data.media || []).map((m: any) => ({ ...m, file_url: m.file_url || (m.file_path ? getPublicUrl(m.file_path) : '') }))
      setImageDialogMedia(media.filter((m: any) => m.file_type?.startsWith('image/')))
    } catch (err: any) {
      setImageDialogError(err?.message || 'Error fetching media')
    } finally {
      setImageDialogLoading(false)
    }
  }

  // Insert image using DOM Range to allow setting alt, width and responsive behavior
  const insertImageNode = (url: string, alt: string, widthPct: number) => {
    try {
      const sel = window.getSelection()
      let range: Range | null = null
      if (sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0)
      } else if (savedSelectionRef.current) {
        range = savedSelectionRef.current.cloneRange()
      }

      // Create image and wrapper
      const img = document.createElement('img')
      img.src = url
      img.alt = alt || ''
      img.className = 'max-w-full h-auto rounded'
      img.setAttribute('loading', 'lazy')
      img.style.display = 'block'
      img.style.width = `${widthPct}%`

      const figure = document.createElement('figure')
      figure.className = 'editable-figure'
      figure.style.width = `${widthPct}%`
      // simple alignment handling (avoid cssFloat which can make elements escape layout)
      if (imageAlignment === 'center') {
        figure.style.marginLeft = 'auto'
        figure.style.marginRight = 'auto'
        figure.style.display = 'block'
      } else if (imageAlignment === 'left') {
        figure.style.marginLeft = '0'
        figure.style.marginRight = '1rem'
        figure.style.display = 'block'
      } else if (imageAlignment === 'right') {
        figure.style.marginLeft = '1rem'
        figure.style.marginRight = '0'
        figure.style.display = 'block'
      }
      figure.appendChild(img)
      if (imageCaption) {
        const figcap = document.createElement('figcaption')
        figcap.textContent = imageCaption
        figcap.className = 'text-sm text-muted-foreground mt-2'
        figure.appendChild(figcap)
      }

      // make figure accessible
      figure.setAttribute('role', 'group')
      figure.setAttribute('aria-label', 'Image')

      // Insert node at range if available, otherwise append to editor
      if (range) {
        range.deleteContents()
        range.insertNode(figure)
        // Move caret after inserted node
        range.setStartAfter(figure)
        range.collapse(true)
        sel?.removeAllRanges()
        sel?.addRange(range)
      } else if (contentRef.current) {
        contentRef.current.appendChild(figure)
      }

      // Update React state
      const html = contentRef.current?.innerHTML || ''
      setFormData((prev) => ({ ...prev, content: html }))
      // plain insertion: no resizers or special selection handlers
    } catch (err) {
      console.error('Failed to insert image', err)
    }
  }

  const enableImageResizer = (figure: HTMLElement) => {
    try {
      console.debug('[resizer] enableImageResizer called for figure:', figure)
      const img = figure.querySelector('img') as HTMLImageElement | null
      if (!img) return

      const editorWidth = contentRef.current?.offsetWidth || 600

      const handles = Array.from(figure.querySelectorAll('.resize-handle')) as HTMLElement[]
      console.debug('[resizer] found handles:', handles.length)
      handles.forEach((handle) => {
        let startX = 0
        let startY = 0
        let startWidthPx = 0
        let startHeightPx = 0
        const dir = handle.getAttribute('data-dir') || 'se'
        console.debug('[resizer] attaching to handle', dir)

        const onPointerMove = (e: PointerEvent) => {
          // occasional debug to ensure pointermove fires
          // avoid spamming too much
          if ((Math.random() * 100) < 1) console.debug('[resizer] move', dir, e.clientX, e.clientY)
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY
          const signX = dir.includes('e') ? 1 : dir.includes('w') ? -1 : 0
          const signY = dir.includes('s') ? 1 : dir.includes('n') ? -1 : 0

          // compute new width preserving aspect ratio for corners and mapping vertical drags to height change
          const minPx = 40
          let newWidthPx = startWidthPx
          if (signX !== 0 && signY !== 0) {
            // corner: use average of projected deltas to scale
            const deltaPrimary = (deltaX * signX + deltaY * signY) / 2
            newWidthPx = Math.max(minPx, Math.min(editorWidth, startWidthPx + deltaPrimary))
          } else if (signX !== 0) {
            // horizontal side
            newWidthPx = Math.max(minPx, Math.min(editorWidth, startWidthPx + deltaX * signX))
          } else if (signY !== 0) {
            // vertical side: change height then map to width via aspect ratio
            const newHeightPx = Math.max(20, startHeightPx + deltaY * signY)
            const aspect = startWidthPx / Math.max(1, startHeightPx)
            newWidthPx = Math.max(minPx, Math.min(editorWidth, newHeightPx * aspect))
          }

          const newPct = (newWidthPx / editorWidth) * 100
          img.style.width = `${newPct}%`
          img.style.height = 'auto'
          figure.style.width = `${newPct}%`
          // update ARIA
          handle.setAttribute('aria-valuenow', String(Math.round(newPct)))
        }

        const onPointerUp = (ev: PointerEvent) => {
          console.debug('[resizer] pointerup', dir)
          try {
            if ((handle as any).releasePointerCapture && typeof ev.pointerId === 'number') {
              try { (handle as any).releasePointerCapture(ev.pointerId) } catch (_) {}
            }
          } catch (err) {}
          handle.removeEventListener('pointermove', onPointerMove as any)
          handle.removeEventListener('pointerup', onPointerUp as any)
          // sync state
          const html = contentRef.current?.innerHTML || ''
          setFormData((prev) => ({ ...prev, content: html }))
        }

        const onPointerDown = (e: PointerEvent) => {
          console.debug('[resizer] pointerdown', dir, 'pointerId=', (e as any).pointerId)
          e.preventDefault()
          startX = e.clientX
          startY = e.clientY
          const rect = img.getBoundingClientRect()
          startWidthPx = rect.width
          startHeightPx = rect.height
          // set accessible attributes
          handle.setAttribute('aria-valuemin', '10')
          handle.setAttribute('aria-valuemax', '100')
          const startPct = (startWidthPx / editorWidth) * 100
          handle.setAttribute('aria-valuenow', String(Math.round(startPct)))
          // attempt to capture the pointer on this handle so move/up events are routed here
          try {
            if ((handle as any).setPointerCapture && typeof e.pointerId === 'number') {
              try { (handle as any).setPointerCapture(e.pointerId) } catch (_) {}
            }
          } catch (err) {}
          // attach listeners to the handle so move/up are delivered while captured
          handle.addEventListener('pointermove', onPointerMove as any)
          handle.addEventListener('pointerup', onPointerUp as any)
          // focus the handle for keyboard control
          (handle as HTMLElement).focus()
        }

        const onKey = (e: KeyboardEvent) => {
          // ArrowLeft/ArrowRight adjust by 2% when handle focused
          const current = parseFloat(String(img.style.width || img.width || '50').replace('%', '')) || 50
          if (e.key === 'ArrowLeft') {
            e.preventDefault()
            const next = Math.max(10, Math.min(100, current - 2))
            img.style.width = `${next}%`
            figure.style.width = `${next}%`
            const html = contentRef.current?.innerHTML || ''
            setFormData((prev) => ({ ...prev, content: html }))
            handle.setAttribute('aria-valuenow', String(Math.round(next)))
          } else if (e.key === 'ArrowRight') {
            e.preventDefault()
            const next = Math.max(10, Math.min(100, current + 2))
            img.style.width = `${next}%`
            figure.style.width = `${next}%`
            const html = contentRef.current?.innerHTML || ''
            setFormData((prev) => ({ ...prev, content: html }))
            handle.setAttribute('aria-valuenow', String(Math.round(next)))
          }
        }

        handle.addEventListener('pointerdown', onPointerDown)
        handle.addEventListener('keydown', onKey)
        // add a hover/focus class for visuals
        handle.addEventListener('focus', () => handle.classList.add('handle-focus'))
        handle.addEventListener('blur', () => handle.classList.remove('handle-focus'))
      })
    } catch (err) {
      console.error('Failed to enable resizer', err)
    }
  }

  // Keep contentEditable DOM in sync if formData.content changes externally
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    if (formData.content !== el.innerHTML) {
      el.innerHTML = formData.content || ""
    }
    // after setting content, keep DOM in sync (do not auto-enable resizers)
  }, [formData.content])

  // Fetch media when image dialog opens
  useEffect(() => {
    if (showImageDialog) {
      fetchImageDialogMedia()
    }
  }, [showImageDialog])

  // Handle clicks inside editor to select figures and show toolbar
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      const figure = (target as HTMLElement).closest && (target as HTMLElement).closest('figure.editable-figure') as HTMLElement | null
      if (figure) {
        // select this figure
        e.preventDefault()
        selectFigure(figure)
      } else {
        // click outside any figure: deselect
        deselectFigure()
      }
    }

    el.addEventListener('click', onClick)

    const onKey = (e: KeyboardEvent) => {
      if (!selectedFigure) return
      if (e.key === 'Escape') {
        deselectFigure()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // remove selected figure
        selectedFigure.remove()
        const html = contentRef.current?.innerHTML || ''
        setFormData((prev) => ({ ...prev, content: html }))
        deselectFigure()
      }
    }

    window.addEventListener('keydown', onKey)

    return () => {
      el.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [selectedFigure])

  // Deselect figure when clicking outside the figure or the toolbar
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!selectedFigure) return
      const target = e.target as Node | null
      if (!target) return
      const toolbar = document.querySelector('.figure-toolbar')
      if (selectedFigure.contains(target) || (toolbar && toolbar.contains(target))) {
        return
      }
      deselectFigure()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [selectedFigure])

  const selectFigure = (figure: HTMLElement) => {
    // clear previous
    if (selectedFigure && selectedFigure !== figure) {
      selectedFigure.classList.remove('selected')
    }
    figure.classList.add('selected')
    setSelectedFigure(figure)
    // compute toolbar position and set CSS variables on editor container
    const editorRect = contentRef.current?.getBoundingClientRect()
    const figRect = figure.getBoundingClientRect()
    if (editorRect && contentRef.current) {
      const top = figRect.top - editorRect.top - 8
      const left = Math.max(8, figRect.left - editorRect.left + figRect.width / 2)
      const wrapper = contentRef.current.parentElement // the .relative container
      if (wrapper) {
        wrapper.style.setProperty('--figure-toolbar-top', `${top}px`)
        wrapper.style.setProperty('--figure-toolbar-left', `${left}px`)
      }
    }
    // ensure resizer active
    enableImageResizer(figure)
    // load caption text
    const figcap = figure.querySelector('figcaption')
    setCaptionInput(figcap ? figcap.textContent || '' : '')
  }

  const deselectFigure = () => {
    if (selectedFigure) selectedFigure.classList.remove('selected')
    setSelectedFigure(null)
    if (contentRef.current) {
      const wrapper = contentRef.current.parentElement
      if (wrapper) {
        wrapper.style.removeProperty('--figure-toolbar-top')
        wrapper.style.removeProperty('--figure-toolbar-left')
      }
    }
  }

  // Keyboard resize: Alt+ArrowLeft/ArrowRight to adjust width by 5%
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedFigure) return
      if (!e.altKey) return
      const img = selectedFigure.querySelector('img') as HTMLImageElement | null
      if (!img) return
      const current = parseFloat(String(img.style.width || img.width || '50').replace('%', '')) || 50
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const next = Math.max(10, Math.min(100, current - 5))
        img.style.width = `${next}%`
        selectedFigure.style.width = `${next}%`
        const html = contentRef.current?.innerHTML || ''
        setFormData((prev) => ({ ...prev, content: html }))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const next = Math.max(10, Math.min(100, current + 5))
        img.style.width = `${next}%`
        selectedFigure.style.width = `${next}%`
        const html = contentRef.current?.innerHTML || ''
        setFormData((prev) => ({ ...prev, content: html }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedFigure])

  const updateFigureAlignment = (figure: HTMLElement, align: 'left' | 'center' | 'right') => {
    // clear float/margins
    figure.style.cssFloat = ''
    figure.style.marginLeft = ''
    figure.style.marginRight = ''
    if (align === 'center') {
      figure.style.marginLeft = 'auto'
      figure.style.marginRight = 'auto'
      figure.style.cssFloat = 'none'
    } else if (align === 'left') {
      figure.style.cssFloat = 'left'
      figure.style.marginRight = '1rem'
    } else if (align === 'right') {
      figure.style.cssFloat = 'right'
      figure.style.marginLeft = '1rem'
    }
    // sync state
    const html = contentRef.current?.innerHTML || ''
    setFormData((prev) => ({ ...prev, content: html }))
    // reposition toolbar
    if (figure && contentRef.current) selectFigure(figure)
  }

  const updateFigureCaption = (figure: HTMLElement, captionText: string) => {
    let figcap = figure.querySelector('figcaption') as HTMLElement | null
    if (!figcap) {
      figcap = document.createElement('figcaption')
      figcap.className = 'text-sm text-muted-foreground mt-2'
      figure.appendChild(figcap)
    }
    figcap.textContent = captionText
    const html = contentRef.current?.innerHTML || ''
    setFormData((prev) => ({ ...prev, content: html }))
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
                <Button type="button" variant="ghost" onClick={() => exec('bold')}>
                  {" "}
                  <Bold className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => { saveSelection(); setShowImageDialog(true); }}>
                  <Image className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => { saveSelection(); setShowLinkDialog(true); setLinkUrl(''); setLinkText(''); }}>
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('italic')}>
                  {" "}
                  <Italic className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('underline')}>
                  {" "}
                  <Underline className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyLeft')}>
                  {" "}
                  <AlignLeft className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyCenter')}>
                  {" "}
                  <AlignCenter className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyRight')}>
                  {" "}
                  <AlignRight className="h-4 w-4" />{" "}
                </Button>
                <Button type="button" variant="ghost" onClick={() => exec('justifyFull')}>
                  {" "}
                  <AlignJustify className="h-4 w-4" />{" "}
                </Button>
              </div>

              <div>
                <Label htmlFor="content">{formData.type === "poem" ? "Poem Content" : "Post Content"}</Label>
                <div className="relative overflow-visible">
                  <div
                  id="content"
                  ref={contentRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => setFormData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || "" }))}
                  className={`min-h-[400px] p-3 border rounded prose max-w-none ${formData.type === "poem" ? "font-serif leading-relaxed" : ""}`}
                  aria-label={formData.type === "poem" ? "Poem content editor" : "Post content editor"}
                />
                  {/* Floating figure toolbar (positioned via CSS variables set on the editor container) */}
                  {selectedFigure && (
                    <div
                      className="figure-toolbar absolute z-50 bg-card border rounded shadow p-2 flex gap-2 items-center"
                      role="toolbar"
                      aria-label="Image toolbar"
                    >
                      <Button size="sm" aria-label="Align left" onClick={() => selectedFigure && updateFigureAlignment(selectedFigure, 'left')}>Left</Button>
                      <Button size="sm" aria-label="Align center" onClick={() => selectedFigure && updateFigureAlignment(selectedFigure, 'center')}>Center</Button>
                      <Button size="sm" aria-label="Align right" onClick={() => selectedFigure && updateFigureAlignment(selectedFigure, 'right')}>Right</Button>
                      <Button size="sm" aria-label="Edit caption" onClick={() => setEditingCaption((s) => !s)}>Caption</Button>
                      {editingCaption && (
                        <div className="flex items-center gap-2">
                          <Input aria-label="Caption text" className="w-40" value={captionInput} onChange={(e) => setCaptionInput(e.target.value)} placeholder="Caption text" />
                          <Button size="sm" aria-label="Save caption" onClick={() => { if (selectedFigure) { updateFigureCaption(selectedFigure, captionInput); setEditingCaption(false); } }}>Save</Button>
                        </div>
                      )}
                      <Button size="sm" variant="destructive" aria-label="Delete image" onClick={() => { if (selectedFigure) { selectedFigure.remove(); setFormData((prev) => ({ ...prev, content: contentRef.current?.innerHTML || '' })); deselectFigure(); }}}>Delete</Button>
                    </div>
                  )}
                  {(!formData.content || formData.content === "<p><br></p>") && (
                    <span className="absolute top-3 left-3 text-muted-foreground pointer-events-none select-none">
                      {formData.type === "poem" ? "Write your poem here..." : "Write your blog post content here..."}
                    </span>
                  )}
                </div>
              </div>

              {/* Image picker dialog */}
              <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Insert Image</DialogTitle>
                    <DialogDescription>Select an uploaded image to insert at the cursor.</DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {imageDialogLoading && <div className="text-center py-8">Loading...</div>}
                    {imageDialogError && <div className="text-destructive py-4">{imageDialogError}</div>}
                    {!imageDialogLoading && !imageDialogError && (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-auto">
                        {imageDialogMedia.length === 0 && (
                          <div className="col-span-2 text-muted-foreground">No uploaded images</div>
                        )}
                        {imageDialogMedia.map((file, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="border rounded overflow-hidden p-0"
                            onClick={() => {
                              // select image for insertion options
                              setSelectedImageForInsert(file)
                              setImageAltText(file.original_name || "")
                              setImageSizeOption("medium")
                            }}
                          >
                            <img src={file.file_url} alt={file.original_name} className="w-full h-24 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Link dialog */}
              <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Insert Link</DialogTitle>
                    <DialogDescription>Enter URL and optional text. If you had a selection, the selected text will become the link.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    <div>
                      <Label>URL</Label>
                      <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
                    </div>
                    <div>
                      <Label>Text (optional)</Label>
                      <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Link text" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
                      <Button onClick={() => {
                        setShowLinkDialog(false)
                        setTimeout(() => {
                          restoreSelection()
                          if (linkText) {
                            // insert text node and wrap
                            exec('insertHTML', `<a href=\"${linkUrl}\" target=\"_blank\" rel=\"noopener noreferrer\">${linkText}</a>`)
                          } else {
                            // createLink will convert selection to anchor
                            exec('createLink', linkUrl)
                            // ensure target
                            const sel = window.getSelection()
                            if (sel && sel.anchorNode) {
                              const el = sel.anchorNode.parentElement
                              if (el && el.tagName === 'A') {
                                el.setAttribute('target', '_blank')
                                el.setAttribute('rel', 'noopener noreferrer')
                              }
                            }
                          }
                        }, 0)
                      }}>Insert</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Insert options panel for selected image */}
              {selectedImageForInsert && (
                <div className="mt-4 border rounded p-3 bg-muted/30">
                  <div className="flex gap-4">
                    <div className="w-1/3">
                      <img src={selectedImageForInsert.file_url} alt={selectedImageForInsert.original_name} className="w-full h-auto object-cover rounded" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label>Alt text</Label>
                        <Input value={imageAltText} onChange={(e) => setImageAltText(e.target.value)} placeholder="Describe the image" />
                      </div>
                      <div>
                        <Label>Size</Label>
                        <div className="flex gap-2 mt-1">
                          <Button variant={imageSizeOption === 'small' ? 'default' : 'outline'} size="sm" onClick={() => setImageSizeOption('small')}>Small</Button>
                          <Button variant={imageSizeOption === 'medium' ? 'default' : 'outline'} size="sm" onClick={() => setImageSizeOption('medium')}>Medium</Button>
                          <Button variant={imageSizeOption === 'large' ? 'default' : 'outline'} size="sm" onClick={() => setImageSizeOption('large')}>Large</Button>
                          <Button variant={imageSizeOption === 'full' ? 'default' : 'outline'} size="sm" onClick={() => setImageSizeOption('full')}>Full</Button>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setSelectedImageForInsert(null)}>Cancel</Button>
                        <Button onClick={() => {
                          // perform insertion via DOM Range
                          setShowImageDialog(false)
                          setTimeout(() => {
                            restoreSelection()
                            const sizeMap: Record<string, number> = { small: 30, medium: 50, large: 75, full: 100 }
                            const widthPct = sizeMap[imageSizeOption]
                            insertImageNode(selectedImageForInsert.file_url, imageAltText, widthPct)
                            setSelectedImageForInsert(null)
                          }, 0)
                        }}>Insert Image</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
