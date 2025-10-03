"use client"

import React, { useState, useRef } from 'react'
import StartConversation from './start-conversation'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { MoreVertical, X, ChevronLeft } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import MessagesClient from '@/components/admin/messages-client'
import ErrorBoundary from '@/components/admin/error-boundary'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { useToast } from '@/hooks/use-toast'

export default function ConversationsShell({ initialConversations, initialSelected, sessionAdminId, admins }:{ initialConversations: any[]; initialSelected?: string; sessionAdminId: string; admins?: any[] }){
  const [conversations, setConversations] = useState(initialConversations || [])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()
  // determine highlight style from CSS var (fallback to pulse)
  const highlightStyle = (typeof window !== 'undefined') ? getComputedStyle(document.documentElement).getPropertyValue('--conv-highlight-style').trim() : 'pulse'

  // user settings persisted in localStorage
  const [settings, setSettings] = useState<{ sound: boolean; animation: boolean }>(() => {
    try {
      if (typeof window === 'undefined') return { sound: true, animation: true }
      const raw = localStorage.getItem('whispr:settings')
      if (!raw) return { sound: true, animation: true }
      return { ...{ sound: true, animation: true }, ...(JSON.parse(raw) || {}) }
    } catch (e) {
      return { sound: true, animation: true }
    }
  })

  // debounce aggregation refs for notifications
  const pendingCountRef = useRef(0)
  const lastTitleRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<any>(null)
  const NOTIFY_DEBOUNCE_MS = 2200
  // default: no selection on desktop/tablet; mobile may read URL params to open
  const [selected, setSelected] = useState<string | null>(null)

  const [mobileView, setMobileView] = useState<'list' | 'chat'>(() => 'list')
  // Modal state for edit/delete
  const [editingConv, setEditingConv] = useState<any | null>(null)
  const [deletingConv, setDeletingConv] = useState<any | null>(null)

  // helper to format ISO dates into a concise local string
  const formatDate = (iso?: string | null) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      const now = new Date()
      const diff = now.getTime() - d.getTime()
      const oneDay = 24 * 60 * 60 * 1000
      // today -> show time only
      if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      // yesterday
      const yesterday = new Date(now.getTime() - oneDay)
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
      // within last week -> show weekday
      if (diff < 7 * oneDay) return d.toLocaleDateString(undefined, { weekday: 'short' })
      // fallback: short date
      return d.toLocaleDateString()
    } catch (e) {
      return ''
    }
  }

  // helper: merge/upsert a conversation, update preview/unread and reorder by updated_at
  const upsertConversation = (incoming: any, opts: { incrementUnread?: boolean, incomingMessage?: string } = {}) => {
    if (!incoming || !incoming.id) return
    setConversations((prev: any[]) => {
      // map existing, merge fields
      const found = prev.find(p => p.id === incoming.id)
      let merged: any[]
      if (found) {
        // Check if incoming data is newer than existing data to prevent reverting to old state
        const incomingTime = new Date(incoming.updated_at || incoming.last_message_at || incoming.created_at || 0).getTime()
        const existingTime = new Date(found.updated_at || found.last_message_at || found.created_at || 0).getTime()
        if (incomingTime <= existingTime) return prev  // Don't update if incoming is not newer
        merged = prev.map(p => p.id === incoming.id ? { ...p, ...incoming } : p)
      } else {
        merged = [incoming, ...prev]
      }

      // If there's an incomingMessage, reflect it in preview and updated_at
      if (opts.incomingMessage) {
        merged = merged.map(p => p.id === incoming.id ? { ...p, last_message_preview: opts.incomingMessage, updated_at: incoming.updated_at || new Date().toISOString() } : p)
      }

      // increment unread if requested
      if (opts.incrementUnread) {
        merged = merged.map(p => p.id === incoming.id ? { ...p, unread_count: (p.unread_count || 0) + 1 } : p)
      }

      // reorder by updated_at (newest first). fallback to created_at
      merged.sort((a: any, b: any) => {
        const ta = new Date(a.updated_at || a.created_at || 0).getTime()
        const tb = new Date(b.updated_at || b.created_at || 0).getTime()
        return tb - ta
      })

      // tag the updated conversation so we can animate it briefly in the UI (only if animation enabled)
      const nowTag = new Date().toISOString()
      if (settings.animation) merged = merged.map(p => p.id === incoming.id ? { ...p, __updatedAt: nowTag } : p)

      // Aggregate notifications into a single toast/sound per debounce window
      try {
        pendingCountRef.current = (pendingCountRef.current || 0) + 1
        lastTitleRef.current = incoming.title || incoming.last_message_preview || lastTitleRef.current

        if (!debounceTimerRef.current) {
          debounceTimerRef.current = setTimeout(() => {
            const count = pendingCountRef.current || 0
            const title = lastTitleRef.current || 'Conversation updated'
            try {
              if (settings.sound) {
                if (typeof window !== 'undefined') {
                  if (!audioRef.current) audioRef.current = new Audio('/connect.mp3')
                  audioRef.current.currentTime = 0
                  audioRef.current.play().catch(() => {})
                }
              }
            } catch (e) {}

            try {
              if (count > 1) {
                toast({ title: `${count} conversations updated`, description: title, duration: 3500 })
              } else {
                toast({ title: 'Conversation updated', description: title, duration: 3000 })
              }
            } catch (e) {}

            // reset
            pendingCountRef.current = 0
            lastTitleRef.current = null
            debounceTimerRef.current = null
          }, NOTIFY_DEBOUNCE_MS)
        }
      } catch (e) {}

      // schedule clearing the tag after animation completes (only if animation used)
      if (settings.animation) {
        setTimeout(() => {
          setConversations((cur: any[]) => cur.map(c => c.id === incoming.id ? (() => { const copy = { ...c }; delete copy.__updatedAt; return copy })() : c))
        }, 1200)
      }

      return merged
    })
  }

  const EditConversationModal = ({ conv, onClose }: { conv: any | null, onClose: ()=>void }) => {
    const [title, setTitle] = useState(conv?.title || '')
    if (!conv) return null
    return (
      <Dialog open={Boolean(conv)} onOpenChange={(o)=>{ if (!o) onClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="sr-only">Conversation title</label>
            <input aria-label="Conversation title" placeholder="Conversation title" value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border px-2 py-1 rounded" />
          </div>
          <DialogFooter>
            <Button onClick={async ()=>{
              try {
                const res = await fetch('/api/admin/conversations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conv.id, title }), cache: 'no-cache' })
                if (!res.ok) throw new Error('Failed')
                const json = await res.json()
                setConversations(prev => prev.map(p => p.id === conv.id ? { ...p, title: json.conversation?.title ?? title } : p))
                onClose()
              } catch (err) {
                console.error(err)
                // show a simple alert fallback
                alert('Failed to update conversation title')
              }
            }}>Save</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const ConfirmDeleteModal = ({ conv, onClose }: { conv: any | null, onClose: ()=>void }) => {
    if (!conv) return null
    return (
      <Dialog open={Boolean(conv)} onOpenChange={(o)=>{ if (!o) onClose() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p>Are you sure you want to delete "{conv.title || 'this conversation'}"?</p>
          </div>
          <DialogFooter>
            <Button onClick={async ()=>{
              try {
                const res = await fetch('/api/admin/conversations', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: conv.id }), cache: 'no-cache' })
                if (!res.ok) throw new Error('Failed')
                setConversations(prev => prev.filter(p => p.id !== conv.id))
                if (selected === conv.id) {
                  setSelected(null)
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href)
                    url.searchParams.delete('conversation_id')
                    window.history.replaceState({}, '', url.toString())
                  }
                }
                onClose()
              } catch (err) {
                console.error(err)
                alert('Failed to delete conversation')
              }
            }} className="text-red-600">Delete</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Clear potential stale data on mount
  React.useEffect(() => {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('whispr:')) {
          const value = localStorage.getItem(key)
          if (value) {
            try {
              const parsed = JSON.parse(value)
              const age = Date.now() - (parsed.ts || 0)
              if (age > 24 * 60 * 60 * 1000) { // Older than 24 hours
                localStorage.removeItem(key)
              }
            } catch (e) {
              // Clear invalid data
              localStorage.removeItem(key)
            }
          }
        }
      })
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [])

  // ensure initial conversations are ordered by newest message (updated_at) on mount / when prop changes
  React.useEffect(() => {
    if (!initialConversations || !initialConversations.length) return
    try {
      const sorted = [...initialConversations].sort((a: any, b: any) => {
        const ta = new Date(a.updated_at || a.last_message_at || a.created_at || 0).getTime()
        const tb = new Date(b.updated_at || b.last_message_at || b.created_at || 0).getTime()
        return tb - ta
      })
      setConversations((prev) => {
        if (prev.length === 0) return sorted
        // merge with existing, keeping newer data to prevent reverting to old state
        const merged = [...prev]
        sorted.forEach((incoming) => {
          const existing = merged.find(p => p.id === incoming.id)
          if (existing) {
            const incomingTime = new Date(incoming.updated_at || incoming.last_message_at || incoming.created_at || 0).getTime()
            const existingTime = new Date(existing.updated_at || existing.last_message_at || existing.created_at || 0).getTime()
            if (incomingTime > existingTime) {
              const index = merged.findIndex(p => p.id === incoming.id)
              merged[index] = incoming
            }
          } else {
            merged.push(incoming)
          }
        })
        merged.sort((a: any, b: any) => {
          const ta = new Date(a.updated_at || a.created_at || 0).getTime()
          const tb = new Date(b.updated_at || b.created_at || 0).getTime()
          return tb - ta
        })
        return merged
      })
    } catch (e) {
      // ignore
    }
  }, [initialConversations])

  // listen for conversation updates (dispatched from MessagesManager after send)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    // upsertConversation moved to component scope

    const handler = (e: any) => {
      try {
        const conv = e?.detail?.conversation
        if (!conv || !conv.id) return
        // ensure last_message_preview and updated_at are present when available
        upsertConversation(conv)
      } catch (err) {
        /* ignore */
      }
    }
    window.addEventListener('conversation:updated', handler as EventListener)

    // Listen for remote new-message events to increment per-conversation unread badge
    const newMsgHandler = (e: any) => {
      try {
        const detail = e?.detail || {}
        const cid = detail.conversation_id || detail.conversation?.id
        if (!cid) return
        // determine preview text (prefer the message text or provided preview)
        const incomingMsg = detail.message || detail.preview || detail.text || detail.last_message_preview || (detail.conversation && detail.conversation.last_message_preview) || ''
        const updatedAt = detail.created_at || detail.updated_at || new Date().toISOString()

        // Build a minimal conversation update object
  const convUpdate: any = { id: cid, updated_at: updatedAt }

        // If the message is from an admin (detail.from_admin true) or just any incoming message,
        // use that message as the last_message_preview so previews show newest message
        if (incomingMsg) {
          const prefix = (detail.sender_id === sessionAdminId) ? 'You: ' : ''
          convUpdate.last_message_preview = prefix + incomingMsg
        }

        // If this conversation is currently open/selected, do not increment unread
        const shouldIncrement = selected !== cid

        upsertConversation(convUpdate, { incrementUnread: shouldIncrement, incomingMessage: convUpdate.last_message_preview })
      } catch (err) {
        // ignore
      }
    }
    window.addEventListener('conversation:new_message', newMsgHandler as EventListener)
    return () => {
      try { window.removeEventListener('conversation:updated', handler as EventListener) } catch (e) {}
      try { window.removeEventListener('conversation:new_message', newMsgHandler as EventListener) } catch (e) {}
    }
  }, [selected])

  // Listen for messages forwarded from the service worker (push events) so open tabs
  // update immediately when push arrives. The handler extracts a conversation id
  // and dispatches a local 'conversation:updated' event so existing upsert logic runs.
  React.useEffect(() => {
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
  }, [selected])

  // Service worker conflict detection and cleanup
  React.useEffect(() => {
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

  // Global realtime subscription: listen to messages inserts across all conversations so the
  // conversation list updates even when a conversation isn't open (mobile list view)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const supabase = createSupabaseBrowser()
    if (!supabase) return
    // dedupe recently seen message ids so we don't increment unread twice for same message
    const seenMsgIds = new Set<string>()

    let channel: any = null
    let isSubscribed = false

    const createChannel = async () => {
      try {
        // Check auth before creating subscription
        const authCheck = await fetch('/api/auth/me', { cache: 'no-cache' })
        if (!authCheck.ok) {
          console.error('Auth check failed for global subscription:', authCheck.status)
          return
        }

        // unsubscribe previous if present
        try { channel?.unsubscribe?.() } catch (e) {}

        channel = supabase
          .channel('public:messages:all')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
            try {
              const newMsg = payload?.record ?? payload?.new ?? null
              if (!newMsg || !newMsg.conversation_id) return
              // dedupe
              const mid = String(newMsg.id || newMsg.message_id || '')
              if (mid && seenMsgIds.has(mid)) return
              if (mid) seenMsgIds.add(mid)
              const preview = (newMsg.admin_id === sessionAdminId ? 'You: ' : '') + (newMsg.content || (newMsg.attachments && newMsg.attachments.length ? (newMsg.attachments[0].file_name || 'attachment') : ''))
              const conv = { id: newMsg.conversation_id, last_message_preview: preview, updated_at: newMsg.created_at, last_message_at: newMsg.created_at }
              const shouldIncrement = selected !== newMsg.conversation_id
              upsertConversation(conv, { incrementUnread: shouldIncrement, incomingMessage: preview })
              // immediate UI update for selected conversation
              if (selected === newMsg.conversation_id) {
                // dispatch event to trigger message list update
                window.dispatchEvent(new CustomEvent('message:received', { detail: { message: newMsg } }))
              }
            } catch (e) {
              // ignore
            }
          })
          .on('broadcast', { event: 'message' }, (payload: any) => {
            try {
              const msg = payload?.payload ?? payload
              if (!msg || !msg.conversation_id) return
              const mid = String(msg.id || msg.message_id || '')
              if (mid && seenMsgIds.has(mid)) return
              if (mid) seenMsgIds.add(mid)
              const preview = (msg.admin_id === sessionAdminId ? 'You: ' : '') + (msg.content || (msg.attachments && msg.attachments.length ? (msg.attachments[0].file_name || 'attachment') : ''))
              const conv = { id: msg.conversation_id, last_message_preview: preview, updated_at: msg.created_at, last_message_at: msg.created_at }
              const shouldIncrement = selected !== msg.conversation_id
              upsertConversation(conv, { incrementUnread: shouldIncrement, incomingMessage: preview })
              // immediate UI update for selected conversation
              if (selected === msg.conversation_id) {
                // dispatch event to trigger message list update
                window.dispatchEvent(new CustomEvent('message:received', { detail: { message: msg } }))
              }
            } catch (e) {}
          })
          .subscribe((status) => {
            console.log('Global messages subscription status:', status)
          })
      } catch (e) {
        // ignore subscription errors
        isSubscribed = false
      }
    }

    createChannel()

    // visibility: re-create channel when tab becomes visible to mitigate background throttling
    const visibilityHandler = () => {
      try {
        if (document.visibilityState === 'visible') {
          // clear seen ids older than some threshold to allow future messages with same id? keep simple and keep set
          createChannel()
        }
      } catch (e) {}
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    // best-effort monitor: if channel dies, attempt a recreate after backoff
    let attempts = 0
    const monitor = setInterval(async () => {
      try {
        const state = channel?.state || null
        console.log('Global channel monitor check - State:', state)
        if (!state || state !== 'SUBSCRIBED') {
          attempts += 1
          const delay = Math.min(30000, 500 * Math.pow(2, attempts))
          console.warn('Global realtime channel not subscribed, scheduling reconnect', { state, attempt: attempts, delay })

          setTimeout(async () => {
            try {
              // Check auth before reconnecting
              const authCheck = await fetch('/api/auth/me', { cache: 'no-cache' })
              if (!authCheck.ok) {
                console.error('Auth failed during global reconnection, aborting')
                return
              }
              createChannel()
            } catch (e) {
              console.error('Global resubscribe failed', e)
            }
          }, delay)
        } else {
          attempts = 0
        }
      } catch (e) {
        console.error('Global channel monitor error:', e)
      }
    }, 3000)

    return () => {
      try { channel?.unsubscribe?.() } catch (e) {}
      try { document.removeEventListener('visibilitychange', visibilityHandler) } catch (e) {}
      try { clearInterval(monitor) } catch (e) {}
    }
  }, [selected])

  // Listen for cross-tab / cross-client conversation refresh broadcasts
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const supabase = createSupabaseBrowser()
    if (supabase) {
      try {
        const ch = supabase
          .channel('public:conversations')
          .on('broadcast', { event: 'conversations:refreshed' }, (payload: any) => {
            try {
              const data = payload?.payload ?? payload
              if (!data) return
              // If the broadcast targets this admin, update list
              // data: { admin_id, conversation_id, unread_count }
              // update the specific conversation unread_count or if unread_count is total, dispatch conversations:refreshed locally
              if (data.conversation_id) {
                setConversations(prev => prev.map(p => p.id === data.conversation_id ? { ...p, unread_count: 0 } : p))
              }
              // also emit a local event with exact counts for header listeners
              try { window.dispatchEvent(new CustomEvent('conversations:refreshed', { detail: { unread_count: data.unread_count } })) } catch (e) {}
              // also write to localStorage to trigger storage event across tabs
              try { localStorage.setItem('whispr:conversations:refreshed', JSON.stringify({ ts: Date.now(), data })) } catch (e) {}
            } catch (e) {}
          })
          .on('broadcast', { event: 'conversation:read' }, (payload: any) => {
            try {
              const data = payload?.payload ?? payload
              if (!data) return
              // clear unread for that conversation
              if (data.conversation_id) {
                setConversations(prev => prev.map(p => p.id === data.conversation_id ? { ...p, unread_count: 0 } : p))
                // dispatch local event so header and other components update
                try { window.dispatchEvent(new CustomEvent('conversation:read', { detail: { conversation_id: data.conversation_id, unreadDelta: data.unread_for_conversation || 0 } })) } catch (e) {}
                // write to localStorage for cross-tab
                try { localStorage.setItem('whispr:conversation:read', JSON.stringify({ ts: Date.now(), data })) } catch (e) {}
              }
            } catch (e) {}
          })
          .subscribe()
      } catch (e) {
        // ignore
      }
    }

      // listen for conversation updates (title changes etc.)
      try {
        supabase
          .channel('public:conversations')
          .on('broadcast', { event: 'conversation:updated' }, (payload: any) => {
            try {
              const data = payload?.payload ?? payload
              if (!data || !data.id) return
              upsertConversation(data)
            } catch (e) {}
          })
          .subscribe()
      } catch (e) {}

    // listen for localStorage storage events (cross-tab)
    const storageHandler = (e: StorageEvent) => {
      try {
        if (e.key === 'whispr:conversations:refreshed' && e.newValue) {
          const payload = JSON.parse(e.newValue)
          const data = payload.data
          if (data?.conversation_id) {
            setConversations(prev => prev.map(p => p.id === data.conversation_id ? { ...p, unread_count: 0 } : p))
          }
          if (data?.unread_count || data?.unread_count === 0) {
            try { window.dispatchEvent(new CustomEvent('conversations:refreshed', { detail: { unread_count: data.unread_count } })) } catch (e) {}
          }
        }
      } catch (e) {}
    }
    window.addEventListener('storage', storageHandler)

    return () => {
      try { window.removeEventListener('storage', storageHandler) } catch (e) {}
    }
  }, [])

  // When selected changes on mobile, switch to chat view
  const handleSelect = async (id: string) => {
    setSelected(id)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setMobileView('chat')
    // update url param for back/refresh
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('conversation_id', id)
      window.history.replaceState({}, '', url.toString())
    }
    // mark conversation as read when opened
    try {
      // capture current unread count for this conversation so header can decrement immediately
      const convObj = conversations.find((c: any) => c.id === id)
      const unreadDelta = convObj?.unread_count || 0

      const res = await fetch('/api/admin/conversations/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: id }), cache: 'no-cache' })
      if (res && res.ok) {
        // update local conversations list to set unread_count to 0 for the opened conversation
        setConversations(prev => prev.map(p => p.id === id ? { ...p, unread_count: 0 } : p))
        // dispatch a lightweight event so other components (header) can update without waiting for polling
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('conversation:read', { detail: { conversation_id: id, unreadDelta } }))
          }
        } catch (e) {
          // ignore dispatch errors
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // convenient reference to the currently selected conversation
  const currentConversation = conversations.find((c: any) => c.id === selected) || null

    return (
      <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)]">
        <div className={`lg:col-span-4 xl:col-span-3 ${mobileView === 'chat' ? 'hidden lg:block' : ''}`}>
          {/* Make left panel sticky on larger screens so it doesn't scroll with messages */}
          <div className="h-full flex flex-col lg:sticky lg:top-14 lg:h-[calc(100vh-10rem)] lg:overflow-hidden">
            {/* Left panel header - sticky so it remains at top on scroll (mobile + desktop) */}
              <div className="p-2 sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
                <div className="p-2 border-b">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">Conversations</div>
                  </div>
                </div>
              <div className="p-2 hidden lg:block">
                <StartConversation admins={admins || []} />
              </div>
              <div className="p-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings.sound} onChange={(e) => { const s = { ...settings, sound: e.target.checked }; setSettings(s); try { localStorage.setItem('whispr:settings', JSON.stringify(s)) } catch (err) {} }} />
                  <span>Sound</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings.animation} onChange={(e) => { const s = { ...settings, animation: e.target.checked }; setSettings(s); try { localStorage.setItem('whispr:settings', JSON.stringify(s)) } catch (err) {} }} />
                  <span>Animation</span>
                </label>
              </div>
              {/* Mobile floating add button moved outside header so it stays at bottom-left */}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 lg-hide-scrollbar">
              {conversations.map((c: any) => {
                const other = c.participants?.find((p: any) => p?.admin_id && p.admin_id !== sessionAdminId)
                const members = (c.participants || []).map((p: any)=>p?.admin).filter(Boolean)
                const isDirect = c.participants?.length === 2
                return (
                  <div key={c.id} className={`w-full group text-left p-3 rounded-lg transition ${selected===c.id? 'bg-primary/10 border border-primary/20 shadow-sm' : 'hover:bg-sidebar-accent/50'} ${c.__updatedAt ? 'conv-updated' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Main clickable content */}
                      <button
                        type="button"
                        onClick={() => handleSelect(c.id)}
                        className="flex-1 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {isDirect ? (
                              <Avatar className="h-8 w-8">
                                {other?.admin?.avatar_url ? (
                                  <AvatarImage src={other.admin.avatar_url} alt={other.admin.full_name || other.admin.username} />
                                ) : (
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{(other?.admin?.full_name||other?.admin?.username||'A').charAt(0)}</AvatarFallback>
                                )}
                              </Avatar>
                            ) : (
                              <div className="flex items-center -space-x-2">
                                {members.slice(0,2).map((a: any, i:number) => (
                                  <Avatar key={a.id} className={`h-8 w-8 ring-1 ring-card/40 ${i===0? 'z-20' : 'z-10'}`}>
                                    {a?.avatar_url ? <AvatarImage src={a.avatar_url} alt={a.full_name || a.username} /> : <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{(a?.full_name||a?.username||'A').charAt(0)}</AvatarFallback>}
                                  </Avatar>
                                ))}
                                {members.length > 2 && (
                                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">+{members.length - 2}</div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium truncate">{c.title || (isDirect ? (other?.admin?.full_name || other?.admin?.username) : 'Group Chat')}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground mr-2">{formatDate(c.updated_at || c.last_message_at || c.created_at)}</div>
                                {c.unread_count > 0 && (
                                  <div className="inline-flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-destructive text-white text-xs font-medium">{c.unread_count}</div>
                                )}
                                <div className="hidden lg:block" />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 break-words whitespace-pre-wrap truncate">{c.last_message_preview ? (c.last_message_preview.length > 50 ? c.last_message_preview.slice(0, 50) + '...' : c.last_message_preview) : ''}</div>
                          </div>
                        </div>
                      </button>

                      {/* Actions (must be sibling to avoid nested interactive controls) */}
                      <div className="flex items-center gap-2 ml-2">
                        <div className="text-xs text-muted-foreground">{c.participants?.length || 0}</div>
                        {c.created_by === sessionAdminId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button aria-label="Conversation actions" aria-haspopup="menu" title="Conversation actions" className="p-1 rounded hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"><MoreVertical className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => setEditingConv(c)}>Edit title</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setDeletingConv(c)} className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Mobile floating add button: placed here so it's rendered at bottom-left and not inside the sticky header */}
            <div className="lg:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" className="fixed bottom-6 left-6 z-60 rounded-full h-12 w-12 p-0 flex items-center justify-center">
                    <Plus />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="pt-2">
                    <StartConversation admins={admins || []} />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-8 xl:col-span-9 ${mobileView === 'list' ? 'hidden lg:block' : ''}`}>
          {selected ? (
            // Guard: ensure the conversation data is available before rendering
            currentConversation ? (
              <div className={`h-full bg-gradient-to-b from-background to-muted/20 flex flex-col transition-all duration-300 ease-out ${mobileView === 'chat' ? 'animate-fade-slide' : ''}`}>
                {/* Header: sticky on mobile so back button stays visible while messages scroll; offset below site header */}
                <div className="p-2 flex items-center justify-between flex-shrink-0 sticky top-14 z-40 bg-gradient-to-b from-background to-muted/20 lg:static shadow-sm">
                  {/* Mobile back button only */}
                  <div className="lg:hidden">
                    <button
                      onClick={() => {
                        // go back to list on mobile
                        setMobileView('list')
                        setSelected(null)
                        if (typeof window !== 'undefined') {
                          const url = new URL(window.location.href)
                          url.searchParams.delete('conversation_id')
                          window.history.replaceState({}, '', url.toString())
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-1 rounded-md hover:bg-muted/20 transition-transform transform active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span className="sr-only">Back</span>
                      <span className="ml-1">Back</span>
                    </button>
                  </div>

                  <div className="hidden lg:block" />

                  <div className="flex items-center gap-4">
                    {/* Chat avatar + title (mobile) */}
                    <div className="flex items-center gap-2 truncate lg:hidden">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {/* show first participant avatar if available */}
                        {(() => {
                          const avatarUrl = currentConversation?.participants?.[0]?.admin?.avatar_url
                          return avatarUrl ? (
                            <Avatar>
                              <AvatarImage src={avatarUrl} alt={currentConversation.title || 'Conversation'} />
                            </Avatar>
                          ) : (
                            <div className="text-sm font-medium text-primary">{(currentConversation?.title || 'C').charAt(0)}</div>
                          )
                        })()}
                      </div>
                      <div className="text-sm font-medium truncate">{currentConversation?.title || 'Conversation'}</div>
                    </div>

                    {/* Close button only on desktop/tablet; keep it visible by using sticky container */}
                    <div className="hidden lg:block lg:sticky lg:top-14 lg:right-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button aria-label="Close conversation" title="Close conversation" onClick={() => {
                          setSelected(null)
                          if (typeof window !== 'undefined') {
                            const url = new URL(window.location.href)
                            url.searchParams.delete('conversation_id')
                            window.history.replaceState({}, '', url.toString())
                          }
                        }} className="p-1 rounded hover:bg-muted/60 transition-colors"><X className="w-4 h-4" /></button>
                        </TooltipTrigger>
                        <TooltipContent>Close conversation</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-auto">
                      <div className="h-full min-h-0">
                    <ErrorBoundary>
                      {/* force remount when selected changes to avoid stale subscriptions/closures */}
                      <MessagesClient key={selected || 'none'} conversationId={selected} initialMessages={[]} />
                    </ErrorBoundary>
                    </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
      <EditConversationModal conv={editingConv} onClose={()=>setEditingConv(null)} />
      <ConfirmDeleteModal conv={deletingConv} onClose={()=>setDeletingConv(null)} />
    </TooltipProvider>
  )
}
