'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { NotificationPermissionModal } from '@/components/notification-permission-modal'
import { usePathname } from 'next/navigation'

export function FloatingNotificationBell() {
  const { isSupported, isSubscribed, isLoading, subscribe, hasChecked } = usePushNotifications()
  const [isVisible, setIsVisible] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)
  const pathname = usePathname()

  // listen for same-tab subscription updates so UI updates immediately
  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as any
      if (detail && typeof detail.isSubscribed === 'boolean') {
        if (detail.isSubscribed) {
          setIsVisible(false)
        }
      }
    }

    window.addEventListener('push:subscription-changed', onCustom as EventListener)
    return () => window.removeEventListener('push:subscription-changed', onCustom as EventListener)
  }, [])

  useEffect(() => {
    // Check if user has dismissed the bell before
    const dismissed = localStorage.getItem('notification-bell-dismissed')
    const hasDismissedBefore = dismissed === 'true'
    setHasDismissed(hasDismissedBefore)

    // Check if we're on admin pages
    const isAdminPage = pathname.startsWith('/admin')

    // Show bell for unsubscribed users who haven't dismissed it and not on admin pages
    // Wait until hasChecked to avoid flicker on initial load
    if (hasChecked && isSupported && !isSubscribed && !hasDismissedBefore && !isAdminPage) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000) // 1 second delay
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isSupported, isSubscribed, pathname, hasChecked])

  const handleSubscribe = async () => {
    try {
      await subscribe()
      // Bell will automatically hide due to isSubscribed becoming true
      setIsVisible(false)
    } catch (error) {
      console.error('Subscription error:', error)
      // If permission is denied or blocked, show the modal
      if (Notification.permission === 'denied' || (error as Error).message === 'Permission denied') {
        setShowPermissionModal(true)
      }
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setHasDismissed(true)
    localStorage.setItem('notification-bell-dismissed', 'true')
  }

  // Don't render if push isn't supported or the bell shouldn't be visible
  if (!isSupported || !isVisible) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999]">
        <div className="relative group">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            size="lg"
            className="h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 bg-blue-600 hover:bg-blue-700 animate-bounce border-4 border-white"
            style={{ animationDuration: '2s' }}
            title="Get notified about new poems, blogs, and spoken words! Click to subscribe."
          >
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            ) : (
              <Bell className="h-7 w-7 text-white" />
            )}
          </Button>

          {/* Dismiss button */}
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 border-2 border-white shadow-lg"
          >
            <X className="h-4 w-4 text-white" />
          </Button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Get notified about new content! Click to subscribe.
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>

      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />
    </>
  )
}
