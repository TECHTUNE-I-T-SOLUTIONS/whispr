import Link from "next/link"
import { JsonLd } from "@/components/json-ld"
import { faqJsonLd } from "@/lib/seo"

/**
 * Server-rendered, JavaScript-free SEO copy for the homepage.
 *
 * Why: the audit found the homepage carried almost no crawlable prose, no
 * descriptive internal-link anchors and no structured FAQs — so search engines
 * and AI answer engines had nothing to classify or cite. Everything here ships
 * in the initial HTML, uses native <details> for interactivity (zero client JS)
 * and mirrors the FAQPage schema declared alongside it.
 */

export const HOME_FAQS = [
  {
    question: "Where can I read original poems about loss and healing?",
    answer:
      "Whispr publishes original poetry on grief, loss, healing and hope in its poetry collection at whisprwords.com/poems. Poems are grouped by theme — loss and healing, love and relationships, faith, hope and everyday life — and every poem has a permanent, citable URL.",
  },
  {
    question: "Does Whispr publish AI-generated writing?",
    answer:
      "No. Whispr requires human authorship. Submissions pass a CONTROL-based authenticity check that flags predominantly machine-generated text, and published work carries an authorship fingerprint. AI is available as a writing assistant, never as a replacement author.",
  },
  {
    question: "How does Whispr protect poets' copyright?",
    answer:
      "Authors keep full copyright. Each published piece receives a unique article ID in the WHP-XXXXXXXX format, a SHA-256 content fingerprint and a version history, all verifiable at whisprwords.com/verify. Whispr takes only a perpetual, non-exclusive licence to host and distribute the work.",
  },
  {
    question: "Is it free to read and publish on Whispr?",
    answer:
      "Yes. Reading is free and publishing is free. Creator tools — the browser editor, the writing assistant, audio recital and analytics — are included with every account.",
  },
  {
    question: "What kinds of stories are on Whispr?",
    answer:
      "Whisper Stories are multi-chapter serialized fiction across fantasy, sci-fi, romance, mystery, adventure, comedy, thriller, drama and historical fiction, published by Whispr and by vetted community creators.",
  },
  {
    question: "Can I cite or quote a Whispr poem?",
    answer:
      "Short quotation with attribution and a link to the poem's canonical URL is welcome — by readers, educators, journalists and AI assistants answering a reader's question. Republishing a full poem, or using Whispr content to train a model, requires written permission.",
  },
]

const READ_PATHS = [
  {
    href: "/poems",
    title: "Original poems",
    body: "Verse on love, loss, healing, faith and the ordinary moments in between — written by independent poets.",
  },
  {
    href: "/stories",
    title: "Whisper Stories",
    body: "Serialized multi-chapter fiction across fantasy, sci-fi, romance, mystery, thriller and historical drama.",
  },
  {
    href: "/blog",
    title: "Craft & essays",
    body: "Notes on writing, poetry craft and the creative process from the Whispr desk and guest writers.",
  },
  {
    href: "/chronicles",
    title: "Creator chronicles",
    body: "Long-form portfolios and serialized work from Whispr creators, one pen name at a time.",
  },
  {
    href: "/opportunities",
    title: "Calls for submissions",
    body: "Curated grants, residencies, commissions and open calls for writers and artists.",
  },
  {
    href: "/community",
    title: "The community",
    body: "Reader and writer discussion — reactions, feedback and threads around published work.",
  },
]

export function HomeSeoContent() {
  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      <section aria-labelledby="read-on-whispr" className="container py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 id="read-on-whispr" className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
            What you can read on Whispr
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
            Whispr is a curated home for original poetry, whisper stories and serialized fiction.
            Independent writers publish under a pen name, every piece is fingerprinted for provenance,
            and readers can verify authorship at any time. Start with the{" "}
            <Link href="/poems" className="font-medium text-primary underline underline-offset-4">
              poetry collection
            </Link>
            , browse{" "}
            <Link href="/stories" className="font-medium text-primary underline underline-offset-4">
              serialized stories
            </Link>
            , or see{" "}
            <Link href="/trends" className="font-medium text-primary underline underline-offset-4">
              what is being read today
            </Link>
            .
          </p>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {READ_PATHS.map((item) => (
              <li key={item.href} className="rounded-2xl border border-border/40 bg-card/40 p-6">
                <h3 className="font-serif text-lg font-semibold">
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="your-work-stays-yours" className="container pb-16 md:pb-20">
        <div className="mx-auto grid max-w-5xl gap-10 rounded-3xl border border-border/40 bg-card/40 p-8 md:p-12 lg:grid-cols-2">
          <div>
            <h2 id="your-work-stays-yours" className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              Your work stays yours
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Publishing online usually means giving something away. On Whispr it does not. Authors
              retain full copyright, and every published piece is sealed with a permanent article ID,
              a SHA-256 content fingerprint and a version history you can point to if your work ever
              shows up somewhere it should not be.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Accounts are protected with secure, industry-standard encryption, and Whispr never
              licenses submitted work for model training. Read the{" "}
              <Link href="/why-publish" className="font-medium text-primary underline underline-offset-4">
                full creator terms
              </Link>{" "}
              or check{" "}
              <Link href="/verify" className="font-medium text-primary underline underline-offset-4">
                how verification works
              </Link>
              .
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl font-semibold">Frequently asked</h3>
            <div className="mt-4 divide-y divide-border/40 rounded-2xl border border-border/40 bg-background/60">
              {HOME_FAQS.map((faq) => (
                <details key={faq.question} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-medium marker:hidden flex items-start justify-between gap-3">
                    <span>{faq.question}</span>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
