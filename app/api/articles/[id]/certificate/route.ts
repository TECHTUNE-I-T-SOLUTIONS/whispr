import { type NextRequest, NextResponse } from "next/server"
import { CopyrightService } from "@/lib/services/copyright.service"
import { CertificateService } from "@/lib/services/certificate.service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const articleId = id

    // Generate certificate data
    const certificateData = await CopyrightService.generateCertificateData(articleId)

    if (!certificateData) {
      return NextResponse.json(
        { error: "Article not found or not published" },
        { status: 404 }
      )
    }

    // Generate PDF certificate
    const pdfBuffer = await CertificateService.generateCertificate(certificateData)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificateData.article_id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    )
  }
}
