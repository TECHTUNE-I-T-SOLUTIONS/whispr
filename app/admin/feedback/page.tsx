import React from 'react'
import { createSupabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { AdminFeedbackTabs } from './feedback-tabs'

export const metadata = { title: 'Feedback - Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminFeedbackPage() {
  await requireAuth()

  const supabase = createSupabaseServer()

  const [{ data: feedback, error: feedbackError }, { data: featureRequests, error: frError }] = await Promise.all([
    supabase.from('feedback').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('feature_requests').select('*').order('created_at', { ascending: false }).limit(200),
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Feedback &amp; Feature Requests</h1>
        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Back</Link>
      </div>

      {(feedbackError || frError) && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {feedbackError && <div>Feedback: {feedbackError.message}</div>}
          {frError && (
            <div>
              Feature requests: {frError.message}. Did you run the{' '}
              <code>sql-migrations/feature-requests.sql</code> migration in Supabase?
            </div>
          )}
        </div>
      )}

      <AdminFeedbackTabs
        feedback={feedback || []}
        featureRequests={featureRequests || []}
      />
    </div>
  )
}
