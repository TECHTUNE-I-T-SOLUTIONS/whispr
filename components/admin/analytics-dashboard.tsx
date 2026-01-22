"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Calendar, Clock, Share2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AnalyticsData {
  overview: {
    totalViews: number
    totalReactions: number
    totalComments: number
    avgReadingTime: number
    viewsGrowth: number
    reactionsGrowth: number
    totalWallPosts?: number
    totalWallComments?: number
    totalWallReactions?: number
  }
  viewsOverTime: Array<{ date: string; views: number; reactions: number }>
  topPosts: Array<{ title: string; views: number; reactions: number; type: string }>
  reactionBreakdown: Array<{ name: string; value: number; color: string }>
  trafficSources: Array<{ source: string; visits: number }>
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  useEffect(() => {
    fetchShares()
  }, [timeRange])

  const [sharesData, setSharesData] = useState<any | null>(null)

  const fetchShares = async () => {
    try {
      const res = await fetch(`/api/admin/shares?range=${timeRange}`)
      if (res.ok) {
        const j = await res.json()
        setSharesData(j)
      }
    } catch (e) {
      console.error('Failed to fetch shares', e)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No analytics data available</h3>
        <p className="text-muted-foreground">Start creating content to see analytics here!</p>
      </div>
    )
  }

  const overviewCards = [
    {
      title: "Total Views",
      value: analytics.overview.totalViews.toLocaleString(),
      icon: Eye,
      growth: analytics.overview.viewsGrowth,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Total Reactions",
      value: analytics.overview.totalReactions.toLocaleString(),
      icon: Heart,
      growth: analytics.overview.reactionsGrowth,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Total Comments",
      value: analytics.overview.totalComments.toLocaleString(),
      icon: MessageCircle,
      growth: 0,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Avg. Reading Time",
      value: `${analytics.overview.avgReadingTime}m`,
      icon: Clock,
      growth: 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Total Shares",
      value: (sharesData?.totalShares || 0).toLocaleString(),
      icon: Share2,
      growth: 0,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-serif font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Detailed insights into your content performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
          <Card
            key={card.title}
            className="animate-slide-up border-0 bg-card/50 backdrop-blur"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold font-serif">{card.value}</p>
                  {card.growth !== 0 && (
                    <div
                      className={`flex items-center gap-1 text-xs ${card.growth > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {card.growth > 0 ? "+" : ""}
                      {card.growth}%
                    </div>
                  )}
                </div>
                <div className={`h-12 w-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Wall Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Wall Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.overview.totalWallPosts?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Wall Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.overview.totalWallComments?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Wall Reactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.overview.totalWallReactions?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Shares Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(sharesData?.totalShares || 0).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total shares in the selected range</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Top Recent Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(sharesData?.topReferrers || []).slice(0, 10).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="text-sm">{r.user_agent ? (r.user_agent.substring(0, 60) + (r.user_agent.length>60? '...':'')) : 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString?.() || ''}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Views Over Time */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Views & Reactions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.viewsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="reactions" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Posts */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Top Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topPosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Reaction Breakdown */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Reaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.reactionBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                >
                  {analytics.reactionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Traffic Sources */}
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.trafficSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{source.source}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{source.visits} visits</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
