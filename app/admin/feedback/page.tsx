import React from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'

export const metadata = { title: 'Feedback - Admin' }

export default async function AdminFeedbackPage() {
  await requireAuth()

  const supabase = createSupabaseServer()
  const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100)

  if (error) {
    return <div className="p-6">Error loading feedback: {error.message}</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Feedback</h1>
        <Link href="/admin/dashboard">Back</Link>
      </div>

      {data?.length === 0 && <div>No feedback yet.</div>}

      <div className="space-y-2">
        {data?.map((f: any) => (
          <div key={f.id} className="border rounded p-3 bg-background rounded-md shadow-md">
            <div className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{f.message}</div>
            {f.page_url && <div className="text-sm text-muted-foreground mt-2">Page: <a className="underline" href={f.page_url} target="_blank" rel="noreferrer">{f.page_url}</a></div>}
            {f.user_agent && <div className="text-xs text-muted-foreground mt-1">UA: {f.user_agent}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
