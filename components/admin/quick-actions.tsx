"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, FileText, ImageIcon, MessageCircle, BarChart3, Plus, Sparkles } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Write New Post",
      description: "Create a new blog post",
      icon: PenTool,
      href: "/admin/posts/new?type=blog",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      hoverColor: "hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
    {
      title: "Compose Poem",
      description: "Write a new poem",
      icon: Sparkles,
      href: "/admin/posts/new?type=poem",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
    },
    {
      title: "Manage Posts",
      description: "View and edit all posts",
      icon: FileText,
      href: "/admin/posts",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
    },
    {
      title: "Media Library",
      description: "Upload and manage media",
      icon: ImageIcon,
      href: "/admin/media",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      hoverColor: "hover:bg-orange-100 dark:hover:bg-orange-900/30",
    },
    {
      title: "Comments",
      description: "Moderate comments",
      icon: MessageCircle,
      href: "/admin/comments",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      hoverColor: "hover:bg-red-100 dark:hover:bg-red-900/30",
    },
    {
      title: "Feedback",
      description: "View user feedback",
      icon: MessageCircle,
      href: "/admin/feedback",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
      hoverColor: "hover:bg-teal-100 dark:hover:bg-teal-900/30",
    },
    {
      title: "Analytics",
      description: "View detailed stats",
      icon: BarChart3,
      href: "/admin/analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      hoverColor: "hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
    },
  ]

  return (
    <Card className="animate-slide-up border-0 bg-card/50 backdrop-blur" style={{ animationDelay: "0.4s" }}>
      <CardHeader>
        <CardTitle className="text-xl font-serif flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={action.title}
            asChild
            variant="ghost"
            className={`w-full justify-start h-auto p-4 ${action.hoverColor} transition-all duration-200 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Link href={action.href}>
              <div className="flex items-center space-x-4 w-full">
                <div
                  className={`h-10 w-10 rounded-lg ${action.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
