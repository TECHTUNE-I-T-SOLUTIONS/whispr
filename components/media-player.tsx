"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  RotateCcw
} from "lucide-react"
import { SafeImage } from "@/components/SafeImage"

interface MediaFile {
  id: string
  original_name: string
  file_name: string
  file_path: string
  file_url: string
  file_type: string
  file_size: number
}

interface MediaPlayerProps {
  media: MediaFile
  className?: string
  showControls?: boolean
  autoPlay?: boolean
  showDownload?: boolean
  // When true, hide filename, type, size, and any non-essential UI
  hideMeta?: boolean
}

export function MediaPlayer({
  media,
  className = "",
  showControls = true,
  autoPlay = false,
  showDownload = true,
  hideMeta = false
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isVideo = media.file_type.startsWith("video/")
  const isAudio = media.file_type.startsWith("audio/")
  const isImage = media.file_type.startsWith("image/")

  // Set loading state when component mounts
  useEffect(() => {
    console.log('MediaPlayer mounted for:', media.file_url, 'type:', media.file_type)
    if (isVideo || isAudio) {
      setIsLoading(true)
      // Force load the media to get metadata
      if (mediaRef.current) {
        console.log('Calling load() on media element')
        mediaRef.current.load()
      }
    }
  }, [isVideo, isAudio, media.file_url])

  const mediaRef = isVideo ? videoRef : audioRef

  const handlePlayPause = () => {
    if (!mediaRef.current) return

    if (isPlaying) {
      mediaRef.current.pause()
    } else {
      mediaRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return
    setCurrentTime(mediaRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return
    const newDuration = mediaRef.current.duration
    console.log('Loaded metadata, duration:', newDuration, 'isFinite:', isFinite(newDuration))
    if (isFinite(newDuration) && newDuration > 0) {
      setDuration(newDuration)
      setIsLoading(false)
    } else {
      // Fallback: try to get duration after a short delay
      setTimeout(() => {
        if (mediaRef.current && isFinite(mediaRef.current.duration) && mediaRef.current.duration > 0) {
          console.log('Fallback duration loaded:', mediaRef.current.duration)
          setDuration(mediaRef.current.duration)
          setIsLoading(false)
        } else {
          console.log('Duration still not available')
          setIsLoading(false) // Stop loading even if duration is not available
        }
      }, 2000)
    }
  }

  const handleError = () => {
    // Set a default duration if media fails to load
    setDuration(0)
    setIsLoading(false)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return
    const time = parseFloat(e.target.value)
    mediaRef.current.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return
    const vol = parseFloat(e.target.value)
    mediaRef.current.volume = vol
    setVolume(vol)
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (!mediaRef.current) return
    const newMuted = !isMuted
    mediaRef.current.muted = newMuted
    setIsMuted(newMuted)
  }

  const skipTime = (seconds: number) => {
    if (!mediaRef.current) return
    mediaRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
  }

  const restart = () => {
    if (!mediaRef.current) return
    mediaRef.current.currentTime = 0
    setCurrentTime(0)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (time: number) => {
    // Handle invalid values
    if (!isFinite(time) || isNaN(time) || time < 0) {
      return "0:00"
    }

    // Handle very large values
    if (time > 86400) { // More than 24 hours
      return "∞:∞"
    }

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isImage) {
    return (
      <Card className={`overflow-hidden ${className}`}>
          <div className="relative" onContextMenu={hideMeta ? (e) => e.preventDefault() : undefined}>
          <SafeImage
            src={media.file_url}
            alt={media.original_name}
            width={800}
            height={600}
            className="w-full h-auto object-cover"
              draggable={hideMeta ? false : undefined}
          />
          {showDownload && !hideMeta && (
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/50 hover:bg-black/70 text-white border-0"
                asChild
              >
                <a
                  href={media.file_url}
                  download={media.original_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Download ${media.original_name}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </div>
        {!hideMeta && (
          <div className="p-4">
            <h3 className="font-medium text-sm mb-2">{media.original_name}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="outline">{media.file_type.split("/")[1].toUpperCase()}</Badge>
              <span>{formatFileSize(media.file_size)}</span>
            </div>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div ref={containerRef} className="relative bg-black">
        {isVideo && (
          <div className="relative">
            <video
              ref={videoRef}
              src={media.file_url}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onLoadStart={() => setIsLoading(true)}
              onCanPlay={() => setIsLoading(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onClick={showControls ? undefined : handlePlayPause}
              autoPlay={autoPlay}
              poster={media.file_type.startsWith("video/") ? undefined : undefined}
              controls={showControls}
              muted={!showControls} // Mute by default for previews
              preload="metadata"
              controlsList={hideMeta ? "nodownload noplaybackrate" : undefined}
              disablePictureInPicture={hideMeta ? true : undefined}
              playsInline
              onContextMenu={hideMeta ? (e) => e.preventDefault() : undefined}
            />
            {!showControls && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Button size="lg" variant="secondary" className="rounded-full">
                  <Play className="h-8 w-8 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}

        {isAudio && (
          <div className="p-8 flex items-center justify-center min-h-[200px] cursor-pointer" onClick={showControls ? undefined : handlePlayPause}>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                {isPlaying ? <Pause className="h-12 w-12 text-white" /> : <Play className="h-12 w-12 text-white" />}
              </div>
              <audio
                ref={audioRef}
                src={media.file_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={handleError}
                onLoadStart={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                autoPlay={autoPlay}
                controls={showControls}
                preload="metadata"
                controlsList={hideMeta ? "nodownload noplaybackrate" : undefined}
                onContextMenu={hideMeta ? (e) => e.preventDefault() : undefined}
              />
            </div>
          </div>
        )}

        {showControls && (isVideo || isAudio) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                aria-label="Seek video/audio"
                disabled={duration <= 0}
              />
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>
                  {isLoading ? "Loading..." : (duration > 0 ? formatTime(duration) : "0:00")}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={restart}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skipTime(-10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => skipTime(10)}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                  aria-label="Volume control"
                />
              </div>

              <div className="flex items-center gap-2">
                {showDownload && !hideMeta && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    asChild
                  >
                    <a
                      href={media.file_url}
                      download={media.original_name}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Download ${media.original_name}`}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {isVideo && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {!hideMeta && (
        <div className="p-4">
          <h3 className="font-medium text-sm mb-2">{media.original_name}</h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline">{media.file_type.split("/")[0].toUpperCase()}</Badge>
            <span>{formatFileSize(media.file_size)}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </Card>
  )
}
