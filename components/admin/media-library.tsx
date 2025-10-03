"use client"

import type React from "react"
<<<<<<< HEAD

import { useState, useRef } from "react"
=======
import { useState, useRef, useEffect } from "react"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { Upload, Search, Filter, ImageIcon, FileText, Video, Music, Trash2, Download, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MediaLibrary() {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
=======
import { Upload, Search, Filter, ImageIcon, FileText, Video, Music, Trash2, Download, Eye, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MediaPlayer } from "@/components/media-player"
import type { Database } from "@/types/supabase"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

type MediaFile = Database["public"]["Tables"]["media"]["Row"]

export function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [type, setType] = useState("")
  const [search, setSearch] = useState("")
  const [showImage, setShowImage] = useState<string | MediaFile | null>(null)
  const [isLastPage, setIsLastPage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const getPublicUrl = (path: string) =>
    `https://vkftywhuaxwbknlrymnr.supabase.co/storage/v1/object/public/media/${path}`


  const fetchMediaFiles = async () => {
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
    }
  }

  useEffect(() => {
    fetchMediaFiles()
  }, [page, type, search])
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    setIsUploading(true)

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch("/api/admin/media/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          setFiles((prev) => [data, ...prev])
<<<<<<< HEAD
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

    setIsUploading(false)
  }

=======
          toast({ variant: "success", title: "File uploaded", description: `${file.name} has been uploaded.` })
        }
      } catch {
        toast({ variant: "destructive", title: "Upload failed", description: `Failed to upload ${file.name}.` })
      }
    }
    setIsUploading(false)
  }

  const deleteFile = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" })
      if (res.ok) {
        setFiles((prev) => prev.filter((file: any) => file.id !== id))
        toast({ variant: "success", title: "Deleted", description: "File successfully deleted." })
      } else {
        toast({ variant: "destructive", title: "Delete failed" })
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not delete file." })
    }
  }

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
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

  return (
    <div className="space-y-8">
<<<<<<< HEAD
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            Media Library
=======
      <Dialog open={!!showImage} onOpenChange={() => setShowImage(null)}>
        <DialogContent className="w-full max-w-2xl p-4">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Media Preview</h2>
          </div>
          {showImage && (
            <div className="max-h-96 overflow-auto">
              {typeof showImage === 'string' ? (
                <img src={showImage} alt="Preview" className="w-full h-auto rounded" />
              ) : (
                <MediaPlayer
                  media={{
                    ...showImage,
                    file_url: getPublicUrl(showImage.file_path)
                  }}
                  showControls={true}
                  showDownload={true}
                  className="w-full"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" /> Media Library
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
          </h1>
          <p className="text-muted-foreground">Upload and manage your images, videos, and other media files</p>
        </div>
      </div>

<<<<<<< HEAD
      {/* Upload Section */}
      <Card className="border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
=======
      <Card className="border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Upload Files
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
<<<<<<< HEAD
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
=======
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" aria-label="Upload media files" />
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">Support for images, videos, audio, and documents</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="animate-pulse">
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
          </div>
        </CardContent>
      </Card>

<<<<<<< HEAD
      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Files Grid */}
=======
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setType(type === "image" ? "" : "image")}>Filter</Button>
      </div>

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
            <p className="text-muted-foreground">Upload your first file to get started</p>
          </div>
        ) : (
          files.map((file: any, index) => (
<<<<<<< HEAD
            <Card
              key={file.id}
              className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  {file.file_type.startsWith("image/") ? (
                    <img
                      src={file.file_url || "/placeholder.svg"}
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(file.file_type)
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm truncate" title={file.original_name}>
                    {file.original_name}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {file.file_type.split("/")[0]}
                    </Badge>
                    <span>{formatFileSize(file.file_size)}</span>
                  </div>

                  <div className="flex items-center gap-1 pt-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
=======
            <Card key={file.id} className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  {file.file_type.startsWith("image/") ? (
                    <img src={getPublicUrl(file.file_path)} alt={file.original_name} className="w-full h-full object-cover" />
                  ) : file.file_type.startsWith("video/") || file.file_type.startsWith("audio/") ? (
                    <div className="w-full h-full flex items-center justify-center bg-black/20">
                      <MediaPlayer
                        media={{
                          ...file,
                          file_url: getPublicUrl(file.file_path)
                        }}
                        showControls={false}
                        showDownload={false}
                        className="w-full h-full border-0 bg-transparent"
                      />
                    </div>
                  ) : getFileIcon(file.file_type)}
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-sm truncate" title={file.original_name}>{file.original_name}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">{file.file_type.split("/")[0]}</Badge>
                    <span>{formatFileSize(file.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowImage(file)}><Eye className="h-3 w-3" /></Button>
                    <a href={getPublicUrl(file.file_path)} download target="_blank" rel="noopener noreferrer" title={`Download ${file.original_name}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="h-3 w-3" /></Button>
                    </a>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => deleteFile(file.id)}>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
<<<<<<< HEAD
=======

      {files.length > 0 && (
        <div className="flex justify-center gap-4 pt-6">
          <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>Previous</Button>
          <Button variant="outline" onClick={() => setPage((prev) => prev + 1)} disabled={isLastPage}>Next</Button>
        </div>
      )}
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    </div>
  )
}
