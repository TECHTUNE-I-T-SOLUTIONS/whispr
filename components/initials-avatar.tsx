"use client"

import React, { useMemo } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface InitialsAvatarProps {
  name?: string | null
  src?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function InitialsAvatar({ name, src, size = "md", className = "" }: InitialsAvatarProps) {
  const initials = useMemo(() => {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [name])

  const sizeClass = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10"

  return (
    <Avatar>
      {src ? <AvatarImage src={src} alt={name || "avatar"} /> : null}
      <AvatarFallback className={`${sizeClass} ${className}`}>{initials}</AvatarFallback>
    </Avatar>
  )
}
