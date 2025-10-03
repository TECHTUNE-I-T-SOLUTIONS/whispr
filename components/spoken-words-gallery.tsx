"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward, RotateCcw } from "lucide-react"
import { MediaPlayer } from "@/components/media-player"
import { useToast } from "@/hooks/use-toast"

interface MediaFile {
  id: string
  original_name: string
  file_name: string
  file_path: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
  description?: string
  spoken_word_id?: string
}

export function SpokenWordsGallery() {
  const [audioFiles, setAudioFiles] = useState<MediaFile[]>([])
  const [videoFiles, setVideoFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [audioPage, setAudioPage] = useState(1)
  const [videoPage, setVideoPage] = useState(1)
  const [audioLastPage, setAudioLastPage] = useState(false)
  const [videoLastPage, setVideoLastPage] = useState(false)
  const { toast } = useToast()

  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`

  const fetchMediaFiles = async (type: "audio" | "video", page: number, setFiles: (files: MediaFile[]) => void, setLastPage: (isLast: boolean) => void) => {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        type
      })
      if (search) query.append("search", search)

      const response = await fetch(`/api/spoken-words?${query.toString()}`)
      if (response.ok) {
        const result = await response.json()
        // Transform spoken words data to match MediaFile interface
        const transformedFiles = (result.spokenWords || []).map((word: any) => ({
          id: word.media_file?.id || word.id,
          original_name: word.title,
          file_name: word.media_file?.file_name || "",
          file_path: word.media_file?.file_path || "",
          file_url: word.media_file?.file_url || "",
          file_type: word.media_file?.file_type || (word.type === "audio" ? "audio/mp3" : "video/mp4"),
          file_size: word.media_file?.file_size || 0,
          created_at: word.created_at,
          description: word.description,
          spoken_word_id: word.id
        }))
        setFiles(transformedFiles)
        setLastPage(transformedFiles.length < 12)
      } else {
        setFiles([])
        setLastPage(true)
        toast({ variant: "destructive", title: "Fetch Failed", description: `Could not load ${type} files.` })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `An error occurred while fetching ${type} files.` })
    }
  }

  const fetchAllFiles = async () => {
    setLoading(true)
    await Promise.all([
      fetchMediaFiles("audio", audioPage, setAudioFiles, setAudioLastPage),
      fetchMediaFiles("video", videoPage, setVideoFiles, setVideoLastPage)
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAllFiles()
  }, [audioPage, videoPage, search])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && audioFiles.length === 0 && videoFiles.length === 0) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
      {/* Search */}
      <div className="flex items-center justify-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spoken words..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Audio Words
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Video Words
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audio" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Audio Spoken Words</h2>
            <p className="text-muted-foreground">Listen to our collection of spoken words and audio content</p>
          </div>

          {audioFiles.length === 0 ? (
            <div className="text-center py-12">
              <Volume2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No audio files found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {audioFiles.map((file) => (
                <Card key={file.id} className="p-6 hover:shadow-lg transition-shadow">
                  <MediaPlayer
                    media={{
                      ...file,
                      file_url: getPublicUrl(file.file_path)
                    }}
                    showControls={true}
                    showDownload={false}
                    hideMeta={true}
                    className="w-full"
                  />
                </Card>
              ))}
            </div>
          )}

          {audioFiles.length > 0 && (
            <div className="flex justify-center gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setAudioPage((prev) => Math.max(1, prev - 1))}
                disabled={audioPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setAudioPage((prev) => prev + 1)}
                disabled={audioLastPage || loading}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Video Spoken Words</h2>
            <p className="text-muted-foreground">Watch our collection of video spoken words and visual content</p>
          </div>

          {videoFiles.length === 0 ? (
            <div className="text-center py-12">
              <Play className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No video files found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoFiles.map((file) => (
                <Card key={file.id} className="p-6 hover:shadow-lg transition-shadow">
                  <MediaPlayer
                    media={{
                      ...file,
                      file_url: getPublicUrl(file.file_path)
                    }}
                    showControls={true}
                    showDownload={false}
                    hideMeta={true}
                    className="w-full"
                  />
                </Card>
              ))}
            </div>
          )}

          {videoFiles.length > 0 && (
            <div className="flex justify-center gap-4 pt-6">
              <Button
                variant="outline"
                onClick={() => setVideoPage((prev) => Math.max(1, prev - 1))}
                disabled={videoPage === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setVideoPage((prev) => prev + 1)}
                disabled={videoLastPage || loading}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
