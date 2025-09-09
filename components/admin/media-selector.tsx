"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Plus, X, ImageIcon, Video, Music, FileText, Play } from "lucide-react"
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
}

interface MediaSelectorProps {
  onSelect: (media: MediaFile[]) => void
  selectedMedia: MediaFile[]
  trigger?: React.ReactNode
}

export function MediaSelector({ onSelect, selectedMedia, trigger }: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [page, setPage] = useState(1)
  const [isLastPage, setIsLastPage] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`

  const fetchMediaFiles = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (type) query.append("type", type)
      if (search) query.append("search", search)

      const response = await fetch(`/api/admin/media?${query.toString()}`)
      if (response.ok) {
        const result = await response.json()
        setFiles(result.media || [])
        setIsLastPage((result.media || []).length < 20)
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
    if (isOpen) {
      fetchMediaFiles()
    }
  }, [isOpen, page, type, search])

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-500" />
    if (fileType.startsWith("video/")) return <Video className="h-6 w-6 text-purple-500" />
    if (fileType.startsWith("audio/")) return <Music className="h-6 w-6 text-green-500" />
    return <FileText className="h-6 w-6 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isSelected = (file: MediaFile) => {
    return selectedMedia.some(selected => selected.id === file.id)
  }

  const toggleSelection = (file: MediaFile) => {
    const fileWithUrl = { ...file, file_url: getPublicUrl(file.file_path) }

    if (isSelected(file)) {
      onSelect(selectedMedia.filter(selected => selected.id !== file.id))
    } else {
      onSelect([...selectedMedia, fileWithUrl])
    }
  }

  const handleConfirm = () => {
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Select from Media Library
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Select Media Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={type === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("")}
              >
                All
              </Button>
              <Button
                variant={type === "image" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("image")}
              >
                Images
              </Button>
              <Button
                variant={type === "video" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("video")}
              >
                Videos
              </Button>
              <Button
                variant={type === "audio" ? "default" : "outline"}
                size="sm"
                onClick={() => setType("audio")}
              >
                Audio
              </Button>
            </div>
          </div>

          {/* Selected Media Preview */}
          {selectedMedia.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-medium mb-2">Selected Media ({selectedMedia.length})</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMedia.map((file) => (
                  <Badge key={file.id} variant="secondary" className="flex items-center gap-1">
                    {file.original_name}
                    <button
                      onClick={() => toggleSelection(file)}
                      className="ml-1 hover:text-destructive"
                      title={`Remove ${file.original_name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading media files...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No files found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              files.map((file) => (
                <Card
                  key={file.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected(file) ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => toggleSelection(file)}
                >
                  <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                    {file.file_type.startsWith("image/") ? (
                      <img
                        src={getPublicUrl(file.file_path)}
                        alt={file.original_name}
                        className="w-full h-full object-cover"
                      />
                    ) : file.file_type.startsWith("video/") || file.file_type.startsWith("audio/") ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/20 relative group">
                        <MediaPlayer
                          media={{
                            ...file,
                            file_url: getPublicUrl(file.file_path)
                          }}
                          showControls={false}
                          showDownload={false}
                          className="w-full h-full border-0 bg-transparent"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="secondary" className="text-white">
                            <Play className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    ) : (
                      getFileIcon(file.file_type)
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate" title={file.original_name}>
                      {file.original_name}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <Badge variant="outline" className="text-xs">
                        {file.file_type.split("/")[0]}
                      </Badge>
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {files.length > 0 && (
            <div className="flex justify-center gap-4 pt-4">
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

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Selection ({selectedMedia.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
