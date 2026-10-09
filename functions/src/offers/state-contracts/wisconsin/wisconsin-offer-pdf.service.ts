import { formatTimestamp } from '../property-time-format';
import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; the Wisconsin condition report remains a separate attachment. */
export async function generateWisconsinOfferPdf(input: GenerateStateAgreementInput<WisconsinOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, Wisconsin, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
  registerNavStreetPdfFonts(pdf);
  const chunks: Buffer[] = [];
  pdf.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => { pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject); });
  function page(title: string): void {
    pdf.addPage();
    pdf.y = NAVSTREET_PDF.contentTop;
    drawNavStreetSectionBar(pdf, title);
  }
  function line(label: string, value: unknown): void {
    const text = String(value ?? 'Not specified');
    pdf.font('NavStreet-Regular').fontSize(9);
    const height = Math.max(27, pdf.heightOfString(text || ' ', { width: 324, lineGap: 2 }) + 12);
    if (pdf.y + height > NAVSTREET_PDF.contentBottom) page('Parties and property (continued)');
    const y = pdf.y;
    pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, height - 2).fill(NAVSTREET_PDF.pale);
    pdf.font('NavStreet-Bold').fillColor(NAVSTREET_PDF.ink).fontSize(9)
      .text(label, NAVSTREET_PDF.margin + 10, y + 7, { width: 170, characterSpacing: 0 });
    pdf.font('NavStreet-Regular').fillColor(NAVSTREET_PDF.ink).fontSize(9)
      .text(text || ' ', NAVSTREET_PDF.margin + 192, y + 7, { width: 324, lineGap: 2, characterSpacing: 0 });
    pdf.y = y + height;
  }
  function clause(label: string, body: string): void {
    pdf.font('NavStreet-Regular').fontSize(9.5);
    const bodyHeight = pdf.heightOfString(body, { width: 502, lineGap: 2.5 });
    if (pdf.y + bodyHeight + 42 > NAVSTREET_PDF.contentBottom)
      page('Wisconsin agreement (continued)');
    const y = pdf.y + 8;
    pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, 20).fill(NAVSTREET_PDF.blue);
    pdf.font('NavStreet-Bold').fillColor('#FFFFFF').fontSize(8.5)
      .text(label.toUpperCase(), NAVSTREET_PDF.margin + 10, y + 5,
        { width: NAVSTREET_PDF.contentWidth - 20, characterSpacing: 0.3 });
    pdf.y = y + 29;
    pdf.font('NavStreet-Regular').fillColor(NAVSTREET_PDF.ink).fontSize(9.5)
      .text(body, NAVSTREET_PDF.margin + 10, pdf.y,
        { width: NAVSTREET_PDF.contentWidth - 20, lineGap: 2.5, characterSpacing: 0 });
    pdf.y += 8;
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  pdf.y = NAVSTREET_PDF.contentTop;
  drawNavStreetNotice(pdf, 'Important agreement', 'This is the buyer’s offer to purchase the property. It becomes the parties’ agreement when the required signatures are complete and acceptance is communicated. Wisconsin seller disclosures and supplements remain separate documents. The parties should consult an independent Wisconsin real estate attorney if they have questions.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Wisconsin', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Agreement and price', `The identified buyer offers to purchase, and the identified seller agrees to convey, the property described above for ${money(t.purchase.purchasePriceInCents)} under this version after all required parties sign. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. Parties may change terms only through a new written version signed by the required parties.`);
  clause('2. Earnest money and financing', `Buyer will deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after acceptance. Additional deposit selected: ${answer(t.conditions.additionalEarnestMoney)}; amount: ${money(t.purchase.additionalEarnestMoneyInCents)}. Funding: ${t.purchase.financingType}; anticipated loan: ${money(t.purchase.loanAmountInCents)}. The holder must handle the funds under the parties’ escrow instructions and applicable law.`);
  clause('3. Property and included items', `Additional included items: ${t.propertyItems.included || 'None specified'}. Excluded items: ${t.propertyItems.excluded || 'None specified'}. Installed fixtures included: ${answer(t.propertyItems.fixturesIncluded)}. Leased equipment and proposed assumption terms: ${t.propertyItems.leasedItemsDescription || 'None specified'}. No lease passes to buyer unless the holder and parties approve any necessary assignment in writing.`);
  page('Conditions and contract dates');
  clause('4. Express conditions', `Buyer due diligence: ${answer(t.conditions.dueDiligence)}. Appraisal: ${answer(t.conditions.appraisal)}. Financing: ${answer(t.conditions.financing)}. Sale of buyer’s property: ${answer(t.conditions.saleOfBuyersProperty)}. Any condition selected Yes must be satisfied or waived in writing by the applicable deadline. The parties should attach detailed terms for a sale-of-property condition before signing.`);
  clause('5. Contract dates', `Additional seller document deadline: ${t.deadlines.sellerDisclosureDate}. Due diligence deadline: ${t.conditions.dueDiligence ? t.deadlines.dueDiligenceDate : 'Not applicable'}. Financing and appraisal deadline: ${t.conditions.financing || t.conditions.appraisal ? t.deadlines.financingAppraisalDate : 'Not applicable'}. Settlement deadline: ${t.deadlines.settlementDate}. A stated deadline ends at 5:00 p.m. Wisconsin local time on its calendar date unless the parties agree otherwise in writing. The Wisconsin condition report is subject to the applicable statutory delivery requirements in Wis. Stat. ch. 709; this additional-document date does not extend those requirements.`);
  clause('6. Title, settlement, and delivery', 'Seller will deliver marketable title by a deed suitable for recording, subject to recorded easements and restrictions accepted in writing by buyer. The parties will complete settlement through a mutually selected Wisconsin title or escrow provider by the settlement deadline. Property taxes, periodic association dues, and utilities are prorated at settlement unless the parties sign different instructions. Risk of material loss before recording stays with seller; a material loss will be resolved in a written amendment or by termination under applicable law.');
  clause('7. Possession and charges', `Possession: ${t.settlement.possession === 'at_recording' ? 'at recording' : `${t.settlement.possessionDelay} ${t.settlement.possession === 'hours_after' ? 'hours' : 'days'} after recording`}. Pre-settlement special assessments: ${t.settlement.specialAssessmentPayer}. Association transfer fees, if applicable: ${t.settlement.hoaTransferFeePayer}. Seller will maintain the property in substantially the condition present at acceptance, ordinary wear excepted, until possession.`);
  clause('8. Inspection and requested repairs', 'Buyer may inspect the property at reasonable times through any selected due diligence deadline. Any requested repair, credit, cancellation, or extension must be communicated in a dated written notice before the controlling deadline. An agreement to perform repairs must identify the work and its completion date in writing.');
  page('Disclosures and communications');
  const conditionReportStatement = t.disclosures.propertyConditionStatus === 'received'
    ? 'Buyer states that the separate, seller-signed Wisconsin real estate condition report was received and reviewed before signing this offer.'
    : 'Buyer has not yet received the separate, seller-signed Wisconsin real estate condition report and does not acknowledge its receipt or review. Seller must furnish the report within the applicable period under Wis. Stat. § 709.02, where chapter 709 applies. This statement does not waive the buyer’s statutory rights, including applicable rescission rights under chapter 709. Delivery and receipt after acceptance must be documented separately.';
  clause('9. Wisconsin condition report and other disclosures', `${conditionReportStatement} Seller reports that existing leases affect the property: ${answer(t.disclosures.sellerReportsExistingLeases)}. Buyer acknowledges reviewing that lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. Lead-based paint packet: ${t.disclosures.leadPaintStatus}. Buyer’s lead inspection choice: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : 'buyer waived' : 'not applicable'}. Association documents: ${t.disclosures.hoaDocumentsStatus}. Any signed lead packet, available lead records and EPA pamphlet, and any separately identified association documents are delivered separately; these summary entries do not replace those documents or statutory rights.`);
  clause('10. Default and resolution', 'If either party fails to perform a material obligation, the other may give written notice and exercise available remedies under Wisconsin law, including any applicable right to seek performance, damages, or return of earnest money. The parties should obtain independent advice about the choice and timing of a remedy. The escrow holder will disburse disputed funds only under mutually signed instructions, a court order, or applicable law.');
  clause('11. Notices, signatures, and expiration', `The parties authorize electronic delivery and electronic signatures: ${answer(t.delivery.electronicDeliveryAuthorized)}. This version expires ${t.delivery.expiresAt} unless all required initiating signatures and delivery occur before that time. Acceptance requires all required parties to sign the same immutable version; a counteroffer creates a new version and the prior version does not carry signatures. The effective date is the final required signature timestamp recorded for the accepted version.`);
  clause('12. Other agreed terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement', 'This signed version and any separately identified signed attachments constitute the parties’ agreement. Changes require another signed written version. Each party acknowledges the opportunity to consult an independent Wisconsin real estate attorney and to review any applicable disclosure and supplement before signing.');
  page('Version signatures');
  const requiredParties = [...input.version.buyers, ...input.version.sellers].filter(party => party.requiredSigner);
  const allSigned = requiredParties.length > 0 && requiredParties.every(party =>
    party.signature.status === 'signed' && party.signature.signedAt);
  line('Document status', input.documentStatus === 'approved' && allSigned
    ? 'Final accepted version' : 'Offer version - signatures pending');
  line('Version created', formatTimestamp(input.version.createdAt?.toDate(), 'America/Chicago'));
  for (const [label, parties] of [['Buyers', input.version.buyers], ['Sellers', input.version.sellers]] as const) {
    pdf.moveDown();
    drawNavStreetSectionBar(pdf, label);
    for (const party of parties) {
      if (pdf.y > 590) page('Version signatures (continued)');
      const signed = party.signature.status === 'signed' && party.signature.signedAt;
      line('Party', party.legalName);
      line('Electronic signature', signed ? `/s/ ${party.legalName}` : 'Awaiting signature');
      line('Signed (property time)', signed ? formatTimestamp(party.signature.signedAt?.toDate(), 'America/Chicago') : 'Pending');
      pdf.y += 6;
    }
  }
  if (input.documentStatus === 'approved' && allSigned) {
    const signed = [...input.version.buyers, ...input.version.sellers].filter(p => p.requiredSigner).map(p => p.signature.signedAt?.toDate()).filter((v): v is Date => Boolean(v));
    if (signed.length) line('Effective signature time (property time)', formatTimestamp(new Date(Math.max(...signed.map(d => d.getTime()))), 'America/Chicago'));
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    // Footer text is outside the body margin; keep it on the current page.
    pdf.page.margins.bottom = 0;
    drawNavStreetPdfChrome(pdf, {
      stateName: 'Wisconsin',
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-WI-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
