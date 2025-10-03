import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
<<<<<<< HEAD
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeScript } from "@/components/theme-script"
import { Toaster } from "@/components/ui/toaster"
import { ConditionalLayout } from "@/components/conditional-layout"
=======
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeScript } from "@/components/theme-script"
import { Toaster } from "@/components/ui/toaster"
import { ConditionalLayout } from "@/components/conditional-layout"
import { FloatingNotificationBell } from "@/components/floating-notification-bell"
import { FeedbackWidget } from '@/components/feedback-widget'
import { PushNotificationScript } from "@/components/push-notification-script"
import { TooltipProvider } from '@/components/ui/tooltip'
import ErrorCatcher from '@/components/error-catcher'
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "Whispr - Poetry & Writing",
  description: "A collection of poems and writings that speak in whispers",
<<<<<<< HEAD
    generator: 'v0.dev'
=======
  keywords: ["poetry", "writing", "creative writing", "literature", "whispers"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
<<<<<<< HEAD
=======
        {/* Fallback link for favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
<<<<<<< HEAD
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="whispr-theme"
        >
          <ConditionalLayout>{children}</ConditionalLayout>
=======
          enableSystem
          storageKey="whispr-theme"
        >
          <ErrorCatcher />
          <PushNotificationScript />
          <TooltipProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <FloatingNotificationBell />
            <FeedbackWidget />
          </TooltipProvider>
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
