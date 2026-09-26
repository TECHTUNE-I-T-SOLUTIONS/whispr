// Certificate Generation Service
// Generates professional copyright certificates for published content using PDFKit

import PDFDocument from 'pdfkit';
import type { CertificateData } from '@/lib/types/copyright.types';

export class CertificateService {
  /**
   * Generate PDF certificate for an article
   */
  static async generateCertificate(data: CertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          layout: 'landscape',
          size: 'a4',
          margin: 50
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // Add border
        doc.lineWidth(2)
          .strokeColor('#DC2626')
          .rect(10, 10, pageWidth - 20, pageHeight - 20)
          .stroke();

        // Add header background
        doc.rect(10, 10, pageWidth - 20, 50)
          .fillColor('#DC2626')
          .fill();

        // Add title
        doc.fillColor('#FFFFFF')
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('Content Authenticity Certificate', pageWidth / 2, 30, { align: 'center' });

        // Add Whispr branding
        doc.fontSize(11)
          .font('Helvetica')
          .text('Whispr - Content Protection System', pageWidth / 2, 42, { align: 'center' });

        // Add certificate content
        let yPos = 75;

        // Article Title
        doc.fillColor('#000000')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Article Title:', 30, yPos);
        yPos += 12;
        doc.fontSize(12)
          .font('Helvetica')
          .text(data.article_title, 30, yPos, { width: pageWidth - 100 });
        yPos += 25;

        // Author
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('Author:', 30, yPos);
        yPos += 12;
        doc.font('Helvetica')
          .text(data.author, 30, yPos);
        yPos += 20;

        // Article ID
        doc.font('Helvetica-Bold')
          .text('Article ID:', 30, yPos);
        yPos += 12;
        doc.fontSize(10)
          .font('Helvetica')
          .text(data.article_id, 30, yPos);
        yPos += 20;

        // Version
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('Version:', 30, yPos);
        yPos += 12;
        doc.font('Helvetica')
          .text(`Version ${data.version}`, 30, yPos);
        yPos += 20;

        // Publication Date
        doc.font('Helvetica-Bold')
          .text('Publication Date:', 30, yPos);
        yPos += 12;
        doc.font('Helvetica')
          .text(new Date(data.publication_date).toLocaleDateString(), 30, yPos);
        yPos += 20;

        // SHA256 Fingerprint
        doc.font('Helvetica-Bold')
          .text('SHA-256 Fingerprint:', 30, yPos);
        yPos += 12;
        doc.fontSize(8)
          .font('Helvetica')
          .text(data.sha256_fingerprint, 30, yPos, { width: pageWidth - 100 });
        yPos += 20;

        // Canonical URL
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .text('Canonical URL:', 30, yPos);
        yPos += 12;
        doc.fontSize(9)
          .fillColor('#DC2626')
          .text(data.canonical_url || 'N/A', 30, yPos, { width: pageWidth - 100, link: data.canonical_url });
        yPos += 25;

        // Copyright Notice
        doc.fillColor('#000000')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Copyright Notice:', 30, yPos);
        yPos += 12;
        doc.fontSize(9)
          .fillColor('#505050')
          .font('Helvetica')
          .text(
            'This certificate serves as proof of original publication on Whispr. The content creator retains all copyright ownership. Whispr holds a perpetual, non-exclusive license to host and distribute this content. Unauthorized reproduction may violate copyright law.',
            30,
            yPos,
            { width: pageWidth - 60, align: 'justify' }
          );
        yPos += 35;

        // Generated Timestamp
        doc.fillColor('#000000')
          .fontSize(8)
          .font('Helvetica-Oblique')
          .text(
            `Generated: ${new Date(data.generated_timestamp).toLocaleString()}`,
            pageWidth - 30,
            pageHeight - 25,
            { align: 'right' }
          );

        // Add verification info
        doc.lineWidth(0.5)
          .strokeColor('#C0C0C0')
          .rect(pageWidth - 50, 65, 35, 35)
          .stroke();
        doc.fontSize(7)
          .font('Helvetica')
          .fillColor('#808080')
          .text('Verify at', pageWidth - 32.5, 72, { align: 'center' })
          .text('/verify', pageWidth - 32.5, 79, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate simple text-based certificate (fallback)
   */
  static generateTextCertificate(data: CertificateData): string {
    return `
CONTENT AUTHENTICITY CERTIFICATE
================================

Whispr - Content Protection System

Article Title: ${data.article_title}
Author: ${data.author}
Article ID: ${data.article_id}
Version: ${data.version}
Publication Date: ${new Date(data.publication_date).toLocaleString()}

SHA-256 Fingerprint:
${data.sha256_fingerprint}

Canonical URL: ${data.canonical_url}

Copyright Notice:
This certificate serves as proof of original publication on Whispr. 
The content creator retains all copyright ownership. Whispr holds a 
perpetual, non-exclusive license to host and distribute this content. 
Unauthorized reproduction may violate copyright law.

Generated: ${new Date(data.generated_timestamp).toLocaleString()}
================================
Verify at: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://whisprwords.com'}/verify
    `.trim();
  }
}
