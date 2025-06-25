import { ForgotPasswordForm } from "@/components/admin/forgot-password-form"

export const metadata = {
  title: "Forgot Password - Whispr Admin",
  description: "Reset your Whispr admin password",
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <ForgotPasswordForm />
    </div>
  )
}
