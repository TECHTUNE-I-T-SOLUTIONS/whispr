'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ErrorLog {
  id: string
  message: string
  stack?: string
  url?: string
  source: string
  created_at: string
  occurrence_count: number
  last_occurrence_at: string
  resolved: boolean
}

interface ErrorResponse {
  errors: ErrorLog[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function ErrorLogsPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')

  const LIMIT = 20

  useEffect(() => {
    fetchErrors()
  }, [offset, filter])

  const fetchErrors = async () => {
    try {
      setLoading(true)
      const resolved = filter === 'all' ? undefined : filter === 'resolved'
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: offset.toString(),
        ...(resolved !== undefined && { resolved: resolved.toString() }),
      })

      const res = await fetch(`/api/admin/error-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch error logs')

      const data: ErrorResponse = await res.json()
      setErrors(data.errors)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/error-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true, notes: 'Marked as resolved' }),
      })

      if (!res.ok) throw new Error('Failed to resolve error')
      fetchErrors()
      setSelectedError(null)
    } catch (error) {
      console.error('Error resolving log:', error)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-3xl font-bold">Error Logs</h1>
            <p className="text-muted-foreground">Production error tracking and monitoring</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {errors.filter(e => !e.resolved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {total > 0 ? Math.round((errors.filter(e => e.resolved).length / total) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'unresolved', 'resolved'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => {
              setFilter(f)
              setOffset(0)
            }}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Error Log List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No errors found</div>
          ) : (
            <div className="space-y-2">
              {errors.map(error => (
                <div
                  key={error.id}
                  onClick={() => setSelectedError(error)}
                  className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold truncate">{error.message}</p>
                        {!error.resolved && (
                          <Badge variant="destructive" className="ml-2 shrink-0">
                            Unresolved
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Source: <span className="font-mono text-xs">{error.source}</span></p>
                        <p>URL: <span className="font-mono text-xs truncate">{error.url}</span></p>
                        <p>Occurred: {formatDistanceToNow(new Date(error.created_at))} ago</p>
                        {error.occurrence_count > 1 && (
                          <p>Occurrences: <span className="font-bold">{error.occurrence_count}×</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({total} total errors)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={!errors.length || offset + LIMIT >= total}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Error Details</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Message</label>
                  <p className="p-3 bg-muted rounded text-sm break-words">{selectedError.message}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Source</label>
                  <p className="p-3 bg-muted rounded font-mono text-xs">{selectedError.source}</p>
                </div>

                {selectedError.url && (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">URL</label>
                    <p className="p-3 bg-muted rounded font-mono text-xs break-all">{selectedError.url}</p>
                  </div>
                )}

                {selectedError.stack && (
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Stack Trace</label>
                    <pre className="p-3 bg-muted rounded font-mono text-xs overflow-x-auto max-h-48">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Occurrences</label>
                    <p className="text-lg font-bold">{selectedError.occurrence_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground">Last Occurrence</label>
                    <p className="text-sm">{formatDistanceToNow(new Date(selectedError.last_occurrence_at))} ago</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Status</label>
                  <Badge variant={selectedError.resolved ? 'secondary' : 'destructive'}>
                    {selectedError.resolved ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </div>
              </div>
            </CardContent>
            <div className="border-t p-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedError(null)}
              >
                Close
              </Button>
              {!selectedError.resolved && (
                <Button
                  onClick={() => handleResolve(selectedError.id)}
                >
                  Mark as Resolved
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
