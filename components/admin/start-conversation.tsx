"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, MessageCircle, Loader2 } from "lucide-react"
import { AdminAvatarDisplay } from "./admin-avatar-display"

export default function StartConversation({ admins }: { admins: any[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected.length) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, participantIds: selected, is_direct: selected.length === 1 }),
      })
      if (!res.ok) throw new Error("Failed")
      const json = await res.json()
  // simple success handling: redirect to messages page for the created conversation
  // server returns { id: <conversationId> }
  const convId = json?.id || null
  if (convId) window.location.href = `/admin/messages?conversation_id=${convId}`
  else window.location.href = "/admin/messages"
    } catch (err) {
      console.error(err)
      alert("Failed to create conversation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Select Team Members
        </Label>
        <ScrollArea className="h-32 w-full rounded-md border bg-card p-3">
          <div className="space-y-2">
            {admins.map((admin: any) => (
              <div
                key={admin.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={admin.id}
                  checked={selected.includes(admin.id)}
                  onCheckedChange={() => toggle(admin.id)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <AdminAvatarDisplay
                    adminId={admin.id}
                    adminName={admin.full_name}
                    username={admin.username}
                    size="sm"
                  />
                  <Label htmlFor={admin.id} className="text-sm font-medium cursor-pointer flex-1 text-card-foreground">
                    {admin.full_name || admin.email || admin.username}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {selected.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            {selected.length} member{selected.length > 1 ? "s" : ""} selected
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Conversation Title (Optional)
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={selected.length === 1 ? "Direct message" : "Enter conversation title..."}
          className="bg-input border-border focus:ring-ring"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        disabled={loading || selected.length === 0}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Starting Conversation...
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Conversation
          </>
        )}
      </Button>
    </form>
  )
}
