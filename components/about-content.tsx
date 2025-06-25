"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Feather, BookOpen, Heart, Lightbulb, Coffee, Moon } from "lucide-react"

export function AboutContent() {
  const sections = [
    {
      icon: Feather,
      title: "The Journey",
      content:
        "Prayce discovered her love for words at an early age, finding solace in the rhythm of poetry and the power of storytelling. Her writing journey began with quiet observations of the world around her, transforming everyday moments into extraordinary verses and prose that resonate with readers seeking depth and authenticity.",
    },
    {
      icon: BookOpen,
      title: "Writing Philosophy",
      content:
        "Her approach to writing is deeply rooted in the belief that the most powerful stories are often told in whispers. Prayce crafts her words with intention, creating spaces for readers to pause, reflect, and find pieces of themselves within her verses and stories.",
    },
    {
      icon: Heart,
      title: "What Drives Her",
      content:
        "Prayce is driven by the desire to capture the ephemeral moments that make life beautiful—the pause between heartbeats, the silence after rain, the gentle strength found in vulnerability. Her work celebrates the quiet courage it takes to be human in an increasingly noisy world.",
    },
  ]

  const interests = [
    { icon: Coffee, label: "Early morning writing sessions" },
    { icon: Moon, label: "Midnight poetry under starlight" },
    { icon: Lightbulb, label: "Finding inspiration in ordinary moments" },
    { icon: Heart, label: "Connecting with readers through words" },
  ]

  return (
    <section className="container py-16">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl font-serif font-bold mb-4">Her Story</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every writer has a story, and every story begins with a whisper of possibility. Here's how Prayce found her
            voice in the quiet corners of creativity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section, index) => (
            <Card
              key={section.title}
              className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold">{section.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          className="animate-slide-up bg-gradient-to-br from-card/60 to-card/30 backdrop-blur border-0"
          style={{ animationDelay: "0.4s" }}
        >
          <CardContent className="p-8">
            <h3 className="font-serif text-2xl font-bold mb-6 text-center">What Inspires Prayce</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interests.map((interest, index) => (
                <div
                  key={interest.label}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <interest.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="font-serif text-xl font-semibold mb-4">A Personal Note</h3>
              <p className="text-muted-foreground italic leading-relaxed max-w-2xl mx-auto">
                "Writing, for me, is not just about putting words on paper—it's about creating bridges between hearts,
                building sanctuaries for thoughts that need a home, and whispering truths that the world needs to hear.
                Thank you for joining me on this journey of words and wonder."
              </p>
              <p className="text-primary font-serif font-medium mt-4">— Prayce ✨</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
