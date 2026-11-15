import { TrendsPage } from "@/components/trends/TrendsPage"

export const metadata = {  alternates: { canonical: "https://whisprwords.com/trends" },

  title: "Trending on Whispr — What Readers Are Reading",
  description: 'Discover what\'s trending now from RSS feeds and news sources worldwide',
}

export default function Page() {
  return <TrendsPage />
}
