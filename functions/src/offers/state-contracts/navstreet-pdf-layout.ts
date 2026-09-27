import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SVGtoPDF from 'svg-to-pdfkit';

/** Shared NavStreet page chrome for state-authored agreements. Official state forms keep their own pages. */
export const NAVSTREET_PDF = {
  blue: '#154360',
  teal: '#1F7A8C',
  ink: '#1B2A34',
  pale: '#EDF5F7',
  margin: 42,
  contentWidth: 528,
  contentTop: 92,
  contentBottom: 705,
} as const;

const root = join(__dirname, '../../../');
const logo = readFileSync(join(root, 'assets/navstreet-transparent.svg'), 'utf8');
const fonts = join(root, 'node_modules/@fontsource/barlow/files');

export function registerNavStreetPdfFonts(pdf: PDFKit.PDFDocument): void {
  pdf.registerFont('NavStreet-Regular', join(fonts, 'barlow-latin-400-normal.woff'));
  pdf.registerFont('NavStreet-Bold', join(fonts, 'barlow-latin-700-normal.woff'));
}

export function drawNavStreetPdfChrome(pdf: PDFKit.PDFDocument, input: {
  readonly stateName: string;
  readonly referenceNumber: string;
  readonly versionNumber: number;
  readonly pageNumber: number;
  readonly pageCount: number;
}): void {
  const { blue, teal, margin, contentWidth } = NAVSTREET_PDF;
  pdf.save();
  pdf.rect(36, 24, 540, 48).fill(blue);
  SVGtoPDF(pdf, logo, 44, 25, { width: 118, height: 46, preserveAspectRatio: 'xMidYMid meet' });
  pdf.restore();

  pdf.font('NavStreet-Bold').fillColor('#FFFFFF').fontSize(9.4)
    .text(`${input.stateName.toUpperCase()} RESIDENTIAL PURCHASE\nAND SALE AGREEMENT`, 181, 33,
      { width: 380, lineGap: 1.5, characterSpacing: 0.5 });
  pdf.font('NavStreet-Regular').fontSize(5.6)
    .text(`Offer | ${input.referenceNumber} | Version ${input.versionNumber}`, 181, 60,
      { width: 380, characterSpacing: 0 });

  pdf.moveTo(margin, 723).lineTo(margin + contentWidth, 723)
    .lineWidth(0.5).strokeColor('#BDD0D8').stroke();
  pdf.font('NavStreet-Regular').fontSize(5.8).fillColor(teal)
    .text(`NavStreet | ${input.referenceNumber} | Version ${input.versionNumber}`, margin, 730,
      { width: 410, lineBreak: false, characterSpacing: 0 });
  pdf.text(`Page ${input.pageNumber} of ${input.pageCount}`, 480, 730,
    { width: 90, align: 'right', lineBreak: false, characterSpacing: 0 });
}

export function drawNavStreetSectionBar(pdf: PDFKit.PDFDocument, title: string): void {
  const { blue, margin, contentWidth } = NAVSTREET_PDF;
  const y = pdf.y + 7;
  pdf.rect(margin, y, contentWidth, 18).fill(blue);
  pdf.font('NavStreet-Bold').fillColor('#FFFFFF').fontSize(8)
    .text(title.toUpperCase(), margin + 9, y + 5,
      { width: contentWidth - 18, lineBreak: false, characterSpacing: 0.35 });
  pdf.y = y + 25;
}

export function drawNavStreetNotice(pdf: PDFKit.PDFDocument, title: string, body: string): void {
  const { blue, teal, ink, margin, contentWidth } = NAVSTREET_PDF;
  const y = pdf.y;
  pdf.font('NavStreet-Regular').fontSize(9);
  const height = Math.max(56, pdf.heightOfString(body, { width: contentWidth - 24, lineGap: 2 }) + 32);
  pdf.roundedRect(margin, y, contentWidth, height, 4)
    .lineWidth(0.8).strokeColor(teal).stroke();
  pdf.font('NavStreet-Bold').fillColor(blue).fontSize(9)
    .text(title.toUpperCase(), margin + 12, y + 9,
      { width: contentWidth - 24, characterSpacing: 0 });
  pdf.font('NavStreet-Regular').fillColor(ink).fontSize(9)
    .text(body, margin + 12, y + 24,
      { width: contentWidth - 24, lineGap: 2, characterSpacing: 0 });
  pdf.y = y + height + 8;
}
