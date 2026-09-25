import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';

/** Renders NavStreet-authored terms; the Wisconsin condition report remains a separate attachment. */
export async function generateWisconsinOfferPdf(input: GenerateStateAgreementInput<WisconsinOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const pdf = new PDFDocument({ size: 'LETTER', margin: 48, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', CreationDate: input.generatedAt } });
  const chunks: Buffer[] = [];
  pdf.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve, reject) => { pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject); });
  function page(title: string): void { pdf.addPage(); heading(title); }
  function heading(title: string): void {
    pdf.font('Helvetica-Bold').fillColor('#154360').fontSize(16).text(title);
    pdf.moveDown(.5).font('Helvetica').fillColor('#303942').fontSize(9);
  }
  function line(label: string, value: unknown): void {
    if (value === '') {
      pdf.font('Helvetica-Bold').text(`${label}:`);
      pdf.moveDown(.3);
      return;
    }
    pdf.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    pdf.font('Helvetica').text(String(value ?? 'Not specified')); pdf.moveDown(.3);
  }
  function clause(label: string, body: string): void {
    if (pdf.y > 645) page('NavStreet Wisconsin residential agreement (continued)');
    pdf.font('Helvetica-Bold').text(label); pdf.font('Helvetica').text(body, { lineGap: 2 }); pdf.moveDown(.65);
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  heading('NavStreet Wisconsin Residential Purchase and Sale Agreement');
  pdf.fontSize(8).text(`Offer ${input.offer.referenceNumber} · Version ${input.version.versionNumber} · Version UID ${input.version.Uid}`);
  pdf.text('NavStreet-authored agreement; seller disclosures and supplements are separate documents.');
  pdf.moveDown(); pdf.fontSize(9);
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Wisconsin', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Agreement and price', `The identified buyer offers to purchase, and the identified seller agrees to convey, the property described above for ${money(t.purchase.purchasePriceInCents)} under this version after all required parties sign. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. Parties may change terms only through a new written version signed by the required parties.`);
  clause('2. Earnest money and financing', `Buyer will deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after acceptance. Additional deposit selected: ${answer(t.conditions.additionalEarnestMoney)}; amount: ${money(t.purchase.additionalEarnestMoneyInCents)}. Funding: ${t.purchase.financingType}; anticipated loan: ${money(t.purchase.loanAmountInCents)}. The holder must handle the funds under the parties’ escrow instructions and applicable law.`);
  clause('3. Property and included items', `Additional included items: ${t.propertyItems.included || 'None specified'}. Excluded items: ${t.propertyItems.excluded || 'None specified'}. Installed fixtures included: ${answer(t.propertyItems.fixturesIncluded)}. Leased equipment and proposed assumption terms: ${t.propertyItems.leasedItemsDescription || 'None specified'}. No lease passes to buyer unless the holder and parties approve any necessary assignment in writing.`);
  page('Conditions and contract dates');
  clause('4. Express conditions', `Buyer due diligence: ${answer(t.conditions.dueDiligence)}. Appraisal: ${answer(t.conditions.appraisal)}. Financing: ${answer(t.conditions.financing)}. Sale of buyer’s property: ${answer(t.conditions.saleOfBuyersProperty)}. Any condition selected Yes must be satisfied or waived in writing by the applicable deadline. The parties should attach detailed terms for a sale-of-property condition before signing.`);
  clause('5. Contract dates', `Additional seller document deadline: ${t.deadlines.sellerDisclosureDate}. Due diligence deadline: ${t.conditions.dueDiligence ? t.deadlines.dueDiligenceDate : 'Not applicable'}. Financing and appraisal deadline: ${t.conditions.financing || t.conditions.appraisal ? t.deadlines.financingAppraisalDate : 'Not applicable'}. Settlement deadline: ${t.deadlines.settlementDate}. A stated deadline ends at 5:00 p.m. Wisconsin local time on its calendar date unless the parties agree otherwise in writing. The additional seller document date does not defer delivery of the Wisconsin condition report acknowledged below.`);
  clause('6. Title, settlement, and delivery', 'Seller will deliver marketable title by a deed suitable for recording, subject to recorded easements and restrictions accepted in writing by buyer. The parties will complete settlement through a mutually selected Wisconsin title or escrow provider by the settlement deadline. Property taxes, periodic association dues, and utilities are prorated at settlement unless the parties sign different instructions. Risk of material loss before recording stays with seller; a material loss will be resolved in a written amendment or by termination under applicable law.');
  clause('7. Possession and charges', `Possession: ${t.settlement.possession === 'at_recording' ? 'at recording' : `${t.settlement.possessionDelay} ${t.settlement.possession === 'hours_after' ? 'hours' : 'days'} after recording`}. Pre-settlement special assessments: ${t.settlement.specialAssessmentPayer}. Association transfer fees, if applicable: ${t.settlement.hoaTransferFeePayer}. Seller will maintain the property in substantially the condition present at acceptance, ordinary wear excepted, until possession.`);
  clause('8. Inspection and requested repairs', 'Buyer may inspect the property at reasonable times through any selected due diligence deadline. Any requested repair, credit, cancellation, or extension must be communicated in a dated written notice before the controlling deadline. An agreement to perform repairs must identify the work and its completion date in writing.');
  page('Disclosures and communications');
  clause('9. Wisconsin condition report and other disclosures', `Buyer acknowledges receipt of the separate, seller-signed Wisconsin real estate condition report: ${t.disclosures.propertyConditionStatus}. Seller reports that existing leases affect the property: ${answer(t.disclosures.sellerReportsExistingLeases)}. Buyer has reviewed the report and lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. Lead-based paint packet: ${t.disclosures.leadPaintStatus}. Buyer’s lead inspection choice: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : 'buyer waived' : 'not applicable'}. Association documents: ${t.disclosures.hoaDocumentsStatus}. The statutory report, any signed lead packet, available lead records and EPA pamphlet, and any separately identified association documents are delivered separately; these summary entries do not replace those documents or statutory rescission rights.`);
  clause('10. Default and resolution', 'If either party fails to perform a material obligation, the other may give written notice and exercise available remedies under Wisconsin law, including any applicable right to seek performance, damages, or return of earnest money. The parties should obtain independent advice about the choice and timing of a remedy. The escrow holder will disburse disputed funds only under mutually signed instructions, a court order, or applicable law.');
  clause('11. Notices, signatures, and expiration', `The parties authorize electronic delivery and electronic signatures: ${answer(t.delivery.electronicDeliveryAuthorized)}. This version expires ${t.delivery.expiresAt} unless all required initiating signatures and delivery occur before that time. Acceptance requires all required parties to sign the same immutable version; a counteroffer creates a new version and the prior version does not carry signatures. The effective date is the final required signature timestamp recorded for the accepted version.`);
  clause('12. Other agreed terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement', 'This signed version and any separately identified signed attachments constitute the parties’ agreement. Changes require another signed written version. Each party acknowledges the opportunity to consult an independent Wisconsin real estate attorney and to review any applicable disclosure and supplement before signing.');
  page('Version signatures');
  line('Document status', input.documentStatus === 'approved' ? 'Final accepted version' : 'Draft or delivered version');
  line('Version created', formatTimestamp(input.version.createdAt?.toDate(), 'America/Chicago'));
  for (const [label, parties] of [['Buyers', input.version.buyers], ['Sellers', input.version.sellers]] as const) {
    pdf.moveDown(); pdf.font('Helvetica-Bold').fontSize(12).text(label); pdf.moveDown(.5).fontSize(9);
    for (const party of parties) {
      if (pdf.y > 690) page('Version signatures (continued)');
      const signed = party.signature.status === 'signed' && party.signature.signedAt;
      line('Party', party.legalName);
      line('Electronic signature', signed ? `/s/ ${party.legalName}` : '');
      line('Signed (property time)', signed ? formatTimestamp(party.signature.signedAt?.toDate(), 'America/Chicago') : '');
      pdf.moveDown(.6);
    }
  }
  if (input.documentStatus === 'approved') {
    const signed = [...input.version.buyers, ...input.version.sellers].filter(p => p.requiredSigner).map(p => p.signature.signedAt?.toDate()).filter((v): v is Date => Boolean(v));
    if (signed.length) line('Effective signature time (property time)', formatTimestamp(new Date(Math.max(...signed.map(d => d.getTime()))), 'America/Chicago'));
  }
  const pageCount = pdf.bufferedPageRange().count;
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-WI-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
function formatTimestamp(date: Date | undefined, timeZone: string): string {
  return date ? new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date) : '';
}
