import { requireAuth } from "@/lib/auth"
import { AiStudioClient } from "./ai-studio-client"

export const metadata = { title: "AI Video Studio - Admin" }
export const dynamic = "force-dynamic"

export default async function AiStudioPage() {
  await requireAuth()
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="container py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-bold">AI Video Studio</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Turn a poem or story into a short social teaser — animated text over images with narration. Everything
            renders in your browser, so it stays free. Videos are teasers only; the full piece link goes in the caption.
          </p>
        </div>
        <AiStudioClient />
      </main>
    </div>
  )
}
