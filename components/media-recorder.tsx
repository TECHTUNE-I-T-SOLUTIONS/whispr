"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Play,
  Pause,
  Square,
  Trash2,
  Upload,
  RotateCcw,
  Save
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MediaRecorderProps {
  type: "audio" | "video"
  onRecordingComplete: (blob: Blob, duration: number) => void
  maxSizeMB?: number
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  size: number
  chunks: Blob[]
}

export function MediaRecorder({ type, onRecordingComplete, maxSizeMB = 50 }: MediaRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    size: 0,
    chunks: []
  })
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [recordedDetails, setRecordedDetails] = useState<{
    duration: number
    size: number
  } | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [mediaDuration, setMediaDuration] = useState<number>(0)
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Calculate approximate bitrate for size estimation
  const getEstimatedBitrate = useCallback(() => {
    if (type === "audio") {
      // Audio: ~128 kbps = 16 KB/s
      return 128 * 1024 / 8 // bits per second
    } else {
      // Video: ~2 Mbps = 250 KB/s (conservative estimate)
      return 2 * 1024 * 1024 / 8 // bits per second
    }
  }, [type])

  const getMaxDurationSeconds = useCallback(() => {
    const bitrate = getEstimatedBitrate()
    const maxBytes = maxSizeMB * 1024 * 1024
    return Math.floor(maxBytes / bitrate)
  }, [maxSizeMB, getEstimatedBitrate])

  const formatTime = (seconds: number) => {
    // Handle invalid values
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return "0:00"
    }

    // Handle very large values
    if (seconds > 86400) { // More than 24 hours
      return "∞:∞"
    }

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const requestPermissions = async () => {
    try {
      const constraints = type === "audio"
        ? { audio: true }
        : { audio: true, video: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      setHasPermission(true)
      setPermissionGranted(true)

      if (type === "video" && videoRef.current) {
        videoRef.current.srcObject = stream
      }

      toast({
        title: "Permission granted",
        description: `You can now record ${type} content.`
      })
    } catch (error) {
      console.error("Permission denied:", error)
      setHasPermission(false)
      setPermissionGranted(false)
      toast({
        variant: "destructive",
        title: "Permission denied",
        description: `Please allow ${type} access to record.`
      })
    }
  }

  const checkPermissions = async () => {
    try {
      // Simple check - try to get user media
      const constraints = type === "audio"
        ? { audio: true }
        : { audio: true, video: true }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.getTracks().forEach(track => track.stop()) // Stop immediately

      setPermissionGranted(true)
      setHasPermission(true)
    } catch (error) {
      setPermissionGranted(null)
      setHasPermission(null)
    }
  }

  const previewRecording = () => {
    if (recordedBlob) {
      if (type === "audio") {
        // Create a temporary URL for the current recording
        const tempUrl = URL.createObjectURL(recordedBlob)

        // Create a temporary audio element for preview
        const tempAudio = new Audio(tempUrl)
        tempAudio.currentTime = 0
        tempAudio.play()
        setIsPlaying(true)
        setPlaybackTime(0)

        // Track playback time
        const updateTime = () => {
          setPlaybackTime(tempAudio.currentTime)
        }

        const handleEnded = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
          URL.revokeObjectURL(tempUrl)
        }

        tempAudio.addEventListener('timeupdate', updateTime)
        tempAudio.addEventListener('ended', handleEnded)

        // Don't set src on the main audio element to avoid conflicts
        // if (audioRef.current) {
        //   audioRef.current.src = tempUrl
        // }
      } else if (type === "video") {
        // For video, use the existing video element
        if (videoRef.current && recordedUrl) {
          videoRef.current.src = recordedUrl
          videoRef.current.currentTime = 0
          videoRef.current.play()
          setIsPlaying(true)
          setPlaybackTime(0)

          // Track playback time
          const updateTime = () => {
            setPlaybackTime(videoRef.current?.currentTime || 0)
          }

          const handleEnded = () => {
            setIsPlaying(false)
            setPlaybackTime(0)
          }

          videoRef.current.addEventListener('timeupdate', updateTime)
          videoRef.current.addEventListener('ended', handleEnded)

          // Cleanup listeners when video ends
          videoRef.current.addEventListener('ended', () => {
            videoRef.current?.removeEventListener('timeupdate', updateTime)
            videoRef.current?.removeEventListener('ended', handleEnded)
          })
        }
      }
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) {
      await requestPermissions()
      if (!streamRef.current) return
    }

    try {
      // Clean up any existing recorder
      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
        mediaRecorderRef.current = null
      }

      const recorder = new (window as any).MediaRecorder(streamRef.current)

      const chunks: Blob[] = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        // Use only the local chunks collected for this recording session
        const blob = new Blob(chunks, {
          type: type === "audio" ? "audio/webm" : "video/webm"
        })
        const url = URL.createObjectURL(blob)

        setRecordedBlob(blob)
        setRecordedUrl(url)
        setRecordedDetails({
          duration: recordingState.duration,
          size: blob.size
        })
        setIsMediaLoading(true) // Set loading while media loads metadata

        // Reset recording state (clear chunks for next recording)
        setRecordingState(prev => ({
          ...prev,
          chunks: [],
          isRecording: false,
          isPaused: false
        }))

        // Clear the ref to the recorder so a new one can be created later
        mediaRecorderRef.current = null

        onRecordingComplete(blob, recordingState.duration)
      }

      recorder.onstart = () => {
        // Recording started successfully
      }

      recorder.onerror = (event: Event) => {
        console.error("MediaRecorder error:", event)
        toast({
          variant: "destructive",
          title: "Recording error",
          description: "An error occurred during recording."
        })
      }

      mediaRecorderRef.current = recorder
      recorder.start(1000) // Collect data every second

      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        size: 0,
        chunks: []
      }))

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1
          const maxDuration = getMaxDurationSeconds()

          if (newDuration >= maxDuration) {
            stopRecording()
            toast({
              variant: "destructive",
              title: "Recording stopped",
              description: `Maximum duration reached (${formatTime(maxDuration)}).`
            })
            return prev
          }

          return {
            ...prev,
            duration: newDuration,
            size: Math.floor((newDuration * getEstimatedBitrate()) / 8)
          }
        })
      }, 1000)

    } catch (error) {
      console.error("Recording failed:", error)
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Failed to start recording. Please try again."
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      if (recordingState.isPaused) {
        // Resume recording
        mediaRecorderRef.current.resume()
        setRecordingState(prev => ({ ...prev, isPaused: false }))

        // Resume duration timer
        intervalRef.current = setInterval(() => {
          setRecordingState(prev => ({
            ...prev,
            duration: prev.duration + 1,
            size: Math.floor(((prev.duration + 1) * getEstimatedBitrate()) / 8)
          }))
        }, 1000)
      } else {
        // Pause recording
        mediaRecorderRef.current.pause()
        setRecordingState(prev => ({ ...prev, isPaused: true }))

        // Store current chunks for resuming
        if (mediaRecorderRef.current && typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData()
        }

        // Pause duration timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.warn('Error stopping recorder:', e)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const deleteRecording = () => {
    // Pause and clear any media elements that might be using the recorded URL
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        // Remove source to avoid using revoked URL
        audioRef.current.src = ''
        audioRef.current.load()
      }
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.src = ''
        videoRef.current.load()
      }
    } catch (e) {
      // ignore cleanup errors
    }

    if (recordedUrl) {
      try { URL.revokeObjectURL(recordedUrl) } catch (e) { /* ignore */ }
    }

    setRecordedBlob(null)
    setRecordedUrl(null)
    setRecordedDetails(null)
    setMediaDuration(0)
    setIsMediaLoading(false)
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      size: 0,
      chunks: []
    })
    setIsPlaying(false)
    setPlaybackTime(0)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const playRecording = () => {
    if (recordedUrl) {
      if (type === "audio" && audioRef.current) {
        const audio = audioRef.current
        try {
          audio.currentTime = 0
          void audio.play()
        } catch (e) {
          console.error('Audio play error:', e)
          setIsPlaying(false)
          setPlaybackTime(0)
          toast({ variant: 'destructive', title: 'Playback error', description: 'Failed to play the recording.' })
          return
        }
        setIsPlaying(true)
        setPlaybackTime(0)

        // Track playback time
        const updateTime = () => {
          if (audio) {
            setPlaybackTime(audio.currentTime)
          }
        }

        const handleEnded = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
        }

        audio.addEventListener('timeupdate', updateTime)
        audio.addEventListener('ended', handleEnded)

        // Cleanup listeners when audio ends
        audio.addEventListener('ended', () => {
          audio.removeEventListener('timeupdate', updateTime)
          audio.removeEventListener('ended', handleEnded)
        })

      } else if (type === "video" && videoRef.current) {
        const video = videoRef.current
        try {
          video.src = recordedUrl
          video.currentTime = 0
          void video.play()
        } catch (e) {
          console.error('Video play error:', e)
          setIsPlaying(false)
          setPlaybackTime(0)
          toast({ variant: 'destructive', title: 'Playback error', description: 'Failed to play the recording.' })
          return
        }
        setIsPlaying(true)
        setPlaybackTime(0)

        // Track playback time
        const updateTime = () => {
          if (video) {
            setPlaybackTime(video.currentTime)
          }
        }

        const handleEnded = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
        }

        video.addEventListener('timeupdate', updateTime)
        video.addEventListener('ended', handleEnded)

        // Cleanup listeners when video ends
        video.addEventListener('ended', () => {
          video.removeEventListener('timeupdate', updateTime)
          video.removeEventListener('ended', handleEnded)
        })
      }
    }
  }

  const restartRecording = () => {
    deleteRecording()
    setMediaDuration(0)
    setIsMediaLoading(false)
    startRecording()
  }

  // Check permissions on mount
  useEffect(() => {
    checkPermissions()
  }, [type])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [recordedUrl])

  const maxDuration = getMaxDurationSeconds()
  const progressPercent = (recordingState.duration / maxDuration) * 100

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Permission Request */}
        {permissionGranted === null && (
          <div className="text-center space-y-4">
            <div className="text-4xl">
              {type === "audio" ? <Mic className="mx-auto text-muted-foreground" /> : <Video className="mx-auto text-muted-foreground" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {type === "audio" ? "Audio Recording" : "Video Recording"}
              </h3>
              <p className="text-muted-foreground mb-4">
                Click below to grant permission and start recording
              </p>
              <Button onClick={requestPermissions} size="lg">
                <Mic className="mr-2 h-4 w-4" />
                Grant {type} Permission
              </Button>
            </div>
          </div>
        )}

        {/* Live Preview (Video Only) */}
        {hasPermission && type === "video" && recordingState.isRecording && !recordedBlob && (
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <video
              ref={videoRef}
              className="w-full h-48 bg-black rounded-lg"
              muted
              autoPlay
              playsInline
            />
          </div>
        )}

        {/* Audio Wave Visualizer (Audio Only) */}
        {hasPermission && type === "audio" && (recordingState.isRecording || (recordingState.isPaused && recordedBlob) || isPlaying) && (
          <div className="space-y-2">
            <Label>
              {recordingState.isRecording && !recordingState.isPaused ? "Recording Audio Wave" :
               recordingState.isPaused && recordedBlob ? "Preview Audio Wave" :
               isPlaying ? "Playing Audio Wave" : "Audio Wave"}
            </Label>
            <div className="h-15 bg-muted/20 rounded border flex items-center justify-center text-sm text-muted-foreground">
              {recordingState.isRecording && !recordingState.isPaused ? "🎤 Recording..." :
               recordingState.isPaused && recordedBlob ? "⏸️ Paused - Click Play to Preview" :
               isPlaying ? "▶️ Playing Audio..." : "🎵 Ready to Record"}
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {hasPermission && (
          <div className="space-y-4">
            {/* Recording Status */}
            {recordingState.isRecording && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={recordingState.isPaused ? "secondary" : "destructive"}>
                    {recordingState.isPaused ? "Paused" : "Recording"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(recordingState.duration)} / {formatTime(maxDuration)}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Size: {formatSize(recordingState.size)} / {maxSizeMB} MB
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2">
              {permissionGranted === true && !recordingState.isRecording && !recordedBlob && (
                <Button onClick={startRecording} size="sm">
                  <Mic className="mr-2 h-4 w-4" />
                  Start Recording
                </Button>
              )}

              {recordingState.isRecording && (
                <>
                  <Button
                    onClick={pauseRecording}
                    variant="outline"
                    size="sm"
                  >
                    {recordingState.isPaused ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}

              {recordingState.isPaused && recordedBlob && (
                <Button
                  onClick={previewRecording}
                  variant="outline"
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Preview Recording
                </Button>
              )}

              {!recordingState.isRecording && recordedBlob && (
                <>
                  <Button
                    onClick={playRecording}
                    variant="outline"
                    size="sm"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </Button>
                  <Button
                    onClick={restartRecording}
                    variant="outline"
                    size="sm"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Record Again
                  </Button>
                  <Button
                    onClick={deleteRecording}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>

            {/* Recorded Media Preview */}
            {recordedBlob && recordedUrl && (
              <div className="space-y-4">
                <Label>Recorded {type === "audio" ? "Audio" : "Video"}</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  {type === "audio" ? (
                    <>
                      <audio
                        ref={audioRef}
                        src={recordedUrl}
                        controls
                        className="w-full"
                        onEnded={() => setIsPlaying(false)}
                        onLoadedMetadata={() => {
                          if (audioRef.current) {
                            setMediaDuration(audioRef.current.duration)
                            setIsMediaLoading(false)
                          }
                        }}
                        onLoadStart={() => setIsMediaLoading(true)}
                        onTimeUpdate={() => {
                          if (audioRef.current) {
                            setPlaybackTime(audioRef.current.currentTime)
                          }
                        }}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                    </>
                  ) : (
                    <video
                      ref={videoRef}
                      src={recordedUrl}
                      controls
                      className="w-full h-48 bg-black rounded"
                      onEnded={() => setIsPlaying(false)}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setMediaDuration(videoRef.current.duration)
                          setIsMediaLoading(false)
                        }
                      }}
                      onLoadStart={() => setIsMediaLoading(true)}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setPlaybackTime(videoRef.current.currentTime)
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  )}
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>
                      Duration: {isMediaLoading ? "Loading..." : (mediaDuration > 0 ? formatTime(mediaDuration) : (recordedDetails ? formatTime(recordedDetails.duration) : formatTime(recordingState.duration)))} • Size: {recordedDetails ? formatSize(recordedDetails.size) : formatSize(recordedBlob.size)}
                    </span>
                    {isPlaying && (
                      <span>
                        Playing: {formatTime(playbackTime)} / {isMediaLoading ? "Loading..." : (mediaDuration > 0 ? formatTime(mediaDuration) : (recordedDetails ? formatTime(recordedDetails.duration) : formatTime(recordingState.duration)))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Permission Denied */}
        {permissionGranted === false && (
          <div className="text-center space-y-4">
            <div className="text-4xl text-red-500">
              {type === "audio" ? <MicOff className="mx-auto" /> : <VideoOff className="mx-auto" />}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Permission Required</h3>
              <p className="text-muted-foreground mb-4">
                {type === "audio"
                  ? "Microphone access is required for audio recording."
                  : "Camera and microphone access is required for video recording."
                }
              </p>
              <Button onClick={requestPermissions} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
