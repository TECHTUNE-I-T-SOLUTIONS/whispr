import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="whispr-gradient min-h-screen flex items-center justify-center">
      <div className="container">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Poem Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">The poem you're looking for doesn't exist or may have been removed.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/poems">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Poems
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
