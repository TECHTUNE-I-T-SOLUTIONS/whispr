"use client"

import React, { useEffect, useState, useCallback, useMemo, memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, Trash2, MessageCircle, Heart, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type NotificationType = 
  | "comment" | "reaction" | "milestone" | "system" | "wall_comment" | "wall_reaction" | "whispr_wall"
  | "post_flagged_for_review" | "chain_created" | "chain_entry_added" | "post_added_to_chain"
  | string // Allow any other string type for general notifications

interface Notification {
  id: string
  notification_type?: string
  type?: string
  title: string
  message: string
  read: boolean
  created_at: string
  source?: 'general' | 'chronicles'
  // Optional chronicles-specific fields
  creator_id?: string
  post_id?: string
  comment_id?: string
  priority?: string
  read_at?: string
  read_by?: string
  action_taken?: string
  data?: Record<string, any>
  creator?: { id: string; pen_name: string; profile_image_url?: string }
  post?: { id: string; title: string; status: string; created_at: string }
}

// Memoized helper: return a small icon for the notification type
const getNotificationIcon = (type: string | undefined) => {
  const normalizedType = (type || 'system').toLowerCase()
  
  if (['comment', 'wall_comment', 'post_commented'].includes(normalizedType)) {
    return <MessageCircle className="h-5 w-5 text-green-600" />
  }
  if (['reaction', 'wall_reaction', 'post_liked'].includes(normalizedType)) {
    return <Heart className="h-5 w-5 text-red-600" />
  }
  if (['milestone', 'badge_earned', 'streak_milestone'].includes(normalizedType)) {
    return <Eye className="h-5 w-5 text-purple-600" />
  }
  
  return <Bell className="h-5 w-5 text-blue-600" />
}

// Memoized helper: return a background class for the icon container
const getNotificationBg = (type: string | undefined): string => {
  const normalizedType = (type || 'system').toLowerCase()
  
  if (['comment', 'wall_comment', 'post_commented'].includes(normalizedType)) {
    return "bg-green-50"
  }
  if (['reaction', 'wall_reaction', 'post_liked'].includes(normalizedType)) {
    return "bg-red-50"
  }
  if (['milestone', 'badge_earned', 'streak_milestone'].includes(normalizedType)) {
    return "bg-purple-50"
  }
  
  return "bg-blue-50"
}

// Memoized notification card component to prevent child re-renders
interface NotificationCardProps {
  notification: Notification & { source?: string }
  onMarkAsRead: (id: string, source: string) => void
  onDelete: (id: string, source: string) => void
}

const NotificationCard = memo(({ notification, onMarkAsRead, onDelete }: NotificationCardProps) => {
  const notificationType = notification.notification_type || notification.type
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className={`mt-2 h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationBg(notificationType)}`}>
              {getNotificationIcon(notificationType)}
            </div>
            <div className="min-w-0 mt-3">
              <div className="font-medium text-sm leading-tight break-words">{notification.title}</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words mb-1 max-w-[60ch]">{notification.message}</div>
              <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 ml-4">
          {!notification.read && (
            <Button variant="ghost" size="icon" className="p-1" onClick={() => onMarkAsRead(notification.id, notification.source || 'general')}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="p-1" onClick={() => onDelete(notification.id, notification.source || 'general')}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

NotificationCard.displayName = "NotificationCard"

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15
  const { toast } = useToast()

  // Fetch notifications only on mount
  useEffect(() => {
    let mounted = true

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/admin/notifications", { cache: "no-store" })
        if (res.ok && mounted) {
          const data = await res.json()
          // API returns { success, notifications: [], unread_count, total }
          setNotifications(Array.isArray(data) ? data : data.notifications || [])
          setPage(1)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchNotifications()
    return () => {
      mounted = false
    }
  }, [])

  // Optimistic update for marking as read
  const markAsRead = useCallback(async (id: string, source: string) => {
    // Optimistic update: update local state immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )

    // Then sync with server using PUT endpoint
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id, source, read: true }),
      })
    } catch (e) {
      console.error(e)
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      )
      toast({ title: "Failed to mark as read" })
    }
  }, [toast])

  // Remove notification from UI (backend doesn't support deletion)
  const deleteNotification = useCallback(async (id: string, source: string) => {
    // Remove from notifications list
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    toast({ title: "Notification removed" })
  }, [toast])

  // Mark all unread as read - optimistic update
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

    try {
      // Use PUT endpoint with all: true flag
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true, read: true }),
      })
      toast({ title: "All notifications marked as read" })
    } catch (e) {
      console.error(e)
      // Revert on error
      setNotifications((prev) =>
        prev.map((n) =>
          unreadIds.includes(n.id) ? { ...n, read: false } : n
        )
      )
      toast({ title: "Failed to mark all as read" })
    }
  }, [notifications, toast])

  // Memoize derived values to prevent unnecessary recalculations
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  const paginatedNotifications = useMemo(
    () => notifications.slice((page - 1) * pageSize, page * pageSize),
    [notifications, page, pageSize]
  )

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(notifications.length / pageSize)),
    [notifications.length, pageSize]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-md font-bold flex items-center gap-2">
            <Bell /> Notifications {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
          </h1>
          <span className="text-sm text-muted-foreground">{`${notifications.length} total`}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
          >
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <Card>
            <CardContent>Loading...</CardContent>
          </Card>
        ) : paginatedNotifications.length === 0 ? (
          <Card>
            <CardContent>No notifications</CardContent>
          </Card>
        ) : (
          paginatedNotifications.map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
