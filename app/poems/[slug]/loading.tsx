import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="whispr-gradient min-h-screen">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>

            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-full mb-2" />
            <Skeleton className="h-6 w-2/3 mb-6" />

            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
          </div>

          {/* Featured Image Skeleton */}
          <Skeleton className="w-full h-64 md:h-96 rounded-lg mb-8" />

          {/* Content Skeleton */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>

          {/* Engagement Section Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 w-16" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-16" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-8" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex space-x-4">
                    <Skeleton className="rounded-full h-10 w-10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
