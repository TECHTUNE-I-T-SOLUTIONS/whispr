'use client'

import { useEffect } from 'react'
import { Bell, Chrome, Monitor, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface NotificationPermissionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPermissionModal({ isOpen, onClose }: NotificationPermissionModalProps) {
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('chrome') || userAgent.includes('chromium')) {
      return {
        icon: Chrome,
        name: 'Chrome',
        steps: [
          'Click the lock icon (🔒) in the address bar',
          'Find "Notifications" in the dropdown menu',
          'Change it from "Block" to "Allow"',
          'Refresh the page and try subscribing again'
        ]
      }
    }

    if (userAgent.includes('firefox')) {
      return {
        icon: Monitor,
        name: 'Firefox',
        steps: [
          'Click the shield icon (🛡️) in the address bar',
          'Click the "i" icon next to "Notifications blocked"',
          'Select "Allow notifications" from the dropdown',
          'Refresh the page and try subscribing again'
        ]
      }
    }

    if (userAgent.includes('safari')) {
      return {
        icon: Monitor,
        name: 'Safari',
        steps: [
          'Go to Safari → Preferences (or press Cmd + ,)',
          'Click on "Websites" tab',
          'Scroll down to "Notifications"',
          'Find whispr.com and change to "Allow"',
          'Refresh the page and try subscribing again'
        ]
      }
    }

    // Default instructions
    return {
      icon: Bell,
      name: 'Your Browser',
      steps: [
        'Look for a lock icon (🔒) or shield icon (🛡️) in the address bar',
        'Click it and find notification settings',
        'Change notifications from "Block" to "Allow"',
        'Refresh the page and try subscribing again'
      ]
    }
  }

  const browserInfo = getBrowserInstructions()
  const BrowserIcon = browserInfo.icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Enable Notifications
          </DialogTitle>
          <DialogDescription>
            Notifications are currently blocked in your browser. Follow these steps to enable them and stay updated with new content.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BrowserIcon className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">{browserInfo.name}</h3>
                <p className="text-sm text-muted-foreground">Browser-specific instructions</p>
              </div>
            </div>

            <ol className="space-y-3 text-sm">
              {browserInfo.steps.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Pro tip:</strong> After enabling notifications, refresh this page and click the bell icon again to subscribe.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              onClose()
              // Try to request permission again
              if ('Notification' in window) {
                Notification.requestPermission()
              }
            }}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
