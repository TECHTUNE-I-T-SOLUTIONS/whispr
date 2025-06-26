import type React from "react"
import type { Poem } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

interface PoemsListProps {
  poems: Poem[]
}

const PoemsList: React.FC<PoemsListProps> = ({ poems }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {poems.map((poem) => (
        <Link href={`/poems/${poem.id}`} key={poem.id}>
          <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-muted/50 hover:border-primary/20">
            <CardContent>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{poem.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{poem.content}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export default PoemsList
