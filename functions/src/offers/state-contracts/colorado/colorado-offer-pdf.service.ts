import { generateLegacyColoradoOfferPdf } from './colorado-legacy-offer-pdf.service';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SVGtoPDF from 'svg-to-pdfkit';
import { coloradoAgreementClauses } from './colorado-agreement-clauses';
import { normalizeColoradoTerms } from './colorado-terms-rules';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { COLORADO_DEADLINE_KEYS } from './colorado-initial-terms';
import { NAVSTREET_PDF, drawNavStreetPdfChrome, drawNavStreetSectionBar, registerNavStreetPdfFonts } from '../navstreet-pdf-layout';

const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
const yesNo = (value: boolean | null) => value === true ? 'YES' : value === false ? 'NO' : 'UNSELECTED';
const phone = (value: string) => { const digits = value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, ''); return digits.length === 10 ? `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}` : value; };

/** An original NavStreet agreement; the Colorado CBS1 PDF remains a research reference. */
export async function generateColoradoOfferPdf(input: GenerateStateAgreementInput<ColoradoOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  if (!input.version.terms.elections) return generateLegacyColoradoOfferPdf(input);
  const t = normalizeColoradoTerms(input.version.terms), d = t.deadlines;
  const pdf = new PDFDocument({ size: 'LETTER', bufferPages: true,
    margins: { top: NAVSTREET_PDF.contentTop, bottom: 32, left: NAVSTREET_PDF.margin, right: NAVSTREET_PDF.margin },
    info: { Title: input.documentTitle, Author: 'NavStreet', CreationDate: input.generatedAt } });
  registerNavStreetPdfFonts(pdf);
  const chunks: Buffer[] = [];
  pdf.on('data', data => chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
  function section(title: string): void {
    if (pdf.y > NAVSTREET_PDF.contentBottom - 60) pdf.addPage();
    drawNavStreetSectionBar(pdf, title);
  }
  function paragraph(title: string, body: string, bold = false): void {
    pdf.font('NavStreet-Regular').fontSize(9.5);
    if (pdf.y + pdf.heightOfString(body, { width: 508, lineGap: 2 }) + 55 > NAVSTREET_PDF.contentBottom) pdf.addPage();
    section(title);
    pdf.font(bold ? 'NavStreet-Bold' : 'NavStreet-Regular').fontSize(9.5).fillColor(NAVSTREET_PDF.ink)
      .text(body, NAVSTREET_PDF.margin + 10, pdf.y + 2, { width: 508, lineGap: 2 });
    pdf.y += 12;
  }
  function row(name: string, value: string): void {
    pdf.font('NavStreet-Regular').fontSize(9);
    const height = Math.max(26, pdf.heightOfString(value, { width: 315 }) + 12);
    if (pdf.y + height > NAVSTREET_PDF.contentBottom) pdf.addPage();
    const y = pdf.y;
    pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, height - 2).fill(NAVSTREET_PDF.pale);
    pdf.font('NavStreet-Bold').fillColor(NAVSTREET_PDF.ink).fontSize(9)
      .text(name, NAVSTREET_PDF.margin + 8, y + 6, { width: 180 });
    pdf.font('NavStreet-Regular').text(value, NAVSTREET_PDF.margin + 196, y + 6, { width: 315 });
    pdf.y = y + height;
  }
  pdf.y = NAVSTREET_PDF.contentTop;
  section('Parties and property');
  row('Buyer(s)', input.version.buyers.map(x => x.legalName).join('; '));
  row('Seller(s)', input.version.sellers.map(x => x.legalName).join('; '));
  row('Address', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Colorado', t.property.zipCode].filter(Boolean).join(', '));
  row('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  row('Seller legal description', t.legalDescription);
  row('Seller land area', t.propertyFacts.landArea || 'Information not supplied');
  if (input.version.documents.length) section('Disclosure records supplied with this version');
  for (const document of input.version.documents) {
    row('Document reference', Object.entries(document).filter(([key]) => ['documentType','documentUid','versionId','fileName','title'].includes(key)).map(([key,value]) => `${key}: ${String(value)}`).join(' / ') || 'Refer to the immutable version attachment record');
  }
  for (const clause of coloradoAgreementClauses(t)) paragraph(clause.title, clause.body, clause.bold);
  section('Dates and deadlines summary');
  for (const key of COLORADO_DEADLINE_KEYS) {
    if (t.deadlines[key]) row(label(key), t.deadlines[key]);
  }
  row('Deadline time / holiday extension', `${d.timeOfDay} Mountain Time / ${yesNo(d.extendHoliday)}`);
  row('Possession time', `${d.possessionTime} Mountain Time`);
  section('Version signatures');
  for (const [side, parties] of [['Buyer', input.version.buyers], ['Seller', input.version.sellers]] as const) {
    for (const person of parties) {
      const signed = person.signature.status === 'signed' && person.signature.signedAt;
      row(`${side} contact`, `${person.email} / ${phone(person.phone)}`);
      row(`${side}: ${person.legalName}`, signed ? `/s/ ${person.legalName} at ${person.signature.signedAt?.toDate().toISOString()}` : 'Awaiting signature');
    }
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    drawNavStreetPdfChrome(pdf, { stateName: 'Colorado', referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber, pageNumber: index + 1, pageCount });
  }
  pdf.end();
  let buffer = await completed;
  // A header-only page avoids copying contract body content into the banner.
  const bannerPdf = new PDFDocument({ size: [540, 48], margin: 0 });
  registerNavStreetPdfFonts(bannerPdf);
  const bannerChunks: Buffer[] = [];
  bannerPdf.on('data', data => bannerChunks.push(Buffer.from(data)));
  const bannerDone = new Promise<Buffer>((resolve, reject) => {
    bannerPdf.on('end', () => resolve(Buffer.concat(bannerChunks)));
    bannerPdf.on('error', reject);
  });
  bannerPdf.rect(0, 0, 540, 48).fill(NAVSTREET_PDF.blue);
  const svg = readFileSync(join(__dirname, '../../../../assets/navstreet-transparent.svg'), 'utf8');
  SVGtoPDF(bannerPdf, svg, 8, 1, { width: 118, height: 46, preserveAspectRatio: 'xMidYMid meet' });
  bannerPdf.font('NavStreet-Bold').fillColor('#FFFFFF').fontSize(9.4)
    .text('COLORADO RESIDENTIAL PURCHASE', 145, 9, {width:380,lineBreak:false})
    .text('AND SALE AGREEMENT',145,21,{width:380,lineBreak:false});
  bannerPdf.font('NavStreet-Regular').fontSize(5.6)
    .text(`Offer | ${input.offer.referenceNumber} | Version ${input.version.versionNumber}`,145,36,{width:380,lineBreak:false});
  bannerPdf.end();
  const finished = await PdfLibDocument.load(buffer);
  const [banner] = await finished.embedPdf(await bannerDone, [0]);
  for (const page of finished.getPages()) page.drawPage(banner, { x:36, y:720, width:540, height:48 });
  buffer = Buffer.from(await finished.save());
  return { buffer, fileName: `NavStreet-CO-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}