"use client"

import { useRef, useState } from "react"
import AdvancedFeaturesModal from "@/components/advanced-features-modal"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface BlogClientPageProps {
  htmlContent: string
  plainText: string
}

export function BlogClientPage({ htmlContent, plainText }: BlogClientPageProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [autoScrollMode, setAutoScrollMode] = useState(false)

  return (
    <div className="border-t pt-6 mb-6">
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="text-sm text-muted-foreground">Advanced Reading Features</span>
          <AdvancedFeaturesModal text={plainText} contentRef={contentRef} onAutoScrollChange={setAutoScrollMode} />
        </CardHeader>
        <CardContent className={autoScrollMode ? 'p-0' : 'p-8'}>
          {autoScrollMode ? (
            <div className="h-96 overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-lg">
              <div 
                ref={contentRef}
                className="h-full overflow-y-auto flex flex-col items-center justify-end px-4 py-8"
              >
                <div className="pt-96 text-center w-full prose prose-lg dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
