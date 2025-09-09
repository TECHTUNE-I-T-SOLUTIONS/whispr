"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Grid, List, ImageIcon, Video, Music, FileText } from "lucide-react"
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
}

export function MediaGallery() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)
  const [isLastPage, setIsLastPage] = useState(false)
  const { toast } = useToast()

  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`

  const fetchMediaFiles = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: "24",
        published: "true" // Only show published media
      })
      if (type) query.append("type", type)
      if (search) query.append("search", search)

      const response = await fetch(`/api/media?${query.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setFiles(result.media || [])
        setIsLastPage((result.media || []).length < 24)
      } else {
        setFiles([])
        setIsLastPage(true)
        toast({ variant: "destructive", title: "Fetch Failed", description: "Could not load media files." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "An error occurred while fetching media." })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMediaFiles()
  }, [page, type, search])

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-8 w-8 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-8 w-8 text-purple-500" />
    if (fileType.startsWith("audio/")) return <Music className="h-8 w-8 text-green-500" />
    return <FileText className="h-8 w-8 text-gray-500" />
  }

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

  if (loading && files.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted/50 aspect-square rounded-lg mb-4"></div>
            <div className="bg-muted/50 h-4 rounded mb-2"></div>
            <div className="bg-muted/50 h-4 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Media Grid/List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No media files found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {files.map((file) => (
            <MediaPlayer
              key={file.id}
              media={{
                ...file,
                file_url: getPublicUrl(file.file_path)
              }}
              showControls={true}
              showDownload={true}
              className="h-full"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {files.map((file) => (
            <Card key={file.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 flex-shrink-0">
                  {file.file_type.startsWith("image/") ? (
                    <img
                      src={getPublicUrl(file.file_path)}
                      alt={file.original_name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      {getFileIcon(file.file_type)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate" title={file.original_name}>
                    {file.original_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-xs">
                      {file.file_type.split("/")[0].toUpperCase()}
                    </Badge>
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a
                      href={getPublicUrl(file.file_path)}
                      download={file.original_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Download ${file.original_name}`}
                    >
                      Download
                    </a>
                  </Button>

                  {(file.file_type.startsWith("video/") || file.file_type.startsWith("audio/")) && (
                    <MediaPlayer
                      media={{
                        ...file,
                        file_url: getPublicUrl(file.file_path)
                      }}
                      showControls={true}
                      showDownload={false}
                      className="w-64"
                    />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {files.length > 0 && (
        <div className="flex justify-center gap-4 pt-8">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={isLastPage || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
