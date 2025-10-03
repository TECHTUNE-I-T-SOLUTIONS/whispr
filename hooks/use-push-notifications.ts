"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationHook {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  hasChecked: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

export function usePushNotifications() : PushNotificationHook & { subscribeWithKey?: (key: string)=>Promise<void> } {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { toast } = useToast();

  // BroadcastChannel for cross-tab/component subscription state sync
  const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('push-subscription') : null;

  useEffect(() => {
    if (bc) {
      bc.onmessage = (msg: MessageEvent) => {
        try {
          const data = msg.data as any;
          if (data && typeof data.isSubscribed === 'boolean') {
            setIsSubscribed(Boolean(data.isSubscribed));
          }
        } catch (e) {
          // ignore
        }
      };
      return () => bc.close();
    }

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (detail && typeof detail.isSubscribed === 'boolean') {
        setIsSubscribed(Boolean(detail.isSubscribed));
      }
    };
    window.addEventListener('push:subscription-changed', onCustom as EventListener);
    return () => window.removeEventListener('push:subscription-changed', onCustom as EventListener);
  }, []);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);

      // Wait a bit for the service worker to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if already subscribed
      const subscription = await reg.pushManager.getSubscription();
      const isCurrentlySubscribed = !!subscription;
      setIsSubscribed(isCurrentlySubscribed);
        // mark that initial check completed to avoid UI flicker
        setHasChecked(true);
        // notify other tabs/components
        try {
          if (bc) bc.postMessage({ isSubscribed: isCurrentlySubscribed });
          else window.dispatchEvent(new CustomEvent('push:subscription-changed', { detail: { isSubscribed: isCurrentlySubscribed } }));
        } catch (e) {
          // ignore
        }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  };

  const subscribe = async (applicationServerKeyOverride?: string) => {
    if (!registration) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Service Worker not registered"
      });
      return;
    }

    setIsLoading(true);

    try {
  console.log('subscribe: current registration', registration);
      // Check for existing subscription and unsubscribe if it exists
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Unsubscribing from existing subscription...');
        await existingSubscription.unsubscribe();

        // Also remove from server
        await fetch('/api/push/subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: existingSubscription.endpoint
          }),
        });
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        // If permission is denied, throw an error to trigger modal
        throw new Error('Permission denied')
      }

      // Subscribe to push notifications
  // Prefer the main public VAPID key (legacy) so client and server use same credentials
  const preferredKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PUBLIC_KEY
      const fallbackKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const appKey = applicationServerKeyOverride || preferredKey || fallbackKey!
      let subscription
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(appKey)
        })
      } catch (subErr) {
        console.warn('Initial pushManager.subscribe failed, attempting fallback if available', subErr)
        // Some browsers / servers may fail with specific key; try fallback if different
        if (preferredKey && fallbackKey && preferredKey !== fallbackKey) {
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(fallbackKey)
            })
          } catch (subErr2) {
            console.error('Fallback subscribe also failed', subErr2)
            throw subErr2
          }
        } else {
          throw subErr
        }
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
            }
          },
          userAgent: navigator.userAgent,
          ipAddress: null // Will be set by server
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        toast({
          title: "Subscribed!",
          description: "You'll now receive push notifications from Whispr"
        });
        // Broadcast state change
        try {
          if (bc) bc.postMessage({ isSubscribed: true });
          else window.dispatchEvent(new CustomEvent('push:subscription-changed', { detail: { isSubscribed: true } }));
        } catch (e) {
          // ignore
        }
      } else {
        // read server response for helpful error information
        let details: any = null;
        try {
          details = await response.json();
        } catch (ex) {
          try { details = await response.text(); } catch (_) { details = null; }
        }
        console.error('Subscribe failed:', response.status, details);
        toast({
          variant: 'destructive',
          title: 'Subscription Failed',
          description: details?.error || details?.message || `Server responded ${response.status}`,
        });
        throw new Error('Failed to subscribe: ' + (details?.error || JSON.stringify(details)));
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "Failed to subscribe to push notifications"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeWithKey = async (key: string) => {
    return subscribe(key)
  }

  const unsubscribe = async () => {
    if (!registration) return;

    setIsLoading(true);

    try {
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push/subscription', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          }),
        });

          setIsSubscribed(false);
        toast({
          title: "Unsubscribed",
          description: "You won't receive push notifications anymore"
        });
          // Broadcast state change
          try {
            if (bc) bc.postMessage({ isSubscribed: false });
            else window.dispatchEvent(new CustomEvent('push:subscription-changed', { detail: { isSubscribed: false } }));
          } catch (e) {
            // ignore
          }
      }
    } catch (error) {
      console.error('Unsubscription failed:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unsubscribe from push notifications"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeNotification = async () => {
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Welcome to Whispr! 🎉',
        body: `You have joined the hush — gentle ripples of poems, posts, and spoken words will find you.`,
          url: '/',
          type: 'welcome',
          actions: [
            {
              action: 'explore',
              title: 'Explore',
              icon: '/logotype.png'
            }
          ]
        }),
      });
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
    }
  };

  const sendTestNotification = async () => {
    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification 🔔',
          body: 'This is a test push notification from Whispr!',
          url: '/',
          type: 'test'
        }),
      });

      toast({
        title: "Test Sent",
        description: "Test notification sent to all subscribers"
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test notification"
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
  hasChecked,
  subscribe,
  subscribeWithKey,
    unsubscribe,
    sendTestNotification
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
