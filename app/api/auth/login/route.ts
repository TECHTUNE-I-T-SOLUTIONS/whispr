import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"
<<<<<<< HEAD
import { cookies } from "next/headers"
import crypto from "crypto"
=======
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
<<<<<<< HEAD

=======
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

<<<<<<< HEAD
    // Find admin by username or email
=======
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

<<<<<<< HEAD
    // Check if account is active
=======
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    if (!admin.is_active) {
      return NextResponse.json({ error: "Account is deactivated. Please contact support." }, { status: 401 })
    }

<<<<<<< HEAD
    // Check if account is locked
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json(
        {
          error:
            "Account is locked due to multiple failed login attempts. Please use the forgot password option to reset your password.",
          accountLocked: true,
        },
        { status: 423 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)

    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = (admin.failed_login_attempts || 0) + 1
      const updateData: any = { failed_login_attempts: failedAttempts }

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updateData.locked_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }

      await supabase.from("admin").update(updateData).eq("id", admin.id)

      if (failedAttempts >= 5) {
        return NextResponse.json(
          {
            error:
              "Account has been locked due to multiple failed login attempts. Please use the forgot password option to reset your password.",
            accountLocked: true,
          },
          { status: 423 },
        )
      }

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Reset failed login attempts and update last login
    await supabase
      .from("admin")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login: new Date().toISOString(),
      })
      .eq("id", admin.id)

    // Create session directly here
    const sessionToken = crypto.randomUUID() + "-" + Date.now()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Insert session into database
    const { error: sessionError } = await supabase.from("admin_sessions").insert({
      admin_id: admin.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    })

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Set secure cookie
    const cookieStore = await cookies()
    cookieStore.set("whispr-admin-session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        bio: admin.bio,
        avatar_url: admin.avatar_url,
        phone: admin.phone,
        date_of_birth: admin.date_of_birth,
        profile_image_url: admin.profile_image_url,
      },
    })
=======
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json({
        error: "Account is locked due to multiple failed login attempts.",
        accountLocked: true,
      }, { status: 423 })
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      const failedAttempts = (admin.failed_login_attempts || 0) + 1
      await supabase.from("admin").update({
        failed_login_attempts: failedAttempts,
        ...(failedAttempts >= 5 && {
          locked_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      }).eq("id", admin.id)

      return NextResponse.json({
        error: failedAttempts >= 5
          ? "Account locked. Use forgot password to reset."
          : "Invalid credentials",
        accountLocked: failedAttempts >= 5,
      }, { status: 423 })
    }

    await supabase.from("admin").update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString()
    }).eq("id", admin.id)

    const adminData = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      full_name: admin.full_name,
      avatar_url: admin.avatar_url,
      is_active: admin.is_active,
      created_at: admin.created_at,
      last_login: new Date().toISOString()
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const response = NextResponse.json({ success: true, admin: adminData })

    response.cookies.set("whispr-admin-auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    })

    response.cookies.set("whispr-admin-data", encodeURIComponent(JSON.stringify(adminData)), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt
    })

    return response
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
