'use client'
import { useEffect } from 'react'

export default function SetAdminId() {
  useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith('whispr-admin-data='))
      if (!raw) return
      const val = raw.split('=')[1]
      if (!val) return
      const decoded = decodeURIComponent(val)
      const adminData = JSON.parse(decoded)
      if (adminData?.id) {
        ;(window as any).__WHISPR_ADMIN_ID__ = adminData.id
      }
    } catch (e) {}
  }, [])
  return null
}
