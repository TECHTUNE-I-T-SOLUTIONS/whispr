import { NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your favorite food as a child?",
  "What was the make of your first car?",
  "What was your childhood nickname?",
  "What is the name of your favorite childhood friend?",
]

export async function POST(request: Request) {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      fullName,
      bio,
      phone,
      dateOfBirth,
      securityQuestion,
      securityAnswer,
    } = await request.json()

    // Validation
    if (!username || !email || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: "Username, email, password, security question and answer are required" },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: "Username can only contain letters, numbers, and underscores" },
        { status: 400 },
      )
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be between 3 and 20 characters" }, { status: 400 })
    }

    // Validate security question
    if (!SECURITY_QUESTIONS.includes(securityQuestion)) {
      return NextResponse.json({ error: "Invalid security question" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Check if username already exists
    const { data: existingUsername } = await supabase.from("admin").select("id").eq("username", username).single()

    if (existingUsername) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase.from("admin").select("id").eq("email", email).single()

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Hash password and security answer
    const passwordHash = await bcrypt.hash(password, 12)
    const securityAnswerHash = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 12)

    // Create admin account
    const { data: admin, error } = await supabase
      .from("admin")
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName || null,
        bio: bio || null,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        security_question: securityQuestion,
        security_answer: securityAnswerHash,
        is_active: true,
        email_verified: true, // Auto-verify for now
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ securityQuestions: SECURITY_QUESTIONS })
}
