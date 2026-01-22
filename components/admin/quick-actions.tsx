"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PenTool, FileText, ImageIcon, MessageCircle, BarChart3, Plus, Sparkles, Bell, User } from "lucide-react"

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
    {
      title: "View Messages",
      description: "Check admin messages",
      icon: MessageCircle,
      href: "/admin/messages",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      hoverColor: "hover:bg-pink-100 dark:hover:bg-pink-900/30",
    },
    {
      title: "Notifications",
      description: "Manage notifications",
      icon: Bell,
      href: "/admin/notifications",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      hoverColor: "hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
    },
    {
      title: "Profile",
      description: "View and edit your profile",
      icon: User,
      href: "/admin/profile",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-900/30",
    },
    {
      title: "Push Notifications History",
      description: "View past push notifications",
      icon: Bell,
      href: "/admin/push-history",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      hoverColor: "hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
    },
    {
      title: "Send Push Notification",
      description: "Create and send a new push notification",
      icon: Bell,
      href: "/admin/create-notifications",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      hoverColor: "hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
    },
    {
      title: "Manage Push Subscriptions",
      description: "View and manage push subscriptions",
      icon: Bell,
      href: "/admin/push-subscribers",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      hoverColor: "hover:bg-cyan-100 dark:hover:bg-cyan-900/30",
    },
    {
      title: "Admin Settings",
      description: "Configure admin settings",
      icon: User,
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-900/20",
      hoverColor: "hover:bg-gray-100 dark:hover:bg-gray-900/30",
    },
    {
      title: "Manage Spoken Words",
      description: "View and edit spoken word entries",
      icon: Sparkles,
      href: "/admin/spoken-words",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      hoverColor: "hover:bg-purple-100 dark:hover:bg-purple-900/30",
    },
    {
      title: "Whispr Wall",
      description: "View and manage Whispr wall posts",
      icon: MessageCircle,
      href: "/admin/whispr-wall",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20",
      hoverColor: "hover:bg-pink-100 dark:hover:bg-pink-900/30",
    },
    {
      title: "Manage Whispr Chronicles",
      description: "View and edit Whispr Chronicles entries",
      icon: FileText,
      href: "/admin/chronicles",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      hoverColor: "hover:bg-green-100 dark:hover:bg-green-900/30",
    }
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
