"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Feather, BookOpen } from "lucide-react"

export function HeroSection() {
  return (
    <section className="container py-24 md:py-32">
      <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
        <div className="animate-float">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
            <Feather className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-slide-up">
            Welcome to Whispr
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
            ...From silence to whispers, from whispers to words
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Button asChild size="lg" className="group">
            <Link href="/poems">
              <BookOpen className="mr-2 h-4 w-4" />
              Explore Poems
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="bg-background text-foreground">
            <Link href="/blog">Read Blog</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
