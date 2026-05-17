"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ExternalLink, CalendarDays, MapPin, Building2, Sparkles } from "lucide-react"
import { formatJobDeadline, formatOpportunityType, formatRemoteType, OPPORTUNITY_TYPES, SORT_OPTIONS } from "@/lib/job-opportunities"

type Category = {
  id: string
  slug: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
}

type Opportunity = {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  organization_name: string
  organization_website?: string | null
  opportunity_type: string
  location?: string | null
  remote_type?: string | null
  compensation?: string | null
  application_url: string
  source_url?: string | null
  image_url?: string | null
  image_alt?: string | null
  tags?: string[] | null
  featured?: boolean | null
  deadline_at?: string | null
  category?: Category | null
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="group overflow-hidden border-border/60 bg-background/80 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <div className="relative min-h-[220px] bg-muted">
          {opportunity.image_url ? (
            <img
              src={opportunity.image_url}
              alt={opportunity.image_alt || opportunity.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/15 via-background to-secondary/10 px-6 text-center">
              <div>
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">Writing and arts opportunity</p>
              </div>
            </div>
          )}
        </div>

        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary text-primary-foreground">{opportunity.category?.name || "Opportunity"}</Badge>
            <Badge variant="outline">{formatOpportunityType(opportunity.opportunity_type)}</Badge>
            <Badge variant="secondary">{formatRemoteType(opportunity.remote_type)}</Badge>
            {opportunity.featured ? <Badge className="bg-amber-500 text-white">Featured</Badge> : null}
          </div>

          <div>
            <h3 className="text-2xl font-serif font-bold leading-tight">{opportunity.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" />{opportunity.organization_name}</span>
              {opportunity.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{opportunity.location}</span> : null}
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{formatJobDeadline(opportunity.deadline_at)}</span>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{opportunity.summary}</p>

          {opportunity.compensation ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm">
              <span className="font-medium text-foreground">Compensation:</span> {opportunity.compensation}
            </div>
          ) : null}

          {opportunity.tags && opportunity.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {opportunity.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <a href={opportunity.application_url} target="_blank" rel="noreferrer">
                Apply now <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {opportunity.source_url ? (
              <Button asChild variant="outline">
                <a href={opportunity.source_url} target="_blank" rel="noreferrer">
                  Source listing
                </a>
              </Button>
            ) : null}
            {opportunity.organization_website ? (
              <Button asChild variant="ghost">
                <a href={opportunity.organization_website} target="_blank" rel="noreferrer">
                  Organization site
                </a>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

export function OpportunitiesClient() {
  const [jobs, setJobs] = useState<Opportunity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [type, setType] = useState("all")
  const [sort, setSort] = useState("latest")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadJobs = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (search.trim()) params.set("search", search.trim())
        if (category !== "all") params.set("category", category)
        if (type !== "all") params.set("type", type)
        if (sort !== "latest") params.set("sort", sort)
        params.set("limit", "48")

        const response = await fetch(`/api/jobs?${params.toString()}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load opportunities")
        }

        if (!active) return

        setJobs(payload.jobs || [])
        setCategories(payload.categories || [])
      } catch (fetchError) {
        if (!active) return
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load opportunities")
        setJobs([])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadJobs()

    return () => {
      active = false
    }
  }, [search, category, type, sort])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(145,26,27,0.12),_transparent_36%),linear-gradient(180deg,_#ECE5E3_0%,_#E4ADAD_30%,_#DDD5D4_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(145,26,27,0.12),_transparent_36%),linear-gradient(180deg,_#1B1B1B_0%,_#591515_30%,_#1B1B1B_100%)]">
      <main className="mx-auto w-full max-w-auto px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-background/85 p-8 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.35)] backdrop-blur md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <Badge className="bg-primary text-primary-foreground">Opportunities for writers and artists</Badge>
              <h1 className="max-w-3xl text-4xl font-serif font-bold tracking-tight sm:text-5xl">
                Find the next writing, arts, and creative opportunity.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Browse jobs, commissions, fellowships, grants, and calls for submissions curated for the Whispr community.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border/60 bg-muted/40 p-4 text-center">
              <div>
                <div className="text-2xl font-semibold">{jobs.length}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live listings</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{categories.length}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">Arts</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focused</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm lg:grid-cols-[1.4fr_0.5fr_0.5fr_0.5fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search titles, organizations, or keywords"
                className="h-12 pl-9"
              />
            </div>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item.id} value={item.slug}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {OPPORTUNITY_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="mt-8 space-y-4">
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-background/80 p-12 text-center">
              <h2 className="text-2xl font-serif font-semibold">No opportunities found</h2>
              <p className="mt-2 text-muted-foreground">Try adjusting the search, category, or sorting options.</p>
              <Button asChild className="mt-6">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {jobs.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}