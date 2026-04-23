import React from "react"
import Link from "next/link"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuth } from "@/lib/auth"
import { AdminCommunityClient } from "./admin-community-client"

export const metadata = { title: "Community — Admin" }
export const dynamic = "force-dynamic"

export default async function AdminCommunityPage() {
  await requireAuth()
  const supabase = createSupabaseServer()
  const { data: issues, error } = await supabase
    .from("community_issues")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return <div className="p-6">Error loading community: {error.message}</div>
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Community</h1>
          <p className="text-sm text-muted-foreground">
            Triage incoming issues, reply to users and mark items resolved.
          </p>
        </div>
        <Link href="/community" target="_blank" className="text-sm underline">
          Open public page
        </Link>
      </div>
      <AdminCommunityClient initialIssues={issues || []} />
    </div>
  )
}
