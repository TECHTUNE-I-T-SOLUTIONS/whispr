import { serializeJsonLd } from "@/lib/seo"

/**
 * Renders one or more Schema.org JSON-LD blocks.
 * Server-component friendly: no client JS is shipped for structured data.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <>
      {serializeJsonLd(data).map((json, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: json }}
        />
      ))}
    </>
  )
}
