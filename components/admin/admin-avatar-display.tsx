"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface AdminAvatarDisplayProps {
  adminId?: string
  adminName?: string
  username?: string
  fallbackUrl?: string
  size?: "sm" | "md" | "lg"
  className?: string
  useImage?: boolean // true for Next.js Image, false for Avatar component
}

/**
 * Fetches admin avatar from /api/admin/avatar endpoint and displays it.
 * Works for any admin in the system.
 */
export function AdminAvatarDisplay({
  adminId,
  adminName,
  username,
  fallbackUrl = "/placeholder.svg",
  size = "md",
  className = "",
  useImage = false,
}: AdminAvatarDisplayProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const displayName = adminName || username || "Admin"
  const initial = displayName.charAt(0).toUpperCase()

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  useEffect(() => {
    // Only fetch if we have an adminId
    if (!adminId) return

    const fetchAvatarUrl = async () => {
      try {
        setIsLoading(true)
        // Fetch the full avatar URL from the endpoint for this specific admin
        const res = await fetch(`/api/admin/avatar?adminId=${adminId}`)
        if (!res.ok) {
          console.warn(`Failed to fetch avatar for admin ${adminId}`)
          setAvatarUrl(fallbackUrl)
          return
        }

        const data = await res.json()
        if (data.avatar_url && data.avatar_url !== "/placeholder.svg") {
          setAvatarUrl(data.avatar_url)
        } else {
          setAvatarUrl(fallbackUrl)
        }
      } catch (error) {
        console.error("Error fetching admin avatar:", error)
        setAvatarUrl(fallbackUrl)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvatarUrl()
  }, [adminId, fallbackUrl])

  // Show fallback while loading
  if (isLoading || !avatarUrl) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {initial}
        </AvatarFallback>
      </Avatar>
    )
  }

  // Use Next.js Image component if requested
  if (useImage) {
    const imageSizeMap = { sm: 24, md: 32, lg: 48 }
    return (
      <Image
        src={avatarUrl}
        alt={displayName}
        width={imageSizeMap[size]}
        height={imageSizeMap[size]}
        className={`rounded-full object-cover ${className}`}
        unoptimized
      />
    )
  }

  // Use Avatar component (shadcn)
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
