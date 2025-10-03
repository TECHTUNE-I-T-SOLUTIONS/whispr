'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase' // Adjust path to your generated types

export const createSupabaseBrowser = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
