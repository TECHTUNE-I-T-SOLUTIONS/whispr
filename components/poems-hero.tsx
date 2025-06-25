"use client"

import { Feather, Sparkles } from "lucide-react"

export function PoemsHero() {
  return (
    <section className="container py-16 md:py-24">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="animate-float">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
            <Feather className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
            Poetry Collection
          </h1>
          <p
            className="text-lg md:text-xl text-muted-foreground animate-slide-up font-serif italic"
            style={{ animationDelay: "0.2s" }}
          >
            "In every whisper lies a poem waiting to be heard, in every silence, a verse yearning to be born."
          </p>
          <p className="text-base text-muted-foreground animate-slide-up" style={{ animationDelay: "0.3s" }}>
            — Prayce's collection of verses that dance between heartbeats and breathe life into quiet moments
          </p>
        </div>

        <div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Where words become whispers, and whispers become poetry</span>
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
      </div>
    </section>
  )
}
