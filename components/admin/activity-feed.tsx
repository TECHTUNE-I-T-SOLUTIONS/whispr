"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Clock,
  PenTool,
  MessageCircle,
  Heart,
  Eye,
  Filter,
  Calendar,
  Bell,
  Quote,
  ThumbsUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

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

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 5

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
      case "whispr_wall_posted":
        return <Bell className="h-4 w-4 text-blue-600" />
      case "wall_comment_received":
        return <Quote className="h-4 w-4 text-green-600" />
      case "wall_reaction_received":
        return <ThumbsUp className="h-4 w-4 text-yellow-600" />
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
      case "whispr_wall_posted":
        return "bg-blue-100 dark:bg-blue-900/30"
      case "wall_comment_received":
        return "bg-green-100 dark:bg-green-900/30"
      case "wall_reaction_received":
        return "bg-yellow-100 dark:bg-yellow-900/30"
      default:
        return "bg-muted/50"
    }
  }

  const filteredActivities = activities
    .filter((activity) =>
      activity.title.toLowerCase().includes(search.toLowerCase()) ||
      activity.description.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime()
      const timeB = new Date(b.timestamp).getTime()
      return sort === "newest" ? timeB - timeA : timeA - timeB
    })

  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE)
  const paginated = filteredActivities.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground">Complete timeline of all events and interactions</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter activities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="post_created">Posts</SelectItem>
              <SelectItem value="comment_received">Comments</SelectItem>
              <SelectItem value="reaction_received">Reactions</SelectItem>
              <SelectItem value="whispr_wall_posted">Whispr Wall</SelectItem>
              <SelectItem value="wall_comment_received">Wall Comments</SelectItem>
              <SelectItem value="wall_reaction_received">Wall Reactions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {paginated.length === 0 ? (
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
          paginated.map((activity, index) => (
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

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-1 rounded border bg-muted hover:bg-accent disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-1 rounded border bg-muted hover:bg-accent disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
