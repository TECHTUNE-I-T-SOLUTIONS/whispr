"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function QuickCompose({ onSent }: { onSent?: () => void }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const send = async () => {
    // naive: create a new conversation with first admin or send to all
    await fetch('/api/admin/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Quick Message', participantIds: [] }) })
    setOpen(false)
    setText('')
    onSent?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Compose</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Compose</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input value={text} onChange={(e:any) => setText(e.target.value)} placeholder="Message" />
        </div>
        <DialogFooter>
          <Button onClick={send}>Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
