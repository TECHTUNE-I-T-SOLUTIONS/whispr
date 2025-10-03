"use client"

import { useEffect, useState } from "react"
<<<<<<< HEAD
=======
import { useRouter } from "next/navigation"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Heart, MessageCircle, Eye, TrendingUp, Users, Calendar, Sparkles } from "lucide-react"

interface StatsData {
  totalPosts: number
  totalReactions: number
  totalComments: number
  totalViews: number
  postsThisMonth: number
  pendingComments: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<StatsData>({
    totalPosts: 0,
    totalReactions: 0,
    totalComments: 0,
    totalViews: 0,
    postsThisMonth: 0,
    pendingComments: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
<<<<<<< HEAD
=======
  const router = useRouter()
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError("Failed to load statistics")
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      setError("Failed to load statistics")
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: FileText,
      description: "Published content",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Reactions",
      value: stats.totalReactions,
      icon: Heart,
      description: "Reader engagement",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Comments",
      value: stats.totalComments,
      icon: MessageCircle,
      description: "Community discussions",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      description: "Content reach",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "This Month",
      value: stats.postsThisMonth,
      icon: Calendar,
      description: "New posts published",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Pending",
      value: stats.pendingComments,
      icon: Users,
      description: "Comments to review",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-muted rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
          <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to Load Statistics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={fetchStats} className="text-primary hover:text-primary/80 text-sm font-medium">
            Try Again
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Analytics Overview
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Real-time data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div
                  className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-serif">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state when all stats are zero */}
      {Object.values(stats).every((value) => value === 0) && (
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Welcome to Your Dashboard!</h3>
            <p className="text-muted-foreground mb-4">
              Start creating content to see your analytics come to life. Your journey begins with the first post!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
<<<<<<< HEAD
              <button className="text-primary hover:text-primary/80 text-sm font-medium">Create Your First Post</button>
              <span className="text-muted-foreground text-sm">or</span>
              <button className="text-primary hover:text-primary/80 text-sm font-medium">Write a Poem</button>
=======
              <button
                onClick={() => router.push("/admin/posts/new?type=blog")}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Create Your First Post
              </button>
              <span className="text-muted-foreground text-sm">or</span>
              <button
                onClick={() => router.push("/admin/posts/new?type=poem")}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Write a Poem
              </button>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
