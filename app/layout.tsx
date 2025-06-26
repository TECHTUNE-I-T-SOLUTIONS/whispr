import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeScript } from "@/components/theme-script"
import { Toaster } from "@/components/ui/toaster"
import { ConditionalLayout } from "@/components/conditional-layout"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })

export const metadata: Metadata = {
  title: "Whispr - Poetry & Writing",
  keywords: ["poetry", "writing", "creative writing", "literature", "whispers"],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  description: "A collection of poems and writings that speak in whispers",
    generator: 'v0.dev'
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
          storageKey="whispr-theme"
        >
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
