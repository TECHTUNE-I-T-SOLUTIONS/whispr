"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, X, FileText, Download } from "lucide-react"

export function MessagesManager({
  conversationId,
  initialMessages = [],
}: { conversationId: string; initialMessages?: any[] }) {
  const supabase = createSupabaseBrowser()
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  const [currentAdminName, setCurrentAdminName] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>(initialMessages || [])
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { toast } = useToast()
  const subRef = useRef<any>(null)
  const reconnectRef = useRef<{ attempts: number; timer?: any }>({ attempts: 0 })
  const monitorRef = useRef<any>(null)
  const reconcileRef = useRef<any>(null)
  // map of seen message ids -> timestamp (ms) to avoid duplicates and allow expiry
  const seenIdsRef = useRef<Map<string, number>>(new Map())
  const REAP_MS = 1000 * 60 * 5 // 5 minutes
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/messages?conversation_id=${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      // ignore
    }
  }

  // pushMessage ensures we don't append duplicate messages (same id)
  const pushMessage = (msg: any) => {
    if (!msg) return
    const mid = String(msg.id || '')
    const now = Date.now()

    setMessages((prev) => {
      // First, check if this is replacing an optimistic message
      if (!msg.isOptimistic) {
        // Look for an optimistic message with the same content and conversation
        const optimisticIndex = prev.findIndex((x) =>
          x.isOptimistic &&
          x.content === msg.content &&
          x.conversation_id === msg.conversation_id &&
          x.admin_id === msg.admin_id
        )

        if (optimisticIndex !== -1) {
          console.log('Replacing optimistic message with real message:', msg.id)
          const newPrev = [...prev]
          newPrev[optimisticIndex] = { ...msg, isOptimistic: false }
          // Scroll to bottom after replacing optimistic message
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
          const scrollDelay = isMobile ? 50 : 10
          setTimeout(() => scrollToBottom(), scrollDelay)
          return newPrev
        }
      }

      // cleanup expired entries occasionally
      try {
        const m = seenIdsRef.current
        if (m.size > 1000) {
          for (const [k, ts] of Array.from(m.entries())) {
            if (now - ts > REAP_MS) m.delete(k)
          }
        }
        // For non-optimistic messages, check for duplicates
        if (mid && !msg.isOptimistic && m.has(mid)) {
          console.log('Duplicate message ignored:', mid)
          return prev
        }
        if (mid) m.set(mid, now)
      } catch (e) {
        // ignore
      }

      // Add new message (optimistic or regular)
      if (prev.some((x) => x.id === msg.id && msg.id && !msg.isOptimistic)) {
        console.log('Message already exists:', msg.id)
        return prev
      }

      // ensure messages are sorted by created_at
      const newMessages = [...prev, msg].sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      return newMessages
    })
  }

  // fetch messages created after `since` ISO timestamp (returns [] on error)
  const fetchMessagesSince = async (since?: string) => {
    try {
      const url = `/api/admin/messages?conversation_id=${conversationId}${since ? `&since=${encodeURIComponent(since)}` : ''}`
      const res = await fetch(url)
      if (!res.ok) return []
      const j = await res.json()
      return j.messages || []
    } catch (e) {
      return []
    }
  }

  const scrollToBottom = () => {
    const scroll = () => {
      // Check if we're on mobile
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

      if (messagesEndRef.current) {
        // Check if user is already near the bottom (within 100px on desktop, 150px on mobile)
        const messagesContainer = document.querySelector('[data-messages-container]')
        if (messagesContainer) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainer
          const threshold = isMobile ? 150 : 100 // Larger threshold on mobile
          const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold

          if (isNearBottom) {
            // Calculate input area height to ensure last message is fully visible
            const inputArea = document.querySelector('[data-input-area]')
            let inputHeight = 0

            if (inputArea) {
              const rect = inputArea.getBoundingClientRect()
              inputHeight = rect.height

              // Add some extra padding for mobile keyboard or safe area
              if (isMobile) {
                inputHeight += 20 // Extra padding for mobile
              }
            } else {
              // If input area not found, use fallback heights
              if (isMobile) {
                inputHeight = 140 // Approximate height of mobile input area with padding
              } else {
                inputHeight = 100 // Approximate height of desktop input area with padding
              }
            }

            // Ensure we have at least some minimum height to avoid cutting off messages
            inputHeight = Math.max(inputHeight, isMobile ? 120 : 80)

            // Scroll to show content above the input area
            const targetScrollTop = Math.max(0, scrollHeight - clientHeight + inputHeight)

            if (isMobile) {
              // On mobile, use multiple scrolling methods for reliability
              messagesContainer.scrollTop = targetScrollTop
              // Also try scrollTo as a fallback
              setTimeout(() => {
                messagesContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
              }, 50)

              // Also try scrollIntoView with offset
              setTimeout(() => {
                if (messagesEndRef.current) {
                  messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
                }
              }, 100)
            } else {
              messagesContainer.scrollTop = targetScrollTop
            }
            return true
          }
          // Don't scroll if user has scrolled up to read older messages
          return true
        } else {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
          return true
        }
      } else {
        // Fallback: try to scroll the messages container itself
        const messagesContainer = document.querySelector('[data-messages-container]')
        if (messagesContainer) {
          const { scrollTop, scrollHeight, clientHeight } = messagesContainer
          const threshold = isMobile ? 150 : 100
          const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold

          if (isNearBottom) {
            // Calculate input area height
            const inputArea = document.querySelector('[data-input-area]')
            let inputHeight = 0

            if (inputArea) {
              const rect = inputArea.getBoundingClientRect()
              inputHeight = rect.height
              if (isMobile) {
                inputHeight += 20
              }
            } else {
              // If input area not found, use fallback heights
              if (isMobile) {
                inputHeight = 140 // Approximate height of mobile input area with padding
              } else {
                inputHeight = 100 // Approximate height of desktop input area with padding
              }
            }

            // Ensure we have at least some minimum height to avoid cutting off messages
            inputHeight = Math.max(inputHeight, isMobile ? 120 : 80)

            const targetScrollTop = Math.max(0, scrollHeight - clientHeight + inputHeight)

            if (isMobile) {
              messagesContainer.scrollTop = targetScrollTop
              setTimeout(() => {
                messagesContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
              }, 50)
            } else {
              messagesContainer.scrollTop = targetScrollTop
            }
            return true
          }
          // Don't scroll if user has scrolled up
          return true
        }
      }
      return false
    }

    // Try to scroll immediately
    if (!scroll()) {
      // If it fails, try again after a short delay (DOM might not be ready)
      setTimeout(() => {
        if (!scroll()) {
          // Final fallback: try once more after another delay
          setTimeout(() => {
            // Last attempt: scroll to absolute bottom as final fallback
            const messagesContainer = document.querySelector('[data-messages-container]')
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight
            }
          }, 200)
        }
      }, 50) // Slightly longer initial delay
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // fetch current admin session for identifying own messages
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-cache' })
        if (r.ok) {
          const j = await r.json()
          const aid = j?.admin?.id || null
          const name = j?.admin?.full_name || j?.admin?.username || null
          setCurrentAdminId(aid)
          setCurrentAdminName(name)
        } else {
          console.warn('Auth check failed:', r.status)
          // Clear admin data on auth failure
          setCurrentAdminId(null)
          setCurrentAdminName(null)
        }
      } catch (e) {
        console.error('Auth check error:', e)
        // Clear admin data on error
        setCurrentAdminId(null)
        setCurrentAdminName(null)
      }
    })()

    fetchMessages()

    // Supabase Realtime subscription to messages for this conversation
  let visibilityHandler: any = null
  if (conversationId && supabase) {
      // Unsubscribe previous
      if (subRef.current) {
        try {
          subRef.current.unsubscribe()
        } catch (e) {
          /* ignore */
        }
      }

      // create channel and attach handlers with logging and simple retry on failure
      let channel = supabase.channel(`public:messages:conversation=${conversationId}`)

  // dedupe recently seen ids to avoid duplicates between postgres_changes and broadcast
  const seenIds = new Set<string>()

      const onInsert = (payload: any) => {
        try {
          const newMsg = payload?.record ?? payload?.new ?? null
              if (newMsg) {
                console.log('Received postgres_changes message:', newMsg.id)
                const mid = String(newMsg.id || '')
                if (!seenIds.has(mid)) {
                  seenIds.add(mid)
                  // also add to global seen map with timestamp
                  try { seenIdsRef.current.set(mid, Date.now()) } catch (e) {}
                  pushMessage(newMsg)
                  // immediate scroll to bottom for new messages
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
                  const scrollDelay = isMobile ? 50 : 10
                  setTimeout(() => scrollToBottom(), scrollDelay)
                } else {
                  console.log('Duplicate message ignored:', mid)
                }
                try {
                  // notify conversation list / shells about new message for badge increment
                  if (typeof window !== 'undefined') {
                    // also dispatch a lightweight conversation:update so conversation list can refresh preview/ordering
                    const preview = newMsg.content || (newMsg.attachments && newMsg.attachments.length ? (newMsg.attachments[0].file_name || 'attachment') : '')
                    // dispatch unread increment event
                    window.dispatchEvent(new CustomEvent('conversation:new_message', { detail: { conversation_id: newMsg.conversation_id, sender_id: newMsg.admin_id, message_id: newMsg.id, message: preview } }))
                    const conv = { id: newMsg.conversation_id, last_message_preview: preview, updated_at: newMsg.created_at, last_message_at: newMsg.created_at }
                    window.dispatchEvent(new CustomEvent('conversation:updated', { detail: { conversation: conv } }))
                  }
                } catch (e) {
                  // ignore
                }
              }
        } catch (e) {
          console.error('Failed to handle postgres_changes payload', e)
        }
      }

      const onBroadcast = (payload: any) => {
        try {
          const msg = (payload as any).payload ?? payload
      if (msg) {
        console.log('Received broadcast message:', msg.id)
        const mid = String(msg.id || '')
        // Don't add broadcast messages to seenIds since they might be our own messages
        // that we need to process to replace optimistic messages
        pushMessage(msg)
        // immediate scroll to bottom for new messages
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
        const scrollDelay = isMobile ? 50 : 10
        setTimeout(() => scrollToBottom(), scrollDelay)
        try {
          if (typeof window !== 'undefined') {
            const preview = msg.content || (msg.attachments && msg.attachments.length ? (msg.attachments[0].file_name || 'attachment') : '')
            window.dispatchEvent(new CustomEvent('conversation:new_message', { detail: { conversation_id: msg.conversation_id, sender_id: msg.admin_id, message_id: msg.id, message: preview } }))
            const conv = { id: msg.conversation_id, last_message_preview: preview, updated_at: msg.created_at, last_message_at: msg.created_at }
            window.dispatchEvent(new CustomEvent('conversation:updated', { detail: { conversation: conv } }))
          }
        } catch (e) {}
      }
        } catch (e) {
          console.error('Failed to handle broadcast payload', e)
        }
      }

      channel = channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onInsert)
        .on('broadcast', { event: 'message' }, onBroadcast)
        .subscribe((status) => {
          console.log('Subscription status for conversation', conversationId, ':', status)
        })

      subRef.current = channel

      // Best-effort: log channel state after short delay
      setTimeout(() => {
        try {
          const state = (subRef.current as any)?.state || null
          console.info('Supabase channel state for', conversationId, state)
          if (state !== 'SUBSCRIBED') {
            console.warn('Channel not subscribed immediately, will retry via monitor')
          } else {
            console.log('Channel successfully subscribed for conversation', conversationId)
          }
        } catch (e) {
          /* ignore */
        }
      }, 500)

      // Monitor channel state and attempt exponential backoff resubscribe
      const startMonitor = () => {
        if (monitorRef.current) return
        monitorRef.current = setInterval(() => {
          try {
            const ch = subRef.current as any
            const state = ch?.state || null
            console.log('Channel monitor check - State:', state, 'Conversation:', conversationId)
            // if not subscribed, try to reconnect with backoff
            if (!state || state !== 'SUBSCRIBED') {
              const info = reconnectRef.current
              if (info.attempts >= 5) {
                console.warn('Max reconnection attempts reached for conversation:', conversationId)
                return
              }
              const delay = Math.min(30000, 500 * Math.pow(2, info.attempts))
              console.warn('Realtime channel not subscribed, scheduling reconnect', { conversationId, state, attempt: info.attempts + 1, delay })
              info.attempts += 1
              if (info.timer) clearTimeout(info.timer)
              info.timer = setTimeout(async () => {
                try {
                  // Check auth before reconnecting
                  const authCheck = await fetch('/api/auth/me', { cache: 'no-cache' })
                  if (!authCheck.ok) {
                    console.error('Auth failed during reconnection, aborting')
                    return
                  }

                  try { ch?.unsubscribe?.() } catch (_) {}
                  const retry = supabase
                    .channel(`public:messages:conversation=${conversationId}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onInsert)
                    .on('broadcast', { event: 'message' }, onBroadcast)
                    .subscribe((status) => {
                      console.log('Reconnection status for conversation', conversationId, ':', status)
                    })
                  subRef.current = retry
                } catch (e) {
                  console.error('Resubscribe failed', e)
                }
              }, delay)
            } else {
              // reset attempts on success
              reconnectRef.current.attempts = 0
            }
          } catch (e) {
            console.error('Channel monitor error:', e)
          }
        }, 2000)
      }

      startMonitor()

      // Recreate subscription when tab becomes visible (mitigates background throttling)
      const visibilityHandler = () => {
        try {
          if (document.visibilityState === 'visible') {
            try { subRef.current?.unsubscribe?.() } catch (e) {}
            const retry = supabase
              .channel(`public:messages:conversation=${conversationId}`)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onInsert)
              .on('broadcast', { event: 'message' }, onBroadcast)
              .subscribe()
            subRef.current = retry
            // reconciliation: fetch missing messages since last known message
            ;(async () => {
              try {
                const last = messages[messages.length - 1]?.created_at
                if (last) {
                  const missed = await fetchMessagesSince(last)
                  for (const mm of missed) pushMessage(mm)
                }
              } catch (e) {}
            })()
          }
        } catch (e) {}
      }
  document.addEventListener('visibilitychange', visibilityHandler)
  // periodic reconciliation when channel not subscribed
  reconcileRef.current = setInterval(async () => {
        try {
          const ch = subRef.current as any
          const state = ch?.state || null
          if (!state || state !== 'SUBSCRIBED') {
            const last = messages[messages.length - 1]?.created_at
            const missed = await fetchMessagesSince(last)
            for (const mm of missed) pushMessage(mm)
            // prune global seen map
            const now = Date.now()
            for (const [k, ts] of Array.from(seenIdsRef.current.entries())) {
              if (now - ts > REAP_MS) seenIdsRef.current.delete(k)
            }
          }
        } catch (e) {}
  }, 15000)
    }

    return () => {
      if (subRef.current) {
        try {
          subRef.current.unsubscribe()
        } catch (e) {
          /* ignore */
        }
      }
  try { if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler) } catch (e) {}
  try { if (reconcileRef.current) clearInterval(reconcileRef.current) } catch (e) {}
  try { if (monitorRef.current) clearInterval(monitorRef.current) } catch (e) {}
    }
  }, [conversationId])

  // Periodic connection health check
  useEffect(() => {
    const healthCheckInterval = setInterval(async () => {
      try {
        // Test Supabase connection
        if (supabase) {
          const { data, error } = await supabase.from('messages').select('id').limit(1)
          if (error) {
            console.warn('Supabase connection health check failed:', error)
            // Force reconnection
            if (subRef.current) {
              try {
                subRef.current.unsubscribe()
                subRef.current = null
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error('Connection health check error:', e)
      }
    }, 10 * 60 * 1000) // Check every 10 minutes

    return () => clearInterval(healthCheckInterval)
  }, [supabase])

  // Clear potential stale data on mount
  useEffect(() => {
    // Clear any stale localStorage data that might conflict
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('whispr:') && key.includes('conversation') && key.includes('read')) {
          // Keep conversation read states but clear old ones
          const value = localStorage.getItem(key)
          if (value) {
            try {
              const parsed = JSON.parse(value)
              const age = Date.now() - (parsed.ts || 0)
              if (age > 24 * 60 * 60 * 1000) { // Older than 24 hours
                localStorage.removeItem(key)
              }
            } catch (e) {
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // Listen for messages forwarded from the service worker (push events) so open tabs
  // update immediately when push arrives. The handler extracts a conversation id
  // and dispatches a local 'conversation:updated' event so existing upsert logic runs.
  useEffect(() => {
    if (typeof window === 'undefined') return

    function onSWMessage(e: MessageEvent) {
      try {
        const msg = e?.data
        if (!msg || msg.type !== 'push' || !msg.payload) return
        const data = msg.payload
        let convId: string | undefined
        if (data.conversation_id) convId = String(data.conversation_id)
        else if (data.data && data.data.conversation_id) convId = String(data.data.conversation_id)
        else if (data.url) {
          try {
            const u = new URL(data.url, location.origin)
            convId = u.searchParams.get('conversation_id') || undefined
            if (!convId) {
              const parts = u.pathname.split('/').filter(Boolean)
              const last = parts[parts.length - 1]
              if (last) convId = last
            }
          } catch (err) {
            // ignore
          }
        }

        if (!convId) return

        console.log('Received service worker message for conversation:', convId)
        const preview = data.body || data.data?.body || data.message || data.data?.message || ''
        const createdAt = data.data?.last_message_at || data.data?.created_at || new Date().toISOString()
        const msgDetail: any = {
          conversation_id: convId,
          message: preview,
          created_at: createdAt,
          title: data.title || data.data?.title,
        }

        // Always emit new_message so unread/preview logic runs as before
        try { window.dispatchEvent(new CustomEvent('conversation:new_message', { detail: msgDetail })) } catch (e) {}

        // If payload contains conversation-level changes (title, preview, updated_at),
        // also emit conversation:updated for distinct handling (e.g. title change)
        const hasConversationUpdate = Boolean(
          data.title ||
          data.data?.title ||
          data.data?.conversation ||
          data.data?.last_message_preview ||
          data.data?.updated_at
        )

        if (hasConversationUpdate) {
          const conv: any = {
            id: convId,
            title: data.title || data.data?.title,
            last_message_preview: data.body || data.data?.body || data.data?.last_message_preview || preview,
            updated_at: data.data?.updated_at || createdAt,
          }
          try { window.dispatchEvent(new CustomEvent('conversation:updated', { detail: { conversation: conv } })) } catch (e) {}
        }
      } catch (err) {
        console.error('Service worker message error:', err)
      }
    }

    try { navigator.serviceWorker?.addEventListener?.('message', onSWMessage as EventListener) } catch (e) {}
    try { window.addEventListener('message', onSWMessage as EventListener) } catch (e) {}

    return () => {
      try { navigator.serviceWorker?.removeEventListener?.('message', onSWMessage as EventListener) } catch (e) {}
      try { window.removeEventListener('message', onSWMessage as EventListener) } catch (e) {}
    }
  }, [conversationId])

  // Service worker conflict detection and cleanup
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkServiceWorkerConflicts = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration) {
            console.log('Service worker detected:', registration.scope)

            // Check if service worker is responding
            const testMessage = { type: 'ping', timestamp: Date.now() }
            let responded = false

            const messageHandler = (event: MessageEvent) => {
              if (event.data?.type === 'pong') {
                responded = true
                console.log('Service worker is responsive')
              }
            }

            navigator.serviceWorker.addEventListener('message', messageHandler)

            // Send ping and wait for response
            registration.active?.postMessage(testMessage)

            setTimeout(() => {
              navigator.serviceWorker.removeEventListener('message', messageHandler)
              if (!responded) {
                console.warn('Service worker not responding, may be causing conflicts')
                // Force unregister if unresponsive
                registration.unregister().then(() => {
                  console.log('Unregistered unresponsive service worker')
                })
              }
            }, 2000)
          }
        }
      } catch (e) {
        console.error('Service worker conflict check failed:', e)
      }
    }

    // Check immediately and then periodically
    checkServiceWorkerConflicts()
    const interval = setInterval(checkServiceWorkerConflicts, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [])

  // Mobile-specific scrolling enhancements
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobile = window.innerWidth < 1024
    if (!isMobile) return

    // Handle viewport changes (keyboard show/hide) on mobile
    const handleViewportChange = () => {
      setTimeout(() => scrollToBottom(), 300) // Delay to allow keyboard animation to complete
    }

    // Listen for visual viewport changes (keyboard, etc.)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange)
      }
    }

    // Fallback: listen for window resize
    window.addEventListener('resize', handleViewportChange)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  // Enhanced mobile scrolling when messages change
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobile = window.innerWidth < 1024
    if (!isMobile) return

    // On mobile, add extra delay to ensure DOM is fully updated
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [])

  // Handle mobile keyboard appearance/disappearance
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isMobile = window.innerWidth < 1024
    if (!isMobile) return

    const handleFocus = () => {
      // When keyboard appears, scroll to bottom after a delay
      setTimeout(() => scrollToBottom(), 500)
    }

    const handleBlur = () => {
      // When keyboard disappears, scroll to bottom after a delay
      setTimeout(() => scrollToBottom(), 300)
    }

    // Add listeners to textarea when it mounts
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.addEventListener('focus', handleFocus)
      textarea.addEventListener('blur', handleBlur)

      return () => {
        textarea.removeEventListener('focus', handleFocus)
        textarea.removeEventListener('blur', handleBlur)
      }
    }
  }, [])

  const sendMessage = async () => {
    if (!text.trim() && !file) return

    // Check auth before sending
    try {
      const authCheck = await fetch('/api/auth/me', { cache: 'no-cache' })
      if (!authCheck.ok) {
        console.error('Auth check failed before sending message')
        toast({ variant: "destructive", title: "Authentication Error", description: "Please refresh the page and try again" })
        return
      }
      const authData = await authCheck.json()
      const adminId = authData?.admin?.id
      if (!adminId) {
        console.error('No admin ID found in auth response')
        toast({ variant: "destructive", title: "Authentication Error", description: "Please refresh the page and try again" })
        return
      }
    } catch (e) {
      console.error('Auth check error before sending:', e)
      toast({ variant: "destructive", title: "Connection Error", description: "Please check your connection and try again" })
      return
    }

    setIsSending(true)

    // Create optimistic message BEFORE sending to server
    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`
    const optimisticMsg = {
      id: optimisticId,
      content: text,
      conversation_id: conversationId,
      admin_id: currentAdminId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      attachments: []
    }

    // Add optimistic message immediately for instant UI feedback
    pushMessage(optimisticMsg)
    // Scroll to bottom to show the new message
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
    const scrollDelay = isMobile ? 50 : 10 // Longer delay on mobile
    setTimeout(() => scrollToBottom(), scrollDelay)
    setText("")

    try {
      let attachmentPayload = []

      if (file) {
        setIsUploading(true)
        const form = new FormData()
        form.append("file", file)
        form.append("conversation_id", conversationId)

        const up = await fetch("/api/admin/messages/upload", { method: "POST", body: form })
        if (!up.ok) throw new Error("Upload failed")
        const upjson = await up.json()
        attachmentPayload = upjson.attachments || []
        setFile(null)
        setIsUploading(false)
      }

      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId, content: text, attachments: attachmentPayload }),
        cache: 'no-cache'
      })

      if (!res.ok) {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId))
        throw new Error("Failed to send message")
      }

      const data = await res.json()

      // The server response will be handled by the realtime subscription
      // which will replace the optimistic message with the real one
      console.log('Message sent successfully:', data.message.id)

      // if server returned an updated conversation, broadcast it so parent shells can update their lists
      try {
        if (data.conversation) {
          const preview = text || (file ? (file.name || 'attachment') : '')
          const updatedConv = { ...data.conversation, last_message_preview: 'You: ' + preview, updated_at: data.message.created_at || new Date().toISOString() }
          const ev = new CustomEvent('conversation:updated', { detail: { conversation: updatedConv } })
          if (typeof window !== 'undefined') window.dispatchEvent(ev)
        }
      } catch (e) {
        // ignore event dispatch failures
      }

      // mark conversation read for sender
      try {
        await fetch('/api/admin/conversations/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: conversationId }), cache: 'no-cache' })
      } catch (e) {
        // ignore
      }

      // broadcast fallback: publish to the same channel so other clients receive immediately
      try {
        await supabase
          .channel(`public:messages:conversation=${conversationId}`)
          .send({ type: 'broadcast', event: 'message', payload: data.message })
      } catch (e) {
        // ignore broadcast failures
      }

      // also broadcast to global channel for conversation list updates on other clients
      try {
        await supabase
          .channel('public:messages:all')
          .send({ type: 'broadcast', event: 'message', payload: data.message })
      } catch (e) {
        // ignore broadcast failures
      }

    } catch (err) {
      console.error('Failed to send message:', err)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId))
      toast({ variant: "destructive", title: "Error", description: "Failed to send message" })
    } finally {
      setIsSending(false)
      setIsUploading(false)
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // legacy handler left in place — noop. Replaced by handleKeyDown and textarea below.
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Desktop: Enter sends (unless Shift held). Mobile: Enter inserts newline.
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
    if (isDesktop) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    } else {
      // mobile: do nothing special, let Enter create newline in textarea
    }
  }

  const removeFile = () => {
    setFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area: add extra bottom padding to account for fixed composer on mobile */}
  <div className="flex-1 overflow-y-auto pt-2 pb-24 lg:pb-4 px-3 space-y-3 bg-gradient-to-b from-background to-muted/20 safe-area-bottom lg-hide-scrollbar" data-messages-container>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground max-w-sm">Start the conversation by sending your first message below.</p>
          </div>
        ) : (
          messages.map((m, index) => {
            const senderName = m?.sender_name || m?.admin?.full_name || m?.admin?.username || 'Admin'
            const initial = senderName?.charAt(0)?.toUpperCase() || 'A'
            const isOwn = Boolean(currentAdminId && m?.admin_id && currentAdminId === m?.admin_id)

            return (
              <div key={m?.id || index} className={`flex gap-3 group ${isOwn ? 'justify-end' : ''}`}>
                {!isOwn && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {m?.admin && m.admin.avatar_url ? (
                      <AvatarImage src={m.admin.avatar_url} alt={senderName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initial}</AvatarFallback>
                    )}
                  </Avatar>
                )}

                <div className={`min-w-0 ${isOwn ? 'text-right' : ''}`}>
                  <div className={`flex items-baseline gap-2 mb-0 ${isOwn ? 'justify-end' : ''}`}>
                    <span className="font-medium text-sm text-foreground">{senderName}</span>
                    <span className="text-xs text-muted-foreground">{m?.created_at ? new Date(m.created_at).toLocaleString() : ''}</span>
                  </div>

                  {m?.content && (
                    <Card className={`p-3 ${isOwn ? 'bg-primary/10 ml-auto' : 'bg-card'} border-border/50 shadow-sm max-w-[65%] break-words inline-block ${m.isOptimistic ? 'opacity-70' : ''}`}>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                      {m.isOptimistic && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </div>
                      )}
                    </Card>
                  )}

                  {m?.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.attachments.map((a: any) => (
                        <Card key={a.id} className={`p-3 bg-muted/50 border-border/50 ${m.isOptimistic ? 'opacity-70' : ''}`}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a href={a.file_url || '#'} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 truncate block">
                                {a.file_name || a.file_url || 'attachment'}
                              </a>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
                          {m.isOptimistic && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                {isOwn && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {m?.admin && m.admin.avatar_url ? (
                      <AvatarImage src={m.admin.avatar_url} alt={senderName} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initial}</AvatarFallback>
                    )}
                  </Avatar>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <Separator />

      {/* Composer: fixed on small screens, static on lg+ */}
      <div className="p-4 bg-background border-t lg:static fixed left-0 right-0 bottom-0 z-50 lg:z-auto" data-input-area>
        <div className="max-w-4xl mx-auto">
          {file && (
            <Card className="p-3 mb-3 bg-muted/50 border-border/50">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file!.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file!.size)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={removeFile} className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." className="min-h-[56px] lg:min-h-[44px] resize-none bg-background border-border/50 focus:border-primary/50 w-full rounded px-3 py-3 text-sm textarea-safe-bottom" disabled={isSending || isUploading} />
            </div>

            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-[44px] w-[44px] p-0 border-border/50 hover:bg-muted bg-transparent" disabled={isSending || isUploading} asChild>
                <label className="cursor-pointer flex items-center justify-center">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" onChange={onFileChange} className="hidden" aria-label="Attach file" />
                </label>
              </Button>

              <Button onClick={sendMessage} disabled={isSending || isUploading || (!text.trim() && !file)} size="sm" className="h-[44px] w-[44px] p-0">
                {isSending || isUploading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {(isSending || isUploading) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {isUploading ? 'Uploading file...' : 'Sending message...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
