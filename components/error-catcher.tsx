"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Bug, X, Copy, Mail } from 'lucide-react'

export default function ErrorCatcher() {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const reportToServer = (eObj: Error, source: string) => {
      try {
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: eObj.message,
            stack: eObj.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ts: Date.now(),
            source,
          }),
        }).catch(() => {})
      } catch (e) {}
    }

    const onError = (msg: string | Event, url?: string, line?: number, col?: number, err?: Error) => {
      const eObj = err instanceof Error ? err : new Error(String(msg))
      setError(eObj)
      setHasError(true)
      reportToServer(eObj, 'onerror')
      return false
    }

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      const err = ev?.reason
      const eObj = err instanceof Error ? err : new Error(String(err))
      setError(eObj)
      setHasError(true)
      reportToServer(eObj, 'unhandledrejection')
    }

    window.addEventListener('error', onError as EventListener)
    window.addEventListener('unhandledrejection', onUnhandledRejection as EventListener)

    return () => {
      try { window.removeEventListener('error', onError as EventListener) } catch (e) {}
      try { window.removeEventListener('unhandledrejection', onUnhandledRejection as EventListener) } catch (e) {}
    }
  }, [])

  if (!hasError) return null

  const detailsText = String(error?.message || '') + (error?.stack ? '\n\n' + error.stack : '')

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(detailsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      try { document.execCommand('copy') } catch {}
    }
  }

  const sendReport = async () => {
    if (!error) return
    setReporting(true)
    try {
      await fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: error.message, stack: error.stack, url: window.location.href, userAgent: navigator.userAgent, ts: Date.now(), source: 'manual-report' })
      })
    } catch (e) {
      // ignore
    } finally {
      setReporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl mx-auto rounded-xl overflow-hidden shadow-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image src="/logotype.png" alt="Whispr" fill className="object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground dark:text-foreground">Unexpected error</h3>
              <p className="text-xs text-muted-foreground">A client-side error was detected. The issue has been logged and can be reported to the team.</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Close" onClick={() => { setHasError(false); setError(null) }} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-800">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/30">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold">What happened</p>
                <p className="text-xs text-muted-foreground mt-1">An unexpected client-side error occurred. You can reload the page, try again, or send a report to the team.</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-3 py-2 rounded bg-red-600 text-white text-sm">Reload</button>
                  <button onClick={() => { setHasError(false); setError(null) }} className="inline-flex items-center gap-2 px-3 py-2 rounded border text-sm">Continue</button>
                  <button onClick={() => { setDetailsOpen(!detailsOpen) }} className="inline-flex items-center gap-2 px-3 py-2 rounded border text-sm">{detailsOpen ? 'Hide details' : 'Show details'}</button>
                </div>
              </div>
            </div>

            {detailsOpen && (
              <div className="mt-4 bg-muted/5 dark:bg-muted/10 border border-gray-100 dark:border-slate-800 rounded p-3 text-xs overflow-auto max-h-60">
                <div className="flex items-start justify-between gap-2">
                  <pre className="whitespace-pre-wrap">{detailsText}</pre>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={copyDetails} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded text-sm">
                    <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy details'}
                  </button>
                  <button onClick={sendReport} disabled={reporting} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm">
                    <Mail className="w-4 h-4" /> {reporting ? 'Reporting...' : 'Send report'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-1">
            <div className="bg-gray-50 dark:bg-slate-800 rounded p-4 text-xs">
              <p className="font-medium text-sm mb-2">Error details</p>
              <p className="text-muted-foreground"><strong>URL:</strong> <span className="break-all">{typeof window !== 'undefined' ? window.location.href : ''}</span></p>
              <p className="text-muted-foreground mt-1"><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p className="text-muted-foreground mt-1"><strong>User agent:</strong> <span className="hidden sm:inline">{navigator.userAgent}</span></p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
