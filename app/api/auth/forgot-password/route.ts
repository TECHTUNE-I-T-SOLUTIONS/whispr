import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { step, ...data } = await request.json()

    const supabase = createSupabaseServer()

    if (step === "verify") {
      const { username, securityAnswer } = data

      if (!username || !securityAnswer) {
        return NextResponse.json({ error: "Username and security answer are required" }, { status: 400 })
      }

      // Find admin by username or email
      const { data: admin, error } = await supabase
        .from("admin")
        .select("id, username, email, security_question, security_answer, is_active")
        .or(`username.eq.${username},email.eq.${username}`)
        .single()

      if (error || !admin) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      if (!admin.is_active) {
        return NextResponse.json({ error: "Account is deactivated" }, { status: 401 })
      }

      // Verify security answer
      const isValidAnswer = await bcrypt.compare(securityAnswer.toLowerCase().trim(), admin.security_answer)

      if (!isValidAnswer) {
        return NextResponse.json({ error: "Incorrect security answer" }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        adminId: admin.id,
        securityQuestion: admin.security_question,
      })
    }

    if (step === "reset") {
      const { adminId, newPassword, confirmPassword } = data

      if (!adminId || !newPassword || !confirmPassword) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 })
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12)

      // Update password and clear lockout
      await supabase
        .from("admin")
        .update({
          password_hash: passwordHash,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq("id", adminId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
