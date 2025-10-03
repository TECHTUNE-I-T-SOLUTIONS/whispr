"use client"

import React, { useEffect, useState } from 'react'

export default function ErrorCatcher() {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const onError = (msg: string | Event, url?: string, line?: number, col?: number, err?: Error) => {
      try {
        console.error('Global error captured:', msg, err)
      } catch (e) {}
      const eObj = err instanceof Error ? err : new Error(String(msg))
      setError(eObj)
      setHasError(true)
      // send to server for easier debugging
      try {
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: eObj.message, stack: eObj.stack, url: window.location.href, userAgent: navigator.userAgent, ts: Date.now(), source: 'onerror' })
        }).catch(() => {})
      } catch (e) {}
      return false
    }

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      try { console.error('Global unhandledrejection captured:', ev.reason) } catch (e) {}
      const err = ev?.reason
      const eObj = err instanceof Error ? err : new Error(String(err))
      setError(eObj)
      setHasError(true)
      try {
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: eObj.message, stack: eObj.stack, url: window.location.href, userAgent: navigator.userAgent, ts: Date.now(), source: 'unhandledrejection' })
        }).catch(() => {})
      } catch (e) {}
    }

    window.addEventListener('error', onError as EventListener)
    window.addEventListener('unhandledrejection', onUnhandledRejection as EventListener)

    return () => {
      try { window.removeEventListener('error', onError as EventListener) } catch (e) {}
      try { window.removeEventListener('unhandledrejection', onUnhandledRejection as EventListener) } catch (e) {}
    }
  }, [])

  if (!hasError) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-xl w-full mx-4">
        <h2 className="text-lg font-bold mb-2">Application error</h2>
        <p className="text-sm text-muted-foreground mb-4">A client-side exception occurred while loading the page.</p>

        {process.env.NODE_ENV === 'development' && error && (
          <pre className="bg-muted/10 dark:bg-muted/20 rounded p-2 mb-4 text-xs overflow-auto max-h-40">
            {String(error?.message || error)}
            {error?.stack ? '\n\n' + error.stack : ''}
          </pre>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload
          </button>
          <button
            onClick={() => {
              setHasError(false)
              setError(null)
            }}
            className="px-4 py-2 border rounded"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
