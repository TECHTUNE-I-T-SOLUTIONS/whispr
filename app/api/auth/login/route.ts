import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    const supabase = createSupabaseServer()

    const { data: admin, error } = await supabase
      .from("admin")
      .select("*")
      .or(`username.eq.${username},email.eq.${username}`)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid credentials" }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    if (!admin.is_active) {
      return NextResponse.json({ error: "Account is deactivated. Please contact support." }, {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
    }

    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return NextResponse.json({
        error: "Account is locked due to multiple failed login attempts.",
        accountLocked: true,
      }, {
        status: 423,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
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
      }, {
        status: 423,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })
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

    const response = NextResponse.json({ success: true, admin: adminData }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

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
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  }
}
