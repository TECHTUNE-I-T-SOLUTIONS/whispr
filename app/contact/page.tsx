import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Whispr",
  description:
    "Get in touch with Whispr for general questions, writing, partnerships, or sponsorships.",
  alternates: { canonical: "https://whisprwords.com/contact" },
}

const contactOptions = [
  {
    label: "General enquiries",
    description: "Questions, feedback, or anything else about Whispr.",
    email: "contact@whisprwords.com",
    number: "01",
  },
  {
    label: "Writing & editorial",
    description: "Writing submissions, editorial ideas, and story questions.",
    email: "write@whisprwords.com",
    number: "02",
  },
  {
    label: "Partnerships",
    description: "Collaborations and ideas for working together.",
    email: "partner@whisprwords.com",
    number: "03",
  },
  {
    label: "Sponsorships",
    description: "Sponsorship opportunities and brand enquiries.",
    email: "sponsor@whisprwords.com",
    number: "04",
  },
]

export default function ContactPage() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Mail aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            We&apos;d love to hear from you
          </span>
          <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            Every good conversation starts somewhere. Choose the inbox that fits your note, and our team will be glad to hear from you.
          </p>
        </header>

        <section aria-label="Contact Whispr by email" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
          {contactOptions.map(({ label, description, email, number }) => (
            <Link
              key={email}
              href={`mailto:${email}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6 lg:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="font-serif text-sm text-muted-foreground/70">{number}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold sm:text-xl">{label}</h2>
              <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{description}</p>
              <span className="mt-5 inline-flex min-w-0 items-center gap-2 border-t border-border/70 pt-4 text-sm font-medium text-primary">
                <span className="break-all">{email}</span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </section>

        <p className="mt-8 text-center text-xs leading-5 text-muted-foreground sm:mt-10 sm:text-sm">
          Looking for a place to share an idea with the community? Visit our{" "}
          <Link href="/community" className="font-medium text-primary underline-offset-4 hover:underline">
            community
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
