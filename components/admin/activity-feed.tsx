"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, PenTool, MessageCircle, Heart, Eye, Filter, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: "post_created" | "comment_received" | "reaction_received" | "post_viewed"
  title: string
  description: string
  timestamp: string
  metadata?: any
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchActivities()
  }, [filter])

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/admin/activity?type=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "post_created":
        return <PenTool className="h-4 w-4 text-blue-600" />
      case "comment_received":
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case "reaction_received":
        return <Heart className="h-4 w-4 text-red-600" />
      case "post_viewed":
        return <Eye className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "post_created":
        return "bg-blue-50 dark:bg-blue-900/20"
      case "comment_received":
        return "bg-green-50 dark:bg-green-900/20"
      case "reaction_received":
        return "bg-red-50 dark:bg-red-900/20"
      case "post_viewed":
        return "bg-purple-50 dark:bg-purple-900/20"
      default:
        return "bg-muted/50"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground">Complete timeline of all events and interactions</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter activities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="post_created">Posts Created</SelectItem>
            <SelectItem value="comment_received">Comments</SelectItem>
            <SelectItem value="reaction_received">Reactions</SelectItem>
            <SelectItem value="post_viewed">Views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "Start creating content to see activity here!"
                  : `No ${filter.replace("_", " ")} activities found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity, index) => (
            <Card
              key={activity.id}
              className="animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80 transition-colors"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div
                    className={`h-10 w-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-foreground">{activity.title}</h3>
                      <div className="flex items-center gap-2">
                        {activity.metadata?.postType && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.postType === "poem" ? "✨ Poem" : "📝 Blog"}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
