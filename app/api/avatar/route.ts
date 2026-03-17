import { type NextRequest, NextResponse } from "next/server"

// Default avatar as base64-encoded PNG (1x1 transparent pixel with placeholder color)
const DEFAULT_AVATAR_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAACXBIWXMAAA7DAAAOwwHHb6thAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJAHFF3t8/AIffvOec7dgwAoSfRiCAoxlAiBEFIoiEBRxIkpRolxKwVES8DG4K+QTIK5rCUoQUolVrgnCwVwYqbAv73gNueuJuIGnkKZELmkLjZQPtLiuEkn67B7pLESKGoVoxEAoxDoqZEhSxoPEGCL7mKgkNxoCZuBqXgI6ydomcKSBXe8LJwqKkPAJQJgqyRlSdJJUTJqKxSNVQJU01QKRaXlW0r3HSIawVH9uk+BWEYGqQBxks+3g9t1Kz3gvyNYxEAYb6ST1yMhNE5z/TfIdzPOZ+zNIHnwrFfIlV4XwVN984IAKkoGXoQZS37eSF2WsprjvmvJfc6kIry5Z5yp6I8cgqKEVU7g7lb+qGe7PIQbqTkWGepJHmGEoJRiapIVydSlUakywtUfAEA51SUMog8cbgx9kx5Rk7gIoPjWwnt6f5ANclToEoEwAA6ngvOlMaxABI9gUBuzS/dNaL3XxwWd/BPMevzQstVaIGD2atRI+DJXSRO7LyundG84mNjWigm3p9db+sp4cWkiMiAxaX7mrBX+gsF3KwB8bH7Ziyy2jNnM7DkegYGqTmajQeys2yQcezP6CR6ifuqn0KhX2HxUx+MKF8CcydSTvHL8My1iMjMmQkZGZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZ/7DEoAAAAAElFTkSuQmCC'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const file = searchParams.get('file')
    const bucket = searchParams.get('bucket') || 'chronicles-profiles'

    if (!file) {
      return NextResponse.json({ error: "File parameter required" }, { status: 400 })
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL not configured')
    }

    // The file parameter might already contain the full relative path (e.g., "avatars/avatar-xxx.png")
    // or just the filename (e.g., "avatar-xxx.png")
    let publicUrl: string
    
    if (bucket === 'avatars' && !file.includes('/')) {
      // If it's just a filename (no slash), it might be in the nested avatars folder
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/avatars/${encodeURIComponent(file)}`
    } else {
      // Use the path as-is (it already contains folder structure)
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${file}`
    }

    // Try to fetch the image from Supabase
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(publicUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || getContentType(file)
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        })
      }
    } catch (fetchError) {
      console.warn(`Failed to fetch avatar from Supabase: ${publicUrl}`, fetchError)
    }

    // If file doesn't exist or fetch fails, return a default avatar PNG
    console.log(`Returning default avatar for: ${file}`)
    const defaultAvatarBuffer = Buffer.from(DEFAULT_AVATAR_BASE64, 'base64')
    
    return new NextResponse(defaultAvatarBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Avatar proxy error:', error)
    // Return a default avatar as fallback even on errors
    const defaultAvatarBuffer = Buffer.from(DEFAULT_AVATAR_BASE64, 'base64')
    return new NextResponse(defaultAvatarBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}

// Helper function to get content type from filename
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'svg':
      return 'image/svg+xml'
    default:
      return 'image/png'
  }
}