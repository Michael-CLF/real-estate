import { paginatePdfText } from './pdf-text-pagination';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import type { AgreementSummaryRow, GenerateStateAgreementInput, GeneratedStateAgreement, StateContractTerms } from './state-contract-package';

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
let logo: string | undefined;
const fonts = join(root, 'node_modules/@fontsource/barlow/files');
let regularFont: Buffer | undefined;
let boldFont: Buffer | undefined;

export function registerNavStreetPdfFonts(pdf: PDFKit.PDFDocument): void {
  regularFont ??= preparePdfFont(readFileSync(join(fonts, 'barlow-latin-400-normal.woff')));
  boldFont ??= preparePdfFont(readFileSync(join(fonts, 'barlow-latin-700-normal.woff')));
  pdf.registerFont('NavStreet-Regular', regularFont);
  pdf.registerFont('NavStreet-Bold', boldFont);
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
  const SVGtoPDF = require('svg-to-pdfkit') as typeof import('svg-to-pdfkit');
  logo ??= readFileSync(join(root, 'assets/navstreet-transparent.svg'), 'utf8');
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


export function summaryMoney(cents: number): string {
  return Number.isFinite(cents) ? new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
  }).format(cents / 100) : 'Not specified';
}

export function summaryText(value: string | number | undefined): string {
  return value === undefined || value === '' || value === 'unselected'
    ? 'Not specified' : String(value).replace(/_/g, ' ');
}

/** Down payment is price less financing, before crediting earnest money; not cash to close. */
export function summaryFunding(price: number, loan: number | undefined, cash: boolean): AgreementSummaryRow[] {
  return [
    { label: 'Purchase price', value: summaryMoney(price) },
    { label: 'Down payment (before deposit credit)', value: cash ? 'Not applicable — cash purchase' :
      loan === undefined ? 'Not specified in base agreement; see financing attachments' : summaryMoney(price - loan) },
    { label: 'Loan amount', value: cash ? 'None — cash purchase' :
      loan === undefined ? 'Not specified in base agreement; see financing attachments' : summaryMoney(loan) },
  ];
}

/** Adds the same branded summary to submitted and accepted PDFs before hashing/storage. */
export async function prependNavStreetContractSummary(
  input: GenerateStateAgreementInput<StateContractTerms>,
  rows: readonly AgreementSummaryRow[],
  agreement: GeneratedStateAgreement,
): Promise<GeneratedStateAgreement> {
  const PDFDocument = require('pdfkit') as typeof import('pdfkit');
  const { PDFDocument: MergePdfDocument } = require('pdf-lib') as typeof import('pdf-lib');
  const pdf = new PDFDocument({ size: 'LETTER', margin: NAVSTREET_PDF.margin, bufferPages: true });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    pdf.on('data', chunk => chunks.push(Buffer.from(chunk)));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
  registerNavStreetPdfFonts(pdf);
  const property = input.version.terms.property;
  pdf.y = NAVSTREET_PDF.contentTop;
  pdf.font('NavStreet-Bold').fontSize(20).fillColor(NAVSTREET_PDF.blue)
    .text('Contract at a glance', NAVSTREET_PDF.margin, pdf.y);
  pdf.moveDown(0.4);
  pdf.font('NavStreet-Regular').fontSize(10).fillColor(NAVSTREET_PDF.ink)
    .text([property.addressLine1, property.city, property.state, property.zipCode].filter(Boolean).join(', '),
      { width: NAVSTREET_PDF.contentWidth });
  pdf.moveDown(0.5);
  const parties = [
    { label: 'Buyer(s)', value: input.version.buyers.map(party => party.legalName).join('; ') },
    { label: 'Seller(s)', value: input.version.sellers.map(party => party.legalName).join('; ') },
  ];
  const addPageIfNeeded = (height: number): void => {
    if (pdf.y + height > NAVSTREET_PDF.contentBottom) {
      pdf.addPage(); pdf.y = NAVSTREET_PDF.contentTop;
    }
  };
  for (const row of [...parties, ...rows]) {
    pdf.font('NavStreet-Regular').fontSize(10);
    const fragments = summaryValueFragments(pdf, row.value || 'Not specified');
    for (const [fragmentIndex, value] of fragments.entries()) {
    const label = row.label + (fragmentIndex ? ' (continued)' : '');
    pdf.font('NavStreet-Regular').fontSize(10);
    const valueHeight = pdf.heightOfString(value, { width: 300, lineGap: 2 });
    pdf.font('NavStreet-Bold').fontSize(9);
    const height = Math.max(32, valueHeight + 14, pdf.heightOfString(label, { width: 196 }) + 14);
    addPageIfNeeded(height);
    const y = pdf.y;
    pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, height).fill(NAVSTREET_PDF.pale);
    pdf.font('NavStreet-Bold').fontSize(9).fillColor(NAVSTREET_PDF.blue)
      .text(label, NAVSTREET_PDF.margin + 10, y + 8, { width: 196 });
    pdf.font('NavStreet-Regular').fontSize(10).fillColor(NAVSTREET_PDF.ink)
      .text(value, NAVSTREET_PDF.margin + 216, y + 8, { width: 300, lineGap: 2 });
    pdf.y = y + height + 4;
    }
  }
  const notice = 'This page highlights selected terms for convenience. It does not replace or modify the complete agreement. Read all provisions and incorporated attachments. If this summary differs from the agreement’s operative provisions, those provisions control. Down payment excludes closing costs and is shown before deposit credits. Relative deadlines follow the agreement’s counting rules and any agreed extensions.';
  pdf.font('NavStreet-Regular').fontSize(9);
  addPageIfNeeded(pdf.heightOfString(notice, { width: NAVSTREET_PDF.contentWidth - 24, lineGap: 2 }) + 48);
  drawNavStreetNotice(pdf, 'Summary only — read the complete agreement', notice);
  const range = pdf.bufferedPageRange();
  for (let index = range.start; index < range.start + range.count; index++) {
    pdf.switchToPage(index);
    pdf.page.margins.bottom = 0;
    drawNavStreetPdfChrome(pdf, { stateName: property.state, referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber, pageNumber: index + 1, pageCount: range.count });
    pdf.font('NavStreet-Regular').fontSize(7).fillColor(NAVSTREET_PDF.teal)
      .text('Summary pages • Agreement pages follow with their original numbering', NAVSTREET_PDF.margin, 748,
        { width: NAVSTREET_PDF.contentWidth, lineBreak: false });
  }
  pdf.end();
  const cover = await MergePdfDocument.load(await completed);
  // Load the original rather than copying its pages, which would drop interactive form fields.
  const merged = await MergePdfDocument.load(agreement.buffer, { updateMetadata: false });
  const coverPages = await merged.copyPages(cover, cover.getPageIndices());
  coverPages.forEach((page, index) => merged.insertPage(index, page));
  return { ...agreement, buffer: Buffer.from(await merged.save({ updateFieldAppearances: false })),
    pageCount: merged.getPageCount() };
}

/** Reconstruct bundled WOFF1 tables once; each PDF still gets its own font object. */
function preparePdfFont(source: Buffer): Buffer {
  if (source.toString('ascii', 0, 4) !== 'wOFF') return source;
  const count = source.readUInt16BE(12);
  const tables = Array.from({ length: count }, (_, index) => {
    const position = 44 + index * 20;
    const tag = source.toString('ascii', position, position + 4);
    const offset = source.readUInt32BE(position + 4);
    const compressedLength = source.readUInt32BE(position + 8);
    const length = source.readUInt32BE(position + 12);
    const compressed = source.subarray(offset, offset + compressedLength);
    const bytes = compressedLength < length ? inflateSync(compressed) : compressed;
    if (bytes.length !== length) throw new Error('Invalid bundled PDF font table.');
    return { tag, bytes, checksum: source.readUInt32BE(position + 16) };
  });
  // Preserve signed font containers rather than invalidating their signatures.
  if (tables.some(table => table.tag === 'DSIG')) return source;
  const size = 12 + count * 16 + tables.reduce((sum, table) => sum + Math.ceil(table.bytes.length / 4) * 4, 0);
  const font = Buffer.alloc(size);
  font.writeUInt32BE(source.readUInt32BE(4), 0);
  font.writeUInt16BE(count, 4);
  const selector = Math.floor(Math.log2(count));
  const searchRange = 16 * 2 ** selector;
  font.writeUInt16BE(searchRange, 6);
  font.writeUInt16BE(selector, 8);
  font.writeUInt16BE(count * 16 - searchRange, 10);
  let offset = 12 + count * 16;
  let headOffset: number | undefined;
  tables.forEach((table, index) => {
    const position = 12 + index * 16;
    font.write(table.tag, position, 4, 'ascii');
    font.writeUInt32BE(table.checksum, position + 4);
    font.writeUInt32BE(offset, position + 8);
    font.writeUInt32BE(table.bytes.length, position + 12);
    table.bytes.copy(font, offset);
    if (table.tag === 'head') {
      headOffset = offset;
      font.writeUInt32BE(0, offset + 8);
    }
    offset += Math.ceil(table.bytes.length / 4) * 4;
  });
  if (headOffset !== undefined) {
    let checksum = 0;
    for (let position = 0; position < font.length; position += 4) {
      checksum = (checksum + font.readUInt32BE(position)) >>> 0;
    }
    font.writeUInt32BE((0xB1B0AFBA - checksum) >>> 0, headOffset + 8);
  }
  return font;
}
/** A large party group or summary value must stay inside each summary page. */
function summaryValueFragments(pdf: PDFKit.PDFDocument, value: string): string[] {
  pdf.font('NavStreet-Regular').fontSize(10);
  const pageCapacity = NAVSTREET_PDF.contentBottom - NAVSTREET_PDF.contentTop - 20;
  const availableCapacity = Math.max(80, NAVSTREET_PDF.contentBottom - pdf.y - 20);
  return paginatePdfText(pdf, value, 300, Math.min(pageCapacity, availableCapacity), 2);
}
