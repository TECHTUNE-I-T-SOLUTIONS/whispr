"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ThumbsUp, Smile, Zap, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reaction {
  type: string
  count: number
}

interface ReactionsProps {
  postId: string
}

const reactionTypes = [
  { type: "like", icon: ThumbsUp, label: "Like", color: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950" },
  { type: "love", icon: Heart, label: "Love", color: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" },
  {
    type: "smile",
    icon: Smile,
    label: "Smile",
    color: "hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950",
  },
  { type: "wow", icon: Zap, label: "Wow", color: "hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950" },
  {
    type: "star",
    icon: Star,
    label: "Star",
    color: "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950",
  },
]

export function Reactions({ postId }: ReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReactions, setUserReactions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchReactions()
  }, [postId])

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/reactions?post_id=${postId}`)
      if (response.ok) {
        const data = await response.json()
        setReactions(data.reactions || [])
        setUserReactions(data.userReactions || [])
      }
    } catch (error) {
      console.error("Error fetching reactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (type: string) => {
    const hasReacted = userReactions.includes(type)

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          reaction_type: type,
          action: hasReacted ? "remove" : "add",
        }),
      })

      if (response.ok) {
        // Update local state optimistically
        setReactions((prev) =>
          prev.map((r) => (r.type === type ? { ...r, count: hasReacted ? r.count - 1 : r.count + 1 } : r)),
        )

        setUserReactions((prev) => (hasReacted ? prev.filter((r) => r !== type) : [...prev, type]))

        toast({
          title: hasReacted ? "Reaction removed" : "Reaction added",
          description: `You ${hasReacted ? "removed" : "added"} a ${type} reaction`,
        })
      } else {
        throw new Error("Failed to update reaction")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getReactionCount = (type: string) => {
    const reaction = reactions.find((r) => r.type === type)
    return reaction?.count || 0
  }

  const getTotalReactions = () => {
    return reactions.reduce((total, reaction) => total + reaction.count, 0)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 w-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Reactions
          {getTotalReactions() > 0 && (
            <span className="text-sm font-normal text-muted-foreground">{getTotalReactions()} total</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {reactionTypes.map(({ type, icon: Icon, label, color }) => {
            const count = getReactionCount(type)
            const hasReacted = userReactions.includes(type)

            return (
              <Button
                key={type}
                variant={hasReacted ? "default" : "outline"}
                size="sm"
                onClick={() => handleReaction(type)}
                className={`flex items-center gap-2 ${!hasReacted ? color : ""}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {count > 0 && <span className="bg-muted px-1.5 py-0.5 rounded-full text-xs">{count}</span>}
              </Button>
            )
          })}
        </div>

        {getTotalReactions() === 0 && (
          <p className="text-muted-foreground text-sm mt-4 text-center">Be the first to react to this post!</p>
        )}
      </CardContent>
    </Card>
  )
}
