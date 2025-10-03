import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json()
    const supabase = createSupabaseServer()

    // Save draft notification
    const { error } = await supabase
      .from('push_notification_drafts')
      .insert({
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
        type: notificationData.type,
        icon: notificationData.icon,
        image: notificationData.image,
        actions: notificationData.actions,
        created_by: 'admin' // You might want to get the actual admin user ID
      })

    if (error) {
      console.error('Error saving draft:', error)
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Draft saved successfully'
    })

  } catch (error) {
    console.error('Error in save draft:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    const { data: drafts, error } = await supabase
      .from('push_notification_drafts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching drafts:', error)
      return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 })
    }

    return NextResponse.json({
      drafts: drafts || []
    })

  } catch (error) {
    console.error('Error in get drafts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
