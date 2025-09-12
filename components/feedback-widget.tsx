"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePathname } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function FeedbackWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // don't show on admin pages
  if (pathname.startsWith('/admin')) return null

  const submit = async () => {
    if (!message.trim()) { toast({ title: 'Message required' }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim(), page_url: typeof window !== 'undefined' ? window.location.href : '', user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '', metadata: { referrer: document.referrer || null } }) })
      const json = await res.json()
      if (json?.ok) {
        toast({ title: 'Thanks!', description: 'Your feedback was received anonymously.' })
        setMessage('')
        setOpen(false)
      } else {
        toast({ title: 'Error', description: json?.error || 'Failed to send feedback' })
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to send feedback' })
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed bottom-6 left-6 z-[9999]">
      <div className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-3 w-80 max-w-[90vw]">
        {!open ? (
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Feedback</div>
            <Button size="sm" onClick={() => setOpen(true)}>Give feedback</Button>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium mb-2">We value your feedback (anonymous)</div>
            <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Share your experience, bugs, or ideas..." className="mb-2" />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setMessage('') }}>Cancel</Button>
              <Button size="sm" onClick={submit} disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
