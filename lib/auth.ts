import bcrypt from "bcryptjs"
import { createSupabaseServer } from "@/lib/supabase-server"
import { cookies } from "next/headers"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateSessionToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function createSession(adminId: string): Promise<string> {
  const supabase = createSupabaseServer()
  const sessionToken = await generateSessionToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const { error } = await supabase.from("admin_sessions").insert({
    admin_id: adminId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  })

  if (error) {
    throw new Error("Failed to create session")
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set("whispr-session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  })

  return sessionToken
}

export async function getSession(): Promise<{ admin: any } | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("whispr-session")?.value

  if (!sessionToken) {
    return null
  }

  const supabase = createSupabaseServer()
  const { data: session, error } = await supabase
    .from("admin_sessions")
    .select(`
      *,
      admin (*)
    `)
    .eq("session_token", sessionToken)
    .gt("expires_at", new Date().toISOString())
    .single()

  if (error || !session) {
    return null
  }

  // Update last accessed
  await supabase
    .from("admin_sessions")
    .update({ last_accessed: new Date().toISOString() })
    .eq("session_token", sessionToken)

  return { admin: session.admin }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("whispr-session")?.value

  if (sessionToken) {
    const supabase = createSupabaseServer()
    await supabase.from("admin_sessions").delete().eq("session_token", sessionToken)
  }

  cookieStore.delete("whispr-session")
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}
