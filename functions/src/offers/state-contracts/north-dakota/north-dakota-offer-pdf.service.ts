import {appendReviewedNoticeCopy} from './north-dakota-signed-notice-copy';
import { formatTimestamp } from '../property-time-format';

import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { NorthDakotaOfferTermsDocument } from './north-dakota-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; seller disclosures remain separate signed attachments. */
export async function generateNorthDakotaOfferPdf(input: GenerateStateAgreementInput<NorthDakotaOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const isCondominium = t.contractType === 'navstreet_north_dakota_condominium_resale_2026';
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, North Dakota, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
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
    const options = {width:324,lineGap:2,characterSpacing:0};
    while (remaining.length) {
      pdf.font('NavStreet-Regular').fontSize(9);
      const fullHeight = Math.max(27,pdf.heightOfString(remaining,options)+12);
      const freshSpace = NAVSTREET_PDF.contentBottom-NAVSTREET_PDF.contentTop-35;
      if (pdf.y+27>NAVSTREET_PDF.contentBottom || (fullHeight<=freshSpace && pdf.y+fullHeight>NAVSTREET_PDF.contentBottom)) page('Parties and property (continued)');
      const available = NAVSTREET_PDF.contentBottom-pdf.y-12;
      let low=1,high=remaining.length;
      while(low<high){const mid=Math.ceil((low+high)/2);if(pdf.heightOfString(remaining.slice(0,mid),options)<=available)low=mid;else high=mid-1;}
      let count=low;
      if(count<remaining.length){const boundary=remaining.lastIndexOf(' ',count);if(boundary>0)count=boundary;}
      const chunk=remaining.slice(0,count);remaining=remaining.slice(count).trimStart();
      const height=Math.max(27,pdf.heightOfString(chunk,options)+12),y=pdf.y;
      pdf.rect(NAVSTREET_PDF.margin,y,NAVSTREET_PDF.contentWidth,height-2).fill(NAVSTREET_PDF.pale);
      pdf.font('NavStreet-Bold').fillColor(NAVSTREET_PDF.ink).fontSize(9).text(label+(continued?' (continued)':''),NAVSTREET_PDF.margin+10,y+7,{width:170,characterSpacing:0});
      pdf.font('NavStreet-Regular').fillColor(NAVSTREET_PDF.ink).fontSize(9).text(chunk,NAVSTREET_PDF.margin+192,y+7,options);
      pdf.y=y+height;
      if(remaining.length){page('Parties and property (continued)');continued=true;}
    }
  }
  function clause(label: string, body: string): void {
    pdf.font('NavStreet-Regular').fontSize(9.5);
    const fullHeight = pdf.heightOfString(body, {width:NAVSTREET_PDF.contentWidth - 20,lineGap:2.5,characterSpacing:0}) + 45;
    if (fullHeight < NAVSTREET_PDF.contentBottom - NAVSTREET_PDF.contentTop - 40 && pdf.y + fullHeight > NAVSTREET_PDF.contentBottom) page('North Dakota agreement (continued)');
    const words = body.split(/\s+/);
    let continued = false;
    while (words.length) {
      if (pdf.y + 95 > NAVSTREET_PDF.contentBottom) page('North Dakota agreement (continued)');
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
      if (words.length) {page('North Dakota agreement (continued)');continued = true;}
    }
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptLabel = (value: string) => value === 'built_1978_or_later' ? 'Listing records construction after 1977' : value === 'exempt' ? 'Signed federal exemption evidence received' : value === 'unselected' ? 'Not answered' : value.replace(/_/g, ' ');
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  pdf.y = NAVSTREET_PDF.contentTop;
  drawNavStreetNotice(pdf, isCondominium ? 'North Dakota condominium resale purchase offer' : 'North Dakota residential purchase offer', 'Original NavStreet agreement for an ordinary residential resale. Required seller disclosures remain separate uploaded documents. Acceptance requires all required parties to sign the same version and communicate acceptance. Read all terms and attachments before signing.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  if (isCondominium) line('Agreement identity', 'navstreet_north_dakota_condominium_resale_2026 / navstreet-nd-condominium-2026 / revision 2026-10-24');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'North Dakota', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Property time zone', t.delivery.timeZone);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Purchase and written agreement', `Buyer offers to purchase the identified property from seller for ${money(t.purchase.purchasePriceInCents)}. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. This version becomes binding upon the required signatures and communication of acceptance. The effective date is the final required acceptance signature date, provided acceptance is communicated. A counteroffer is a new version requiring new signatures. Parties shall identify all owners and required signers; signing this offer does not dispense with spouses or other persons whose joinder is required for a valid conveyance.`);
  clause('2. Earnest money', t.purchase.hasEarnestMoney ? `Buyer shall deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder || 'a qualified independent escrow holder jointly selected by the parties'} within ${t.purchase.earnestMoneyDueDays} calendar days after the effective date. ${t.conditions.additionalEarnestMoney ? `Additional earnest money of ${money(t.purchase.additionalEarnestMoneyInCents)} is due within ${t.purchase.additionalEarnestMoneyDueDays} calendar days after the effective date.` : 'No additional deposit is due.'} Deposits are credited to buyer at closing. The holder shall maintain and disburse them under this agreement and applicable law. Disputed funds require lawful disbursement, signed joint instructions or a court order.` : 'No earnest money deposit is required by this version.');
  clause('3. Included property and leases', `Existing improvements and installed fixtures are included except those expressly excluded. Additional personal property included: ${t.propertyItems.included || 'None specified'}. Exclusions: ${t.propertyItems.excluded || 'None specified'}. Leased equipment and proposed assignments: ${t.propertyItems.leasedItemsDescription || 'None specified'}. Seller shall identify existing tenancies and leases. Any continuing tenancy, equipment lease or post-closing occupancy requires separately signed arrangements and applicable third-party consent. This agreement alone does not assign a third-party lease.`);
  page('Conditions, title and closing');
  clause('4. Financing', `Funding: ${t.purchase.financingType}. ${t.purchase.financingType === 'cash' ? 'Buyer will pay cash and has no financing or appraisal condition.' : `Proposed loan: ${money(t.purchase.loanAmountInCents)} over ${t.purchase.loanTermYears} years. Loan approval condition: ${answer(t.conditions.financing)}. Appraisal condition: ${answer(t.conditions.appraisal)}. ${t.conditions.financing ? `Buyer shall apply in good faith within ${t.purchase.loanApplicationDays} calendar days after the effective date and seek approval within ${t.purchase.loanApprovalDays} calendar days after the effective date. Buyer may terminate by written notice delivered within that approval period if the loan cannot be obtained despite good-faith efforts; the deposit shall be returned subject to lawful escrow disbursement.` : 'Buyer assumes the financing risk without a loan-approval cancellation right.'} ${t.conditions.appraisal ? `If the lender appraisal is insufficient for the stated loan, buyer may terminate by written notice within ${t.purchase.loanApprovalDays} calendar days after the effective date and recover the deposit, unless different terms are agreed in writing.` : 'No appraisal cancellation right is selected.'}`} Purchase conditioned on sale of buyer’s other property: ${answer(t.conditions.saleOfBuyersProperty)}. If selected, the identified property, sale deadline and cancellation consequences must be written in Additional terms.`);
  clause('5. Inspection and condition', `Buyer has ${t.deadlines.inspectionPeriodDays} calendar days after the effective date to inspect the property, including structural, environmental, radon, water, sewer and septic conditions as appropriate. Buyer may terminate by written notice delivered before the inspection period expires if the property is unacceptable, and the deposit shall be returned subject to lawful escrow disbursement. Buyer shall repair damage caused by inspections. Seller has no obligation to make requested repairs unless agreed in writing. Seller shall maintain the property substantially in its acceptance condition, ordinary wear excepted. Inspection rights do not waive statutory disclosures, fraud remedies or other nonwaivable rights.`);
  clause('6. Time and closing date', `Closing shall occur by ${t.deadlines.settlementDate}. Optional additional document date: ${t.deadlines.sellerDisclosureDate || 'None'}. Contract periods measured in calendar days begin on the day following the effective date and expire at 11:59 p.m. in ${t.delivery.timeZone}. A fixed contract date expires at that same property-local time. Statutory periods use their own governing rules. The optional document date does not extend a statutory delivery deadline. Offer expiration: ${formatTimestamp(new Date(t.delivery.expiresAt), t.delivery.timeZone)}.`);
  if (t.contractType === 'navstreet_north_dakota_condominium_resale_2026') clause('Condominium conveyance', 'The sale includes the recorded condominium unit described in this agreement and its appurtenant undivided common-element interests and allocated limited common-element rights, subject to the recorded declaration. Parking and storage rights transfer only to the extent legally appurtenant or validly assignable by seller. Seller shall convey the interests seller owns; this agreement does not create additional parking, storage or common-element rights.');
  clause('7. Title and conveyance', `Closing agent: ${t.settlement.closingAgentName || 'To be designated by written agreement'}. The owner’s title insurance policy and search are paid by ${t.settlement.titlePolicyPayer}. Seller shall provide evidence of marketable title at least ${t.settlement.titleEvidenceDaysBeforeClosing} calendar days before closing. Buyer shall promptly identify title objections in writing. Seller shall cure objections by closing or obtain an agreed written extension. If an uncured objection prevents marketable title, buyer may terminate and recover deposits or accept the defect in writing. Seller shall convey by recordable deed, free of liens requiring payoff, subject to recorded exceptions accepted by buyer. All legally necessary owners and spouses must join in conveyance. This agreement does not provide seller financing or an installment contract for deed.`);
  clause('8. Allocations, casualty and possession', `Taxes, periodic dues and utilities shall be prorated at closing using available current information, with later adjustment by written agreement if needed. Seller is responsible for seller’s liens and obligations that must be discharged to convey title. Pre-closing special assessments are paid by ${t.settlement.specialAssessmentPayer}; association transfer fees, if applicable, by ${t.disclosures.sellerReportsHoa ? t.settlement.hoaTransferFeePayer : 'not applicable'}. Material casualty before closing permits buyer to terminate and recover deposits or agree in writing to restoration or assignment of available insurance rights. Seller shall deliver vacant possession and keys at closing unless a separately signed occupancy or tenancy agreement states otherwise.`);
  page('State disclosures and protected rights');
  clause('9. Separate disclosures and actual receipt', `Seller condition disclosure in the combined packet; standalone record status: ${t.disclosures.propertyConditionStatus === 'exempt' ? 'Seller reports a statutory transfer exception; verify its actual applicability' : receiptLabel(t.disclosures.propertyConditionStatus)}. Property-specific notice status: ${receiptLabel(t.disclosures.statutoryPacketStatus)}. Seller reports an association: ${answer(t.disclosures.sellerReportsHoa)}; association documents: ${receiptLabel(t.disclosures.hoaDocumentsStatus)}. Seller reports existing leases: ${answer(t.disclosures.sellerReportsExistingLeases)}; buyer reviewed the lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. A received status records the buyer’s actual review of the uploaded document, including any identified exception evidence; it does not certify the truth of seller statements or waive protected rights. Seller must promptly provide applicable written amendments and updated information before closing.`);
  clause("North Dakota seller disclosure and actual receipt","For covered private owner sales of residential dwellings with no more than four units, N.D.C.C. 47-10-02.1(6) requires written disclosure of known material adverse facts before final acceptance unless the purchase agreement expressly provides otherwise. A commission condition form is permitted, not universally mandated for a private no-broker seller. Use only the listed subsection (7) transfer exceptions. The single reviewed combined packet includes this applicable written statement and the separate statutory radon notice; no duplicate condition upload or buyer receipt is required.");
  clause("North Dakota property-specific requirements","N.D.C.C. 47-10-02.2 independently requires written known radon information and the statutory warning, with the buyer signed receipt, before executing an agreement except a lawful expressly agreed alternative. Furnish reasonably available known prior test results and mitigation evidence before execution. No new radon test or mitigation is universally required. This packet is independent of condition-disclosure exceptions and records actual receipt of its immutable version. The dated buyer signature acknowledges receipt of the separate statutory notice; it does not certify test accuracy, mitigation effectiveness or create a statutory testing contingency.");
  if(isCondominium || t.disclosures.sellerReportsHoa) clause("North Dakota condominium and association resale records","Under N.D.C.C. 47-10-02.3, seller shall disclose the HOA/condominium assessments, approved special assessments, declaration/bylaws/rules, last two meeting minutes, reserves, budgets/financials, insurance, litigation, violations, transfer charges, remedies, collection policy, leasing restrictions, amenities and contact information by the mutually agreed date or within ten days after executing the agreement. Required information must cover at least the preceding ninety days. Association document-retrieval fees must be disclosed before final acceptance. The purchase contract remains voidable by buyer until the documents are provided and for five days thereafter or until conveyance, whichever first occurs. Known material changes before closing or possession must be disclosed in a written amendment. A pending packet does not prevent an offer or acceptance, or eliminate this protected cancellation right. No universal condominium review waiting period is imposed before accepting the offer.");
  for (const [type,versionId] of Object.entries(t.documentVersions ?? {})) line('Reviewed disclosure version', type + ' / ' + versionId);
  if (!t.documentVersions || !(typeof t.property.yearBuilt === 'number' && t.property.yearBuilt >= 1978)) clause('Federal lead disclosure and inspection', `Lead packet status: ${receiptLabel(t.disclosures.leadPaintStatus)}. For covered pre-1978 housing, seller shall provide known lead information, available reports, the signed federal statement and EPA pamphlet before buyer is bound. Inspection selection: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : 'Buyer waives the inspection opportunity in writing' : 'See separate exemption evidence or post-1977 construction record'}. The inspection opportunity runs before buyer becomes bound unless the parties agree to a different period in writing. Choosing 10 days does not defer mandatory disclosures until after acceptance. Waiver of inspection does not waive disclosure. The required federal warning and certifications remain in the separately signed lead attachment, which must be retained for the required period.`);
  clause('10. Default and remedies', 'A party’s material failure to perform permits the other party to give written notice and pursue available remedies under North Dakota law, subject to any applicable notice, cure or statutory requirements. No automatic forfeiture or exclusive remedy is created here. The parties may obtain independent advice about damages, performance, cancellation and lawful escrow disbursement. Statutory and nonwaivable rights are preserved.');
  clause('11. Notices and electronic consent', `The initiating party’s express electronic delivery and signing consent: ${answer(t.delivery.electronicDeliveryAuthorized)}. Each later signer must separately consent in the signing workflow; this entry does not supply consent for another person. Contract notices must be written and delivered to the parties’ designated addresses or electronic destinations where legally permitted. Statutory notice methods and periods apply when required by law. This offer expires at the stated time unless all required acceptance signatures and communication of acceptance occur before expiration.`);
  clause('12. Additional negotiated terms', t.additionalTerms || 'None.');
  if (isCondominium) clause('13. Entire agreement and amendments', 'This immutable version and expressly identified signed attachments constitute the agreement. Changes require a signed written version. Additional terms cannot override statutory protections. Parties may obtain independent legal advice before signing.');
  if (isCondominium) clause('Condominium scope', 'This is an ordinary existing fee-simple residential condominium resale. Developer, new construction, vacant land, leasehold, manufactured-home and multifamily transactions are outside its scope.');
  if (!isCondominium) clause('13. Entire agreement and amendments', 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Parties have the opportunity to obtain independent legal advice before signing. This residential agreement covers the stated non-condominium ownership and does not cover developer offerings, first-sale condominium offerings, new construction, vacant land, leasehold, installment seller financing or other transactions requiring a separate agreement.');
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
  if(t.disclosures.requiredKnownFacts && t.disclosures.statutoryPacketStatus==='received') {
    page('Separate statutory notice receipt');
    line('Property',t.property.addressLine1+' '+(t.property.addressLine2||'')+', '+t.property.city+', '+t.property.state);
    line('Notice instrument','north-dakota-statutory-packet');
    line('Immutable reviewed version',t.documentVersions?.['north-dakota-statutory-packet']||'Not recorded');
    clause('Separate receipt and attached disclosure copy','This receipt accompanies the unchanged copy of the exact seller statutory notice attached after the agreement pages. Each buyer signs this receipt with that buyer electronic signature on this immutable version. It acknowledges actual receipt of the identified disclosure, not the accuracy of the seller information or a waiver of legal rights. A pending signature is not an executed acknowledgement. This is the buyer signed receipt of the attached North Dakota radon notice and included known records under 47-10-02.2. It does not require a new radon test or certify mitigation effectiveness.');
    for(const buyer of input.version.buyers) {
      if(pdf.y>590)page('Separate notice receipt (continued)');
      line('Buyer',buyer.legalName);
      const signed=buyer.signature.status==='signed'&&buyer.signature.signedAt;
      line('Receipt signature',signed?'/s/ '+buyer.legalName:'Awaiting buyer signature');
      line('Date and time of signed receipt',signed?formatTimestamp(buyer.signature.signedAt?.toDate(),t.delivery.timeZone):'Not yet signed');
    }
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    // Footer text is outside the body margin; keep it on the current page.
    pdf.page.margins.bottom = 0;
    drawNavStreetPdfChrome(pdf, {
      stateName: 'North Dakota',
      ...(isCondominium ? {agreementTitle:'North Dakota CONDOMINIUM RESALE PURCHASE\nAND SALE AGREEMENT'} : {}),
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  const base=await done;
  const attached=t.disclosures.requiredKnownFacts && t.disclosures.statutoryPacketStatus==='received' && t.documentVersions?.['north-dakota-statutory-packet'] ? await appendReviewedNoticeCopy(base,input.offer.listingUid,t.documentVersions['north-dakota-statutory-packet']) : {buffer:base,pageCount};
  return { buffer: attached.buffer, fileName: `NavStreet-ND-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount:attached.pageCount };
}
