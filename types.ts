export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string
  type: "blog" | "poem"
  status: "draft" | "published" | "archived"
  admin_id?: string
  featured?: boolean
  reading_time?: number
  tags?: string[]
  media_files?: any[] // you can type this better if you know the shape
  seo_title?: string
  seo_description?: string
  slug?: string
  view_count?: number
  created_at?: string
  updated_at?: string
  published_at?: string
}
