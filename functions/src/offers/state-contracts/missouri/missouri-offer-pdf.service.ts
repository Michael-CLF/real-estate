import { MISSOURI_CONTRACT_NAMES, isMissouriContractCompatible } from './missouri-contract-selection';
import { formatTimestamp } from '../property-time-format';

import PDFDocument from 'pdfkit';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { MissouriOfferTermsDocument } from './missouri-offer-terms.document';
import type { OfferVersionPartySnapshotDocument } from '../../offer-types';
import {
  NAVSTREET_PDF,
  drawNavStreetNotice,
  drawNavStreetPdfChrome,
  drawNavStreetSectionBar,
  registerNavStreetPdfFonts,
} from '../navstreet-pdf-layout';

/** Renders NavStreet-authored terms; seller disclosures remain separate signed attachments. */
export async function generateMissouriOfferPdf(input: GenerateStateAgreementInput<MissouriOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms;
  if (!isMissouriContractCompatible(t.contractType,t.property.propertyType,t.property.contractFacts)) throw new Error('The selected Missouri agreement does not match the property ownership snapshot.');
  const condo=t.contractType==='navstreet_missouri_condominium_resale_2026';
  const land=t.contractType==='navstreet_missouri_land_sale_2026';
  const multi=t.contractType==='navstreet_missouri_small_multifamily_resale_2026';
  if((condo||land||multi)&&!t.specialProperty)throw new Error('The property-specific Missouri agreement terms are missing.');
  const pdf = new PDFDocument({ size: 'LETTER', margins: { top: NAVSTREET_PDF.contentTop, right: NAVSTREET_PDF.margin, bottom: 58, left: NAVSTREET_PDF.margin }, bufferPages: true, info: { Title: input.documentTitle, Author: 'NavStreet', Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`, Keywords: 'NavStreet, Missouri, residential real estate, purchase agreement', CreationDate: input.generatedAt } });
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
    if (fullHeight < NAVSTREET_PDF.contentBottom - NAVSTREET_PDF.contentTop - 40 && pdf.y + fullHeight > NAVSTREET_PDF.contentBottom) page('Missouri agreement (continued)');
    const words = body.split(/\s+/);
    let continued = false;
    while (words.length) {
      if (pdf.y + 95 > NAVSTREET_PDF.contentBottom) page('Missouri agreement (continued)');
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
      if (words.length) {page('Missouri agreement (continued)');continued = true;}
    }
  }
  const money = (cents: number) => `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const receiptLabel = (value: string) => value === 'built_1978_or_later' ? 'Listing records construction after 1977' : value === 'exempt' ? 'Signed federal exemption evidence received' : value === 'unselected' ? 'Not answered' : value.replace(/_/g, ' ');
  const answer = (v: boolean | null) => v === null ? 'No selection' : v ? 'Yes' : 'No';
  const names = (parties: OfferVersionPartySnapshotDocument[]) => parties.map(p => p.legalName).join('; ');
  pdf.y = NAVSTREET_PDF.contentTop;
  drawNavStreetNotice(pdf, (condo||land||multi) ? MISSOURI_CONTRACT_NAMES[t.contractType] : 'Missouri residential purchase offer', (condo||land||multi) ? 'Original NavStreet agreement for the identified property and sale type. Applicable seller disclosures and property records remain separate uploaded documents. Acceptance requires all required parties to sign the same version and communicate acceptance. Read all terms and attachments before signing.' : 'Original NavStreet agreement for an ordinary residential resale. Required seller disclosures remain separate uploaded documents. Acceptance requires all required parties to sign the same version and communicate acceptance. Read all terms and attachments before signing.');
  drawNavStreetSectionBar(pdf, 'Parties, property and negotiated terms');
  line('Property', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Missouri', t.property.zipCode].filter(Boolean).join(', '));
  line('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  line('Property time zone', t.delivery.timeZone);
  line('Legal description', t.legalDescription);
  line('Buyer(s)', names(input.version.buyers)); line('Seller(s)', names(input.version.sellers));
  clause('1. Purchase and written agreement', `Buyer offers to purchase the identified property from seller for ${money(t.purchase.purchasePriceInCents)}. Seller concessions toward buyer expenses: ${money(t.purchase.sellerConcessionsInCents)}. This version becomes binding upon the required signatures and communication of acceptance. The effective date is the final required acceptance signature date, provided acceptance is communicated. A counteroffer is a new version requiring new signatures. Parties shall identify all owners and required signers; signing this offer does not dispense with spouses or other persons whose joinder is required for a valid conveyance.`);
  clause('2. Earnest money', t.purchase.hasEarnestMoney ? `Buyer shall deliver ${money(t.purchase.earnestMoneyInCents)} to ${t.purchase.earnestMoneyHolder} within ${t.purchase.earnestMoneyDueDays} calendar days after the effective date. ${t.conditions.additionalEarnestMoney ? `Additional earnest money of ${money(t.purchase.additionalEarnestMoneyInCents)} is due within ${t.purchase.additionalEarnestMoneyDueDays} calendar days after the effective date.` : 'No additional deposit is due.'} Deposits are credited to buyer at closing. The holder shall maintain and disburse them under this agreement and applicable law. Disputed funds require lawful disbursement, signed joint instructions or a court order.` : 'No earnest money deposit is required by this version.');
  clause('3. Included property and leases', `Existing improvements and installed fixtures are included except those expressly excluded. Additional personal property included: ${t.propertyItems.included || 'None specified'}. Exclusions: ${t.propertyItems.excluded || 'None specified'}. Leased equipment and proposed assignments: ${t.propertyItems.leasedItemsDescription || 'None specified'}. Seller shall identify existing tenancies and leases. Any continuing tenancy, equipment lease or post-closing occupancy requires separately signed arrangements and applicable third-party consent. This agreement alone does not assign a third-party lease.`);
  if(condo) {
    if(t.condominiumOfferEntryRevision === '2026-10-19') {
      // Omit absent supplementary details; do not invent a project, unit or allocation of rights.
      for(const [label,value] of [['Condominium project',t.specialProperty?.projectName],['Recorded unit',t.specialProperty?.unitDesignation],['Common and limited common elements',t.specialProperty?.commonElements],['Parking and storage',t.specialProperty?.parkingStorage]]) if(value?.trim())line(label!,value);
    } else {
    line('Condominium project',t.specialProperty!.projectName);line('Recorded unit',t.specialProperty!.unitDesignation);
    line('Common and limited common elements',t.specialProperty!.commonElements);line('Parking and storage',t.specialProperty!.parkingStorage);
    }
  }
  if(land)line('Intended land use',t.specialProperty!.intendedUse);
  if(multi)line('Seller-reported dwelling units',t.property.contractFacts?.dwellingUnitCount);
  page('Conditions, title and closing');
  clause('4. Financing', `Funding: ${t.purchase.financingType}. ${t.purchase.financingType === 'cash' ? 'Buyer will pay cash and has no financing or appraisal condition.' : `Proposed loan: ${money(t.purchase.loanAmountInCents)} over ${t.purchase.loanTermYears} years. Loan approval condition: ${answer(t.conditions.financing)}. Appraisal condition: ${answer(t.conditions.appraisal)}. ${t.conditions.financing ? `Buyer shall apply in good faith within ${t.purchase.loanApplicationDays} calendar days after the effective date and seek approval within ${t.purchase.loanApprovalDays} calendar days after the effective date. Buyer may terminate by written notice delivered within that approval period if the loan cannot be obtained despite good-faith efforts; the deposit shall be returned subject to lawful escrow disbursement.` : 'Buyer assumes the financing risk without a loan-approval cancellation right.'} ${t.conditions.appraisal ? `If the lender appraisal is insufficient for the stated loan, buyer may terminate by written notice within ${t.purchase.loanApprovalDays} calendar days after the effective date and recover the deposit, unless different terms are agreed in writing.` : 'No appraisal cancellation right is selected.'}`} Purchase conditioned on sale of buyer’s other property: ${answer(t.conditions.saleOfBuyersProperty)}. If selected, the identified property, sale deadline and cancellation consequences must be written in Additional terms.`);
  clause('5. Inspection and condition', `Buyer has ${t.deadlines.inspectionPeriodDays} calendar days after the effective date to inspect the property, including structural, environmental, radon, water, sewer and septic conditions as appropriate. Buyer may terminate by written notice delivered before the inspection period expires if the property is unacceptable, and the deposit shall be returned subject to lawful escrow disbursement. Buyer shall repair damage caused by inspections. Seller has no obligation to make requested repairs unless agreed in writing. Seller shall maintain the property substantially in its acceptance condition, ordinary wear excepted. Inspection rights do not waive statutory disclosures, fraud remedies or other nonwaivable rights.`);
  clause('6. Time and closing date', `Closing shall occur by ${t.deadlines.settlementDate}. Optional additional document date: ${t.deadlines.sellerDisclosureDate || 'None'}. Contract periods measured in calendar days begin on the day following the effective date and expire at 11:59 p.m. in ${t.delivery.timeZone}. A fixed contract date expires at that same property-local time. Statutory periods use their own governing rules. The optional document date does not extend a statutory delivery deadline. Offer expiration: ${formatTimestamp(new Date(t.delivery.expiresAt), t.delivery.timeZone)}.`);
  clause('7. Title and conveyance', `Closing agent: ${t.settlement.closingAgentName}. The owner’s title insurance policy and search are paid by ${t.settlement.titlePolicyPayer}. Seller shall provide evidence of marketable title at least ${t.settlement.titleEvidenceDaysBeforeClosing} calendar days before closing. Buyer shall promptly identify title objections in writing. Seller shall cure objections by closing or obtain an agreed written extension. If an uncured objection prevents marketable title, buyer may terminate and recover deposits or accept the defect in writing. Seller shall convey by recordable deed, free of liens requiring payoff, subject to recorded exceptions accepted by buyer. All legally necessary owners and spouses must join in conveyance. This agreement does not provide seller financing or an installment contract for deed.`);
  clause('8. Allocations, casualty and possession', `Taxes, periodic dues and utilities shall be prorated at closing using available current information, with later adjustment by written agreement if needed. Seller is responsible for seller’s liens and obligations that must be discharged to convey title. Pre-closing special assessments are paid by ${t.settlement.specialAssessmentPayer}; association transfer fees, if applicable, by ${t.disclosures.sellerReportsHoa ? t.settlement.hoaTransferFeePayer : 'not applicable'}. Material casualty before closing permits buyer to terminate and recover deposits or agree in writing to restoration or assignment of available insurance rights. Seller shall deliver vacant possession and keys at closing unless a separately signed occupancy or tenancy agreement states otherwise.`);
  page('State disclosures and protected rights');
  clause('9. Separate disclosures and actual receipt', `Seller disclosure or signed exception evidence: ${t.disclosures.propertyConditionStatus === 'exempt' ? 'Signed Missouri statutory exemption evidence reviewed' : receiptLabel(t.disclosures.propertyConditionStatus)}. Property-specific statutory/local packet: ${receiptLabel(t.disclosures.statutoryPacketStatus)}. Seller reports an association: ${answer(t.disclosures.sellerReportsHoa)}; association documents: ${receiptLabel(t.disclosures.hoaDocumentsStatus)}. Seller reports existing leases: ${answer(t.disclosures.sellerReportsExistingLeases)}; buyer reviewed the lease statement: ${answer(t.disclosures.leaseStatementAcknowledged)}. A received status records the buyer’s actual review of the uploaded document, including any identified exception evidence; it does not certify the truth of seller statements or waive protected rights. Seller must promptly provide applicable written amendments and updated information before closing.`);
  clause("Missouri known methamphetamine and conviction disclosures", "Under RSMo 442.606(1), seller shall disclose in writing known prior methamphetamine production on the premises regardless of whether anyone was convicted. Under subsection (2), seller shall also disclose covered residence, storage-site or laboratory history involving the specified methamphetamine-related convictions when seller knew or should have known of those convictions. These are distinct tests. The written disclosure must describe the known history and available remediation records; a claim of cleanup does not automatically erase disclosure duties. Required history must be reviewed before either party signs this agreement.");
  clause("Missouri material facts and inspection", "This agreement does not represent a proprietary association seller form as universally mandated by Missouri statute. A general seller condition report may remain pending, but that does not excuse truthful disclosure, known material defects, fraud/concealment rules, applicable federal lead requirements or the specific statutory duties above. Buyer shall investigate structure, environmental conditions, water/septic systems, easements and insurability during the negotiated inspection period. RSMo 442.600 addresses psychologically impacted property; it does not authorize false statements or override RSMo 442.606.");
  clause("Missouri title, taxes and separate documents", "RSMo 432.010 requires the applicable signed writing and written agent authority for land sale contracts. Title shall verify all necessary owners, marital/homestead interests, legal description, deed execution, liens, recorded restrictions and recording. Seller shall provide known leases and association records when applicable; no universal pre-offer HOA upload or generic state cooling-off period is created. Seller property tax history does not guarantee buyer assessments or charges. Applicable local permit, occupancy, sewer/septic and transfer obligations remain.");
  if(condo) {
    clause('Condominium unit and common elements', `The sale includes the recorded unit and its appurtenant common-element interests, ${t.condominiumOfferEntryRevision === '2026-10-19' ? 'together with parking/storage and limited common-element rights appurtenant to the unit under the recorded declaration and title, subject to any express written exclusions in this agreement.' : 'together with only those parking/storage and limited common-element rights identified above and verified by the declaration and title.'} Seller shall identify transfer restrictions, association approval or first-refusal rights, current dues, unpaid assessments, special assessments and known planned expenditures. No unattached parking space or separate property is transferred merely by a description here. Title and association requirements must be satisfied before conveyance.`);
    clause('Condominium resale packet and protected rights', `Complete packet status recorded by buyer: ${t.condominiumOfferEntryRevision === '2026-10-19' && (!t.specialProperty || t.specialProperty.resaleCertificateStatus === 'unselected') ? 'Not recorded; buyer has not acknowledged receipt' : t.specialProperty!.resaleCertificateStatus}; actual receipt date, if already received: ${t.specialProperty?.certificateReceivedDate || (t.condominiumOfferEntryRevision === '2026-10-19' ? 'Not recorded' : 'Pending')}. Seller shall request and provide the resale certificate and declaration, bylaws and rules, with assessment/fee balances, anticipated capital expenditures, reserves, financial statements and budget, judgments/litigation, insurance, known nonconforming alterations and applicable leasehold information. For a covered resale under RSMo 448.4-109, the association has ten days after the owner’s request to furnish the certificate information. Buyer’s statutory right to void continues until provision and for five days afterward or until conveyance, whichever occurs first. The statutory limits on unpaid assessments and seller liability for association-supplied errors and delay remain. Confirm RSMo 448.1-102 and 448.4-101 applicability, older declarations and enumerated exceptions; no exemption is assumed${t.condominiumOfferEntryRevision === '2026-10-19' ? '' : ' from this dropdown'}. Independently of statutory coverage, this agreement requires the applicable association packet, permits buyer to cancel in writing until its complete receipt and for five calendar days afterward before conveyance, and requires seller to provide material updates before closing. Closing shall allow that contractual review period unless buyer gives a legally permissible separate written waiver. Uploading is not proof of actual provision or receipt, and no inspection deadline waives applicable statutory rights.`);
  }
  if(land) {
    clause('Vacant land investigation and survey', `This sale covers the described vacant parcel and appurtenant rights shown by title, not a dwelling, manufactured home, operating farm business or developer package. Intended use: ${t.specialProperty!.intendedUse}. Current boundary survey required before closing: ${answer(t.specialProperty!.surveyRequired)}; buyer arranges and pays for the survey unless additional terms specify otherwise. Seller shall permit reasonable investigation of legal access, boundaries, easements, recorded restrictions, zoning/subdivision and intended-use feasibility, utilities and connection costs, potable water and septic feasibility, drainage/flood hazards, environmental conditions and mineral/water interests during the inspection period. Buyer may cancel in writing within that period if the property is unsuitable and recover deposits under the inspection contingency. Seller shall supply known records and disclose known material hazards; no zoning, utility or buildability guarantee is inferred from advertising. If the required survey is not provided before closing, buyer may elect a written extension or terminate and recover deposits.`);
  }
  if(multi) {
    clause('Two to four dwelling units and tenancy transfer', `Seller reports ${t.property.contractFacts?.dwellingUnitCount} dwelling units. This agreement covers an existing two-to-four-unit residential property; condominium units, larger apartment projects and developer transactions require different agreements. Tenant records status: ${t.specialProperty!.tenantDocumentsStatus}. Seller shall promptly provide leases and amendments, current rent roll, security deposits/prepaid rents, concessions, notices and known tenant disputes, with updates before closing. Existing lawful tenancies remain in force unless lawfully terminated independently; this sale does not authorize eviction, deposit forfeiture or unilateral lease changes. Seller shall convey the landlord’s interest, assign transferable leases and account for rents, deposits and prepaid amounts at closing; no liability is shifted contrary to Missouri tenant law. Buyer shall review these matters within the inspection period and may cancel under that contingency. Required records and a complete rent/deposit accounting must be provided before closing; if not, buyer may elect a written extension or terminate and recover deposits. Buyer and closing agent shall verify rental permits, lawful unit count, insurance and safety/code issues. The possession provision is subject to the disclosed continuing tenancies.`);
  }
  clause('Missouri supported transaction scope', (condo||land||multi) ? 'This selected agreement covers the identified ordinary condominium resale, vacant parcel or qualifying two-to-four-unit residential resale, with cash or conventional financing. Manufactured/mobile homes, developer/new construction, operating farm/business assets, installment seller financing, leasehold and wholesale assignments are outside this agreement. Recorded ownership and property-specific terms control; a physical property label does not establish legal classification.' : 'This original NavStreet agreement supports ordinary existing fee-simple single-family, townhome and PUD resale transactions with cash or conventional financing. Condominium, vacant land, manufactured/mobile homes, new construction/developer, installment seller financing, leasehold and wholesale assignment transactions require separate review and are outside this initial agreement. The parties must disclose any unsupported transaction structure to title/closing professionals and must not rely on a dropdown to establish legal eligibility.');
  if(!land)clause('Federal lead disclosure and inspection', `Lead packet status: ${receiptLabel(t.disclosures.leadPaintStatus)}. For covered pre-1978 housing, seller shall provide known lead information, available reports, the signed federal statement and EPA pamphlet before buyer is bound. Inspection selection: ${t.disclosures.leadPaintStatus === 'received' ? t.disclosures.leadInspectionSelection === 'ten_days' ? '10 days' : t.disclosures.leadInspectionSelection === 'other_period' ? `${t.disclosures.leadInspectionDays} days agreed in writing` : 'Buyer waives the inspection opportunity in writing' : 'See separate exemption evidence or post-1977 construction record'}. The inspection opportunity runs before buyer becomes bound unless the parties agree to a different period in writing. Choosing 10 days does not defer mandatory disclosures until after acceptance. Waiver of inspection does not waive disclosure. The required federal warning and certifications remain in the separately signed lead attachment, which must be retained for the required period.`);
  clause('10. Default and remedies', 'A party’s material failure to perform permits the other party to give written notice and pursue available remedies under Missouri law, subject to any applicable notice, cure or statutory requirements. No automatic forfeiture or exclusive remedy is created here. The parties may obtain independent advice about damages, performance, cancellation and lawful escrow disbursement. Statutory and nonwaivable rights are preserved.');
  clause('11. Notices and electronic consent', `The initiating party’s express electronic delivery and signing consent: ${answer(t.delivery.electronicDeliveryAuthorized)}. Each later signer must separately consent in the signing workflow; this entry does not supply consent for another person. Contract notices must be written and delivered to the parties’ designated addresses or electronic destinations where legally permitted. Statutory notice methods and periods apply when required by law. This offer expires at the stated time unless the required initiating signatures and delivery occur before expiration.`);
  clause('12. Additional negotiated terms', t.additionalTerms || 'None.');
  clause('13. Entire agreement and amendments', (condo||land||multi) ? 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Parties have the opportunity to obtain independent legal advice before signing. This selected agreement does not cover developer/new-construction sales, manufactured/mobile homes, leasehold, installment seller financing or other transactions outside its stated scope.' : 'This version and expressly identified signed attachments constitute the agreement. Amendments require a signed written version. Additional terms cannot override nonwaivable statutory protections. Parties have the opportunity to obtain independent legal advice before signing. This resale agreement does not cover condominium/developer offerings, new-construction sales, vacant land, installment seller financing or other transactions requiring a different agreement.');
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
      stateName: 'Missouri',
      ...((condo||land||multi) ? {agreementTitle: `Missouri ${condo ? 'condominium resale' : land ? 'vacant land' : 'two to four unit'} purchase\nand sale agreement`} : {}),
      referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber,
      pageNumber: index + 1,
      pageCount,
    });
  }
  pdf.end();
  return { buffer: await done, fileName: `NavStreet-MO-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}
