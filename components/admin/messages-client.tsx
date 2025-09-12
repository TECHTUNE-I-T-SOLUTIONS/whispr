"use client"

import dynamic from 'next/dynamic'
import React from 'react'

const MessagesManager = dynamic(() => import('./messages-manager').then(m => m.MessagesManager), { ssr: false })

export default function MessagesClient(props: { conversationId: string, initialMessages?: any[] }) {
  return <MessagesManager {...props} />
}
