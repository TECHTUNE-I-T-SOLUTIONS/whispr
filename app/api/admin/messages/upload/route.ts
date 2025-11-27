import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { getAdminFromRequest } from '@/lib/auth-server'


export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const session = await getAdminFromRequest(req)
  const adminId = session?.admin?.id || null

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const conversation_id = formData.get('conversation_id') as string | null

  if (!file) return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 })

  // Generate a safe path
  const filename = `${Date.now()}_${(file as any).name}`
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    // Upload to supabase storage bucket 'media'
    const { data, error: upErr } = await supabase.storage.from('media').upload(filename, fileBuffer, {
      contentType: (file as any).type || 'application/octet-stream',
      upsert: false
    })
    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), { status: 500 })
    }

    const publicUrl = supabase.storage.from('media').getPublicUrl(data.path).data.publicUrl

    // Insert into media table to create media record and return id
    const { data: mediaRow, error: mediaErr } = await supabase.from('media').insert({
      original_name: (file as any).name,
      file_name: filename,
      file_path: data.path,
      file_url: publicUrl,
      file_type: (file as any).type || 'application/octet-stream',
      file_size: (file as any).size || 0,
      bucket_name: 'media',
      uploaded_by: adminId
    }).select().single()

    if (mediaErr) {
      return new Response(JSON.stringify({ error: mediaErr.message }), { status: 500 })
    }

    // Return an attachment record to the client for inclusion in message POST
    const attachment = {
      id: null,
      media_file_id: mediaRow.id,
      file_url: publicUrl,
      file_type: mediaRow.file_type,
      file_size: mediaRow.file_size
    }

    return new Response(JSON.stringify({ attachments: [attachment] }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Upload failed' }), { status: 500 })
  }
}

