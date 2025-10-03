"use client"

<<<<<<< HEAD
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
=======
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
<<<<<<< HEAD
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Trash2, Eye, Calendar, Heart, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface Post {
  id: string
  title: string
  excerpt: string
  type: "blog" | "poem"
  status: "published" | "draft" | "archived"
  created_at: string
  updated_at: string
  published_at?: string
  view_count: number
  featured: boolean
  tags: string[]
}

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPosts(posts.filter((post) => post.id !== postId))
        toast({
          variant: "success",
          title: "Post deleted",
          description: "The post has been successfully deleted.",
        })
      } else {
        throw new Error("Failed to delete post")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the post. Please try again.",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post, index) => (
        <Card
          key={post.id}
          className="group hover:shadow-lg transition-all duration-300 animate-slide-up border-0 bg-card/50 backdrop-blur hover:bg-card/80"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                <Badge variant={post.type === "poem" ? "default" : "secondary"}>
                  {post.type === "poem" ? "✨ Poem" : "📝 Blog"}
                </Badge>
                {post.featured && <Badge variant="outline">⭐ Featured</Badge>}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/posts/${post.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/${post.type}/${post.id}`} target="_blank">
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <h3 className="font-serif text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{post.excerpt}</p>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{post.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.view_count}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />0
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />0
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
=======
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Database } from "@/types/supabase"
import { marked } from "marked"
import DOMPurify from "dompurify"

type Post = Database["public"]["Tables"]["posts"]["Row"]

interface PostsListProps {
  data?: Post[]
  currentAdminId?: string | null
}

export const PostsList = ({ data = [], currentAdminId = null }: PostsListProps) => {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const deletePost = async ({ id }: { id: string }) => {
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
  }

  const columns: ColumnDef<Post>[] = [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      id: 'creator',
      header: 'Creator',
      cell: ({ row }) => {
        const post = row.original as any
        const admin = post.admin || {}
        const name = admin.full_name || admin.username || 'Unknown'
        const avatar = admin.avatar_url || null

        return (
          <div className="flex items-center gap-2">
            {/* use initials avatar fallback component */}
            <img src={avatar || '/placeholder-user.jpg'} alt={name} className="w-8 h-8 rounded-full object-cover" />
            <div className="text-sm">{name}</div>
          </div>
        )
      }
    },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ row }) => (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(marked.parse(row.original.content) as string),
          }}
        />
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
  const post = row.original as any
        const [openDialog, setOpenDialog] = useState(false)

        const handleDelete = () => {
          setIsPending(true)
          fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" })
            .then(() => {
              router.refresh()
              toast.success("Post deleted successfully")
            })
            .catch(() => toast.error("Failed to delete post"))
            .finally(() => {
              setIsPending(false)
              setOpenDialog(false)
            })
        }

        // determine if current admin can edit/delete: owner or super-admin (server-side enforced too)
  const currentAdminIdLocal = currentAdminId || ((typeof window !== 'undefined' && (window as any).__WHISPR_ADMIN_ID__) || null)
  // post.admin_id may be missing when we joined admin data; check nested admin id too
  const postAdminId = post.admin_id || (post.admin && post.admin.id) || null
  const canManage = currentAdminIdLocal === '8ac41ab5-c544-4068-a628-426593a2d4e2' || currentAdminIdLocal === postAdminId

        if (!canManage) return <div className="text-sm text-muted-foreground">—</div>

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/posts/${post.id}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setOpenDialog(true)}
                  className="focus:bg-destructive focus:text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AlertDialog outside dropdown */}
            <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the post.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {isPending ? "Deleting..." : "Continue"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm md:text-base">
          <thead className="bg-muted/20">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 text-left whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
            <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
              <td colSpan={columns.length} className="text-center py-4">
                No posts found.
              </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b last:border-none">
                {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={`px-4 py-3 align-top ${
                  cell.column.id === "content" ? "text-black dark:text-white" : ""
                  }`}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
                ))}
              </tr>
              ))
            )}
            </tbody>
        </table>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    </div>
  )
}
