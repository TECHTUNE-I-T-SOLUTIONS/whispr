"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Bell, Eye, Smartphone, Tablet, Monitor, Users, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function PushSubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedSubscriber, setSelectedSubscriber] = useState<any | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const res = await fetch('/api/admin/push-subscribers')
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || [])
      } else {
        let errMsg = 'Failed to fetch subscribers'
        try {
          const body = await res.json()
          if (body?.error) errMsg = body.error
          else if (body?.message) errMsg = body.message
        } catch (e) {}
        throw new Error(errMsg)
      }
    } catch (err: any) {
      console.error('Error fetching subscribers:', err)
      toast({ variant: 'destructive', title: 'Error', description: err?.message || 'Failed to load subscribers' })
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const search = searchTerm.trim().toLowerCase()
    const ip = String(subscriber.ip_address || '').toLowerCase()
    const browser = String(subscriber.browser_info?.browser || '').toLowerCase()
    const os = String(subscriber.browser_info?.os || '').toLowerCase()
    const matchesSearch = !search || ip.includes(search) || browser.includes(search) || os.includes(search)
    const matchesStatus =
      statusFilter === 'all' || (statusFilter === 'active' && Boolean(subscriber.is_active)) || (statusFilter === 'inactive' && !Boolean(subscriber.is_active))
    return matchesSearch && matchesStatus
  })

  const getDeviceIcon = (device?: string) => {
    switch (String(device || '').toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch (e) {
      return 'N/A'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-md font-serif font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Push Subscribers
          </h1>
          <p className="text-muted-foreground text-sm">Manage your push notification subscribers</p>
        </div>

        <Badge variant="secondary" className="text-xs px-2 py-1">
          {filteredSubscribers.length} subscribers
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold">{subscribers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold">{subscribers.filter((s) => s.is_active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-md font-bold">
              {subscribers.filter((s) => {
                if (!s.subscribed_at) return false
                const subDate = new Date(s.subscribed_at)
                const now = new Date()
                return subDate.getMonth() === now.getMonth() && subDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by IP, browser, or OS..." value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscribers</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriber list: cards on mobile, table on desktop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Subscribers List</CardTitle>
          <CardDescription className="text-sm">Detailed information about all push notification subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: stacked cards */}
          <div className="space-y-2 md:hidden">
            {filteredSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="border rounded-lg p-2 bg-background">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">{getDeviceIcon(subscriber.browser_info?.device)}</div>
                      <div>
                        <div className="font-medium">{subscriber.browser_info?.browser || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{subscriber.browser_info?.os || 'Unknown OS'}</div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">IP</div>
                        <div className="font-mono break-words">{subscriber.ip_address || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Status</div>
                        <div>
                          <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>{subscriber.is_active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Subscribed</div>
                        <div className="text-sm">{formatDate(subscriber.subscribed_at || '')}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Last Active</div>
                        <div className="text-sm">{formatDate(subscriber.last_active_at || '')}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSubscriber(subscriber)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Subscriber Details</DialogTitle>
                          <DialogDescription>Detailed information about this subscriber</DialogDescription>
                        </DialogHeader>
                        {selectedSubscriber && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">IP Address</label>
                                <p className="font-mono text-sm">{selectedSubscriber.ip_address}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">User ID</label>
                                <p className="font-mono text-sm">{selectedSubscriber.user_id}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Browser</label>
                                <p>{selectedSubscriber.browser_info?.browser || 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Operating System</label>
                                <p>{selectedSubscriber.browser_info?.os || 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Device Type</label>
                                <p className="capitalize">{selectedSubscriber.browser_info?.device || 'Unknown'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Status</label>
                                <Badge variant={selectedSubscriber.is_active ? 'default' : 'secondary'}>{selectedSubscriber.is_active ? 'Active' : 'Inactive'}</Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-sm font-medium">User Agent</label>
                              <p className="text-xs font-mono bg-muted p-2 rounded break-all">{selectedSubscriber.user_agent}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Endpoint</label>
                              <p className="text-xs font-mono bg-muted p-2 rounded break-all">{selectedSubscriber.endpoint}</p>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(subscriber.browser_info?.device)}
                        <span className="capitalize">{subscriber.browser_info?.device || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{subscriber.ip_address}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{subscriber.browser_info?.browser || 'Unknown'}</div>
                        <div className="text-muted-foreground">{subscriber.browser_info?.os || 'Unknown OS'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriber.is_active ? 'default' : 'secondary'}>{subscriber.is_active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(subscriber.subscribed_at || '')}</TableCell>
                    <TableCell className="text-sm">{formatDate(subscriber.last_active_at || '')}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedSubscriber(subscriber)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Subscriber Details</DialogTitle>
                            <DialogDescription>Detailed information about this subscriber</DialogDescription>
                          </DialogHeader>
                          {selectedSubscriber && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">IP Address</label>
                                  <p className="font-mono text-sm">{selectedSubscriber.ip_address}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">User ID</label>
                                  <p className="font-mono text-sm">{selectedSubscriber.user_id}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Browser</label>
                                  <p>{selectedSubscriber.browser_info?.browser || 'Unknown'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Operating System</label>
                                  <p>{selectedSubscriber.browser_info?.os || 'Unknown'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Device Type</label>
                                  <p className="capitalize">{selectedSubscriber.browser_info?.device || 'Unknown'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Status</label>
                                  <Badge variant={selectedSubscriber.is_active ? 'default' : 'secondary'}>{selectedSubscriber.is_active ? 'Active' : 'Inactive'}</Badge>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">User Agent</label>
                                <p className="text-xs font-mono bg-muted p-2 rounded break-all">{selectedSubscriber.user_agent}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Endpoint</label>
                                <p className="text-xs font-mono bg-muted p-2 rounded break-all">{selectedSubscriber.endpoint}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredSubscribers.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No subscribers found</h3>
              <p className="text-muted-foreground">{searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No push notification subscribers yet'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

