"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { BookOpen, ArrowLeft, Eye, Heart, MessageSquare, Share2, Loader2, AlertCircle, TrendingUp, Sparkles } from "lucide-react"

interface Story {
  id: string
  title: string
  genre: string
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  chapters_count: number
}

export default function CreatorStoriesMetricsPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCreatorStories()
  }, [])

  const fetchCreatorStories = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/chronicles/creator/stories")
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to load analytics data")
      }
      setStories(data.stories || [])
    } catch (e: any) {
      setError(e.message || "Failed to gather analytics.")
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalViews = stories.reduce((sum, s) => sum + (s.views_count || 0), 0)
  const totalLikes = stories.reduce((sum, s) => sum + (s.likes_count || 0), 0)
  const totalComments = stories.reduce((sum, s) => sum + (s.comments_count || 0), 0)
  const totalShares = stories.reduce((sum, s) => sum + (s.shares_count || 0), 0)

  // Map Recharts data
  const chartData = stories.map((s) => ({
    name: s.title.substring(0, 15) + (s.title.length > 15 ? "..." : ""),
    Views: s.views_count || 0,
    Likes: s.likes_count || 0,
    Comments: s.comments_count || 0,
    Shares: s.shares_count || 0,
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <div className="flex flex-col items-center gap-4 max-w-md p-6 bg-card text-center rounded-xl shadow-lg border border-border/10">
          <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
          <p className="font-bold">{error}</p>
          <Button onClick={fetchCreatorStories} variant="outline" className="mt-2">
            Retry Gathering Metrics
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link
            href="/chronicles/stories"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Creator Stories Hub
          </Link>
        </div>

        {/* Dashboard Title banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary animate-pulse" />
            Stories Performance Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Check how readers engage, read, and comment across your stories series.</p>
        </div>

        {stories.length === 0 ? (
          <Card className="p-12 text-center rounded-xl border border-dashed border-border/20">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">Write your first story to unlock creator dashboard analytics!</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border/10 bg-gradient-to-br from-indigo-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Total Views</span>
                    <Eye className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalViews}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-pink-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Likes Count</span>
                    <Heart className="h-4 w-4 text-pink-500 fill-pink-500/20" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalLikes}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-purple-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Comments</span>
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalComments}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-emerald-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Total Shares</span>
                    <Share2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalShares}</div>
                </CardContent>
              </Card>
            </div>

            {/* Visual Performance Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main comparison chart - 2 cols */}
              <Card className="md:col-span-2 border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="p-6 pb-2 border-b border-border/10">
                  <CardTitle className="font-serif text-lg flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    Story Reach Comparison
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Compare views and likes across your serialized series.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border) / 0.2)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend fontSize={12} wrapperStyle={{ paddingTop: "10px" }} />
                      <Bar dataKey="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Engagement distributions - 1 col */}
              <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="p-6 pb-2 border-b border-border/10">
                  <CardTitle className="font-serif text-lg">Viral Amplifications</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Compare shares and reader comments.</CardDescription>
                </CardHeader>
                <CardContent className="p-6 h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" opacity={0.1} />
                      <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border) / 0.2)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend fontSize={12} wrapperStyle={{ paddingTop: "10px" }} />
                      <Line type="monotone" dataKey="Comments" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Shares" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Stories performance rankings table */}
            <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-border/10">
                <CardTitle className="font-serif text-lg">Story Performance Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/15 font-semibold">
                      <tr>
                        <th className="px-6 py-4">Story Outline</th>
                        <th className="px-6 py-4 text-center">Chapters</th>
                        <th className="px-6 py-4 text-center">Views</th>
                        <th className="px-6 py-4 text-center">Likes</th>
                        <th className="px-6 py-4 text-center">Comments</th>
                        <th className="px-6 py-4 text-center">Shares</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {stories.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-serif font-bold text-foreground">
                            {s.title}
                            <div className="text-[10px] text-muted-foreground font-sans mt-0.5 uppercase tracking-wider">{s.genre}</div>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-muted-foreground">{s.chapters_count || 0}</td>
                          <td className="px-6 py-4 text-center text-blue-400 font-semibold">{s.views_count || 0}</td>
                          <td className="px-6 py-4 text-center text-pink-500 font-semibold">{s.likes_count || 0}</td>
                          <td className="px-6 py-4 text-center text-purple-400 font-semibold">{s.comments_count || 0}</td>
                          <td className="px-6 py-4 text-center text-emerald-400 font-semibold">{s.shares_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
