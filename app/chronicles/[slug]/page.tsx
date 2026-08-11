import { notFound } from "next/navigation"
import { getChroniclesPostBySlug } from "@/lib/services/chronicles.service"
import ChroniclesClientPage from "./chronicles-client-page"

interface ChroniclesPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ChroniclesPage({ params }: ChroniclesPageProps) {
  const { slug } = await params
  const post = await getChroniclesPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return <ChroniclesClientPage initialPost={post} />
}
