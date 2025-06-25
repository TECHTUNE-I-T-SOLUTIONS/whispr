"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Feather, Heart, Users } from "lucide-react"

export function AboutStats() {
  const stats = [
    {
      icon: Feather,
      label: "Poems Written",
      value: "50+",
      description: "Verses that capture life's quiet moments",
    },
    {
      icon: BookOpen,
      label: "Blog Posts",
      value: "25+",
      description: "Thoughtful pieces on writing and life",
    },
    {
      icon: Heart,
      label: "Words of Love",
      value: "∞",
      description: "Infinite passion for the craft",
    },
    {
      icon: Users,
      label: "Readers Touched",
      value: "Growing",
      description: "A community of word lovers",
    },
  ]

  return (
    <section className="container py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-serif font-bold mb-4">By the Numbers</h2>
          <p className="text-muted-foreground">
            While numbers can't capture the essence of creativity, they tell a story of dedication and growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur text-center hover:bg-card/80"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-primary mb-1">{stat.value}</div>
                  <div className="font-medium text-sm mb-2">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
