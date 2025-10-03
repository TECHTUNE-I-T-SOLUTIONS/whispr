"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ThumbsUp, Smile, Zap, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface Reaction {
  type: string
  count: number
}

interface ReactionsProps {
  postId: string
}

const reactionTypes = [
  { type: "like", icon: ThumbsUp, label: "Like 👍", color: "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950" },
  { type: "love", icon: Heart, label: "Love ❤️", color: "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" },
  { type: "smile", icon: Smile, label: "Smile 😊", color: "hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950" },
  { type: "wow", icon: Zap, label: "Wow 😮", color: "hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950" },
  { type: "star", icon: Star, label: "Star ⭐", color: "hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950" },
]

// ...imports remain the same

export function Reactions({ postId }: ReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cooldown, setCooldown] = useState(false)
  const { toast } = useToast()
  const cooldownTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchReactions()
    return () => {
      if (cooldownTimeout.current) clearTimeout(cooldownTimeout.current)
    }
  }, [postId])

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/reactions?post_id=${postId}`)
      if (response.ok) {
        const data = await response.json()
        setReactions(data.reactions || [])
        setUserReaction(data.userReaction || null)
      }
    } catch (error) {
      console.error("Error fetching reactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (type: string) => {
    if (cooldown) {
      toast({
        title: "Too fast!",
        description: "Please wait a moment before reacting again.",
        variant: "destructive",
      })
      return
    }

    setCooldown(true)
    cooldownTimeout.current = setTimeout(() => setCooldown(false), 1500)

    try {
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, reaction_type: type }),
      })

      if (response.ok) {
        const result = await response.json()

        setReactions((prev) =>
          prev.map((r) => {
            if (r.type === type) {
              return {
                ...r,
                count: result.action === "removed" ? r.count - 1 : r.count + 1,
              }
            }
            if (r.type === userReaction && result.action === "updated") {
              return { ...r, count: r.count - 1 }
            }
            return r
          })
        )

        setUserReaction(result.action === "removed" ? null : type)

        toast({
          title:
            result.action === "removed"
              ? "Reaction removed"
              : result.action === "updated"
              ? "Reaction updated"
              : "Reaction added",
          description: `You ${result.action} a ${type} reaction.`,
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

  const getReactionCount = (type: string) => reactions.find((r) => r.type === type)?.count || 0
  const getTotalReactions = () => reactions.reduce((sum, r) => sum + r.count, 0)

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
            <span className="text-sm font-normal text-muted-foreground">
              {getTotalReactions()} total
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {reactionTypes.map(({ type, icon: Icon, label, color }) => {
            const count = getReactionCount(type)
            const isCurrent = userReaction === type
            const isDisabled = userReaction && !isCurrent

            return (
              <motion.div
                key={type}
                whileTap={!isDisabled ? { scale: 0.9 } : {}}
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
              >
                <Button
                  variant={isCurrent ? "default" : "outline"}
                  size="sm"
                  disabled={isDisabled || cooldown}
                  onClick={() => handleReaction(type)}
                  className={`flex items-center gap-2 transition-all duration-300 ${
                    isCurrent ? "ring-2 ring-offset-2 ring-primary" : color
                  } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <Icon className={`h-4 w-4 ${isCurrent ? "text-primary" : ""}`} />
                  <motion.span
                    animate={{ scale: isCurrent ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {label}
                  </motion.span>
                  {count > 0 && (
                    <span className="bg-muted px-1.5 py-0.5 rounded-full text-xs">{count}</span>
                  )}
                </Button>
              </motion.div>
            )
          })}
        </div>

        {getTotalReactions() === 0 && (
          <p className="text-muted-foreground text-sm mt-4 text-center">
            Be the first to react to this post!
          </p>
        )}
      </CardContent>
    </Card>
  )
}
