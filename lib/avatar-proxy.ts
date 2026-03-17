/**
 * Get the correct base URL for avatar proxy requests
 * This handles different environments (development, production, emulator)
 */
export function getAvatarProxyBaseUrl(): string {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'

  // For development, use the Android emulator IP when accessed via API
  // This allows Flutter apps running in Android emulators to access the proxy
  if (isDevelopment) {
    return 'http://10.0.2.2:3000'
  }

  // For production or other environments, use the site URL from environment
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return siteUrl
}

/**
 * Generate avatar proxy URL for a given filename
 * @param filename - The avatar filename (e.g., "avatar-user-id-timestamp.png")
 * @returns Full proxy URL for the avatar
 */
export function getAvatarProxyUrl(filename: string): string {
  const baseUrl = getAvatarProxyBaseUrl()
  return `${baseUrl}/api/avatar?file=${encodeURIComponent(filename)}`
}

/**
 * Generate avatar proxy URL for a given filename and bucket
 * @param filenameOrUrl - The avatar filename or full Supabase URL
 * @param bucket - The bucket name ('chronicles-profiles' or 'avatars')
 * @returns Full proxy URL for the avatar
 */
export function getAvatarProxyUrlWithBucket(filenameOrUrl: string, bucket: string): string {
  // If it's a full Supabase URL, extract the relative path
  let pathToUse = filenameOrUrl
  if (filenameOrUrl.includes('/storage/v1/object/public/')) {
    // Extract everything after /public/
    const publicIndex = filenameOrUrl.indexOf('/public/')
    if (publicIndex !== -1) {
      pathToUse = filenameOrUrl.substring(publicIndex + 8) // +8 to skip '/public/'
    }
  }
  
  const baseUrl = getAvatarProxyBaseUrl()
  return `${baseUrl}/api/avatar?file=${encodeURIComponent(pathToUse)}&bucket=${encodeURIComponent(bucket)}`
}

/**
 * Extract filename from a full Supabase storage URL
 * @param url - Full Supabase storage URL
 * @returns Just the filename part
 */
export function extractFilenameFromUrl(url: string): string {
  if (!url || !url.startsWith('http')) {
    return url
  }

  const urlParts = url.split('/')
  return urlParts[urlParts.length - 1]
}

/**
 * Get avatar proxy URL from a full Supabase URL
 * @param supabaseUrl - Full Supabase storage URL
 * @returns Proxy URL or original URL if not a Supabase avatar URL
 */
export function getAvatarProxyUrlFromSupabaseUrl(supabaseUrl: string): string {
  if (!supabaseUrl || !supabaseUrl.includes('/avatars/')) {
    return supabaseUrl
  }

  const filename = extractFilenameFromUrl(supabaseUrl)
  return getAvatarProxyUrl(filename)
}