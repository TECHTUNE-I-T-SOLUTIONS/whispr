"use client"

import Image, { ImageProps } from "next/image"
import { useState } from "react"

export function SafeImage(props: ImageProps) {
  const [src, setSrc] = useState(props.src)

  return (
    <Image
      {...props}
      src={src}
      onError={() => {
        setSrc("/placeholder-blur.png") // fallback image path
      }}
      placeholder="blur"
      blurDataURL="/placeholder-blur.png"
    />
  )
}
