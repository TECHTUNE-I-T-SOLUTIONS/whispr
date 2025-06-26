import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { marked } from "marked"

export async function markdownToHtml(markdown: string): Promise<string> {
  return await marked.parse(markdown)
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
