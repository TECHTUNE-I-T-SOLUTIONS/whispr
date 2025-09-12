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
    if (!msg || !msg.id) return
    const mid = String(msg.id)
    const now = Date.now()
    // cleanup expired entries occasionally
    try {
      const m = seenIdsRef.current
      if (m.size > 1000) {
        for (const [k, ts] of Array.from(m.entries())) {
          if (now - ts > REAP_MS) m.delete(k)
        }
      }
      if (m.has(mid)) return
      m.set(mid, now)
    } catch (e) {
      // ignore
    }

    setMessages((prev) => {
      // if already present in state, ignore
      if (prev.some((x) => x.id === msg.id)) return prev
      return [...prev, msg]
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // fetch current admin session for identifying own messages
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        if (r.ok) {
          const j = await r.json()
          const aid = j?.admin?.id || null
          const name = j?.admin?.full_name || j?.admin?.username || null
          setCurrentAdminId(aid)
          setCurrentAdminName(name)
        }
      } catch (e) {
        // ignore
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
                const mid = String(newMsg.id || '')
                if (!seenIds.has(mid)) {
                  seenIds.add(mid)
                  // also add to global seen map with timestamp
                  try { seenIdsRef.current.set(mid, Date.now()) } catch (e) {}
                  pushMessage(newMsg)
                }
                try {
                  // notify conversation list / shells about new message for badge increment
                  if (typeof window !== 'undefined') {
                    // dispatch unread increment event
                    window.dispatchEvent(new CustomEvent('conversation:new_message', { detail: { conversation_id: newMsg.conversation_id, sender_id: newMsg.admin_id, message_id: newMsg.id } }))
                    // also dispatch a lightweight conversation:update so conversation list can refresh preview/ordering
                    const preview = newMsg.content || (newMsg.attachments && newMsg.attachments.length ? (newMsg.attachments[0].file_name || 'attachment') : '')
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
        // avoid duplicates using local seen set + global seen map
        const mid = String(msg.id || '')
        if (!seenIds.has(mid)) {
          seenIds.add(mid)
          try { seenIdsRef.current.set(mid, Date.now()) } catch (e) {}
          pushMessage(msg)
        }
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('conversation:new_message', { detail: { conversation_id: msg.conversation_id, sender_id: msg.admin_id, message_id: msg.id } }))
            const preview = msg.content || (msg.attachments && msg.attachments.length ? (msg.attachments[0].file_name || 'attachment') : '')
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
        .subscribe()

      subRef.current = channel

      // Best-effort: log channel state after short delay
      setTimeout(() => {
        try {
          const state = (subRef.current as any)?.state || null
          console.info('Supabase channel state for', conversationId, state)
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
            // if not subscribed, try to reconnect with backoff
            if (!state || state !== 'SUBSCRIBED') {
              const info = reconnectRef.current
              if (info.attempts >= 5) return
              const delay = Math.min(30000, 500 * Math.pow(2, info.attempts))
              console.warn('Realtime channel not subscribed, scheduling reconnect', { conversationId, state, attempt: info.attempts + 1, delay })
              info.attempts += 1
              if (info.timer) clearTimeout(info.timer)
              info.timer = setTimeout(() => {
                try {
                  try { ch?.unsubscribe?.() } catch (_) {}
                  const retry = supabase
                    .channel(`public:messages:conversation=${conversationId}`)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, onInsert)
                    .on('broadcast', { event: 'message' }, onBroadcast)
                    .subscribe()
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
            /* ignore */
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

  const sendMessage = async () => {
    if (!text.trim() && !file) return
    setIsSending(true)
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
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
  // optimistic append (server realtime will also append) — use pushMessage to avoid duplicates
  pushMessage(data.message)
      // if server returned an updated conversation, broadcast it so parent shells can update their lists
      try {
        if (data.conversation) {
          const ev = new CustomEvent('conversation:updated', { detail: { conversation: data.conversation } })
          if (typeof window !== 'undefined') window.dispatchEvent(ev)
        }
      } catch (e) {
        // ignore event dispatch failures
      }
      // mark conversation read for sender
      try {
        await fetch('/api/admin/conversations/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: conversationId }) })
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
      setText("")
    } catch (err) {
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
  <div className="flex-1 overflow-y-auto pt-2 pb-24 lg:pb-4 px-3 space-y-3 bg-gradient-to-b from-background to-muted/20 safe-area-bottom lg-hide-scrollbar">
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
                    <Card className={`p-3 ${isOwn ? 'bg-primary/10 ml-auto' : 'bg-card'} border-border/50 shadow-sm max-w-[65%] break-words inline-block` }>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                    </Card>
                  )}

                  {m?.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.attachments.map((a: any) => (
                        <Card key={a.id} className="p-3 bg-muted/50 border-border/50">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a href={a.file_url || '#'} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 truncate block">
                                {a.file_name || a.file_url || 'attachment'}
                              </a>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </div>
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
      <div className="p-4 bg-background border-t lg:static fixed left-0 right-0 bottom-0 z-50 lg:z-auto">
        <div className="max-w-4xl mx-auto">
          {file && (
            <Card className="p-3 mb-3 bg-muted/50 border-border/50">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
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
