'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, History, Search, Filter, Eye, Send, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PushNotification {
  id: string
  title: string
  body: string
  url: string
  type: string
  icon?: string
  image?: string
  actions?: any[]
  sent_count: number
  sent_by: string
  created_at: string
  sent_at?: string
}

export default function PushHistoryPage() {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<PushNotification | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/push-notifications/history')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notification history'
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.body.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === 'all' || notification.type === typeFilter

    return matchesSearch && matchesType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual':
        return 'default'
      case 'announcement':
        return 'secondary'
      case 'update':
        return 'outline'
      case 'promotion':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <History className="h-8 w-8 text-primary" />
            Push Notification History
          </h1>
          <p className="text-muted-foreground">View all sent push notifications</p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {filteredNotifications.length} notifications
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.reduce((sum, n) => sum + n.sent_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => {
                const sentDate = new Date(n.created_at)
                const now = new Date()
                return sentDate.getMonth() === now.getMonth() && sentDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recipients</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.length > 0
                ? Math.round(notifications.reduce((sum, n) => sum + n.sent_count, 0) / notifications.length)
                : 0
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            Complete history of all sent push notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent By</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium truncate">{notification.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {notification.body}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeColor(notification.type)}>
                      {notification.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {notification.sent_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {notification.sent_by}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(notification.created_at)}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Notification Details</DialogTitle>
                          <DialogDescription>
                            Complete details of this push notification
                          </DialogDescription>
                        </DialogHeader>
                        {selectedNotification && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Title</label>
                                <p className="font-medium">{selectedNotification.title}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Type</label>
                                <Badge variant={getTypeColor(selectedNotification.type)}>
                                  {selectedNotification.type}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Recipients</label>
                                <p>{selectedNotification.sent_count}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Sent By</label>
                                <p>{selectedNotification.sent_by}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Sent At</label>
                                <p>{formatDate(selectedNotification.created_at)}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">URL</label>
                                <p className="text-sm break-all">{selectedNotification.url}</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Body</label>
                              <p className="text-sm bg-muted p-3 rounded">{selectedNotification.body}</p>
                            </div>
                            {selectedNotification.actions && selectedNotification.actions.length > 0 && (
                              <div>
                                <label className="text-sm font-medium">Actions</label>
                                <div className="flex gap-2 mt-2">
                                  {selectedNotification.actions.map((action: any, index: number) => (
                                    <Badge key={index} variant="outline">
                                      {action.title}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No notifications found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No push notifications have been sent yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
