'use client'

// Copyright Footer Component
// Displays copyright information at the bottom of article pages

import { FileText, Calendar, Shield, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface CopyrightFooterProps {
  articleId?: string
  author: string
  publishedDate: string
  canonicalUrl: string
  articleType?: 'post' | 'chronicles_post' | 'chronicles_chain_entry'
}

export function CopyrightFooter({
  articleId,
  author,
  publishedDate,
  canonicalUrl,
  articleType = 'post'
}: CopyrightFooterProps) {
  const currentYear = new Date().getFullYear()
  const publishedYear = new Date(publishedDate).getFullYear()

  const handleDownloadCertificate = async () => {
    if (!articleId) return

    try {
      // Try the article_id first (WHP-XXXXXXXX format), then fallback to the prop
      const downloadId = articleId.startsWith('WHP-') ? articleId : articleId
      const response = await fetch(`/api/articles/${downloadId}/certificate`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${downloadId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Certificate download failed:', response.status)
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
    }
  }

  return (
    <Card className="mt-8 bg-gradient-to-r from-red-50 to-indigo-50 dark:from-red-800/60 dark:to-gray-900 border-red-200 dark:border-gray-700">
      <div className="p-6 space-y-4">
        {/* Copyright Notice */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            © {publishedYear} {author}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Published on Whispr. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Creators retain copyright. Unauthorized reproduction may violate copyright law.
          </p>
        </div>

        {/* Article Details */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          {articleId && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>ID: {articleId}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Original: {new Date(publishedDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Content Protected</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCertificate}
            disabled={!articleId}
            className="text-xs"
          >
            <Download className="h-3 w-3 mr-1" />
            Download Certificate
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="text-xs"
          >
            <a href="/verify" target="_blank" rel="noopener noreferrer">
              <Shield className="h-3 w-3 mr-1" />
              Verify Content
            </a>
          </Button>
        </div>

        {/* License Information */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Whispr holds a perpetual, non-exclusive license to host and distribute this content.
          </p>
        </div>
      </div>
    </Card>
  )
}
