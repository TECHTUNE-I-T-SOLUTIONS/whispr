import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

// Password utilities
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

// Get session based on cookie-based system
export async function getSession(): Promise<{ admin: any } | null> {
  const cookieStore = await cookies()

  const isAuthenticated = cookieStore.get("whispr-admin-auth")?.value === "true"
  const adminDataCookie = cookieStore.get("whispr-admin-data")?.value

  if (!isAuthenticated || !adminDataCookie) {
    return null
  }

  try {
    const adminData = JSON.parse(decodeURIComponent(adminDataCookie))
    return { admin: adminData }
  } catch (error) {
    console.error("Error parsing admin data:", error)
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("whispr-admin-auth")
  cookieStore.delete("whispr-admin-data")
}

export async function requireAuth(): Promise<{ admin: any }> {
  const session = await getSession()
  if (!session) {
    throw new Error("Authentication required")
  }
  return session
}
