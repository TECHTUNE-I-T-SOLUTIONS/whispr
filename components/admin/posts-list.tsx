"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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

/**
 * The avatar_url stored in the DB is a relative path like "avatars/file.jpg".
 * Convert it to a full Supabase Storage public URL.
 */
function resolveAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null
  // If it's already a full URL, return as-is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  // Extract just the filename in case it's a nested path
  const filename = avatarPath.split('/').pop() || avatarPath
  // Try nested avatars/avatars/filename path first (how the upload stores it)
  return `${supabaseUrl}/storage/v1/object/public/avatars/avatars/${filename}`
}

interface PostsListProps {
  data?: Post[]
  currentAdminId?: string | null
}

export const PostsList = ({ data = [], currentAdminId = null }: PostsListProps) => {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

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
        const initial = name.charAt(0).toUpperCase()
        // Resolve the stored relative path into a full public storage URL
        const avatarUrl = resolveAvatarUrl(admin.avatar_url)

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {initial}
              </AvatarFallback>
            </Avatar>
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
          className="prose dark:prose-invert max-w-none"
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
    </div>
  )
}
