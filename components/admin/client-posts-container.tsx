"use client"

import { useEffect, useState, useTransition } from "react"
import { PostsHeader } from "@/components/admin/posts-header"
import { PostsList } from "@/components/admin/posts-list"
import { createSupabaseBrowser } from "@/lib/supabase-browser"
import type { Database } from "@/types/supabase"
type Post = Database["public"]["Tables"]["posts"]["Row"]

export default function ClientPostsContainer({ adminId }: { adminId: string }) {
  const supabase = createSupabaseBrowser()

  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("admin_id", adminId)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setAllPosts(data)
        setFilteredPosts(data)
      }
    }

    fetchPosts()
  }, [adminId])

  useEffect(() => {
    startTransition(() => {
      const filtered = allPosts.filter((post) => {
        const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase())
        const matchesType = typeFilter === "all" || post.type === typeFilter
        const matchesStatus = statusFilter === "all" || post.status === statusFilter
        return matchesSearch && matchesType && matchesStatus
      })
      setFilteredPosts(filtered)
    })
  }, [search, typeFilter, statusFilter, allPosts])

  return (
    <div className="space-y-8">
      <PostsHeader
        search={search}
        setSearch={setSearch}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isPending={isPending}
      />
      <PostsList data={filteredPosts} />
    </div>
  )
}
