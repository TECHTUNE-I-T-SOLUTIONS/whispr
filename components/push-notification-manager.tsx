"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast';

interface PushNotificationManagerProps {
  showTestButton?: boolean;
  compact?: boolean;
}

export function PushNotificationManager({
  showTestButton = false,
  compact = false,
  useAdminRealtime = false
}: PushNotificationManagerProps & { useAdminRealtime?: boolean }) {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, sendTestNotification, subscribeWithKey } = usePushNotifications();
  const { toast } = useToast();
  const [showGuide, setShowGuide] = useState(false)

  if (!isSupported) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className={compact ? "p-0" : ""}>
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Push Notifications Not Supported</p>
              <p className="text-xs text-muted-foreground">
                Your browser doesn't support push notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant={isSubscribed ? "outline" : "default"}
          size="sm"
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <BellRing className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
        </Button>

        {showTestButton && isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendTestNotification}
            className="flex items-center gap-2"
          >
            <BellRing className="h-4 w-4" />
            Test
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-primary" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          Push Notifications
        </CardTitle>
      </CardHeader>
  <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <p className="text-sm font-medium">
                {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed
                  ? 'You\'ll receive notifications about new content'
                  : 'Subscribe to get notified about new blogs, poems, and spoken words'
                }
              </p>
            </div>
          </div>

          <Badge variant={isSubscribed ? "default" : "secondary"}>
            {isSubscribed ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isSubscribed ? "outline" : "default"}
            onClick={async () => {
              if (isSubscribed) return unsubscribe()
              try {
                if (useAdminRealtime && subscribeWithKey) {
                  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PUBLIC_KEY
                  return await subscribeWithKey(key!)
                }
                return await subscribe()
              } catch (e: any) {
                // permission denied or blocked
                setShowGuide(true)
                toast({ variant: 'destructive', title: 'Subscription blocked', description: 'Push permission was blocked. Please enable notifications in your browser settings.' })
              }
            }}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
              </>
            ) : (
              <>
                {isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </>
            )}
          </Button>

          {showTestButton && isSubscribed && (
            <Button
              variant="outline"
              onClick={sendTestNotification}
            >
              <BellRing className="mr-2 h-4 w-4" />
              Test
            </Button>
          )}
        </div>

        {isSubscribed && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro tip:</strong> Make sure notifications are enabled in your browser settings for the best experience.
            </p>
          </div>
        )}
        {showGuide && (
          <Dialog open={showGuide} onOpenChange={(o)=>setShowGuide(Boolean(o))}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enable Notifications</DialogTitle>
              </DialogHeader>
              <div className="py-2">
                <p className="text-sm">It looks like push notifications were blocked. Please allow notifications for this site in your browser settings. Common places to check:</p>
                <ul className="list-disc ml-5 mt-2 text-sm text-muted-foreground">
                  <li>Click the lock icon next to the URL and enable Notifications</li>
                  <li>Open browser Settings → Privacy & security → Site Settings → Notifications</li>
                  <li>After enabling, try subscribing again here</li>
                </ul>
              </div>
              <DialogFooter>
                <Button onClick={()=>setShowGuide(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
