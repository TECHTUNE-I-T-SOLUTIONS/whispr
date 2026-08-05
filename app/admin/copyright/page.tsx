'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, FileText, Calendar, Download, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface ContentFingerprint {
  id: string
  article_id: string
  article_type: string
  article_version: number
  sha256_hash: string
  content_length: number
  published_at: string
  created_by: string
  metadata: {
    title?: string
    article_id?: string
    slug?: string
  }
}

export default function CopyrightAdminPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [fingerprints, setFingerprints] = useState<ContentFingerprint[]>([])
  const [selectedFingerprint, setSelectedFingerprint] = useState<ContentFingerprint | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter an Article ID or SHA256 hash')
      return
    }

    setLoading(true)
    setFingerprints([])
    setSelectedFingerprint(null)

    try {
      const response = await fetch(`/api/admin/copyright/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        setFingerprints(data.fingerprints || [])
        if (data.fingerprints && data.fingerprints.length > 0) {
          toast.success(`Found ${data.fingerprints.length} result(s)`)
        } else {
          toast.error('No fingerprints found')
        }
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search fingerprints')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = async (articleId: string) => {
    try {
      const response = await fetch(`/api/articles/${articleId}/certificate`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificate-${articleId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Certificate downloaded successfully')
      }
    } catch (error) {
      console.error('Error downloading certificate:', error)
      toast.error('Failed to download certificate')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Copyright Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage content fingerprints, verify authenticity, and download certificates
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Content Fingerprints</CardTitle>
            <CardDescription>
              Search by Article ID (WHP-XXXXXXXX) or SHA256 hash
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter Article ID or SHA256 hash"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {fingerprints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {fingerprints.length} fingerprint(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>SHA256</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fingerprints.map((fp) => (
                      <TableRow key={fp.id}>
                        <TableCell className="font-mono text-sm">
                          {fp.metadata?.article_id || fp.article_id?.substring(0, 8)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {fp.metadata?.title || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{fp.article_type}</Badge>
                        </TableCell>
                        <TableCell>v{fp.article_version}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(fp.published_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-32 truncate">
                          {fp.sha256_hash}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedFingerprint(fp)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadCertificate(fp.metadata?.article_id || fp.article_id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Fingerprint Details */}
        {selectedFingerprint && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fingerprint Details</CardTitle>
              <CardDescription>
                Detailed information for selected content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Article ID</p>
                      <p className="font-mono text-sm">{selectedFingerprint.metadata?.article_id || selectedFingerprint.article_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                      <p className="font-semibold">{selectedFingerprint.metadata?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                      <Badge variant="outline">{selectedFingerprint.article_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Version</p>
                      <p className="font-semibold">Version {selectedFingerprint.article_version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Published Date</p>
                      <p className="text-sm">{new Date(selectedFingerprint.published_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Content Length</p>
                      <p className="text-sm">{selectedFingerprint.content_length.toLocaleString()} characters</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">SHA-256 Hash</p>
                    <code className="text-xs break-all bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                      {selectedFingerprint.sha256_hash}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Slug</p>
                    <p className="text-sm">{selectedFingerprint.metadata?.slug || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created By</p>
                    <p className="text-sm font-mono">{selectedFingerprint.created_by}</p>
                  </div>
                </TabsContent>

                <TabsContent value="technical" className="space-y-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fingerprint ID</p>
                    <p className="text-sm font-mono">{selectedFingerprint.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Article Internal ID</p>
                    <p className="text-sm font-mono">{selectedFingerprint.article_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Algorithm</p>
                    <p className="text-sm">SHA-256</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                    <p className="text-sm">{new Date(selectedFingerprint.created_at || '').toLocaleString()}</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6 pt-4 border-t">
                <Button
                  onClick={() => handleDownloadCertificate(selectedFingerprint.metadata?.article_id || selectedFingerprint.article_id)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Certificate
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <a href={`/verify?id=${selectedFingerprint.metadata?.article_id || selectedFingerprint.article_id}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Verify Content
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              About Copyright Management
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• Every published content receives a unique Article ID and SHA-256 fingerprint</li>
              <li>• Version history tracks all changes to content over time</li>
              <li>• PDF certificates provide proof of original publication</li>
              <li>• Public verification system allows anyone to verify content authenticity</li>
              <li>• AI crawlers are blocked from using content for training without permission</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
