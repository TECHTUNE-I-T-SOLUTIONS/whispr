"use client"

import Image, { ImageProps } from "next/image"
import { useState } from "react"

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | { src: string }
}

// Check if URL is external (not from Supabase)
const isExternalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return !urlObj.hostname.includes('supabase.co')
  } catch {
    return false
  }
}

export function SafeImage({ src, alt, className, fill, width, height, ...props }: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [useNativeImg, setUseNativeImg] = useState(false)
  const resolvedSrc = typeof imageSrc === 'string' ? imageSrc : imageSrc.src

  // For external URLs, use unoptimized Next.js Image or fall back to native img
  if (typeof resolvedSrc === 'string' && isExternalUrl(resolvedSrc)) {
    return (
      <img
        src={resolvedSrc}
        alt={alt || 'Image'}
        className={className}
        onError={() => {
          setImageSrc("/placeholder-blur.png")
        }}
        style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
      />
    )
  }

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt || 'Image'}
      onError={() => {
        setImageSrc("/placeholder-blur.png")
      }}
      placeholder="blur"
      blurDataURL="/placeholder-blur.png"
      className={className}
      fill={!width && !height && fill}
      width={width}
      height={height}
      style={!width && !height && fill ? { objectFit: 'cover' } : undefined}
    />
  )
}
