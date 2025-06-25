import { LoginForm } from "@/components/admin/login-form"

export const metadata = {
  title: "Admin Login - Whispr",
  description: "Login to your Whispr admin dashboard",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
