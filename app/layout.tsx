import type React from "react"
import type { Metadata, Viewport } from "next"
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
import { JsonLd } from "@/components/json-ld"
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, organizationJsonLd, websiteJsonLd } from "@/lib/seo"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Whispr — Original Poetry, Whisper Stories & Verse",
    template: "%s | Whispr",
  },
  description:
    "Read original poetry, whisper stories and serialized fiction from independent writers — or publish your own with copyright protection built in.",
  applicationName: SITE_NAME,
  keywords: [
    "original poetry",
    "poems about loss and healing",
    "daily original poetry online",
    "read poems online",
    "short stories",
    "serialized fiction",
    "creative writing platform",
    "publish poetry online",
    "poetry copyright protection",
    "whisper stories",
    "Whispr",
    "WhisprWords",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "literature",
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/api/rss`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: "Whispr — Original Poetry, Whisper Stories & Verse",
    description:
      "Read original poetry, whisper stories and serialized fiction from independent writers — or publish your own with copyright protection built in.",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "Whispr — original poetry and stories" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@whisprwords",
    creator: "@whisprwords",
    title: "Whispr — Original Poetry, Whisper Stories & Verse",
    description:
      "Read original poetry, whisper stories and serialized fiction from independent writers.",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: "/favicon.ico",
    apple: "/lightlogo.png",
  },
  manifest: "/manifest.json",
  formatDetection: { telephone: false, address: false, email: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://vkftywhuaxwbknlrymnr.supabase.co" crossOrigin="" />
        <link rel="dns-prefetch" href="https://vkftywhuaxwbknlrymnr.supabase.co" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Site-wide entity signals for search engines and AI answer engines */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
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
