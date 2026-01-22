"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, Trash2, MessageCircle, Heart, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type NotificationType = "comment" | "reaction" | "milestone" | "system" | "wall_comment" | "wall_reaction" | "whispr_wall"

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
}

// helper: return a small icon for the notification type
function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "comment":
    case "wall_comment":
      return <MessageCircle className="h-5 w-5 text-green-600" />
    case "reaction":
    case "wall_reaction":
      return <Heart className="h-5 w-5 text-red-600" />
    case "milestone":
      return <Eye className="h-5 w-5 text-purple-600" />
    case "system":
    case "whispr_wall":
      return <Bell className="h-5 w-5 text-blue-600" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

// helper: return a background class for the icon container
function getNotificationBg(type: NotificationType) {
  switch (type) {
    case "comment":
    case "wall_comment":
      return "bg-green-50"
    case "reaction":
    case "wall_reaction":
      return "bg-red-50"
    case "milestone":
      return "bg-purple-50"
    case "system":
    case "whispr_wall":
      return "bg-blue-50"
    default:
      return "bg-muted/10"
  }
}

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" })
      if (res.ok) {
  const data = await res.json()
  setNotifications(data)
  setPage(1)
  return data
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
    return []
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!mounted) return
      await fetchNotifications()
    })()
    return () => {
      mounted = false
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" })
      // refresh from server to keep counts accurate
      await fetchNotifications()
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to mark as read" })
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" })
      // refresh to ensure unread counts and list correctness
      await fetchNotifications()
      toast({ title: "Notification deleted" })
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to delete notification" })
    }
  }

  const markAllAsRead = async () => {
    if (notifications.filter((n) => !n.read).length === 0) return
    try {
      await fetch(`/api/admin/notifications/mark-all-read`, { method: "POST" })
      await fetchNotifications()
      toast({ title: "All notifications marked as read" })
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to mark all as read" })
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length
  const paginated = notifications.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(notifications.length / pageSize))

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold flex items-center gap-2">
            <Bell /> Notifications {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
          </h1>
          <span className="text-sm text-muted-foreground">{isRefreshing ? 'Refreshing…' : `${notifications.length} total`}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={unreadCount === 0 || isRefreshing} onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent>Loading...</CardContent>
          </Card>
        ) : paginated.length === 0 ? (
          <Card>
            <CardContent>No notifications</CardContent>
          </Card>
        ) : (
          paginated.map((n) => (
            <Card key={n.id} className="overflow-hidden">
              <CardContent className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className={`mt-2 h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationBg(n.type)}`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="min-w-0 mt-3">
                      <div className="font-medium text-sm leading-tight break-words">{n.title}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words mb-1 max-w-[60ch]">{n.message}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 ml-4">
                  {!n.read && (
                    <Button variant="ghost" size="icon" className="p-1" onClick={() => markAsRead(n.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="p-1" onClick={() => deleteNotification(n.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
