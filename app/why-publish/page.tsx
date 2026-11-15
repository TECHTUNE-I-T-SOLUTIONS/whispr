import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Why Publish on Whispr — Keep Your Copyright",
  description:
    "Publish poetry and stories on Whispr and keep full copyright. Every piece gets a permanent article ID, a SHA-256 fingerprint and a verifiable version history — plus readers who are actually looking for verse.",
  path: "/why-publish",
  keywords: [
    "publish poetry online",
    "keep copyright as a writer",
    "poetry publishing platform",
    "where to publish poems",
  ],
})
import {
  ArrowRight,
  Heart,
  TrendingUp,
  Sparkles,
  Shield,
  Zap,
  Users,
  BookOpen,
  CheckCircle,
} from "lucide-react"

export const revalidate = 300 // 5 minutes

const benefits = [
  {
    id: "audience",
    title: "Built-in Audience",
    subtitle: "Readers who want to discover you",
    description:
      "Whispr brings together readers actively looking for new stories and creators. Your work gets discovered by people who appreciate quality content.",
    icon: Users,
    color: "from-blue-500 to-cyan-500",
    highlights: [
      "Active reader community",
      "Content discovery algorithms",
      "Genre-based matching",
      "Recommendation features",
    ],
  },
  {
    id: "ownership",
    title: "You Own Your Work",
    subtitle: "Full creative control & ownership",
    description:
      "Maintain complete ownership of your content. We provide the platform, but your stories remain yours. No restrictive contracts or hidden clauses.",
    icon: Shield,
    color: "from-emerald-500 to-teal-500",
    highlights: [
      "Retain all rights",
      "No exclusive contracts",
      "Delete anytime",
      "Export your content",
    ],
  },
  {
    id: "engagement",
    title: "Genuine Engagement",
    subtitle: "Connect with readers who care",
    description:
      "Build meaningful relationships with your audience through comments, likes, and follows. Get feedback that helps you grow as a writer.",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    highlights: [
      "Thoughtful comments",
      "Reader feedback",
      "Community support",
      "Direct connection",
    ],
  },
  {
    id: "growth",
    title: "Grow Your Platform",
    subtitle: "Analytics and insights included",
    description:
      "Track your performance with detailed analytics. Understand what resonates with your audience and make data-driven decisions to grow your reach.",
    icon: TrendingUp,
    color: "from-amber-500 to-orange-500",
    highlights: [
      "Readership analytics",
      "Engagement metrics",
      "Growth tracking",
      "Performance insights",
    ],
  },
  {
    id: "tools",
    title: "Creator-First Tools",
    subtitle: "Everything you need to succeed",
    description:
      "Write, edit, and publish with intuitive tools designed for creators. From drafting to distribution, we streamline your creative process.",
    icon: Zap,
    color: "from-red-500 to-violet-500",
    highlights: ["Easy publishing", "Rich text editor", "Media support", "Mobile-friendly"],
  },
  {
    id: "community",
    title: "A Community of Storytellers",
    subtitle: "Write alongside fellow creators",
    description:
      "Join a platform built for writers and artists. Share your work, get inspired by others, and be part of a community that celebrates creativity.",
    icon: BookOpen,
    color: "from-violet-500 to-purple-500",
    highlights: ["Fellow creators", "Inspiration", "Collaboration", "Creative community"],
  },
]

export default function WhyPublishPage() {
  return (
    <div className="whispr-gradient min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(145,26,27,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(145,26,27,0.035)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none z-0" />

      <section className="container py-20 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-300 dark:bg-red-900/30 px-3 py-1 text-sm font-medium text-red-900 dark:text-red-400 mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Why Publish on Whispr?</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-black dark:text-white mb-6 leading-tight">
            Your Stories Deserve to Be Heard
          </h1>
          <p className="text-black dark:text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Join a community that values creativity. Publish your work, build your audience, and grow as a creator on a platform designed for storytellers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.id}
              className="rounded-3xl border border-border/20 bg-background/40 p-8 md:p-10 shadow-sm backdrop-blur hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br {benefit.color} flex items-center justify-center mb-6 text-white">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-black dark:text-white mb-3">{benefit.title}</h3>
              <p className="text-black dark:text-white/80 text-sm mb-6 leading-relaxed">
                {benefit.subtitle}
              </p>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {benefit.description}
              </p>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                What you get
              </h4>
              <ul className="space-y-2">
                {benefit.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Button asChild size="lg" className="w-fit bg-primary text-white shadow-lg">
            <Link href="/chronicles/signup" className="flex items-center justify-center gap-2">
              Start Creating Today <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}