"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Facebook, Twitter, Linkedin, Mail, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
}

export function ShareButtons({ url, title, description = "" }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const [supportsShare, setSupportsShare] = useState(false)
  const { toast } = useToast()

  // Check for native share support after hydration
  useEffect(() => {
    setSupportsShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      })
    }
  }

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: "hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: "hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
      color: "hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800",
    },
  ]

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5" />
          Share this post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy Link */}
        <div className="flex gap-2">
          <Input value={url} readOnly className="flex-1" />
          <Button onClick={copyToClipboard} variant="outline" size="sm" className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {shareLinks.map((link) => {
            const IconComponent = link.icon
            return (
              <Button
                key={link.name}
                variant="outline"
                size="sm"
                onClick={() => handleShare(link.url)}
                className={`flex items-center gap-2 ${link.color}`}
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{link.name}</span>
              </Button>
            )
          })}
        </div>

        {/* Native Share API (if supported) */}
        {supportsShare && (
          <Button
            variant="outline"
            onClick={() => {
              navigator
                .share({
                  title,
                  text: description,
                  url,
                })
                .catch(console.error)
            }}
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share via device
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
