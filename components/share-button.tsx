"use client"

import { useState } from "react"

type Props = {
  shareUrl?: string
  title?: string
}

export default function ShareButton({ shareUrl = '/welcome', title = 'Whispr' }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? new URL(shareUrl, window.location.origin).toString() : shareUrl
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch (e) {
        // fallthrough to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      // no-op
    }
  }

  return (
    <button onClick={handleShare} className="px-3 py-2 rounded-md bg-white/6 hover:bg-white/8 transition outline outline-primary/50 hover:bg-primary/40">
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}
