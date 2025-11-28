import WelcomeHero from "@/components/welcome-hero"
import { createSupabaseServer } from "@/lib/supabase-server"
import fs from "fs/promises"
import path from "path"

type Preview = { title?: string; excerpt?: string; url?: string }

function excerpt(text?: string, max = 160) {
  if (!text) return ''
  const cleaned = text.replace(/\n+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return cleaned.slice(0, max).trim() + '…'
}

export default async function WelcomePage() {
  // Read poems from public data
  let featuredPoem: Preview = { title: undefined, excerpt: undefined, url: '/poems' }
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'daily-poems.json')
    const raw = await fs.readFile(file, 'utf8')
    const poems = JSON.parse(raw)
    if (Array.isArray(poems) && poems.length > 0) {
      const idx = new Date().getDate() % poems.length
      const poem = poems[idx] || poems[0]
      featuredPoem = { title: poem.title, excerpt: excerpt(poem.content, 140), url: '/poems' }
    }
  } catch (e) {
    // ignore — fallback will be used
  }

  // Fetch one featured post from Supabase (server-side)
  let latestChronicle: Preview = { title: undefined, excerpt: undefined, url: '/chronicles' }
  try {
    const supabase = createSupabaseServer()
    const { data, error } = await supabase
      .from('posts')
      .select('id,title,excerpt,type')
      .eq('status', 'published')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!error && Array.isArray(data) && data.length > 0) {
      const p: any = data[0]
      const typePath = p.type === 'poem' ? 'poems' : p.type === 'chronicle' ? 'chronicles' : 'blog'
      latestChronicle = { title: p.title, excerpt: excerpt(p.excerpt || p.title, 140), url: `/${typePath}/${p.id}` }
    } else {
      // fallback: get latest published
      const { data: d2 } = await supabase
        .from('posts')
        .select('id,title,excerpt,type')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
      if (Array.isArray(d2) && d2.length > 0) {
        const p: any = d2[0]
        const typePath = p.type === 'poem' ? 'poems' : p.type === 'chronicle' ? 'chronicles' : 'blog'
        latestChronicle = { title: p.title, excerpt: excerpt(p.excerpt || p.title, 140), url: `/${typePath}/${p.id}` }
      }
    }
  } catch (e) {
    // ignore
  }

  return (
    <main>
      <WelcomeHero featuredPoem={featuredPoem} latestChronicle={latestChronicle} />

      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">What is Whispr?</h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">Whispr is a space for short, thoughtful expression — poems, chronicles, audio and video whispers, and a community wall where voices meet. Start exploring or share your own little echo.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/chronicles" className="p-4 border rounded-lg hover:shadow-lg">
              <h4 className="font-medium">Chronicles</h4>
              <p className="text-sm mt-1">Longform essays and feature pieces.</p>
            </a>
            <a href="/poems" className="p-4 border rounded-lg hover:shadow-lg">
              <h4 className="font-medium">Poems</h4>
              <p className="text-sm mt-1">Short poems and daily inspirations.</p>
            </a>
            <a href="/whispr-wall" className="p-4 border rounded-lg hover:shadow-lg">
              <h4 className="font-medium">Whispr Wall</h4>
              <p className="text-sm mt-1">Community micro-posts and reactions.</p>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
