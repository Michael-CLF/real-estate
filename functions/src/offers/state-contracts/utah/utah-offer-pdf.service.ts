import PDFDocument from 'pdfkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SVGtoPDF from 'svg-to-pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';

const BLUE = '#154360';
const TEAL = '#1F7A8C';
const INK = '#1B2A34';
const PALE = '#EDF5F7';
const ASSETS = join(__dirname, '../../../../');
const LOGO = readFileSync(join(ASSETS, 'assets/navstreet-transparent.svg'), 'utf8');
const FONT = join(ASSETS, 'node_modules/@fontsource/barlow/files');

/** Renders original NavStreet contract text. No Utah Association form or REPC pages are reproduced. */
export async function generateUtahOfferPdf(input: GenerateStateAgreementInput<UtahOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  if (input.documentStatus === 'approved' &&
      [...input.version.buyers, ...input.version.sellers].some(party =>
        party.requiredSigner && (party.signature.status !== 'signed' || !party.signature.signedAt))) {
    throw new Error('A final Utah agreement requires an immutable signature timestamp for every required signer.');
  }
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: 104, left: 48, right: 48, bottom: 34 }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', CreationDate: input.generatedAt } });
  pdf.registerFont('Body', join(FONT, 'barlow-latin-400-normal.woff'));
  pdf.registerFont('Bold', join(FONT, 'barlow-latin-700-normal.woff'));
  const chunks: Buffer[] = [];
  pdf.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => { pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject); });
  function page(title: string): void { pdf.addPage(); pdf.y = 104; heading(title); }
  function heading(title: string): void {
    pdf.font('Bold').fillColor(BLUE).fontSize(15).text(title, 48, pdf.y, { width: 516 });
    pdf.moveDown(.8).font('Body').fillColor(INK).fontSize(10);
  }
  function line(label: string, value: unknown): void {
    const text = String(value ?? 'Not specified');
    pdf.font('Body').fontSize(10);
    const height = Math.max(28, pdf.heightOfString(text || ' ', { width: 318, lineGap: 3 }) + 15);
    if (pdf.y + height > 700) page('Agreement details (continued)');
    const y = pdf.y;
    pdf.rect(48, y, 516, height - 2).fill(PALE);
    pdf.font('Bold').fillColor(INK).fontSize(9.5).text(label, 58, y + 7, { width: 168 });
    pdf.font('Body').fillColor(INK).fontSize(10).text(text || ' ', 236, y + 7, { width: 318, lineGap: 3 });
    pdf.y = y + height;
  }
  function clause(label: string, body: string): void {
    pdf.font('Body').fontSize(10.3);
    const bodyHeight = pdf.heightOfString(body, { width: 492, lineGap: 3 });
    if (pdf.y + bodyHeight + 47 > 699) page('Utah purchase agreement (continued)');
    const y = pdf.y + 9;
    pdf.rect(48, y, 516, 22).fill(BLUE);
    pdf.font('Bold').fontSize(9).fillColor('#FFFFFF').text(label.toUpperCase(), 59, y + 6, { width: 494, characterSpacing: .45 });
    pdf.y = y + 31;
    pdf.font('Body').fontSize(10.3).fillColor(INK).text(body, 59, pdf.y, { width: 492, lineGap: 3 });
    pdf.y += 9;
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  heading('Parties, property and negotiated terms');
  const noticeY = pdf.y;
  pdf.roundedRect(48, noticeY, 516, 52, 4).lineWidth(.8).strokeColor(TEAL).stroke();
  pdf.font('Bold').fillColor(BLUE).fontSize(9).text('IMPORTANT AGREEMENT', 59, noticeY + 9, { width: 490 });
  pdf.font('Body').fillColor(INK).fontSize(9).text('This signed offer becomes the parties\' purchase agreement when all required parties accept the same version. Seller disclosures and supplements are separate documents. Review every term and consult a Utah real estate attorney as needed.', 59, noticeY + 22, { width: 490 });
  pdf.y = noticeY + 62;
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Utah', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Not supplied'}`);
  if (t.legalDescription.trim()) line('Seller-provided legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Agreement and price', `The identified buyer offers to purchase, and the identified seller agrees to convey, the property identified by the Utah listing address and county above for ${money(t.purchase.purchasePriceInCents)} under this version after all required parties sign. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. Confirm the recorded deed description with the title provider before closing. Parties may change terms only through a new written version signed by the required parties.`);
  clause('2. Earnest money and financing', `Buyer will deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after acceptance. Additional deposit selected: ${answer(t.conditions.additionalEarnestMoney)}; amount: ${money(t.purchase.additionalEarnestMoneyInCents)}. Funding: ${t.purchase.financingType}; anticipated loan: ${money(t.purchase.loanAmountInCents)}. The holder must handle the funds under the parties’ escrow instructions and applicable law.`);
  clause('3. Property and included items', `Additional included items: ${t.propertyItems.included || 'None specified'}. Excluded items: ${t.propertyItems.excluded || 'None specified'}. Water rights or shares included: ${answer(t.propertyItems.waterRightsIncluded)}. Specific excluded water rights or transfer instructions: ${t.propertyItems.excludedWaterRights || 'None specified'}. Any transfer of water rights requires its own legally sufficient conveyance.`);
  if (pdf.y > 605) page('Conditions and contract dates'); else heading('Conditions and contract dates');
  clause('4. Express conditions', `Buyer due diligence: ${answer(t.conditions.dueDiligence)}. Appraisal: ${answer(t.conditions.appraisal)}. Financing: ${answer(t.conditions.financing)}. Sale of buyer’s property: ${answer(t.conditions.saleOfBuyersProperty)}. Any condition selected Yes must be satisfied or waived in writing by the applicable deadline. The parties should attach detailed terms for a sale-of-property condition before signing.`);
  clause('5. Contract dates', `Seller disclosure deadline: ${t.deadlines.sellerDisclosureDate}. Due diligence deadline: ${t.conditions.dueDiligence ? t.deadlines.dueDiligenceDate : 'Not applicable'}. Financing and appraisal deadline: ${t.conditions.financing || t.conditions.appraisal ? t.deadlines.financingAppraisalDate : 'Not applicable'}. Settlement deadline: ${t.deadlines.settlementDate}. A stated deadline ends at 5:00 p.m. local property time (America/Denver) on its calendar date unless parties agree to a different time in writing.`);
  clause('6. Title, settlement, and delivery', 'Seller will deliver marketable title by a deed suitable for recording, subject to recorded easements and restrictions accepted in writing by buyer. The parties will complete settlement through a mutually selected Utah title or escrow provider by the settlement deadline. Property taxes, periodic association dues, and utilities are prorated at settlement unless the parties sign different instructions. Risk of material loss before recording stays with seller; a material loss will be resolved in a written amendment or by termination under applicable law.');
  clause('7. Possession and charges', `Possession: ${t.settlement.possession === 'at_recording' ? 'at recording' : `${t.settlement.possessionDelay} ${t.settlement.possession === 'hours_after' ? 'hours' : 'days'} after recording`}. Pre-settlement special assessments: ${t.settlement.specialAssessmentPayer}. Association transfer fees, if applicable: ${t.settlement.hoaTransferFeePayer}. Seller will maintain the property in substantially the condition present at acceptance, ordinary wear excepted, until possession.`);
  clause('8. Inspection and requested repairs', 'Buyer may inspect the property at reasonable times through any selected due diligence deadline. Any requested repair, credit, cancellation, or extension must be communicated in a dated written notice before the controlling deadline. An agreement to perform repairs must identify the work and its completion date in writing.');
  if (pdf.y > 605) page('Disclosures and communications'); else heading('Disclosures and communications');
  clause('9. Seller statements and association', `Seller property condition statement: ${t.disclosures.propertyConditionStatus}. Lead-based paint packet: ${t.disclosures.leadPaintStatus}. Buyer’s lead inspection option: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : 'buyer waived' : 'not applicable'}. Association documents: ${t.disclosures.hoaDocumentsStatus}. Seller reports known current methamphetamine contamination: ${answer(t.disclosures.sellerReportsCurrentMethContamination)}. Buyer acknowledges this statement: ${answer(t.disclosures.methamphetamineContaminationAcknowledged)}. The condition statement, lead packet, and governing documents are separately delivered when applicable; the labels here do not replace them. If the property was built before 1978, the federal disclosure packet, available records and pamphlet must be delivered before the buyer is bound, unless a federal exemption applies.`);
  clause('10. Default and resolution', 'If either party fails to perform a material obligation, the other may give written notice and exercise available remedies under Utah law, including any applicable right to seek performance, damages, or return of earnest money. The parties should obtain independent advice about the choice and timing of a remedy. The escrow holder will disburse disputed funds only under mutually signed instructions, a court order, or applicable law.');
  clause('11. Notices, signatures, and expiration', `The parties authorize electronic delivery and electronic signatures: ${answer(t.delivery.electronicDeliveryAuthorized)}. This version expires ${t.delivery.expiresAt} unless all required initiating signatures and delivery occur before that time. Acceptance requires all required parties to sign the same immutable version; a counteroffer creates a new version and the prior version does not carry signatures. The effective date is the final required signature timestamp recorded for the accepted version.`);
  clause('12. Other agreed terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement', 'This signed version and any separately identified signed attachments constitute the parties’ agreement. Changes require another signed written version. Each party acknowledges the opportunity to consult an independent Utah real estate attorney and to review any applicable disclosure and supplement before signing.');
  page('Version signatures');
  line('Document status', input.documentStatus === 'approved' ? 'Final accepted version' : 'Draft or delivered version');
  line('Version created', formatTimestamp(input.version.createdAt?.toDate(), 'America/Denver'));
  for (const [label, parties] of [['Buyers', input.version.buyers], ['Sellers', input.version.sellers]] as const) {
    pdf.moveDown(); pdf.font('Bold').fillColor(BLUE).fontSize(12).text(label); pdf.moveDown(.5).fontSize(9);
    for (const party of parties) {
      if (pdf.y > 580) page('Version signatures (continued)');
      const signed = party.signature.status === 'signed' && party.signature.signedAt;
      line('Party', party.legalName);
      line('Electronic signature', signed ? `/s/ ${party.legalName}` : '');
      line('Signed (property time)', signed ? formatTimestamp(party.signature.signedAt?.toDate(), 'America/Denver') : '');
      pdf.moveDown(.6);
    }
  }
  if (input.documentStatus === 'approved') {
    const signed = [...input.version.buyers, ...input.version.sellers].filter(p => p.requiredSigner).map(p => p.signature.signedAt?.toDate()).filter((v): v is Date => Boolean(v));
    if (signed.length) line('Effective signature time (property time)', formatTimestamp(new Date(Math.max(...signed.map(d => d.getTime()))), 'America/Denver'));
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    pdf.rect(36, 24, 540, 55).fill(BLUE);
    SVGtoPDF(pdf, LOGO, 44, 25, { width: 118, height: 46, preserveAspectRatio: 'xMidYMid meet' });
    pdf.font('Bold').fillColor('#FFFFFF').fontSize(11).text('UTAH RESIDENTIAL PURCHASE\nAND SALE AGREEMENT', 181, 33, { width: 365, lineGap: 1.5, characterSpacing: .55 });
    pdf.font('Body').fontSize(7.5).text(`Offer ${input.offer.referenceNumber}  |  Version ${input.version.versionNumber}`, 181, 64, { width: 360 });
    pdf.moveTo(48, 721).lineTo(564, 721).lineWidth(.5).strokeColor('#BDD0D8').stroke();
    pdf.font('Body').fillColor(TEAL).fontSize(8).text(`NavStreet  |  ${input.offer.referenceNumber}  |  Version ${input.version.versionNumber}`, 48, 728, { width: 380, lineBreak: false });
    pdf.text(`Page ${index + 1} of ${pageCount}`, 474, 728, { width: 90, align: 'right', lineBreak: false });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-UT-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
function formatTimestamp(date: Date | undefined, timeZone: string): string {
  return date ? new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date) : '';
}
