import { formatTimestamp } from '../property-time-format';

import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { WashingtonOfferTermsDocument } from './washington-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; seller disclosures remain separate signed attachments. */
export async function generateWashingtonOfferPdf(input: GenerateStateAgreementInput<WashingtonOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, Washington, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
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
    const fullHeight = pdf.heightOfString(body, {width:NAVSTREET_PDF.contentWidth - 20,lineGap:2.5,characterSpacing:0}) + 45;
    if (fullHeight < NAVSTREET_PDF.contentBottom - NAVSTREET_PDF.contentTop - 40 && pdf.y + fullHeight > NAVSTREET_PDF.contentBottom) page('Washington agreement (continued)');
    const words = body.split(/\s+/);
    let continued = false;
    while (words.length) {
      if (pdf.y + 95 > NAVSTREET_PDF.contentBottom) page('Washington agreement (continued)');
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
      if (words.length) {page('Washington agreement (continued)');continued = true;}
    }
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptLabel = (value: string) => value === 'built_1978_or_later' ? 'Listing records construction after 1977' : value === 'exempt' ? 'Signed federal exemption evidence received' : value === 'unselected' ? 'Not answered' : value.replace(/_/g, ' ');
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  const condominium = t.contractType === 'navstreet_washington_condominium_resale_2026';
  pdf.y = NAVSTREET_PDF.contentTop;
  drawNavStreetNotice(pdf, condominium ? 'Washington condominium resale purchase offer' : 'Washington residential purchase offer', 'Original NavStreet agreement for an ordinary residential resale. Required seller disclosures remain separate uploaded documents. Acceptance requires all required parties to sign the same version and communicate acceptance. Read all terms and attachments before signing.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Washington', t.property.zipCode].filter(Boolean).join(', '));
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
  clause('9. Separate disclosures and actual receipt', `Seller disclosure or signed exception evidence: ${t.disclosures.propertyConditionStatus === 'exempt' ? 'Signed Washington statutory exemption evidence reviewed' : receiptLabel(t.disclosures.propertyConditionStatus)}. Property-specific statutory/local packet: ${receiptLabel(t.disclosures.statutoryPacketStatus)}. Seller reports an association: ${answer(t.disclosures.sellerReportsHoa)}; association documents: ${receiptLabel(t.disclosures.hoaDocumentsStatus)}. Seller reports existing leases: ${answer(t.disclosures.sellerReportsExistingLeases)}; buyer reviewed the lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. A received status records the buyer’s actual review of the uploaded document, including any identified exception evidence; it does not certify the truth of seller statements or waive protected rights. Seller must promptly provide applicable written amendments and updated information before closing.`);
  clause("Washington seller disclosure and protected rescission", "For covered improved residential transfers under chapter 64.06 RCW, seller shall provide the completed, signed and dated statutory disclosure statement, ordinarily within five business days after mutual acceptance unless otherwise agreed. Buyer ordinarily has three business days after receipt to deliver written rescission under RCW 64.06.030, with immediate return of deposits and other consideration less agreed disbursements. This agreement does not waive receipt or shorten that statutory period. Missing-form and later-inaccuracy rights, corrective-action provisions and required closing extensions under RCW 64.06.040 remain. A Pending selection permits the offer but does not certify delivery or waive rights. A Received selection is not acceptance of the disclosure or execution of the separate buyer acknowledgment. This workflow permits only supported statutory transfer exceptions, not a buyer waiver. If any Environmental answer would be Yes, receipt of that section cannot be waived under RCW 64.06.010(7).");
  clause("Washington property and community records", "Use the prescribed RCW 64.06.020 form, including title, water, sewage, structure, systems, association and environmental information and attachments. Provide applicable locally required notices under RCW 64.06.080 and known tank/leak, well, septic and environmental records. For a community governed by RCW 64.90.640, obtain the resale certificate and records, and preserve its five-business-day cancellation protections and conveyance limits, including when supplied shortly before contract execution. Determine the actual declaration, creation date, governing statute and exceptions; older community regimes may differ and January 2028 changes are not applied early. Seller shall comply with applicable smoke and carbon-monoxide alarm requirements before occupancy. This agreement creates no automatic earnest-money forfeiture or exclusive liquidated-damages election; RCW 64.04.005 has a five-percent statutory safe harbor for qualifying separate provisions.");
  clause("Washington farm and working forest notice", "This notice is to inform you that the real property you are considering for purchase may lie in close proximity to a farm or working forest. The operation of a farm or working forest involves usual and customary agricultural practices or forest practices, which are protected under RCW 7.48.305, the Washington right to farm act.");
  clause("Washington heating oil tank notice", "This notice is to inform you that if the real property you are considering for purchase utilizes an oil tank for heating purposes, no cost insurance may be available from the pollution liability insurance agency.");
  clause("Washington registered offender notice", "INFORMATION REGARDING REGISTERED SEX OFFENDERS MAY BE OBTAINED FROM LOCAL LAW ENFORCEMENT AGENCIES. THIS NOTICE IS INTENDED ONLY TO INFORM YOU OF WHERE TO OBTAIN THIS INFORMATION AND IS NOT AN INDICATION OF THE PRESENCE OF REGISTERED SEX OFFENDERS.");
  if (condominium) {
    clause('Condominium property and title', 'The property conveyed is the seller-owned condominium unit described in the recorded legal description, together with its appurtenant allocated common-element interests and limited common-element, parking and storage rights actually attached to that unit under the recorded declaration and lawful amendments. No additional exclusive parking, storage, rental, occupancy or alteration right is promised by a physical property label. Seller shall provide available governing records; closing shall verify unit identity, allocated interests, restrictions, assessments, association approval or first-refusal rights and title. Buyer is not required to invent missing seller information. Ordinary common expenses are prorated at closing; the negotiated special-assessment and transfer-fee allocations apply subject to statutory protections. Only an existing fee-simple resale with cash or conventional financing is covered; developer, leasehold and public-offering sales require a separate agreement.');
    clause('Condominium resale certificate and protected rights', 'For an ordinary condominium resale, seller shall furnish the applicable association resale certificate and governing records before execution of the sale contract or otherwise before conveyance. Under RCW 64.34.425, buyer may void the contract until the certificate is provided and for five days thereafter or until conveyance, whichever occurs first. Under RCW 64.90.640, buyer generally has five business days after first receipt to cancel; receipt more than five business days before execution eliminates that statutory cancellation right. If received five business days or less before signing, cancellation notice is due no later than the fifth business day after first receipt and before conveyance. Receipt less than five business days before closing permits buyer, before conveyance, to extend closing to no more than five business days after first receipt. Preserve statutory notice methods, assessment protections and deposit remedies. Chapter 64.90 generally governs communities created on or after July 1, 2018 or earlier communities electing it, subject to statutory exceptions; RCW 64.34.010 extends resale provisions to older condominiums subject to its limits. Do not apply the January 2028 transition early. Developer/public-offering sales and statutory transfer exceptions require separate review. This agreement does not elect a statutory exemption or waive receipt, cancellation or closing-extension rights. A pending entry permits an offer and is not proof of delivery. A buyer need not supply project, unit, common-element, parking or storage information absent from the seller records.');
  } else {
  clause("Washington supported scope", "This original NavStreet agreement supports existing fee-simple single-family, townhome and PUD resales with cash or conventional financing. Condominiums, manufactured homes, vacant land, new construction/developer offerings, ground leases, installment seller financing and wholesale assignments require separate agreements and are outside this initial product. These product limits do not narrow statutory coverage. Closing shall verify the recorded legal description, owners, necessary spouse signatures, liens, deed execution, recording, taxes, assessments and local transfer requirements. Seller tax bills do not guarantee buyer taxes. Closing shall evaluate community-property, homestead and necessary spouse or registered domestic partner interests.");
  }
  clause('Federal lead disclosure and inspection', `Lead packet status: ${receiptLabel(t.disclosures.leadPaintStatus)}. For covered pre-1978 housing, seller shall provide known lead information, available reports, the signed federal statement and EPA pamphlet before buyer is bound. Inspection selection: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : 'Buyer waives the inspection opportunity in writing' : 'See separate exemption evidence or post-1977 construction record'}. The inspection opportunity runs before buyer becomes bound unless the parties agree to a different period in writing. Choosing 10 days does not defer mandatory disclosures until after acceptance. Waiver of inspection does not waive disclosure. The required federal warning and certifications remain in the separately signed lead attachment, which must be retained for the required period.`);
  clause('10. Default and remedies', 'A party’s material failure to perform permits the other party to give written notice and pursue available remedies under Washington law, subject to any applicable notice, cure or statutory requirements. No automatic forfeiture or exclusive remedy is created here. The parties may obtain independent advice about damages, performance, cancellation and lawful escrow disbursement. Statutory and nonwaivable rights are preserved.');
  clause('11. Notices and electronic consent', `The initiating party’s express electronic delivery and signing consent: ${answer(t.delivery.electronicDeliveryAuthorized)}. Each later signer must separately consent in the signing workflow; this entry does not supply consent for another person. Contract notices must be written and delivered to the parties’ designated addresses or electronic destinations where legally permitted. Statutory notice methods and periods apply when required by law. This offer expires at the stated time unless the required initiating signatures and delivery occur before expiration.`);
  clause('12. Additional negotiated terms', t.additionalTerms || 'None.');
  if (!condominium) clause('13. Entire agreement and amendments', 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Parties have the opportunity to obtain independent legal advice before signing. This resale agreement does not cover condominium/developer offerings, new-construction sales, vacant land, installment seller financing or other transactions requiring a different agreement.');
  if (condominium) clause('13. Entire agreement and amendments', 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Each party may obtain independent legal advice.');
  if (condominium && t.documentVersions) for (const [type, version] of Object.entries(t.documentVersions)) line('Buyer reviewed disclosure version', `${type}: ${version}`);
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
      stateName: 'Washington',
      ...(condominium ? {agreementTitle:'Washington Condominium Resale Purchase and Sale Agreement'} : {}),
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-WA-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
