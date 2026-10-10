import { formatTimestamp } from '../property-time-format';

import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { OregonOfferTermsDocument } from './oregon-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; seller disclosures remain separate signed attachments. */
export async function generateOregonOfferPdf(input: GenerateStateAgreementInput<OregonOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, Oregon, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
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
    let remaining = String(value ?? 'Not specified') || ' ';
    let continued = false;
    while (remaining.length) {
      if (pdf.y + 35 > NAVSTREET_PDF.contentBottom) page('Parties and property (continued)');
      pdf.font('NavStreet-Regular').fontSize(9);
      const available = NAVSTREET_PDF.contentBottom - pdf.y - 12;
      let low = 1, high = remaining.length;
      while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        if (pdf.heightOfString(remaining.slice(0, middle), { width: 324, lineGap: 2 }) <= available) low = middle;
        else high = middle - 1;
      }
      let count = low;
      if (count < remaining.length) {
        const boundary = remaining.slice(0, count).lastIndexOf(' ');
        if (boundary > count / 2) count = boundary + 1;
      }
      const text = remaining.slice(0, count);
      const height = Math.max(27, pdf.heightOfString(text, { width: 324, lineGap: 2 }) + 12);
      const y = pdf.y;
      pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, height - 2).fill(NAVSTREET_PDF.pale);
      pdf.font('NavStreet-Bold').fillColor(NAVSTREET_PDF.ink).fontSize(9)
        .text(label + (continued ? ' (continued)' : ''), NAVSTREET_PDF.margin + 10, y + 7, { width: 170, characterSpacing: 0 });
      pdf.font('NavStreet-Regular').fillColor(NAVSTREET_PDF.ink).fontSize(9)
        .text(text, NAVSTREET_PDF.margin + 192, y + 7, { width: 324, lineGap: 2, characterSpacing: 0 });
      pdf.y = y + height;
      remaining = remaining.slice(count);
      if (remaining.length) { page('Parties and property (continued)'); continued = true; }
    }
  }
  function clause(label: string, body: string): void {
    pdf.font('NavStreet-Regular').fontSize(9.5);
    const fullHeight = pdf.heightOfString(body, {width:NAVSTREET_PDF.contentWidth - 20,lineGap:2.5,characterSpacing:0}) + 45;
    if (fullHeight < NAVSTREET_PDF.contentBottom - NAVSTREET_PDF.contentTop - 40 && pdf.y + fullHeight > NAVSTREET_PDF.contentBottom) page('Oregon agreement (continued)');
    const words = body.split(/\s+/);
    let continued = false;
    while (words.length) {
      if (pdf.y + 95 > NAVSTREET_PDF.contentBottom) page('Oregon agreement (continued)');
      const y = pdf.y + 8;
      pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, 20).fill(NAVSTREET_PDF.blue);
      pdf.font('NavStreet-Bold').fillColor('#FFFFFF').fontSize(8.5).text((label + (continued ? ' (continued)' : '')).toUpperCase(), NAVSTREET_PDF.margin + 10, y + 5, {width: NAVSTREET_PDF.contentWidth - 20, characterSpacing: 0});
      pdf.y = y + 29;
      pdf.font('NavStreet-Regular').fontSize(9.5);
      const available = NAVSTREET_PDF.contentBottom - pdf.y - 10;
      let count = 1;
      while (count < words.length && pdf.heightOfString(words.slice(0,count + 1).join(' '), {width:NAVSTREET_PDF.contentWidth - 20,lineGap:2.5,characterSpacing:0}) <= available) count++;
      const chunk = words.splice(0,count).join(' ');
      pdf.fillColor(NAVSTREET_PDF.ink).text(chunk,NAVSTREET_PDF.margin + 10,pdf.y,{width:NAVSTREET_PDF.contentWidth - 20,lineGap:2.5,characterSpacing:0});
      pdf.y += 8;
      if (words.length) {page('Oregon agreement (continued)');continued = true;}
    }
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptLabel = (value: string) => value === 'built_1978_or_later' ? 'Listing records construction after 1977' : value === 'exempt' ? 'Signed federal exemption evidence received' : value === 'unselected' ? 'Not answered' : value.replace(/_/g, ' ');
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  pdf.y = NAVSTREET_PDF.contentTop;
  drawNavStreetNotice(pdf, 'Oregon residential purchase offer', 'Original NavStreet agreement for an ordinary residential resale. Required seller disclosures remain separate uploaded documents. Acceptance requires all required parties to sign the same version and communicate acceptance. Read all terms and attachments before signing.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Oregon', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Property time zone', t.delivery.timeZone);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Purchase and written agreement', `Buyer offers to purchase the identified property from seller for ${money(t.purchase.purchasePriceInCents)}. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. This version becomes binding upon the required signatures and communication of acceptance. The effective date is the final required acceptance signature date, provided acceptance is communicated. A counteroffer is a new version requiring new signatures. Parties shall identify all owners and required signers; signing this offer does not dispense with spouses or other persons whose joinder is required for a valid conveyance.`);
  clause('2. Earnest money', t.purchase.hasEarnestMoney ? `Buyer shall deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after the effective date. ${t.conditions.additionalEarnestMoney ? `Additional earnest money of ${money(t.purchase.additionalEarnestMoneyInCents)} is due within ${t.purchase.additionalEarnestMoneyDueDays} calendar days after the effective date.` : 'No additional deposit is due.'} Deposits are credited to buyer at closing. The holder shall maintain and disburse them under this agreement and applicable law. Disputed funds require lawful disbursement, signed joint instructions or a court order.` : 'No earnest money deposit is required by this version.');
  clause('3. Included property and leases', `Existing improvements and installed fixtures are included except those expressly excluded. Additional personal property included: ${t.propertyItems.included || 'None specified'}. Exclusions: ${t.propertyItems.excluded || 'None specified'}. Leased equipment and proposed assignments: ${t.propertyItems.leasedItemsDescription || 'None specified'}. Seller shall identify existing tenancies and leases. Any continuing tenancy, equipment lease or post-closing occupancy requires separately signed arrangements and applicable third-party consent. This agreement alone does not assign a third-party lease.`);
  page('Conditions, title and closing');
  clause('4. Financing', `Funding: ${t.purchase.financingType}. ${t.purchase.financingType === 'cash' ? 'Buyer will pay cash and has no financing or appraisal condition.' : `Proposed loan: ${money(t.purchase.loanAmountInCents)} over ${t.purchase.loanTermYears} years. Loan approval condition: ${answer(t.conditions.financing)}. Appraisal condition: ${answer(t.conditions.appraisal)}. ${t.conditions.financing ? `Buyer shall apply in good faith within ${t.purchase.loanApplicationDays} calendar days after the effective date and seek approval within ${t.purchase.loanApprovalDays} calendar days after the effective date. Buyer may terminate by written notice delivered within that approval period if the loan cannot be obtained despite good-faith efforts; the deposit shall be returned subject to lawful escrow disbursement.` : 'Buyer assumes the financing risk without a loan-approval cancellation right.'} ${t.conditions.appraisal ? `If the lender appraisal is insufficient for the stated loan, buyer may terminate by written notice within ${t.purchase.loanApprovalDays} calendar days after the effective date and recover the deposit, unless different terms are agreed in writing.` : 'No appraisal cancellation right is selected.'}`} Purchase conditioned on sale of buyer’s other property: ${answer(t.conditions.saleOfBuyersProperty)}. If selected, the identified property, sale deadline and cancellation consequences must be written in Additional terms.`);
  clause('5. Inspection and condition', `Buyer has ${t.deadlines.inspectionPeriodDays} calendar days after the effective date to inspect the property, including structural, environmental, radon, water, sewer and septic conditions as appropriate. Buyer may terminate by written notice delivered before the inspection period expires if the property is unacceptable, and the deposit shall be returned subject to lawful escrow disbursement. Buyer shall repair damage caused by inspections. Seller has no obligation to make requested repairs unless agreed in writing. Seller shall maintain the property substantially in its acceptance condition, ordinary wear excepted. Inspection rights do not waive statutory disclosures, fraud remedies or other nonwaivable rights.`);
  clause('6. Time and closing date', `Closing shall occur by ${t.deadlines.settlementDate}. Optional additional document date: ${t.deadlines.sellerDisclosureDate || 'None'}. Contract periods measured in calendar days begin on the day following the effective date and expire at 11:59 p.m. in ${t.delivery.timeZone}. A fixed contract date expires at that same property-local time. Statutory periods use their own governing rules. The optional document date does not extend a statutory delivery deadline. Offer expiration: ${formatTimestamp(new Date(t.delivery.expiresAt), t.delivery.timeZone)}.`);
  clause('7. Title and conveyance', `Closing agent: ${t.settlement.closingAgentName}. The owner’s title insurance policy and search are paid by ${t.settlement.titlePolicyPayer}. Seller shall provide evidence of marketable title at least ${t.settlement.titleEvidenceDaysBeforeClosing} calendar days before closing. Buyer shall promptly identify title objections in writing. Seller shall cure objections by closing or obtain an agreed written extension. If an uncured objection prevents marketable title, buyer may terminate and recover deposits or accept the defect in writing. Seller shall convey by recordable deed, free of liens requiring payoff, subject to recorded exceptions accepted by buyer. All legally necessary owners and spouses must join in conveyance. This agreement does not provide seller financing or an installment contract for deed.`);
  clause('8. Allocations, casualty and possession', `Taxes, periodic dues and utilities shall be prorated at closing using available current information, with later adjustment by written agreement if needed. Seller is responsible for seller’s liens and obligations that must be discharged to convey title. Pre-closing special assessments are paid by ${t.settlement.specialAssessmentPayer}; association transfer fees, if applicable, by ${t.disclosures.sellerReportsHoa ? t.settlement.hoaTransferFeePayer : 'not applicable'}. Material casualty before closing permits buyer to terminate and recover deposits or agree in writing to restoration or assignment of available insurance rights. Seller shall deliver vacant possession and keys at closing unless a separately signed occupancy or tenancy agreement states otherwise.`);
  page('State disclosures and protected rights');
  clause('9. Separate disclosures and actual receipt', `Seller disclosure or signed exception evidence: ${t.disclosures.propertyConditionStatus === 'exempt' ? 'Signed Oregon statutory exemption evidence reviewed' : receiptLabel(t.disclosures.propertyConditionStatus)}. Property-specific statutory/local packet: ${receiptLabel(t.disclosures.statutoryPacketStatus)}. Seller reports an association: ${answer(t.disclosures.sellerReportsHoa)}; association documents: ${receiptLabel(t.disclosures.hoaDocumentsStatus)}. Seller reports existing leases: ${answer(t.disclosures.sellerReportsExistingLeases)}; buyer reviewed the lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. A received status records the buyer’s actual review of the uploaded document, including any identified exception evidence; it does not certify the truth of seller statements or waive protected rights. Seller must promptly provide applicable written amendments and updated information before closing.`);
  clause("Oregon seller disclosure and protected revocation", "For a transaction covered by ORS 105.465, seller shall complete, sign and deliver the disclosure substantially in the ORS 105.464 statutory form to each buyer making a written offer. Document any ORS 105.470 exclusion; an as-is clause does not create an exclusion. Under ORS 105.475, absent a separate written waiver, buyer has five business days after delivery to deliver a separate signed written revocation disapproving the disclosure. Failure or refusal to provide the required disclosure preserves revocation until closing. Timely revocation voids the offer and requires immediate return of deposits and other consideration as provided by law. Closing terminates this statutory revocation right. The seller disclosure is incorporated into offer and acceptance by statute. Review/receipt selections and signing this agreement do not waive this right. No waiver is generated by NavStreet.");
  clause("Oregon domestic well testing", "If the property includes a domestic groundwater well covered by ORS 448.271 and OAR 333-061-0305 through 0335, seller shall arrange accredited-laboratory arsenic, nitrate and total-coliform testing upon accepting the offer and provide the results to buyer and required RET report/results to Oregon Health Authority within the applicable ninety-day reporting periods. Test results associated with a sale are valid for one year. Verify exemptions and any location-specific additional testing. This agreement does not falsely require completed well testing before an offer can be made; buyer may negotiate inspection and closing conditions.");
  clause("Oregon wood devices and alarms", "Unless a statutory/rule exemption applies, seller shall remove, destroy and dispose of uncertified solid-fuel devices and notify Oregon DEQ before closing. Any agreement transferring that duty to buyer must be separately explicit and signed by both parties; buyer then completes the duty within thirty days after closing. No such transfer is implied by this agreement, included-fixtures wording or an as-is clause. Seller shall comply with applicable smoke-alarm installation rules and required functioning carbon-monoxide alarms for a dwelling with a CO source before transfer. Verify local energy-assessment and other transfer requirements with the applicable city; this statewide agreement does not establish local compliance.");
  clause("Oregon title, scope and special transactions", "Title shall confirm legal description, necessary owners and signature authority, liens, easements, water/access rights and appropriate deed/recording. This initial agreement is for ordinary existing fee-simple single-family, townhome and PUD resales with cash or conventional funding. Condominium, manufactured-home, new-construction, land, leasehold, subdivision/developer and residential wholesale transactions require separately reviewed agreements. Oregon wholesaling registration/disclosure/cancellation duties under ORS 696.653 to 696.665 are not implemented here; no assignment/wholesale workflow is authorized. Seller must disclose actual material facts and provide updated applicable information; seller tax bills do not guarantee buyer taxes.");
  clause("Oregon mandatory owner sale agreement notice — ORS 93.040(2)", "THE PROPERTY DESCRIBED IN THIS INSTRUMENT MAY NOT BE WITHIN A FIRE PROTECTION DISTRICT PROTECTING STRUCTURES. THE PROPERTY IS SUBJECT TO LAND USE LAWS AND REGULATIONS THAT, IN FARM OR FOREST ZONES, MAY NOT AUTHORIZE CONSTRUCTION OR SITING OF A RESIDENCE AND THAT LIMIT LAWSUITS AGAINST FARMING OR FOREST PRACTICES, AS DEFINED IN ORS 30.930, IN ALL ZONES. BEFORE SIGNING OR ACCEPTING THIS INSTRUMENT, THE PERSON TRANSFERRING FEE TITLE SHOULD INQUIRE ABOUT THE PERSON\u2019S RIGHTS, IF ANY, UNDER ORS 195.300, 195.301 AND 195.305 TO 195.336 AND SECTIONS 5 TO 11, CHAPTER 424, OREGON LAWS 2007, SECTIONS 2 TO 9 AND 17, CHAPTER 855, OREGON LAWS 2009, AND SECTIONS 2 TO 7, CHAPTER 8, OREGON LAWS 2010. BEFORE SIGNING OR ACCEPTING THIS INSTRUMENT, THE PERSON ACQUIRING FEE TITLE TO THE PROPERTY SHOULD CHECK WITH THE APPROPRIATE CITY OR COUNTY PLANNING DEPARTMENT TO VERIFY THAT THE UNIT OF LAND BEING TRANSFERRED IS A LAWFULLY ESTABLISHED LOT OR PARCEL, AS DEFINED IN ORS 92.010 OR 215.010, TO VERIFY THE APPROVED USES OF THE LOT OR PARCEL, TO VERIFY THE EXISTENCE OF FIRE PROTECTION FOR STRUCTURES AND TO INQUIRE ABOUT THE RIGHTS OF NEIGHBORING PROPERTY OWNERS, IF ANY, UNDER ORS 195.300, 195.301 AND 195.305 TO 195.336 AND SECTIONS 5 TO 11, CHAPTER 424, OREGON LAWS 2007, SECTIONS 2 TO 9 AND 17, CHAPTER 855, OREGON LAWS 2009, AND SECTIONS 2 TO 7, CHAPTER 8, OREGON LAWS 2010.");
  if (t.disclosures.historicSpecialAssessmentApplies) clause("Oregon historic special assessment — ORS 93.040(3)", "THE PROPERTY DESCRIBED IN THIS INSTRUMENT IS SUBJECT TO SPECIAL ASSESSMENT UNDER ORS 358.505.");
  clause('Oregon institutional-investor change effective January 1, 2027', 'Oregon Laws 2026 chapter 64 (HB 4128), effective January 1, 2027, restricts offers and acquisitions by defined covered institutional entities, subject to statutory exceptions. For the ninety-consecutive-day public-listing exception, covered entities must give the seller or agent a completed notarized status disclosure when making or accepting an offer, and send a copy to the Department of Justice within three days. The definitions and other exceptions must be evaluated by the buyer and closing professionals. This agreement does not create an exception or generate that notarized disclosure. These restrictions are not represented as already effective in October 2026.');
  clause('Federal lead disclosure and inspection', `Lead packet status: ${receiptLabel(t.disclosures.leadPaintStatus)}. For covered pre-1978 housing, seller shall provide known lead information, available reports, the signed federal statement and EPA pamphlet before buyer is bound. Inspection selection: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : 'Buyer waives the inspection opportunity in writing' : 'See separate exemption evidence or post-1977 construction record'}. The inspection opportunity runs before buyer becomes bound unless the parties agree to a different period in writing. Choosing 10 days does not defer mandatory disclosures until after acceptance. Waiver of inspection does not waive disclosure. The required federal warning and certifications remain in the separately signed lead attachment, which must be retained for the required period.`);
  clause('10. Default and remedies', 'A party’s material failure to perform permits the other party to give written notice and pursue available remedies under Oregon law, subject to any applicable notice, cure or statutory requirements. No automatic forfeiture or exclusive remedy is created here. The parties may obtain independent advice about damages, performance, cancellation and lawful escrow disbursement. Statutory and nonwaivable rights are preserved.');
  clause('11. Notices and electronic consent', `The initiating party’s express electronic delivery and signing consent: ${answer(t.delivery.electronicDeliveryAuthorized)}. Each later signer must separately consent in the signing workflow; this entry does not supply consent for another person. Contract notices must be written and delivered to the parties’ designated addresses or electronic destinations where legally permitted. Statutory notice methods and periods apply when required by law. This offer expires at the stated time unless the required initiating signatures and delivery occur before expiration.`);
  clause('12. Additional negotiated terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement and amendments', 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Parties have the opportunity to obtain independent legal advice before signing. This resale agreement does not cover condominium/developer offerings, new-construction sales, vacant land, installment seller financing or other transactions requiring a different agreement.');
  page('Version signatures');
  const requiredParties = [...input.version.buyers, ...input.version.sellers].filter(party => party.requiredSigner);
  const allSigned = requiredParties.length > 0 && requiredParties.every(party =>
    party.signature.status === 'signed' && party.signature.signedAt);
  line('Document status', input.documentStatus === 'approved' && allSigned
    ? 'Final accepted version' : 'Offer version - signatures pending');
  line('Version created', formatTimestamp(input.version.createdAt?.toDate(), t.delivery.timeZone));
  for (const [label, parties] of [['Buyers', input.version.buyers], ['Sellers', input.version.sellers]] as const) {
    pdf.moveDown();
    drawNavStreetSectionBar(pdf, label);
    for (const party of parties) {
      if (pdf.y > 590) page('Version signatures (continued)');
      const signed = party.signature.status === 'signed' && party.signature.signedAt;
      line('Party', party.legalName);
      line('Electronic signature', signed ? `/s/ ${party.legalName}` : 'Awaiting signature');
      line('Signed (property time)', signed ? formatTimestamp(party.signature.signedAt?.toDate(), t.delivery.timeZone) : 'Pending');
      pdf.y += 6;
    }
  }
  if (input.documentStatus === 'approved' && allSigned) {
    const signed = [...input.version.buyers, ...input.version.sellers].filter(p => p.requiredSigner).map(p => p.signature.signedAt?.toDate()).filter((v): v is Date => Boolean(v));
    if (signed.length) line('Effective signature time (property time)', formatTimestamp(new Date(Math.max(...signed.map(d => d.getTime()))), t.delivery.timeZone));
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    // Footer text is outside the body margin; keep it on the current page.
    pdf.page.margins.bottom = 0;
    drawNavStreetPdfChrome(pdf, {
      stateName: 'Oregon',
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-OR-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
