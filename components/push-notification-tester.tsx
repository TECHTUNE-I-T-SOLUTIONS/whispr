'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export function PushNotificationTester() {
  const [isLoading, setIsLoading] = useState(false)

  const sendTestNotification = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test push notification from Whispr!',
          url: '/',
          type: 'test'
        })
      })

      if (response.ok) {
        toast({
          title: 'Test notification sent!',
          description: 'Check your browser for the notification.',
        })
      } else {
        throw new Error('Failed to send notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test notification.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notification Test</CardTitle>
        <CardDescription>
          Test the push notification system by sending a notification to all subscribers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={sendTestNotification}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </CardContent>
    </Card>
  )
}
