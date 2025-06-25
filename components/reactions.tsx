"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Laugh, Frown, ThumbsUp, Zap, Angry } from "lucide-react"

interface ReactionsProps {
  postId: string
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  wow: Zap,
  haha: Laugh,
  sad: Frown,
  angry: Angry,
}

const reactionLabels = {
  like: "Like",
  love: "Love",
  wow: "Wow",
  haha: "Haha",
  sad: "Sad",
  angry: "Angry",
}

export function Reactions({ postId }: ReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReactions()
  }, [postId])

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/reactions?postId=${postId}`)
      if (response.ok) {
        const data = await response.json()
        setReactions(data)
      }
    } catch (error) {
      console.error("Error fetching reactions:", error)
    }
  }

  const handleReaction = async (reactionType: string) => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          reactionType,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Update local state
        setReactions((prev) => {
          const newReactions = { ...prev }
          if (result.action === "added") {
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1
            setUserReactions((prev) => new Set([...prev, reactionType]))
          } else {
            newReactions[reactionType] = Math.max((newReactions[reactionType] || 0) - 1, 0)
            setUserReactions((prev) => {
              const newSet = new Set(prev)
              newSet.delete(reactionType)
              return newSet
            })
          }
          return newReactions
        })
      }
    } catch (error) {
      console.error("Error updating reaction:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
      {Object.entries(reactionIcons).map(([type, Icon]) => {
        const count = reactions[type] || 0
        const isActive = userReactions.has(type)

        return (
          <Button
            key={type}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleReaction(type)}
            disabled={loading}
            className={`flex items-center gap-1 transition-all duration-200 ${
              isActive ? "bg-primary text-primary-foreground scale-105" : "hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{reactionLabels[type as keyof typeof reactionLabels]}</span>
            {count > 0 && <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded-full">{count}</span>}
          </Button>
        )
      })}
    </div>
  )
}
