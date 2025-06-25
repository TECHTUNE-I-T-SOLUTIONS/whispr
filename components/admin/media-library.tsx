"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Upload, Search, Filter, ImageIcon, FileText, Video, Music, Trash2, Download, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function MediaLibrary() {
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            Media Library
          </h1>
          <p className="text-muted-foreground">Upload and manage your images, videos, and other media files</p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-0 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
            <p className="text-muted-foreground mb-4">Support for images, videos, audio, and documents</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="animate-pulse">
              {isUploading ? "Uploading..." : "Choose Files"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No files uploaded yet</h3>
            <p className="text-muted-foreground">Upload your first file to get started</p>
          </div>
        ) : (
          files.map((file: any, index) => (
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
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
