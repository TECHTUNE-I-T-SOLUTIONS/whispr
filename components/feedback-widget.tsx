"use client"

import { useState } from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Lightbulb, ArrowRight } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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
      const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: message.trim(), page_url: typeof window !== 'undefined' ? window.location.href : '', user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '', metadata: { referrer: typeof document !== 'undefined' ? document.referrer || null : null } }) })
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
    <div>
      <div className="fixed bottom-32 left-6 z-[9999]">
        <Dialog open={open} onOpenChange={(o) => setOpen(Boolean(o))}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <button title="Give feedback" className="h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">Give feedback</TooltipContent>
          </Tooltip>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send feedback (anonymous)</DialogTitle>
            </DialogHeader>

            <div className="mt-2">
              <div className="text-sm text-muted-foreground mb-2">Tell us about your experience or report a bug.</div>
              <Textarea value={message} onChange={(e: any) => setMessage(e.target.value)} placeholder="Share your experience, bugs, or ideas..." className="mb-4" />
            </div>

            <Link
              href="/feature-requests"
              onClick={() => setOpen(false)}
              className="group mb-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 transition hover:border-primary/40 hover:bg-primary/10"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lightbulb className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">Want to request a feature?</span>
                <span className="block text-xs text-muted-foreground">Share ideas and suggestions on our feature request page.</span>
              </span>
              <ArrowRight className="h-4 w-4 flex-shrink-0 text-primary transition group-hover:translate-x-0.5" />
            </Link>

            <DialogFooter>
              <div className="flex items-center justify-end gap-2 w-full">
                <Button variant="ghost" onClick={() => { setOpen(false); setMessage('') }}>Cancel</Button>
                <Button onClick={submit} disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
