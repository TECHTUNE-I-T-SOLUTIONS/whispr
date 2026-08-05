// PDF Certificate Generation Service
// Generates professional copyright certificates for published content

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CertificateData } from '@/lib/types/copyright.types';

export class CertificateService {
  /**
   * Generate PDF certificate for an article
   */
  static async generateCertificate(data: CertificateData): Promise<Buffer> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add border
    doc.setDrawColor(59, 130, 246); // Blue border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Add header background
    doc.setFillColor(59, 130, 246);
    doc.rect(10, 10, pageWidth - 20, 40, 'F');

    // Add title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Content Authenticity Certificate', pageWidth / 2, 30, { align: 'center' });

    // Add Whispr branding
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Whispr - Content Protection System', pageWidth / 2, 38, { align: 'center' });

    // Add certificate content
    let yPos = 65;

    // Article Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Article Title:', 20, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(data.article_title, pageWidth - 80);
    doc.text(titleLines, 20, yPos);
    yPos += (titleLines.length * 8) + 10;

    // Author
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Author:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(data.author, 20, yPos);
    yPos += 12;

    // Article ID
    doc.setFont('helvetica', 'bold');
    doc.text('Article ID:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(data.article_id, 20, yPos);
    yPos += 12;

    // Version
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Version:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Version ${data.version}`, 20, yPos);
    yPos += 12;

    // Publication Date
    doc.setFont('helvetica', 'bold');
    doc.text('Publication Date:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(data.publication_date).toLocaleDateString(), 20, yPos);
    yPos += 12;

    // SHA256 Fingerprint
    doc.setFont('helvetica', 'bold');
    doc.text('SHA-256 Fingerprint:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const hashLines = doc.splitTextToSize(data.sha256_fingerprint, pageWidth - 80);
    doc.text(hashLines, 20, yPos);
    yPos += (hashLines.length * 5) + 12;

    // Canonical URL
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Canonical URL:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(59, 130, 246);
    const urlLines = doc.splitTextToSize(data.canonical_url, pageWidth - 80);
    doc.text(urlLines, 20, yPos);
    yPos += (urlLines.length * 5) + 15;

    // Copyright Notice
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Copyright Notice:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const copyrightText = `This certificate serves as proof of original publication on Whispr. The content creator retains all copyright ownership. Whispr holds a perpetual, non-exclusive license to host and distribute this content. Unauthorized reproduction may violate copyright law.`;
    const copyrightLines = doc.splitTextToSize(copyrightText, pageWidth - 40);
    doc.text(copyrightLines, 20, yPos);
    yPos += (copyrightLines.length * 5) + 15;

    // Generated Timestamp
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Generated: ${new Date(data.generated_timestamp).toLocaleString()}`, pageWidth - 20, pageHeight - 15, { align: 'right' });

    // Add verification QR code placeholder
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.rect(pageWidth - 35, 55, 25, 25);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Verify at', pageWidth - 22.5, 62.5, { align: 'center' });
    doc.text('/verify', pageWidth - 22.5, 68, { align: 'center' });

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
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
