import { SignupForm } from "@/components/admin/signup-form"

export const metadata = {
  title: "Admin Signup - Whispr",
  description: "Create your Whispr admin account",
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <SignupForm />
    </div>
  )
}
