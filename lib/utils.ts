import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import MarkdownIt from "markdown-it"

// Configure markdown-it to allow raw HTML and render common Markdown syntax
const md = new MarkdownIt({
  html: true,          // Allow raw HTML like <div>
  linkify: true,       // Auto-detect links
  typographer: true,   // Smart punctuation
  breaks: true,        // Convert line breaks to <br>
})

export async function markdownToHtml(markdown: string): Promise<string> {
  return md.render(markdown)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
