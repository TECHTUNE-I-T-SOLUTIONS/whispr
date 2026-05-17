"use client"

import { useEffect, useState } from "react"
import { MediaSelector } from "@/components/admin/media-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Pencil, Trash2, Save, RefreshCw, Sparkles, Search } from "lucide-react"
import {
  formatJobDeadline,
  formatOpportunityType,
  formatRemoteType,
  joinMultilineValues,
  OPPORTUNITY_TYPES,
  REMOTE_TYPES,
  splitMultilineValues,
} from "@/lib/job-opportunities"

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
  contact_email?: string | null
  image_url?: string | null
  image_alt?: string | null
  tags?: string[] | null
  requirements?: string[] | null
  benefits?: string[] | null
  featured?: boolean | null
  status: string
  deadline_at?: string | null
  category?: Category | null
}

type MediaFile = {
  id: string
  original_name: string
  file_name: string
  file_path: string
  file_url: string
  file_type: string
  file_size: number
}

type FormState = {
  title: string
  slug: string
  category_id: string
  summary: string
  description: string
  organization_name: string
  organization_website: string
  opportunity_type: string
  location: string
  remote_type: string
  compensation: string
  application_url: string
  source_url: string
  contact_email: string
  image_url: string
  image_alt: string
  tags: string
  requirements: string
  benefits: string
  featured: boolean
  status: string
  deadline_at: string
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  category_id: "",
  summary: "",
  description: "",
  organization_name: "",
  organization_website: "",
  opportunity_type: "job",
  location: "",
  remote_type: "any",
  compensation: "",
  application_url: "",
  source_url: "",
  contact_email: "",
  image_url: "",
  image_alt: "",
  tags: "",
  requirements: "",
  benefits: "",
  featured: false,
  status: "draft",
  deadline_at: "",
}

function buildFormFromOpportunity(opportunity: Opportunity): FormState {
  return {
    title: opportunity.title || "",
    slug: opportunity.slug || "",
    category_id: opportunity.category?.id || "",
    summary: opportunity.summary || "",
    description: opportunity.description || "",
    organization_name: opportunity.organization_name || "",
    organization_website: opportunity.organization_website || "",
    opportunity_type: opportunity.opportunity_type || "job",
    location: opportunity.location || "",
    remote_type: opportunity.remote_type || "any",
    compensation: opportunity.compensation || "",
    application_url: opportunity.application_url || "",
    source_url: opportunity.source_url || "",
    contact_email: opportunity.contact_email || "",
    image_url: opportunity.image_url || "",
    image_alt: opportunity.image_alt || opportunity.title || "",
    tags: joinMultilineValues(opportunity.tags),
    requirements: joinMultilineValues(opportunity.requirements),
    benefits: joinMultilineValues(opportunity.benefits),
    featured: Boolean(opportunity.featured),
    status: opportunity.status || "draft",
    deadline_at: opportunity.deadline_at ? opportunity.deadline_at.slice(0, 16) : "",
  }
}

export function JobOpportunitiesManager() {
  const [jobs, setJobs] = useState<Opportunity[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([])
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  const isEditing = Boolean(editingId)

  const loadJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (statusFilter !== "all") params.set("status", statusFilter)

      const response = await fetch(`/api/admin/opportunities?${params.toString()}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load opportunities")
      }

      setJobs(payload.jobs || [])
      setCategories(payload.categories || [])
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load opportunities")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setSelectedMedia([])
  }

  const handleEdit = (opportunity: Opportunity) => {
    setEditingId(opportunity.id)
    setForm(buildFormFromOpportunity(opportunity))
    if (opportunity.image_url) {
      setSelectedMedia([
        {
          id: opportunity.id,
          original_name: opportunity.image_alt || opportunity.title,
          file_name: opportunity.image_alt || opportunity.title,
          file_path: opportunity.image_url,
          file_url: opportunity.image_url,
          file_type: "image/*",
          file_size: 0,
        },
      ])
    } else {
      setSelectedMedia([])
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...form,
        tags: splitMultilineValues(form.tags),
        requirements: splitMultilineValues(form.requirements),
        benefits: splitMultilineValues(form.benefits),
        deadline_at: form.deadline_at ? new Date(form.deadline_at).toISOString() : null,
      }

      const response = await fetch(
        isEditing ? `/api/admin/opportunities/${editingId}` : "/api/admin/opportunities",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Unable to save opportunity")
      }

      resetForm()
      await loadJobs()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save opportunity")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this opportunity? This cannot be undone.")) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const response = await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Unable to delete opportunity")
      }

      if (editingId === id) {
        resetForm()
      }

      await loadJobs()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete opportunity")
    } finally {
      setDeletingId(null)
    }
  }

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="space-y-8 p-4">
      <section className="rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 bg-primary text-primary-foreground">Opportunity manager</Badge>
            <h1 className="text-3xl font-serif font-bold">Manage job opportunities</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Publish listings for writers, artists, and creative professionals, then keep them updated from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={loadJobs} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button type="button" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> New opportunity
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_0.4fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search opportunities, organizations, or tags"
              className="h-12 pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70 bg-background/90">
          <CardContent className="space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold">Opportunity form</h2>
                <p className="text-sm text-muted-foreground">Create, edit, and publish listings.</p>
              </div>
              {isEditing ? <Badge>Editing</Badge> : <Badge variant="outline">New</Badge>}
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" value={form.summary} onChange={(event) => updateField("summary", event.target.value)} rows={3} required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={8} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization_name">Organization</Label>
                  <Input id="organization_name" value={form.organization_name} onChange={(event) => updateField("organization_name", event.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization_website">Organization website</Label>
                  <Input id="organization_website" value={form.organization_website} onChange={(event) => updateField("organization_website", event.target.value)} placeholder="https://..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select value={form.category_id} onValueChange={(value) => updateField("category_id", value)}>
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opportunity_type">Type</Label>
                  <Select value={form.opportunity_type} onValueChange={(value) => updateField("opportunity_type", value)}>
                    <SelectTrigger id="opportunity_type">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPPORTUNITY_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={(event) => updateField("location", event.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remote_type">Remote type</Label>
                  <Select value={form.remote_type} onValueChange={(value) => updateField("remote_type", value)}>
                    <SelectTrigger id="remote_type">
                      <SelectValue placeholder="Select remote type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMOTE_TYPES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation</Label>
                  <Input id="compensation" value={form.compensation} onChange={(event) => updateField("compensation", event.target.value)} placeholder="e.g. $45-$60/hour or stipend" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline_at">Deadline</Label>
                  <Input id="deadline_at" type="datetime-local" value={form.deadline_at} onChange={(event) => updateField("deadline_at", event.target.value)} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="application_url">Application URL</Label>
                  <Input id="application_url" value={form.application_url} onChange={(event) => updateField("application_url", event.target.value)} placeholder="https://..." required />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="source_url">Source URL</Label>
                  <Input id="source_url" value={form.source_url} onChange={(event) => updateField("source_url", event.target.value)} placeholder="Optional original listing or source link" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contact_email">Contact email</Label>
                  <Input id="contact_email" value={form.contact_email} onChange={(event) => updateField("contact_email", event.target.value)} placeholder="Optional contact email" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder="Optional, auto-generated if blank" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input id="image_url" value={form.image_url} onChange={(event) => updateField("image_url", event.target.value)} placeholder="Choose from media library or paste an image URL" />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <MediaSelector
                    selectedMedia={selectedMedia}
                    onSelect={(files) => {
                      setSelectedMedia(files)
                      if (files[0]?.file_url) {
                        updateField("image_url", files[0].file_url)
                        updateField("image_alt", files[0].original_name)
                      }
                    }}
                  />

                  {form.image_url ? (
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="mb-2 text-sm font-medium">Preview</p>
                      <img src={form.image_url} alt={form.image_alt || form.title || "Opportunity image"} className="max-h-56 w-full rounded-lg object-cover" />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="image_alt">Image alt text</Label>
                  <Input id="image_alt" value={form.image_alt} onChange={(event) => updateField("image_alt", event.target.value)} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Textarea id="tags" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="One per line or comma separated" rows={3} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea id="requirements" value={form.requirements} onChange={(event) => updateField("requirements", event.target.value)} placeholder="One per line or comma separated" rows={4} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="benefits">Benefits</Label>
                  <Textarea id="benefits" value={form.benefits} onChange={(event) => updateField("benefits", event.target.value)} placeholder="One per line or comma separated" rows={4} />
                </div>

                <div className="flex flex-wrap items-center gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.featured} onChange={(event) => updateField("featured", event.target.checked)} />
                    Featured listing
                  </label>

                  <div className="space-y-2 min-w-[180px]">
                    <Label htmlFor="status">Status</Label>
                    <Select value={form.status} onValueChange={(value) => updateField("status", value)}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !form.category_id}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? "Update opportunity" : "Create opportunity"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-background/90 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-serif font-semibold">Listings</h2>
                <p className="text-sm text-muted-foreground">{loading ? 'Loading...' : `${jobs.length} opportunities`}</p>
              </div>
              <Badge variant="secondary">{categories.length} categories</Badge>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-border/70">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                  No opportunities match the current filters.
                </div>
              ) : (
                jobs.map((job) => (
                  <Card key={job.id} className="border-border/60 bg-muted/20">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{job.category?.name || 'Uncategorized'}</Badge>
                            <Badge variant="outline">{formatOpportunityType(job.opportunity_type)}</Badge>
                            <Badge variant="secondary">{job.status}</Badge>
                            {job.featured ? <Badge className="bg-amber-500 text-white">Featured</Badge> : null}
                          </div>
                          <h3 className="font-serif text-lg font-semibold leading-tight">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">{job.organization_name}</p>
                          <p className="text-sm text-muted-foreground">{formatRemoteType(job.remote_type)} · {formatJobDeadline(job.deadline_at)}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(job)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(job.id)}
                            disabled={deletingId === job.id}
                          >
                            {deletingId === job.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                          </Button>
                        </div>
                      </div>

                      <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{job.summary}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> Publishing behavior
            </div>
            When a listing is published, the database trigger in the new SQL migration notifies active admins and active chronicles creators.
          </div>
        </div>
      </div>
    </div>
  )
}