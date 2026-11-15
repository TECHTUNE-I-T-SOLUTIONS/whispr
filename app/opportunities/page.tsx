import { OpportunitiesClient } from "@/components/opportunities/opportunities-client"

export const metadata = {  alternates: { canonical: "https://whisprwords.com/opportunities" },

  title: "Creative Opportunities for Writers & Artists",
  description: "Browse and apply for opportunities on Whispr",
}

export default function OpportunitiesPage() {
  return <OpportunitiesClient />
}