import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import PDFKitDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { PDFDocument, PDFForm, StandardFonts } from 'pdf-lib';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';
import { OREC_RESIDENTIAL_SALE_TEMPLATE } from './contracts/residential-sale/orec-residential-sale-template';

type OklahomaAgreementInput = GenerateStateAgreementInput<OklahomaOfferTermsDocument>;

export async function generateOklahomaOfferPdf(input: OklahomaAgreementInput): Promise<GeneratedStateAgreement> {
  const terms = requireSupportedTerms(input.version.terms);
  const templateBytes = await loadVerifiedTemplate();
  const pdf = await PDFDocument.load(templateBytes, { updateMetadata: false });
  if (pdf.getPageCount() !== OREC_RESIDENTIAL_SALE_TEMPLATE.pageCount) {
    throw new Error('The OREC Residential Sale template page count is invalid.');
  }

  const form = pdf.getForm();
  populateOfficialForm(form, terms, input.version.buyers, input.version.sellers);
  const appearanceFont = await pdf.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(appearanceFont);

  const coverBytes = await generateNavStreetCover(input, terms);
  const coverDocument = await PDFDocument.load(coverBytes);
  const [coverPage] = await pdf.copyPages(coverDocument, [0]);
  pdf.insertPage(0, coverPage);

  pdf.setTitle(input.documentTitle);
  pdf.setAuthor('NavStreet');
  pdf.setSubject(`${OREC_RESIDENTIAL_SALE_TEMPLATE.formName} - ${input.documentStatus}`);
  pdf.setProducer('NavStreet');
  pdf.setCreator('NavStreet');
  pdf.setCreationDate(input.generatedAt);
  pdf.setModificationDate(input.generatedAt);

  const bytes = await pdf.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  return {
    buffer: Buffer.from(bytes),
    fileName: `NS-OK-${sanitizeFilePart(input.offer.referenceNumber)}-v${input.version.versionNumber}-orec-residential-sale.pdf`,
    pageCount: pdf.getPageCount(),
  };
}

function populateOfficialForm(
  form: PDFForm,
  terms: OklahomaOfferTermsDocument,
  buyers: OfferVersionPartySnapshotDocument[],
  sellers: OfferVersionPartySnapshotDocument[]
): void {
  const propertyIdentifier = `${terms.property.addressLine1}, ${terms.property.city}, OK ${terms.property.zipCode}`;
  OREC_RESIDENTIAL_SALE_TEMPLATE.propertyIdentifierFields.forEach(name => setText(form, name, propertyIdentifier));

  check(form, 'Check Box 57', terms.disclosures.inHouseBrokerageServices);
  const propertyDisclosureChecks: Readonly<Record<string, string>> = {
    disclosure_received: 'Check Box 58', disclaimer_received: 'Check Box 94',
    exempt: 'Check Box 60', not_required: 'Check Box 61',
  };
  checkSelected(form, propertyDisclosureChecks, terms.disclosures.propertyConditionStatus);
  const leadChecks: Readonly<Record<string, string>> = {
    received: 'Check Box 62', built_1978_or_later: 'Check Box 63', not_residential: 'Check Box 64',
  };
  checkSelected(form, leadChecks, terms.disclosures.leadBasedPaintStatus);
  check(form, 'Check Box 65', terms.disclosures.inHouseBrokerageServices);
  setPartyNames(form, ['Text Field 33', 'Text Field 34'], buyers);
  setPartyNames(form, ['Text Field 39', 'Text Field 40'], sellers);

  const selectedDocuments = new Set(terms.contractDocuments);
  Object.entries(OREC_RESIDENTIAL_SALE_TEMPLATE.contractDocumentCheckboxes)
    .forEach(([value, field]) => check(form, field, selectedDocuments.has(value)));

  setText(form, 'Text Field 72', formatPartyNames(sellers));
  setText(form, 'Text Field 73', formatPartyNames(buyers));
  setText(form, 'Text Field 75', terms.property.county);
  setText(form, 'Text Field 74', terms.legalDescription);
  setText(form, 'Text Field 69', [terms.property.addressLine1, terms.property.addressLine2].filter(Boolean).join(', '));
  setText(form, 'Text Field 70', terms.property.city);
  setText(form, 'Text Field 71', terms.property.zipCode);
  setText(form, 'Text Field 76', moneyWithoutSymbol(terms.purchase.purchasePriceInCents));
  setText(form, 'Text Field 77', moneyWithoutSymbol(terms.purchase.earnestMoneyInCents));
  setSplitText(form, ['Text Field 78', 'Text Field 79'], terms.purchase.trustAccountHolder, 42);
  setText(form, 'Text Field 80', formatContractDate(terms.closing.closingDate));

  setText(form, 'Text Field 90', terms.closing.possessionTerms);
  setSplitText(form, ['Text Field 87', 'Text Field 88'], terms.accessories.additionalInclusions, 110);
  setSplitText(form, ['Text Field 173', 'Text Field 89'], terms.accessories.exclusions, 85);
  setText(form, 'Text Field 91', formatContractDate(terms.timePeriods.referenceDate));
  setText(form, 'Text Field 92', String(terms.timePeriods.inspectionDays));
  setText(form, 'Text Field 99', terms.timePeriods.additionalInvestigations);
  setText(form, 'Text Field 100', String(terms.timePeriods.trrNegotiationDays));

  check(form, 'Check Box 82', terms.title.evidenceSelection === 'title_insurance_commitment');
  check(form, 'Check Box 83', terms.title.evidenceSelection === 'attorney_title_opinion');
  check(form, 'Check Box 84', terms.title.surveySelection === 'mortgage_inspection_report');
  check(form, 'Check Box 85', terms.title.surveySelection === 'pin_stake_boundary_survey');
  check(form, 'Check Box 86', terms.title.surveySelection === 'none_unless_required');
  check(form, 'Check Box 87', terms.title.surveyExpensePayer === 'buyer');
  check(form, 'Check Box 88', terms.title.surveyExpensePayer === 'seller');
  setText(form, 'Text Field 107', String(terms.timePeriods.titleCureDelayDays));

  check(form, 'Check Box 89', terms.serviceAgreement.selection === 'none');
  check(form, 'Check Box 90', terms.serviceAgreement.selection === 'seller_existing_transfer');
  check(form, 'Check Box 91', terms.serviceAgreement.selection === 'buyer_selected');
  setText(form, 'Text Field 108', terms.serviceAgreement.selection === 'buyer_selected' ? moneyWithoutSymbol(terms.serviceAgreement.approximateCostInCents) : '');
  setText(form, 'Text Field 109', terms.serviceAgreement.selection === 'buyer_selected' ? moneyWithoutSymbol(terms.serviceAgreement.sellerContributionInCents) : '');
  setSplitText(form, ['Text Field 116', 'Text Field 117', 'Text Field 118', 'Text Field 119'], terms.additionalProvisions.included ? terms.additionalProvisions.partyProvidedText : '', 105);

  const expiration = formatExpiration(terms.delivery.expiresAt, terms.delivery.timeZone);
  setText(form, 'Text Field 130', expiration.date);
  setText(form, 'Text Field 131', expiration.time);
  check(form, 'Check Box 92', expiration.meridiem === 'AM');
  check(form, 'Check Box 93', expiration.meridiem === 'PM');

setPartyNames(
  form,
  [
    'Text Field 142',
    'Text Field 146',
    'Text Field 150',
  ],
  sellers
);

setPartyDates(
  form,
  [
    'Text Field 143',
    'Text Field 147',
    'Text Field 151',
  ],
  buyers,
  terms.delivery.timeZone
);

setPartyDates(
  form,
  [
    'Text Field 144',
    'Text Field 148',
    'Text Field 152',
  ],
  sellers,
  terms.delivery.timeZone
);
}

async function generateNavStreetCover(
  input: OklahomaAgreementInput,
  terms: OklahomaOfferTermsDocument
): Promise<Buffer> {
  const document = new PDFKitDocument({ size: 'LETTER', margin: 0, autoFirstPage: true });
  document.registerFont('NavStreet-Regular', join(__dirname, '../../../../node_modules/@fontsource/barlow/files/barlow-latin-400-normal.woff'));
  document.registerFont('NavStreet-Bold', join(__dirname, '../../../../node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff'));
  const chunks: Buffer[] = [];
  document.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolveBuffer, reject) => {
    document.on('end', () => resolveBuffer(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  const logoSvg = await readFile(resolveBrandAssetPath(), 'utf8');

  document.rect(0, 0, 612, 118).fill('#154360');
  SVGtoPDF(document, logoSvg, 42, 18, {
    width: 170,
    height: 68,
    preserveAspectRatio: 'xMidYMid meet',
  });
  document.fillColor('#FFFFFF').font('NavStreet-Regular').fontSize(19)
    .text('Oklahoma Residential Offer Package', 232, 35, { width: 332 });
  document.fillColor('#D6E8F0').fontSize(10)
    .text(`Offer ${input.offer.referenceNumber} - Version ${input.version.versionNumber}`, 232, 72, { width: 332 });

  let y = 154;
  const field = (label: string, value: string): void => {
    document.fillColor('#596F7B').font('NavStreet-Bold').fontSize(8).text(label.toUpperCase(), 48, y + 2, { width: 126, characterSpacing: 0.8 });
    document.fillColor('#142E3B').font('NavStreet-Regular').fontSize(11).text(value || 'Not provided', 190, y, { width: 374, height: 28, ellipsis: true });
    document.moveTo(48, y + 31).lineTo(564, y + 31).lineWidth(0.5).strokeColor('#D5E0E5').stroke();
    y += 48;
  };
  field('Property', `${terms.property.addressLine1}, ${terms.property.city}, OK ${terms.property.zipCode}`);
  field('Purchase price', formatMoney(terms.purchase.purchasePriceInCents));
  field('Earnest money', `${formatMoney(terms.purchase.earnestMoneyInCents)} - due within 3 days after full execution`);
  field('Trust-account holder', terms.purchase.trustAccountHolder);
  field('Inspection period', `${terms.timePeriods.inspectionDays} days after the Time Reference Date`);
  field('Closing date', formatContractDate(terms.closing.closingDate));
  field('Offer expires', `${formatExpiration(terms.delivery.expiresAt, terms.delivery.timeZone).display} Central Time`);

  document.roundedRect(48, 600, 516, 106, 4).fillAndStroke('#F2F7F9', '#B8CDD7');
  document.fillColor('#154360').font('NavStreet-Bold').fontSize(12).text('About this package', 64, 620);
  document.fillColor('#30434D').font('NavStreet-Regular').fontSize(9).text(
    'This NavStreet cover is a convenience summary. The binding agreement is the unchanged official OREC Residential Sale form and any selected official supplements that follow. If this summary conflicts with the agreement, the official contract controls. NavStreet provides technology for direct buyer-seller transactions and is not acting as a real estate broker or law firm.',
    64, 642, { width: 484, lineGap: 2 }
  );
  document.fillColor('#61727C').fontSize(8).text(`Prepared ${input.generatedAt.toISOString().slice(0, 10)} - ${input.documentStatus}`, 48, 748);
  document.end();
  return completed;
}

function setText(form: PDFForm, name: string, value: string): void {
  form.getTextField(name).setText(value ?? '');
}
function check(form: PDFForm, name: string, selected: boolean): void {
  const field = form.getCheckBox(name); selected ? field.check() : field.uncheck();
}
function checkSelected(form: PDFForm, fields: Readonly<Record<string, string>>, value: string): void {
  Object.entries(fields).forEach(([choice, name]) => check(form, name, choice === value));
}
function setPartyNames(form: PDFForm, fields: readonly string[], parties: readonly OfferVersionPartySnapshotDocument[]): void {
  fields.forEach((field, index) => setText(form, field, parties[index]?.legalName ?? ''));
}
function setPartyDates(
  form: PDFForm,
  fields: readonly string[],
  parties: readonly OfferVersionPartySnapshotDocument[],
  timeZone: string
): void {
  fields.forEach((field, index) => {
    const signedAt =
      parties[index]?.signature.signedAt;

    setText(
      form,
      field,
      signedAt
        ? formatSignatureDate(
          signedAt.toDate(),
          timeZone
        )
        : ''
    );
  });
}
function formatPartyNames(parties: readonly OfferVersionPartySnapshotDocument[]): string {
  return parties.map(party => party.legalName).join('; ');
}
function setSplitText(form: PDFForm, fields: readonly string[], value: string, maximumPerField: number): void {
  const remainingWords = value.trim().split(/\s+/).filter(Boolean);
  fields.forEach(field => {
    let line = '';
    while (remainingWords.length) {
      const candidate = line ? `${line} ${remainingWords[0]}` : remainingWords[0];
      if (candidate.length > maximumPerField && line) break;
      line = candidate; remainingWords.shift();
    }
    setText(form, field, line);
  });
}
function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
function moneyWithoutSymbol(cents: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100);
}
function formatContractDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); return match ? `${match[2]}/${match[3]}/${match[1]}` : '';
}
function formatSignatureDate(
  value: Date,
  timeZone: string
): string {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }
  ).format(value);
}
function formatExpiration(value: string, timeZone: string): { date: string; time: string; meridiem: 'AM' | 'PM'; display: string } {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(candidate => candidate.type === type)?.value ?? '';
  const meridiem = part('dayPeriod').toUpperCase() === 'PM' ? 'PM' : 'AM';
  const dateValue = `${part('month')}/${part('day')}/${part('year')}`;
  const time = `${part('hour')}:${part('minute')}`;
  return { date: dateValue, time, meridiem, display: `${dateValue} at ${time} ${meridiem}` };
}
function requireSupportedTerms(terms: OklahomaOfferTermsDocument): OklahomaOfferTermsDocument {
  if (terms.stateCode !== 'OK' || terms.contractType !== 'residential_sale_2026' || terms.form.formId !== 'OREC-RESIDENTIAL-SALE-2026') throw new Error('The Oklahoma agreement generator received unsupported contract terms.');
  return terms;
}
async function loadVerifiedTemplate(): Promise<Uint8Array> {
  const path = resolveTemplatePath(); const bytes = await readFile(path);
  if (createHash('sha256').update(bytes).digest('hex') !== OREC_RESIDENTIAL_SALE_TEMPLATE.sha256) throw new Error('The OREC Residential Sale template failed its integrity check.');
  return bytes;
}
function resolveTemplatePath(): string {
  const relative = OREC_RESIDENTIAL_SALE_TEMPLATE.assetRelativePath;
  const candidates = [resolve(process.cwd(), relative), resolve(__dirname, '../../../..', relative)];
  const path = candidates.find(candidate => existsSync(candidate));
  if (!path) throw new Error(`The OREC template asset is missing. Expected ${relative}.`);
  return path;
}
function resolveBrandAssetPath(): string {
  const relative = 'assets/navstreet-transparent.svg';
  const candidates = [resolve(process.cwd(), relative), resolve(__dirname, '../../../..', relative)];
  const path = candidates.find(candidate => existsSync(candidate));
  if (!path) throw new Error(`The NavStreet logo asset is missing. Expected ${relative}.`);
  return path;
}
function sanitizeFilePart(value: string): string { return value.replace(/[^A-Za-z0-9_-]/g, '-'); }
