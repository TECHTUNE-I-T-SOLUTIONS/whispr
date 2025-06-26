// app/blog/[id]/loading.tsx
export default function LoadingPost() {
  return (
    <div className="whispr-gradient min-h-screen py-10 animate-pulse">
      <article className="container max-w-3xl space-y-6">
        <div className="h-10 bg-muted/30 w-3/4 rounded" />
        <div className="h-4 bg-muted/20 w-1/4 rounded" />
        <div className="h-64 bg-muted/10 rounded-lg" />
        <div className="space-y-4">
          <div className="h-4 bg-muted/20 rounded" />
          <div className="h-4 bg-muted/10 w-5/6 rounded" />
          <div className="h-4 bg-muted/20 w-2/3 rounded" />
        </div>
      </article>
    </div>
  )
}
