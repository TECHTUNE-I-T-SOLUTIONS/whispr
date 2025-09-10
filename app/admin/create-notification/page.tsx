'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bell, Send, Eye, Smartphone, Monitor, Tablet, Save, History } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface NotificationData {
  title: string
  body: string
  url: string
  type: string
  icon?: string
  image?: string
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export default function CreateNotificationPage() {
  const [notification, setNotification] = useState<NotificationData>({
    title: '',
    body: '',
    url: '/',
    type: 'manual',
    actions: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const { toast } = useToast()

  const handleSendNotification = async () => {
    if (!notification.title.trim() || !notification.body.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title and body are required'
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/push-notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Success!',
          description: `Notification sent to ${result.sentCount} subscribers`
        })

        // Reset form
        setNotification({
          title: '',
          body: '',
          url: '/',
          type: 'manual',
          actions: []
        })
      } else {
        throw new Error('Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send notification'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const response = await fetch('/api/admin/push-notifications/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      })

      if (response.ok) {
        toast({
          title: 'Draft Saved',
          description: 'Notification draft has been saved'
        })
      } else {
        throw new Error('Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save draft'
      })
    }
  }

  const getPreviewStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto'
      case 'tablet':
        return 'max-w-md mx-auto'
      default:
        return 'max-w-lg mx-auto'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Create Push Notification
          </h1>
          <p className="text-muted-foreground">Send notifications to all your subscribers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/push-history">
              <History className="mr-2 h-4 w-4" />
              View History
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/push-subscribers">
              <Eye className="mr-2 h-4 w-4" />
              View Subscribers
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Details</CardTitle>
              <CardDescription>
                Configure your push notification content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title"
                  value={notification.title}
                  onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {notification.title.length}/50 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Body *</Label>
                <Textarea
                  id="body"
                  placeholder="Enter notification message"
                  value={notification.body}
                  onChange={(e) => setNotification(prev => ({ ...prev, body: e.target.value }))}
                  maxLength={150}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {notification.body.length}/150 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  placeholder="https://yoursite.com/page"
                  value={notification.url}
                  onChange={(e) => setNotification(prev => ({ ...prev, url: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Where users will be taken when they click the notification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select
                  value={notification.type}
                  onValueChange={(value) => setNotification(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon URL (optional)</Label>
                <Input
                  id="icon"
                  placeholder="https://yoursite.com/icon.png"
                  value={notification.icon || ''}
                  onChange={(e) => setNotification(prev => ({ ...prev, icon: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL (optional)</Label>
                <Input
                  id="image"
                  placeholder="https://yoursite.com/image.jpg"
                  value={notification.image || ''}
                  onChange={(e) => setNotification(prev => ({ ...prev, image: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>
                Add action buttons to your notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Actions are not supported in all browsers. They will be ignored if not supported.
              </p>
              <Button
                variant="outline"
                onClick={() => setNotification(prev => ({
                  ...prev,
                  actions: [...(prev.actions || []), { action: 'view', title: 'View', icon: '' }]
                }))}
                disabled={(notification.actions?.length || 0) >= 2}
              >
                Add Action
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleSendNotification}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your notification will look on different devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone className="h-4 w-4 mr-1" />
                  Mobile
                </Button>
                <Button
                  variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('tablet')}
                >
                  <Tablet className="h-4 w-4 mr-1" />
                  Tablet
                </Button>
                <Button
                  variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor className="h-4 w-4 mr-1" />
                  Desktop
                </Button>
              </div>

              <div className={`bg-black text-white rounded-lg p-4 shadow-lg ${getPreviewStyles()}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate">
                        {notification.title || 'Your Notification Title'}
                      </h4>
                      <span className="text-xs text-gray-400">now</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {notification.body || 'Your notification message will appear here...'}
                    </p>
                    {notification.url && (
                      <p className="text-xs text-blue-400 truncate">
                        {notification.url}
                      </p>
                    )}
                  </div>
                </div>

                {(notification.actions?.length || 0) > 0 && (
                  <>
                    <Separator className="my-3 bg-gray-700" />
                    <div className="flex gap-2">
                      {notification.actions?.map((action, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 px-3 bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          {action.title}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Preview Notes:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• This is a simulated preview of how the notification might appear</li>
                  <li>• Actual appearance may vary by browser and device</li>
                  <li>• Images and custom icons may not display in all browsers</li>
                  <li>• Action buttons are not supported in all browsers</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {notification.title.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Title Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {notification.body.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Body Characters</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Actions:</span>
                  <Badge variant="secondary">{notification.actions?.length || 0}/2</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <Badge variant="outline">{notification.type}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>URL:</span>
                  <span className="text-muted-foreground truncate ml-2">
                    {notification.url || 'None'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
