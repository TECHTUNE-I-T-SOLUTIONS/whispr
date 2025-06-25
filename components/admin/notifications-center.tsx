"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Check, Settings, MessageCircle, Heart, Eye, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: "comment" | "reaction" | "milestone" | "system"
  title: string
  message: string
  read: boolean
  created_at: string
  metadata?: any
}

interface NotificationSettings {
  emailNotifications: boolean
  commentNotifications: boolean
  reactionNotifications: boolean
  milestoneNotifications: boolean
  systemNotifications: boolean
}

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    commentNotifications: true,
    reactionNotifications: true,
    milestoneNotifications: true,
    systemNotifications: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
    fetchSettings()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/notifications/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })

      if (response.ok) {
        setNotifications(notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/mark-all-read", {
        method: "POST",
      })

      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
        toast({
          variant: "success",
          title: "All notifications marked as read",
        })
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications(notifications.filter((n) => n.id !== notificationId))
        toast({
          variant: "success",
          title: "Notification deleted",
        })
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      const response = await fetch("/api/admin/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSettings(newSettings)
        toast({
          variant: "success",
          title: "Settings updated",
          description: "Your notification preferences have been saved.",
        })
      }
    } catch (error) {
      console.error("Error updating settings:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageCircle className="h-4 w-4 text-green-600" />
      case "reaction":
        return <Heart className="h-4 w-4 text-red-600" />
      case "milestone":
        return <Eye className="h-4 w-4 text-purple-600" />
      case "system":
        return <Bell className="h-4 w-4 text-blue-600" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "comment":
        return "bg-green-50 dark:bg-green-900/20"
      case "reaction":
        return "bg-red-50 dark:bg-red-900/20"
      case "milestone":
        return "bg-purple-50 dark:bg-purple-900/20"
      case "system":
        return "bg-blue-50 dark:bg-blue-900/20"
      default:
        return "bg-muted/50"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        {Array.from({ length: 3 }).map((_, i) => (
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
            <Bell className="h-8 w-8 text-primary" />
            Notifications
            {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground">Stay updated with your content activity</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {showSettings && (
        <Card className="border-0 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="comment-notifications">Comment Notifications</Label>
                <Switch
                  id="comment-notifications"
                  checked={settings.commentNotifications}
                  onCheckedChange={(checked) => updateSettings({ ...settings, commentNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reaction-notifications">Reaction Notifications</Label>
                <Switch
                  id="reaction-notifications"
                  checked={settings.reactionNotifications}
                  onCheckedChange={(checked) => updateSettings({ ...settings, reactionNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="milestone-notifications">Milestone Notifications</Label>
                <Switch
                  id="milestone-notifications"
                  checked={settings.milestoneNotifications}
                  onCheckedChange={(checked) => updateSettings({ ...settings, milestoneNotifications: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up! New notifications will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification, index) => (
            <Card
              key={notification.id}
              className={`animate-slide-up border-0 backdrop-blur transition-colors hover:bg-card/80 ${
                notification.read ? "bg-card/30" : "bg-card/50 border-l-4 border-l-primary"
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`h-10 w-10 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-sm font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && <div className="h-2 w-2 bg-primary rounded-full" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
