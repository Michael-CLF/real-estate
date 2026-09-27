
import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { FloridaOfferTermsDocument } from './florida-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; seller disclosures remain separate signed attachments. */
export async function generateFloridaOfferPdf(input: GenerateStateAgreementInput<FloridaOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, Florida, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
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
      page('Florida agreement (continued)');
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
  drawNavStreetNotice(pdf, 'Florida purchase offer', 'This Florida residential resale offer becomes the agreement when all required parties sign the same version and acceptance is communicated. The statutory flood disclosure, applicable homeowners association summary and applicable federal lead materials must be provided before submission. The buyer’s receipt status for the separate seller condition statement appears below. Consult a Florida real estate attorney about your specific property.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Florida', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Agreement and price', `The identified buyer offers to purchase, and the identified seller agrees to convey, the property described above for ${money(t.purchase.purchasePriceInCents)} under this version after all required parties sign. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. Parties may change terms only through a new written version signed by the required parties.`);
  clause('2. Escrow deposits', t.purchase.hasEarnestMoney ? `Buyer will deliver an initial deposit of ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after the effective date. ${t.conditions.additionalEarnestMoney ? `Buyer will deliver a further ${money(t.purchase.additionalEarnestMoneyInCents)} within ${t.purchase.additionalEarnestMoneyDueDays} calendar days after the effective date.` : 'No additional deposit is due.'} The escrow agent must hold and disburse deposits under this agreement and applicable law. Deposits are credited to buyer at closing.` : 'No initial or additional escrow deposit is required.');
  clause('3. Property and included items', `Seller conveys existing improvements, built-in fixtures and seller-owned appliances present at acceptance unless specifically excluded. Additional personal property included: ${t.propertyItems.included || 'None specified'}. Items excluded: ${t.propertyItems.excluded || 'None specified'}. Leased equipment and proposed transfer arrangements: ${t.propertyItems.leasedItemsDescription || 'None specified'}. A leased item does not transfer without the required lessor consent and a signed assignment.`);
  page('Conditions and contract dates');
  clause('4. Funding and loan conditions', `Funding method: ${t.purchase.financingType}. ${t.purchase.financingType === 'cash' ? 'Buyer does not rely on loan approval or an appraisal condition.' : `Proposed loan amount: ${money(t.purchase.loanAmountInCents)}; term: ${t.purchase.loanTermYears} years. Loan approval is a condition: ${answer(t.conditions.financing)}. ${t.conditions.financing ? `Buyer shall submit a good-faith loan application within ${t.purchase.loanApplicationDays} calendar days after the effective date and seek approval within ${t.purchase.loanApprovalDays} calendar days after the effective date. Buyer shall promptly notify seller in writing if approval is denied by that deadline; timely cancellation for inability to obtain approval returns any deposit, subject to buyer’s good-faith performance.` : 'Buyer assumes the risk of obtaining a loan without a loan-approval cancellation right.'} Appraisal condition: ${answer(t.conditions.appraisal)}. ${t.conditions.appraisal ? 'If a lender appraisal is insufficient for the stated loan, buyer shall notify seller in writing by the loan approval deadline and may cancel for a return of deposit unless the parties agree in writing to different terms.' : ''}`} Purchase conditioned on selling buyer’s other property: ${answer(t.conditions.saleOfBuyersProperty)}. Any sale-of-property condition must be stated in the separately signed additional terms.`);
  clause('5. Contract dates and time', `AS IS inspection period: ${t.deadlines.inspectionPeriodDays} calendar days after the effective date. ${t.conditions.financing ? `Loan application period: ${t.purchase.loanApplicationDays} calendar days; approval period: ${t.purchase.loanApprovalDays} calendar days after the effective date.` : ''} Optional additional seller document deadline: ${t.deadlines.sellerDisclosureDate || 'None'}. Closing date: ${t.deadlines.settlementDate}. A stated date means 11:59 p.m. Eastern Time on that date; a period measured in days begins the day after the effective date. Statutory pre-contract disclosures must be delivered before execution regardless of any optional document date.`);
  clause('6. Title, closing and allocations', `Closing agent: ${t.settlement.closingAgentName}. Owner’s title policy and title search paid by ${t.settlement.titlePolicyPayer}. Seller shall deliver evidence of marketable title at least ${t.settlement.titleEvidenceDaysBeforeClosing} calendar days before closing. Buyer shall promptly identify any title objection in writing; seller may cure it before closing or obtain a written extension. If an uncured defect prevents marketable title, buyer may cancel and recover deposits or accept title subject to that defect. Seller shall deliver a recordable deed conveying marketable title subject to recorded exceptions accepted by buyer. Property taxes, periodic association dues and utilities are prorated at closing; seller remains responsible for seller’s liens and obligations that must be paid to convey title. Material casualty before closing will be resolved by written amendment or buyer may cancel and recover deposits.`);
  clause('7. Possession and charges', `Seller shall deliver vacant possession and keys at closing. Any existing tenancy that will continue after closing requires a separately signed agreement. Pre-closing special assessments: ${t.settlement.specialAssessmentPayer}. Association transfer fees, if applicable: ${t.disclosures.sellerReportsHoa ? t.settlement.hoaTransferFeePayer : 'not applicable'}. Seller will maintain the property in substantially the condition present at acceptance, ordinary wear excepted, until possession.`);
  clause('8. AS IS inspection and cancellation', `Seller conveys the property in its condition at acceptance, ordinary wear excepted, without an obligation to perform buyer-requested repairs absent a later written agreement. Buyer may inspect the property during the ${t.deadlines.inspectionPeriodDays}-calendar-day inspection period. If buyer decides the property is unacceptable, buyer may cancel by delivering written notice before that period expires, and escrow deposits must be returned to buyer subject to lawful escrow disbursement. If buyer does not give timely notice, the AS IS inspection cancellation right expires. The parties may agree in writing to repairs, credits or an extension; an oral request does not change the deadline.`);
  page('Disclosures and communications');
  clause('9. Seller disclosures and buyer receipt', `Seller-signed statutory flood disclosure received: ${t.disclosures.floodStatus === 'received' ? 'Yes' : 'No'}. Seller condition statement, including any known sanitary sewer lateral defects, received: ${t.disclosures.propertyConditionStatus === 'received' ? 'Yes, received and reviewed' : 'No, not received; buyer does not acknowledge receipt'}. Seller states mandatory HOA applies: ${answer(t.disclosures.sellerReportsHoa)}. HOA disclosure summary: ${t.disclosures.hoaDocumentsStatus}. Seller reports existing leases: ${answer(t.disclosures.sellerReportsExistingLeases)}. Lead-based paint packet: ${t.disclosures.leadPaintStatus}. Buyer lead inspection choice: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : 'Buyer waived' : 'Not applicable'}. Buyer acknowledges lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. Actual disclosures remain separately signed attachments; summaries here do not replace them.`);
  clause('Florida property tax notice - Fla. Stat. § 689.261', 'BUYER SHOULD NOT RELY ON THE SELLER’S CURRENT PROPERTY TAXES AS THE AMOUNT OF PROPERTY TAXES THAT THE BUYER MAY BE OBLIGATED TO PAY IN THE YEAR SUBSEQUENT TO PURCHASE. A CHANGE OF OWNERSHIP OR PROPERTY IMPROVEMENTS TRIGGERS REASSESSMENTS OF THE PROPERTY THAT COULD RESULT IN HIGHER PROPERTY TAXES. IF YOU HAVE ANY QUESTIONS CONCERNING VALUATION, CONTACT THE COUNTY PROPERTY APPRAISER’S OFFICE FOR INFORMATION.');
  clause('Florida radon gas notice - Fla. Stat. § 404.056(5)', 'RADON GAS: Radon is a naturally occurring radioactive gas that, when it has accumulated in a building in sufficient quantities, may present health risks to persons who are exposed to it over time. Levels of radon that exceed federal and state guidelines have been found in buildings in Florida. Additional information regarding radon and radon testing may be obtained from your county health department.');
  if (t.disclosures.sellerReportsHoa === true) {
    clause('Mandatory homeowners association - Fla. Stat. § 720.401', 'The separate seller-provided disclosure summary under Florida Statutes § 720.401 is incorporated by reference. THE BUYER SHOULD NOT EXECUTE THIS AGREEMENT UNTIL BUYER HAS RECEIVED AND READ THE DISCLOSURE SUMMARY. IF THE DISCLOSURE SUMMARY REQUIRED BY SECTION 720.401, FLORIDA STATUTES, HAS NOT BEEN PROVIDED TO THE PROSPECTIVE PURCHASER BEFORE EXECUTING THIS CONTRACT FOR SALE, THIS CONTRACT IS VOIDABLE BY BUYER BY DELIVERING TO SELLER OR SELLER’S AGENT OR REPRESENTATIVE WRITTEN NOTICE OF THE BUYER’S INTENTION TO CANCEL WITHIN 3 DAYS AFTER RECEIPT OF THE DISCLOSURE SUMMARY OR PRIOR TO CLOSING, WHICHEVER OCCURS FIRST.');
  }
  clause('10. Default and resolution', 'If either party fails to perform a material obligation, the other may give written notice and exercise available remedies under Florida law, including any applicable right to seek performance, damages, or return of earnest money. The parties should obtain independent advice about the choice and timing of a remedy. The escrow holder will disburse disputed funds only under mutually signed instructions, a court order, or applicable law.');
  clause('11. Notices, signatures, and expiration', `The parties authorize electronic delivery and electronic signatures: ${answer(t.delivery.electronicDeliveryAuthorized)}. This version expires ${t.delivery.expiresAt} unless all required initiating signatures and delivery occur before that time. Acceptance requires all required parties to sign the same immutable version; a counteroffer creates a new version and the prior version does not carry signatures. The effective date is the final required signature timestamp recorded for the accepted version.`);
  clause('12. Other agreed terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement', 'This signed version and any separately identified signed attachments constitute the parties’ agreement. Changes require another signed written version. Each party acknowledges the opportunity to consult an independent Florida real estate attorney and to review any applicable disclosure and supplement before signing.');
  page('Version signatures');
  const requiredParties = [...input.version.buyers, ...input.version.sellers].filter(party => party.requiredSigner);
  const allSigned = requiredParties.length > 0 && requiredParties.every(party =>
    party.signature.status === 'signed' && party.signature.signedAt);
  line('Document status', input.documentStatus === 'approved' && allSigned
    ? 'Final accepted version' : 'Offer version - signatures pending');
  line('Version created', formatTimestamp(input.version.createdAt?.toDate(), 'America/New_York'));
  for (const [label, parties] of [['Buyers', input.version.buyers], ['Sellers', input.version.sellers]] as const) {
    pdf.moveDown();
    drawNavStreetSectionBar(pdf, label);
    for (const party of parties) {
      if (pdf.y > 590) page('Version signatures (continued)');
      const signed = party.signature.status === 'signed' && party.signature.signedAt;
      line('Party', party.legalName);
      line('Electronic signature', signed ? `/s/ ${party.legalName}` : 'Awaiting signature');
      line('Signed (property time)', signed ? formatTimestamp(party.signature.signedAt?.toDate(), 'America/New_York') : 'Pending');
      pdf.y += 6;
    }
  }
  if (input.documentStatus === 'approved' && allSigned) {
    const signed = [...input.version.buyers, ...input.version.sellers].filter(p => p.requiredSigner).map(p => p.signature.signedAt?.toDate()).filter((v): v is Date => Boolean(v));
    if (signed.length) line('Effective signature time (property time)', formatTimestamp(new Date(Math.max(...signed.map(d => d.getTime()))), 'America/New_York'));
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    drawNavStreetPdfChrome(pdf, {
      stateName: 'Florida',
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-FL-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
function formatTimestamp(date: Date | undefined, timeZone: string): string {
  return date ? new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date) : '';
}
