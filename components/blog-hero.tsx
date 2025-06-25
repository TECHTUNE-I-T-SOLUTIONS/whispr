"use client"

import { PenTool, BookOpen } from "lucide-react"

export function BlogHero() {
  return (
    <section className="container py-16 md:py-24">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="animate-float">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6">
            <PenTool className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
            Thoughts & Musings
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            Where Prayce shares her insights on writing, creativity, and the beautiful complexity of life through
            thoughtful prose.
          </p>
        </div>

        <div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <BookOpen className="h-4 w-4" />
          <span>Stories that whisper wisdom</span>
        </div>
      </div>
    </section>
  )
}
