'use client'

import { useState } from 'react'
import { Search, FileText, Calendar, Hash, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface VerificationResult {
  exists: boolean
  title?: string
  author?: string
  published_date?: string
  current_version?: number
  original_url?: string
  all_versions?: Array<{
    version: number
    sha256_hash: string
    published_at: string
  }>
  hash_history?: Array<{
    sha256_hash: string
    version: number
    published_at: string
  }>
}

export default function VerifyPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter an Article ID or SHA256 hash')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/verify?id=${encodeURIComponent(identifier)}`)
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        setResult(data)
        if (data.exists) {
          toast.success('Content verified successfully!')
        } else {
          toast.error('Content not found')
        }
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Failed to verify content')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-red-900/20 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Content Verification
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Verify the authenticity and originality of content published on Whispr
            </p>
          </div>

          {/* Search Box */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Enter Article ID (e.g., WHP-A1B2C3D4) or SHA256 hash"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 text-base"
                  />
                </div>
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="h-12 px-8 bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {result.exists ? (
                <Card className="shadow-lg border-green-200 dark:border-green-800">
                  <CardHeader className="bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div>
                        <CardTitle className="text-green-900 dark:text-green-100">
                          Content Verified
                        </CardTitle>
                        <CardDescription className="text-green-700 dark:text-green-300">
                          This content is authentic and originally published on Whispr
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="versions">Version History</TabsTrigger>
                        <TabsTrigger value="hashes">Hash History</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {result.title && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg md:col-span-2">
                              <FileText className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Title</p>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {result.title}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <FileText className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Author</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {result.author}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Calendar className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Published Date</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {result.published_date ? new Date(result.published_date).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Hash className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Current Version</p>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                Version {result.current_version}
                              </p>
                            </div>
                          </div>

                          {result.original_url && (
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <ExternalLink className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Original URL</p>
                                <a
                                  href={result.original_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-red-600 dark:text-red-400 hover:underline"
                                >
                                  View Original
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="versions" className="mt-6">
                        <div className="space-y-3">
                          {result.all_versions?.map((version) => (
                            <div
                              key={version.sha256_hash}
                              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline">Version {version.version}</Badge>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {new Date(version.published_at).toLocaleString()}
                                </span>
                              </div>
                              <code className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {version.sha256_hash.substring(0, 16)}...
                              </code>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="hashes" className="mt-6">
                        <div className="space-y-3">
                          {result.hash_history?.map((entry) => (
                            <div
                              key={entry.sha256_hash}
                              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">Version {entry.version}</Badge>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(entry.published_at).toLocaleString()}
                                </span>
                              </div>
                              <code className="text-xs break-all text-gray-700 dark:text-gray-300">
                                {entry.sha256_hash}
                              </code>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-lg border-red-200 dark:border-red-800">
                  <CardHeader className="bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      <div>
                        <CardTitle className="text-red-900 dark:text-red-100">
                          Content Not Found
                        </CardTitle>
                        <CardDescription className="text-red-700 dark:text-red-300">
                          This content could not be verified on Whispr
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-600 dark:text-gray-300">
                      The Article ID or SHA256 hash you provided does not match any content in our database.
                      Please verify the identifier and try again.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Info Section */}
          <Card className="mt-8 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">
                About Content Verification
              </h3>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <li>• Every published content on Whispr receives a unique Article ID and SHA-256 fingerprint</li>
                <li>• Version history tracks all changes to content over time</li>
                <li>• This system provides proof of originality and ownership</li>
                <li>• Creators retain copyright; Whispr holds a non-exclusive license to host content</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
