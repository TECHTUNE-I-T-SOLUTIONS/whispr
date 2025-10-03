"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MessageCircle,
  Heart,
  Eye,
  Clock,
  ArrowRight,
  Feather,
  PenTool,
  Megaphone,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ActivityItem {
  id: string
  type:
    | "post_created"
    | "comment_received"
    | "reaction_received"
    | "post_viewed"
    | "whispr_wall_posted"
    | "wall_comment_received"
    | "wall_reaction_received"
  title: string
  description: string
  timestamp: string
  metadata?: any
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch("/api/admin/activity")
      if (response.ok) {
        const data = await response.json()
        // Just to be sure we only show the 10 most recent
        const limited = data.slice(0, 10)
        setActivities(limited)
      }
    } catch (error) {
      console.error("Error fetching activity:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post_created":
        return <PenTool className="h-4 w-4 text-blue-600" />
      case "comment_received":
      case "wall_comment_received":
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case "reaction_received":
      case "wall_reaction_received":
        return <Heart className="h-4 w-4 text-red-600" />
      case "post_viewed":
        return <Eye className="h-4 w-4 text-purple-600" />
      case "whispr_wall_posted":
        return <Megaphone className="h-4 w-4 text-indigo-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "post_created":
        return "bg-blue-50 dark:bg-blue-900/20"
      case "comment_received":
      case "wall_comment_received":
        return "bg-green-50 dark:bg-green-900/20"
      case "reaction_received":
      case "wall_reaction_received":
        return "bg-red-50 dark:bg-red-900/20"
      case "post_viewed":
        return "bg-purple-50 dark:bg-purple-900/20"
      case "whispr_wall_posted":
        return "bg-indigo-50 dark:bg-indigo-900/20"
      default:
        return "bg-muted/50"
    }
  }

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-muted rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-slide-up border-0 bg-card/50 backdrop-blur" style={{ animationDelay: "0.3s" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-serif flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/activity" className="flex items-center gap-2">
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
              <Feather className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">Start creating content to see activity here!</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`h-10 w-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">{activity.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </Badge>
                  {activity.metadata?.postType && (
                    <Badge variant="secondary" className="text-xs">
                      {activity.metadata.postType === "poem" ? "✨ Poem" : "📝 Blog"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
