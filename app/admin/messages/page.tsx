import { requireAuth } from "@/lib/auth"
import { Suspense } from "react"
import { cookies } from "next/headers"
import ConversationsShell from "@/components/admin/conversations-shell"
import { createSupabaseServer } from "@/lib/supabase-server"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"

export const metadata = {
  title: "Admin Messages - Whispr",
  description: "Chat with other admins",
}

export default async function AdminMessagesPage() {
  const session = await requireAuth()
  if (!session) return null

  // fetch conversations from our server API which returns participants and latest previews
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const cookieHeader = (await cookies()).toString()
  const res = await fetch(`${baseUrl}/api/admin/conversations`, { headers: { cookie: cookieHeader }, cache: 'no-store' })
  const convJson = res.ok ? await res.json() : { conversations: [] }
  const json = { conversations: convJson.conversations || [] }

  const supabase = createSupabaseServer()
  const { data: admins } = await supabase
    .from("admin")
    .select("id, full_name, email, username, is_active, avatar_url")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  const adminList = (admins || []).filter((a: any) => a && a.id)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-sidebar/80 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-md font-semibold tracking-tight text-sidebar-foreground">Team Messages</h1>
                <p className="text-sm text-muted-foreground">Stay connected with your team</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {json.conversations?.length || 0} conversations
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Suspense fallback={<div className="h-48 flex items-center justify-center">Loading messages...</div>}>
          <ConversationsShell initialConversations={json.conversations} sessionAdminId={session.admin.id} admins={adminList} />
        </Suspense>
      </div>
    </div>
  )
}
