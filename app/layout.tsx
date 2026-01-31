import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeScript } from "@/components/theme-script"
import { Toaster } from "@/components/ui/toaster"
import { ConditionalLayout } from "@/components/conditional-layout"
import { FloatingNotificationBell } from "@/components/floating-notification-bell"
import { FeedbackWidget } from '@/components/feedback-widget'
import { PushNotificationScript } from "@/components/push-notification-script"
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorCatcher from '@/components/error-catcher'
import MaintenanceBanner from '@/components/maintenance-banner'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "Whispr - Poetry & Writing",
  description: "A collection of poems and writings that speak in whispers",
  keywords: ["poetry", "writing", "creative writing", "literature", "whispers"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* Fallback link for favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          storageKey="whispr-theme"
        >
          <ErrorCatcher />
          <MaintenanceBanner />
          <PushNotificationScript />
          <TooltipProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <FloatingNotificationBell />
            <FeedbackWidget />
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
