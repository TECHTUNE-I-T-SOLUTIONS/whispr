"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Filter, FileText } from "lucide-react"

<<<<<<< HEAD
export function PostsHeader() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Manage Posts
          </h1>
          <p className="text-muted-foreground">Create, edit, and manage your blog posts and poems</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/posts/new?type=blog">
              <Plus className="mr-2 h-4 w-4" />
              New Blog Post
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/posts/new?type=poem">
              <Plus className="mr-2 h-4 w-4" />
              New Poem
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="blog">Blog Posts</SelectItem>
            <SelectItem value="poem">Poems</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
=======
interface PostsHeaderProps {
  search: string
  setSearch: (val: string) => void
  typeFilter: string
  setTypeFilter: (val: string) => void
  statusFilter: string
  setStatusFilter: (val: string) => void
  isPending: boolean
}

export function PostsHeader({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
  isPending,
}: PostsHeaderProps) {
  
  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Manage Posts
            </h1>
            <p className="text-muted-foreground">Create, edit, and manage your blog posts and poems</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/admin/posts/new?type=blog">
                <Plus className="mr-2 h-4 w-4" />
                New Blog Post
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/posts/new?type=poem">
                <Plus className="mr-2 h-4 w-4" />
                New Poem
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Posts</SelectItem>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="poem">Poems</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
  )
}
