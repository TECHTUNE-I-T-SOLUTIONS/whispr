"use client"

import { User, Quote } from "lucide-react"

export function AboutHero() {
  return (
    <section className="container py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
                Meet Prayce
              </h1>
              <p className="text-xl text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
                Writer, Poet, and Curator of Whispered Thoughts
              </p>
            </div>

            <div className="relative animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <Quote className="absolute -top-2 -left-2 h-6 w-6 text-primary/30" />
              <blockquote className="font-serif text-lg italic text-muted-foreground pl-6 border-l-4 border-primary/30">
                "I believe that the most profound truths are often found in the quietest moments, where words become
                whispers and whispers become the poetry of the soul."
              </blockquote>
              <cite className="block text-right text-sm text-primary mt-2 font-medium">— Prayce</cite>
            </div>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl transform rotate-3"></div>
              <div className="relative bg-card/80 backdrop-blur p-8 rounded-2xl border border-border/50 shadow-xl">
                <div className="flex items-center justify-center h-48 w-48 mx-auto bg-gradient-to-br from-primary/10 to-primary/5 rounded-full mb-6">
                  <User className="h-24 w-24 text-primary/60" />
                </div>
                <div className="text-center">
                  <h3 className="font-serif text-2xl font-bold mb-2">Prayce</h3>
                  <p className="text-muted-foreground">Writer & Poet</p>
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                    <span>✨ Amazing</span>
                    <span>•</span>
                    <span>📝 Storyteller</span>
                    <span>•</span>
                    <span>🎭 Wordsmith</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
