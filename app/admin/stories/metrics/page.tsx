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
import { BookOpen, ArrowLeft, Eye, Heart, MessageSquare, Share2, Loader2, AlertCircle, TrendingUp, Sparkles, ShieldAlert, Award } from "lucide-react"

interface StoryItem {
  id: string
  title: string
  genre: string
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  author_type: "admin" | "creator"
  author_name: string
}

export default function AdminStoriesMetricsPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [stories, setStories] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    verifyAdminAndLoad()
  }, [])

  const verifyAdminAndLoad = async () => {
    setCheckingAdmin(true)
    try {
      const res = await fetch("/api/admin/stories")
      if (res.ok) {
        setIsAdmin(true)
        await loadGlobalMetrics()
      } else {
        setIsAdmin(false)
      }
    } catch {
      setIsAdmin(false)
    } finally {
      setCheckingAdmin(false)
    }
  }

  const loadGlobalMetrics = async () => {
    setLoading(true)
    setError("")
    try {
      // Fetch both admin stories and creator stories in parallel
      const [adminRes, creatorRes] = await Promise.all([
        fetch("/api/admin/stories"),
        fetch("/api/admin/stories/moderation")
      ])

      if (!adminRes.ok || !creatorRes.ok) {
        throw new Error("Failed to gather platform story metrics.")
      }

      const adminData = await adminRes.json()
      const creatorData = await creatorRes.json()

      const combined: StoryItem[] = []

      // Map admin stories
      if (adminData.stories) {
        adminData.stories.forEach((s: any) => {
          combined.push({
            id: s.id,
            title: s.title,
            genre: s.genre,
            views_count: s.views_count || 0,
            likes_count: s.likes_count || 0,
            comments_count: s.comments_count || 0,
            shares_count: s.shares_count || 0,
            author_type: "admin",
            author_name: "Whispr Staff"
          })
        })
      }

      // Map creator stories
      if (creatorData.stories) {
        creatorData.stories.forEach((s: any) => {
          combined.push({
            id: s.id,
            title: s.title,
            genre: s.genre,
            views_count: s.views_count || 0,
            likes_count: s.likes_count || 0,
            comments_count: s.comments_count || 0,
            shares_count: s.shares_count || 0,
            author_type: "creator",
            author_name: s.creator?.pen_name || "Community"
          })
        })
      }

      // Sort by Views descending
      combined.sort((a, b) => b.views_count - a.views_count)
      setStories(combined)
    } catch (e: any) {
      setError(e.message || "Failed to consolidate metrics.")
    } finally {
      setLoading(false)
    }
  }

  // Consolidated KPIs
  const totalViews = stories.reduce((sum, s) => sum + s.views_count, 0)
  const totalLikes = stories.reduce((sum, s) => sum + s.likes_count, 0)
  const totalComments = stories.reduce((sum, s) => sum + s.comments_count, 0)
  const totalShares = stories.reduce((sum, s) => sum + s.shares_count, 0)

  // Chart data
  const chartData = stories.slice(0, 8).map((s) => ({
    name: s.title.substring(0, 12) + (s.title.length > 12 ? "..." : ""),
    Views: s.views_count,
    Likes: s.likes_count,
    Type: s.author_type === "admin" ? "Staff" : "Creator",
  }))

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black pt-20 px-4">
        <Card className="max-w-md w-full border border-red-500/20 bg-card text-center p-6 shadow-2xl rounded-2xl">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="font-serif text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Admin console clearance is required to view global consolidated metrics.
          </p>
          <Button asChild className="w-full bg-primary hover:bg-primary/95 rounded-lg">
            <Link href="/">Return Home</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="mb-6">
          <Link
            href="/admin/stories"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin Console
          </Link>
        </div>

        {/* Title banner */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Global Platform Stories Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Check combined reaches, viral interactions, and leaderboards across staff and community stories.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="font-bold">{error}</p>
            <Button onClick={loadGlobalMetrics} variant="outline">Retry</Button>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No stories recorded for global reach computation.</div>
        ) : (
          <div className="space-y-6">
            {/* KPI metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border border-border/10 bg-gradient-to-br from-indigo-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Global Views</span>
                    <Eye className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalViews}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-pink-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Global Likes</span>
                    <Heart className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalLikes}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-purple-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Global Comments</span>
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalComments}</div>
                </CardContent>
              </Card>

              <Card className="border border-border/10 bg-gradient-to-br from-emerald-950/20 to-slate-900/40 backdrop-blur rounded-xl">
                <CardContent className="p-5 flex flex-col justify-between h-28">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    <span>Global Shares</span>
                    <Share2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-serif">{totalShares}</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Reach chart */}
              <Card className="md:col-span-2 border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="p-6 pb-2 border-b border-border/10">
                  <CardTitle className="font-serif text-lg flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-primary" />
                    Top Story Outlines Reach
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Compare views vs likes among the 8 most viral serialized series.</CardDescription>
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

              {/* Distribution */}
              <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
                <CardHeader className="p-6 pb-2 border-b border-border/10">
                  <CardTitle className="font-serif text-lg flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-primary" />
                    Staff vs Creator reach
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Visual graph showing outline reach trends.</CardDescription>
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
                      <Line type="monotone" dataKey="Views" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Global ranks */}
            <Card className="border border-border/10 bg-card rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="p-6 pb-2 border-b border-border/10">
                <CardTitle className="font-serif text-lg">Platform Leaderboard Rankings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted/40 text-muted-foreground border-b border-border/15 font-semibold">
                      <tr>
                        <th className="px-6 py-4">Story Outline Series</th>
                        <th className="px-6 py-4">Author Profile</th>
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
                          <td className="px-6 py-4 font-medium text-slate-300">
                            {s.author_name}
                            <Badge className="ml-2 bg-muted border-border/20 text-[9px] uppercase tracking-wider h-4 px-1 text-slate-400">
                              {s.author_type === "admin" ? "Official" : "Creator"}
                            </Badge>
                          </td>
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
