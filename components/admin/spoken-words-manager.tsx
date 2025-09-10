"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Upload,
  Search,
  Edit,
  Trash2,
  Play,
  Volume2,
  VolumeX,
  Plus,
  Save,
  X,
  FileText,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MediaPlayer } from "@/components/media-player"
import { MediaRecorder } from "@/components/media-recorder"

interface SpokenWord {
  id: string
  title: string
  description: string
  type: "audio" | "video"
  media_id: string
  media_file?: {
    id: string
    original_name: string
    file_name: string
    file_path: string
    file_url: string
    file_type: string
    file_size: number
  }
  created_at: string
  updated_at: string
}

export function SpokenWordsManager() {
  const [spokenWords, setSpokenWords] = useState<SpokenWord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState<"all" | "audio" | "video">("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<SpokenWord | null>(null)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement | null }>({})
  // refs for synchronous access to audio elements and playing id to avoid race conditions
  const audioRefsRef = useRef<{ [key: string]: HTMLAudioElement | null }>({})
  const playingAudioRef = useRef<string | null>(null)
  const [previewMedia, setPreviewMedia] = useState<any | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "audio" as "audio" | "video",
    media_id: ""
  })
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedDuration, setRecordedDuration] = useState<number>(0)
  const [uploadMethod, setUploadMethod] = useState<"upload" | "record">("upload")
  const [availableMedia, setAvailableMedia] = useState<any[]>([])
  const [selectedMediaPreview, setSelectedMediaPreview] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const isValidType = formData.type === "audio"
      ? file.type.startsWith("audio/")
      : file.type.startsWith("video/")

    if (!isValidType) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please select a ${formData.type} file.`
      })
      return
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select a file smaller than 50MB."
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)
      formDataUpload.append("type", formData.type)

      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formDataUpload
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, media_id: data.media.id }))
        setRecordedBlob(null)
        setRecordedDuration(0)

        // Set preview for the uploaded file immediately
        setSelectedMediaPreview({
          ...data.media,
          file_url: getPublicUrl(data.media.file_path)
        })

        // Refresh available media
        fetchAvailableMedia()

        toast({
          title: "Upload successful",
          description: "File uploaded successfully."
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload the file. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setRecordedBlob(blob)
    setRecordedDuration(duration)
    setFormData(prev => ({ ...prev, media_id: "" })) // Clear selected media when recording
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "audio",
      media_id: ""
    })
    setRecordedBlob(null)
    setRecordedDuration(0)
    setUploadMethod("upload")
    setSelectedMediaPreview(null)
  }

  const fetchSpokenWords = async () => {
    try {
      const response = await fetch("/api/admin/spoken-words")
      if (response.ok) {
        const data = await response.json()
        setSpokenWords(data.spokenWords || [])
      } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to fetch spoken words" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMedia = async () => {
    try {
      const response = await fetch("/api/admin/media?type=audio&type=video&limit=100")
      if (response.ok) {
        const data = await response.json()
        setAvailableMedia(data.media || [])
      }
    } catch (error) {
      console.error("Failed to fetch media:", error)
    }
  }

  useEffect(() => {
    fetchSpokenWords()
    fetchAvailableMedia()
  }, [])

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs).forEach(audio => {
        if (audio) {
          audio.pause()
          audio.src = ""
        }
      })
      setPlayingAudioId(null)
    }
  }, [audioRefs])

  // keep refs in sync with state when audioRefs state changes
  useEffect(() => {
    audioRefsRef.current = { ...audioRefsRef.current, ...audioRefs }
  }, [audioRefs])

  const handleCreate = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Error", description: "Title is required" })
      return
    }

    if (uploadMethod === "upload" && !formData.media_id) {
      toast({ variant: "destructive", title: "Error", description: "Media file selection is required" })
      return
    }

    if (uploadMethod === "record" && !recordedBlob) {
      toast({ variant: "destructive", title: "Error", description: "Recording is required" })
      return
    }

    setIsSubmitting(true)
    try {
      let mediaId = formData.media_id

      // If recording, upload the recorded blob first
      if (uploadMethod === "record" && recordedBlob) {
        const formDataUpload = new FormData()
        const fileName = `spoken-word-${Date.now()}.${formData.type === "audio" ? "webm" : "webm"}`
        formDataUpload.append("file", recordedBlob, fileName)
        formDataUpload.append("type", formData.type)

        const uploadResponse = await fetch("/api/admin/media", {
          method: "POST",
          body: formDataUpload
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload recorded media")
        }

        const uploadData = await uploadResponse.json()
        mediaId = uploadData.media.id
      }

      const response = await fetch("/api/admin/spoken-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          media_id: mediaId
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({ variant: "success", title: "Success", description: "Spoken word created successfully" })

        // Send push notification for new spoken word
        try {
          await fetch("/api/push/notify/spoken-word", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: formData.title,
              description: formData.description,
              type: formData.type,
              url: `/media`,
            }),
          });
        } catch (notificationError) {
          console.error("Failed to send push notification:", notificationError);
          // Don't show error to user as the spoken word was successfully created
        }

        setIsCreateDialogOpen(false)
        resetForm()
        fetchSpokenWords()
      } else {
        throw new Error("Failed to create")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create spoken word" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingWord || !formData.title || !formData.media_id) {
      toast({ variant: "destructive", title: "Error", description: "Title and media file are required" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/spoken-words/${editingWord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({ variant: "success", title: "Success", description: "Spoken word updated successfully" })
        setIsEditDialogOpen(false)
        setEditingWord(null)
        setFormData({ title: "", description: "", type: "audio", media_id: "" })
        fetchSpokenWords()
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update spoken word" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this spoken word?")) return

    try {
      const response = await fetch(`/api/admin/spoken-words/${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast({ variant: "success", title: "Success", description: "Spoken word deleted successfully" })
        fetchSpokenWords()
      } else {
        throw new Error("Failed to delete")
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete spoken word" })
    }
  }

  const handleAudioPlay = (word: SpokenWord) => {
    console.log('handleAudioPlay called for word:', word.id, 'playingAudioId:', playingAudioId)
    if (!word.media_file) return

    // Stop any currently playing audio (use ref for immediate access)
    if (playingAudioRef.current && playingAudioRef.current !== word.id) {
      const currentAudio = audioRefsRef.current[playingAudioRef.current]
      if (currentAudio) {
        try { currentAudio.pause(); currentAudio.currentTime = 0 } catch (e) {}
      }
      // clear state but keep refs until new audio is created
      playingAudioRef.current = null
      setPlayingAudioId(null)
    }

    // If clicking the same audio that's playing, pause it
    if (playingAudioRef.current === word.id) {
      console.log('Pausing audio for word:', word.id)
      const audio = audioRefsRef.current[word.id]
      if (audio) {
        try { audio.pause(); audio.currentTime = 0 } catch (e) {}
        playingAudioRef.current = null
        setPlayingAudioId(null)
        // Don't continue to play logic
        return
      } else {
        console.log('Audio element not found in refs for word:', word.id)
      }
    }

    // Play (or resume) the selected audio by reusing an audio element stored in refs
    const existing = audioRefsRef.current[word.id]
    if (existing) {
      try {
        existing.currentTime = 0
        void existing.play()
        playingAudioRef.current = word.id
        setPlayingAudioId(word.id)
        return
      } catch (e) {
        console.error('Error playing existing audio element for word:', word.id, e)
        // fallback: remove and recreate
        try { existing.pause(); existing.src = ''; } catch (_) {}
        audioRefsRef.current[word.id] = null
        setAudioRefs(prev => ({ ...prev, [word.id]: null }))
      }
    }

    console.log('Creating audio element and playing for word:', word.id)
    const audioUrl = getPublicUrl(word.media_file.file_path)
    const audioEl = new Audio()
    audioEl.preload = 'auto'
    audioEl.src = audioUrl

    const handleEnded = () => {
      playingAudioRef.current = null
      setPlayingAudioId(null)
      // keep ref in case user plays again
      setAudioRefs(prev => ({ ...prev, [word.id]: null }))
    }

    const handleError = (e: any) => {
      // Treat certain transient errors as benign; otherwise show toast
      const msg = (e && e.message) ? String(e.message).toLowerCase() : ''
      const isTransient = e && e.name === 'AbortError' || msg.includes('interrupted') || msg.includes('pause') || msg.includes('canceled') || msg.includes('cancelled')
      console.log('Audio element error for word:', word.id, e, 'transient=', isTransient)
      if (isTransient) {
        // don't clear UI for transient errors
        return
      }
      playingAudioRef.current = null
      setPlayingAudioId(null)
      setAudioRefs(prev => ({ ...prev, [word.id]: null }))
      toast({ variant: 'destructive', title: 'Playback error', description: 'Failed to play audio file.' })
    }

    audioEl.addEventListener('ended', handleEnded)
    audioEl.addEventListener('error', handleError)

    // store element in both ref and state so we can access synchronously and re-render
    audioRefsRef.current[word.id] = audioEl
    setAudioRefs(prev => ({ ...prev, [word.id]: audioEl }))

    // set playing id immediately so UI reflects intent
    playingAudioRef.current = word.id
    setPlayingAudioId(word.id)

    // Wait for canplay or a short timeout before attempting play to avoid AbortError races
    let played = false
    const tryPlay = async () => {
      if (played) return
      played = true
      try {
        await audioEl.play()
      } catch (err: any) {
        const msg = (err && err.message) ? String(err.message).toLowerCase() : ''
        const isBenign = err && err.name === 'AbortError' || msg.includes('interrupted') || msg.includes('pause') || msg.includes('canceled') || msg.includes('cancelled')
        if (isBenign) {
          console.debug('Audio play interrupted/benign for word:', word.id, err)
          return
        }

        const isNotSupported = err && (err.name === 'NotSupportedError' || msg.includes('no supported sources') || msg.includes('not supported'))
        if (isNotSupported) {
          // Try to reload the source once and attempt to play again (helps when the element lost its src or timing issue)
          try {
            console.warn('NotSupportedError encountered, retrying load/play for word:', word.id)
            audioEl.src = audioUrl
            audioEl.load()
            await new Promise((r) => setTimeout(r, 200))
            await audioEl.play()
            return
          } catch (err2) {
            console.error('Retry after NotSupportedError failed for word:', word.id, err2)
            // fall through to show toast below
          }
        }

        console.error('Audio play failed for word:', word.id, err)
        playingAudioRef.current = null
        setPlayingAudioId(null)
        audioRefsRef.current[word.id] = null
        setAudioRefs(prev => ({ ...prev, [word.id]: null }))
        toast({ variant: 'destructive', title: 'Playback blocked', description: 'Audio playback was blocked by the browser.' })
      }
    }

    const canplayHandler = () => {
      // remove listener and try to play
      audioEl.removeEventListener('canplay', canplayHandler)
      tryPlay()
    }

    audioEl.addEventListener('canplay', canplayHandler)

    // Fallback: attempt play after short delay even if canplay didn't fire
    const playTimeout = setTimeout(() => {
      tryPlay()
    }, 250)

    // cleanup if element is later removed
    const cleanup = () => {
      clearTimeout(playTimeout)
      audioEl.removeEventListener('canplay', canplayHandler)
      audioEl.removeEventListener('ended', handleEnded)
      audioEl.removeEventListener('error', handleError)
    }

    // Attach a one-time ended/error cleanup via the handlers above; also ensure we cleanup when refs change
    // Note: we intentionally do not immediately revoke src so the element can be reused until user action.

  // playback initiated via audioEl.play() above; removed stray call to undefined `audio`
  }

  const openEditDialog = (word: SpokenWord) => {
    setEditingWord(word)
    setFormData({
      title: word.title,
      description: word.description,
      type: word.type,
      media_id: word.media_id
    })
    setIsEditDialogOpen(true)
  }

  const filteredWords = spokenWords.filter(word => {
    const matchesSearch = word.title.toLowerCase().includes(search.toLowerCase()) ||
                         word.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = type === "all" || word.type === type
    return matchesSearch && matchesType
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-4"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted/50 aspect-video rounded-lg mb-4"></div>
              <div className="bg-muted/50 h-4 rounded mb-2"></div>
              <div className="bg-muted/50 h-4 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Volume2 className="h-8 w-8 text-primary" />
            Spoken Words Manager
          </h1>
          <p className="text-muted-foreground">Manage your audio and video spoken words content</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Spoken Word
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Spoken Word</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter title..."
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "audio" | "video") => {
                    setFormData(prev => ({ ...prev, type: value, media_id: "" }))
                    setRecordedBlob(null)
                    setRecordedDuration(0)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "upload" | "record")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload Media</TabsTrigger>
                  <TabsTrigger value="record">Record {formData.type === "audio" ? "Audio" : "Video"}</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label htmlFor="media">Select Media File</Label>
                    <Select
                      value={formData.media_id || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setFormData(prev => ({ ...prev, media_id: "" }))
                          setSelectedMediaPreview(null)
                          setRecordedBlob(null)
                          setRecordedDuration(0)
                        } else {
                          setFormData(prev => ({ ...prev, media_id: value }))
                          setRecordedBlob(null)
                          setRecordedDuration(0)

                          // Set preview for selected media
                          const selectedMedia = availableMedia.find(media => media.id === value)
                          if (selectedMedia) {
                            setSelectedMediaPreview({
                              ...selectedMedia,
                              file_url: getPublicUrl(selectedMedia.file_path)
                            })
                          }
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a media file..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                        {availableMedia
                          .filter(media => media.file_type.startsWith(formData.type + "/"))
                          .map((media) => (
                            <SelectItem key={media.id} value={media.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{media.original_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({formatFileSize(media.file_size)})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">or</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload New File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={formData.type === "audio" ? "audio/*" : "video/*"}
                      className="hidden"
                      onChange={handleFileUpload}
                      title={`Upload ${formData.type} file`}
                    />
                  </div>

                  {selectedMediaPreview && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Preview</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMediaPreview(null)
                            setFormData(prev => ({ ...prev, media_id: "" }))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {formData.type === "audio" ? (
                        <audio
                          src={selectedMediaPreview.file_url}
                          controls
                          className="w-full"
                        />
                      ) : (
                        <video
                          src={selectedMediaPreview.file_url}
                          controls
                          className="w-full h-32 bg-black rounded"
                        />
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        {selectedMediaPreview.original_name} • {formatFileSize(selectedMediaPreview.file_size)}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="record" className="space-y-4">
                  <MediaRecorder
                    type={formData.type}
                    onRecordingComplete={handleRecordingComplete}
                    maxSizeMB={50}
                  />
                  {recordedBlob && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Recorded {formData.type} ({formatFileSize(recordedBlob.size)}, {Math.round(recordedDuration)}s)
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spoken words..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={(value: "all" | "audio" | "video") => setType(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12">
              <Volume2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No spoken words found</h3>
              <p className="text-muted-foreground">Try adjusting your search or add a new spoken word</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWords.map((word) => (
                <Card key={word.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-lg">{word.title}</h3>
                        <Badge variant={word.type === "audio" ? "default" : "secondary"}>
                          {word.type === "audio" ? <Volume2 className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                          {word.type}
                        </Badge>
                      </div>

                      {word.description && (
                        <p className="text-muted-foreground text-sm line-clamp-2">{word.description}</p>
                      )}

                      {word.media_file && (
                        <MediaPlayer
                          media={{
                            ...word.media_file,
                            file_url: getPublicUrl(word.media_file.file_path)
                          }}
                          showControls={true}
                          showDownload={true}
                          className="w-full"
                        />
                      )}

                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(word)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(word.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(word.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12">
              <Volume2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No spoken words found</h3>
              <p className="text-muted-foreground">Try adjusting your search or add a new spoken word</p>
            </div>
          ) : (
            filteredWords.map((word) => (
              <Card key={word.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex-shrink-0">
                    <Button
                      variant="outline"
                      className="w-full h-full flex items-center justify-center transition-colors"
                      onClick={() => {
                        // open preview modal with media (audio or video)
                        if (!word.media_file) return
                        setPreviewMedia({
                          ...word.media_file,
                          file_url: getPublicUrl(word.media_file.file_path),
                          type: word.type
                        })
                        setIsPreviewOpen(true)
                      }}
                    >
                      {word.type === "audio" ? (
                        <Volume2 className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{word.title}</h3>
                      {playingAudioId === word.id && (
                        <Badge variant="default" className="text-xs animate-pulse">
                          Playing
                        </Badge>
                      )}
                    </div>
                    {word.description && (
                      <p className="text-muted-foreground text-sm line-clamp-1">{word.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{word.type}</Badge>
                      {word.media_file && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(word.media_file.file_size)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(word.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(word)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(word.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Spoken Word</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter title..."
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "audio" | "video") => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-media">Select Media File</Label>
              <Select
                value={formData.media_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, media_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a media file..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMedia
                    .filter(media => media.file_type.startsWith(formData.type + "/"))
                    .map((media) => (
                      <SelectItem key={media.id} value={media.id}>
                        {media.original_name} ({formatFileSize(media.file_size)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog for audio/video */}
      <Dialog open={isPreviewOpen} onOpenChange={(open) => { if (!open) setPreviewMedia(null); setIsPreviewOpen(open) }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview Media</DialogTitle>
          </DialogHeader>
          {previewMedia && (
            <div>
              <MediaPlayer
                media={{
                  ...previewMedia,
                }}
                showControls={true}
                showDownload={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
