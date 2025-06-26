import PoemClientPage from "./PoemClientPage"

interface PoemPageProps {
  params: {
    id: string
  }
}

import { supabase } from "@/lib/supabase-server"

async function getPoem(id: string) {
  const { data: poem, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("type", "poem")
    .eq("status", "published")
    .single()

  if (error || !poem) {
    return null
  }

  return poem
}

export async function generateMetadata({ params }: PoemPageProps) {
  const poem = await getPoem(params.id)

  if (!poem) {
    return {
      title: "Poem Not Found - Whispr",
    }
  }

  return {
    title: `${poem.title} - Whispr | Prayce's Poetry`,
    description: poem.excerpt || poem.content.substring(0, 160),
    openGraph: {
      title: poem.title,
      description: poem.excerpt || poem.content.substring(0, 160),
      images: poem.featured_image ? [poem.featured_image] : [],
      type: "article",
      publishedTime: poem.created_at,
      authors: ["Prayce"],
    },
    twitter: {
      card: "summary_large_image",
      title: poem.title,
      description: poem.excerpt || poem.content.substring(0, 160),
      images: poem.featured_image ? [poem.featured_image] : [],
    },
  }
}

export default async function PoemPage({ params }: PoemPageProps) {
  return <PoemClientPage params={params} />
}
