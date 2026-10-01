import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import type { GenerateStateAgreementInput, GeneratedStateAgreement } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { COLORADO_DEADLINE_KEYS } from './colorado-initial-terms';
import { NAVSTREET_PDF, drawNavStreetPdfChrome, drawNavStreetSectionBar, registerNavStreetPdfFonts } from '../navstreet-pdf-layout';

const money = (value: number) => `$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const label = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
const yesNo = (value: boolean | null) => value === true ? 'Yes' : value === false ? 'No' : 'Unanswered';

/** An original NavStreet agreement; the Colorado CBS1 PDF remains a research reference. */
export async function generateLegacyColoradoOfferPdf(input: GenerateStateAgreementInput<ColoradoOfferTermsDocument>): Promise<GeneratedStateAgreement> {
  const t = input.version.terms, p = t.purchase, c = t.conditions, d = t.deadlines;
  const pdf = new PDFDocument({ size: 'LETTER', bufferPages: true,
    margins: { top: NAVSTREET_PDF.contentTop, bottom: 32, left: NAVSTREET_PDF.margin, right: NAVSTREET_PDF.margin },
    info: { Title: input.documentTitle, Author: 'NavStreet', CreationDate: input.generatedAt } });
  registerNavStreetPdfFonts(pdf);
  const chunks: Buffer[] = [];
  pdf.on('data', data => chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);
  });
  function section(title: string): void {
    if (pdf.y > NAVSTREET_PDF.contentBottom - 60) pdf.addPage();
    drawNavStreetSectionBar(pdf, title);
  }
  function paragraph(title: string, body: string): void {
    pdf.font('NavStreet-Regular').fontSize(9.5);
    if (pdf.y + pdf.heightOfString(body, { width: 508, lineGap: 2 }) + 55 > NAVSTREET_PDF.contentBottom) pdf.addPage();
    section(title);
    pdf.font(title.startsWith('Statutory ') ? 'NavStreet-Bold' : 'NavStreet-Regular').fontSize(9.5).fillColor(NAVSTREET_PDF.ink)
      .text(body, NAVSTREET_PDF.margin + 10, pdf.y + 2, { width: 508, lineGap: 2 });
    pdf.y += 12;
  }
  function row(name: string, value: string): void {
    pdf.font('NavStreet-Regular').fontSize(9);
    const height = Math.max(26, pdf.heightOfString(value, { width: 315 }) + 12);
    if (pdf.y + height > NAVSTREET_PDF.contentBottom) pdf.addPage();
    const y = pdf.y;
    pdf.rect(NAVSTREET_PDF.margin, y, NAVSTREET_PDF.contentWidth, height - 2).fill(NAVSTREET_PDF.pale);
    pdf.font('NavStreet-Bold').fillColor(NAVSTREET_PDF.ink).fontSize(9)
      .text(name, NAVSTREET_PDF.margin + 8, y + 6, { width: 180 });
    pdf.font('NavStreet-Regular').text(value, NAVSTREET_PDF.margin + 196, y + 6, { width: 315 });
    pdf.y = y + height;
  }
  pdf.y = NAVSTREET_PDF.contentTop;
  section('Parties and property');
  row('Buyer(s)', input.version.buyers.map(x => x.legalName).join('; '));
  row('Seller(s)', input.version.sellers.map(x => x.legalName).join('; '));
  row('Address', [t.property.addressLine1, t.property.addressLine2, t.property.city, 'Colorado', t.property.zipCode].filter(Boolean).join(', '));
  row('County / parcel', `${t.property.county || 'Unspecified'} / ${t.property.parcelIdentificationNumber || 'Unspecified'}`);
  row('Seller legal description', t.legalDescription);
  paragraph('1. Conveyance', `Seller agrees to convey and Buyer agrees to purchase the property described above and attached improvements for ${money(p.purchasePriceInCents)} on the terms in this signed version. Deed: ${label(c.deedType)}. Included property: ${t.propertyItems.included || 'attached fixtures'}; excluded property: ${t.propertyItems.excluded || 'none specified'}; leased items: ${t.propertyItems.leasedItems || 'none specified'}. Seller-owned water rights: ${t.propertyItems.waterRights || 'none specified'}; well permit: ${t.propertyItems.wellPermit || 'none specified'}; mineral rights: ${t.propertyItems.mineralRights || 'none specified'}.`);
  paragraph('2. Price and funds', `Price ${money(p.purchasePriceInCents)}; earnest money ${money(p.earnestMoneyInCents)} in the form ${p.earnestMoneyForm || 'not applicable'} to ${p.earnestMoneyHolder || 'not applicable'} by the listed date; Buyer cash at closing ${money(p.cashAtClosingInCents)}; Seller concessions ${money(p.sellerConcessionsInCents)}. Buyer states available cash: ${yesNo(p.availableCashConfirmed)}. Disputed earnest money is held until written joint direction or a lawful order.`);
  if (p.financingType === 'new_loan')
    paragraph('3. New financing', `Buyer proposes a ${label(p.newLoanType)} loan for ${money(p.newLoanAmountInCents)} and must apply and use diligent efforts by the listed application date. Any objection to the loan terms or unavailability of financing requires written notice by the corresponding deadline. No loan is guaranteed by this agreement.`);
  else if (p.financingType === 'assumption') {
    const loan = t.sellerLoan!, a = p.assumption;
    const escrow = [
      loan.escrowRealEstateTaxes ? 'real estate taxes' : '',
      loan.escrowPropertyInsurance ? 'property insurance premiums' : '',
      loan.escrowMortgageInsurance ? 'mortgage insurance premiums' : '',
      loan.escrowOther?.trim() ?? '',
    ].filter(Boolean).join(', ') || 'none indicated';
    paragraph('3. Existing loan assumption',
      `Buyer proposes to assume the existing loan with an approximate balance of ${money(loan.estimatedBalanceInCents)} as of ${loan.balanceAsOf}. Seller reports a current principal and interest payment of ${money(loan.principalInterestPaymentInCents)} per ${loan.paymentPeriod}, at ${loan.ratePercent}% annual interest, with escrow for ${escrow}. The lender must approve the assumption in writing. Buyer will pay a transfer fee up to ${money(a.maxTransferFeeInCents)}. At assumption, the annual rate may not exceed ${a.maxRatePercent}% and principal and interest may not exceed ${money(a.maxPaymentInCents)} per ${a.maxPaymentPeriod}, plus escrow if applicable. If the actual balance at closing is below the stated assumption balance and increases Buyer's required cash by more than ${money(a.maxCashIncreaseInCents)}, or if other loan terms change, Buyer may terminate by written notice on or before closing. Seller ${a.sellerReleaseRequired ? 'will' : 'will not'} be released from liability on the existing loan.${a.sellerReleaseRequired ? ` Evidence of release will be a lender commitment letter delivered ${a.releaseEvidenceTiming === 'closing' ? 'at closing' : 'by the loan transfer approval deadline'}. The release cost will be paid by ${a.releaseCostPayer} up to ${money(a.maxReleaseCostInCents)}. If the lender cannot provide the elected release on time, Buyer may terminate by written notice on or before closing.` : ''} If the lender's written consent to the assumption is not received by both parties and the closing company on or before closing, this agreement terminates. Existing loan document and approval deadlines appear below.`);
  } else paragraph('3. Cash purchase', 'Buyer will deliver the remaining purchase price in good funds at closing.');
  paragraph('4. Conditions and allocations', `Inspection: ${yesNo(c.inspection)}. Appraisal: ${yesNo(c.appraisal)}. Sale of Buyer property: ${yesNo(c.saleOfBuyerProperty)}${c.saleOfBuyerProperty ? ` at ${c.saleOfBuyerPropertyAddress}` : ''}. New survey or ILC: ${c.newSurvey}, paid by ${c.surveyPayer}. Owner title policy paid by ${c.ownerTitlePolicyPayer}; closing fee by ${c.closingFeePayer}; special assessments by ${c.specialAssessmentPayer}. Condition objections, resolutions and termination notices must be delivered in writing by their respective deadlines. Seller must maintain property in substantially its accepted condition, ordinary wear excepted, through possession; access for lawful inspections and a final walk-through will be provided by arrangement.`);
  paragraph('5. Title and documents', 'Seller must furnish title information, known off-record matters, the Seller Property Disclosure, and any applicable association documents by their listed dates. Buyer may object to title, survey, property condition, insurance, water and mineral matters by their applicable objection dates. A written resolution or termination must follow by the specified resolution deadline. Taxes, dues, rents and utilities will be prorated at closing unless separately agreed in writing. Material casualty or failure of title before closing is subject to available Colorado remedies and any signed amendment.');
  pdf.addPage(); pdf.y = NAVSTREET_PDF.contentTop;
  paragraph('6. Dates and deadlines', `Dates use America/Denver local time and expire at ${d.timeOfDay} unless a different time is specified. Weekend or holiday extension chosen: ${yesNo(d.extendHoliday)}. An empty optional deadline is omitted from this agreement; statutory duties and deadlines still apply. Possession occurs on ${d.possession} at ${d.possessionTime}; delayed possession charge: ${money(c.possessionDelayChargeInCents)}.`);
  for (const key of COLORADO_DEADLINE_KEYS) row(label(key), d[key] || 'Not elected / not applicable');
  paragraph('7. Notices and time', 'A notice, objection, waiver, termination or extension must be in writing and delivered to the recipient’s designated contact by the relevant deadline, with a record of delivery. Time is of the essence. A change to a deadline or term requires a signed written amendment.');
  pdf.addPage(); pdf.y = NAVSTREET_PDF.contentTop;
  paragraph('8. Separate seller disclosures', `Buyer records actual receipt of Seller Property Disclosure: ${t.disclosures.sellerPropertyStatus}; known radon information: ${yesNo(t.disclosures.radonInformationAcknowledged)}; radon brochure: ${yesNo(t.disclosures.radonBrochureAcknowledged)}; lead packet: ${t.disclosures.leadPaintStatus}, inspection choice: ${t.disclosures.leadInspectionChoice}; association documents: ${t.disclosures.associationStatus}; potable water source statement: ${yesNo(t.disclosures.waterSourceAcknowledged)}. These are Buyer statements; Seller cannot change them in a counteroffer. Separate uploaded records must be kept with the transaction.`);
  paragraph('Statutory radon warning', 'THE COLORADO DEPARTMENT OF PUBLIC HEALTH AND ENVIRONMENT STRONGLY RECOMMENDS THAT ALL HOME BUYERS HAVE AN INDOOR RADON TEST PERFORMED BEFORE PURCHASING RESIDENTIAL REAL PROPERTY AND RECOMMENDS HAVING THE RADON LEVELS MITIGATED IF ELEVATED RADON CONCENTRATIONS ARE FOUND. ELEVATED RADON CONCENTRATIONS CAN BE REDUCED BY A RADON MITIGATION PROFESSIONAL. RESIDENTIAL REAL PROPERTY MAY PRESENT EXPOSURE TO DANGEROUS LEVELS OF INDOOR RADON GAS THAT MAY PLACE THE OCCUPANTS AT RISK OF DEVELOPING RADON-INDUCED LUNG CANCER. RADON, A CLASS A HUMAN CARCINOGEN, IS THE LEADING CAUSE OF LUNG CANCER IN NONSMOKERS AND THE SECOND LEADING CAUSE OF LUNG CANCER OVERALL. THE SELLER OF RESIDENTIAL REAL PROPERTY IS REQUIRED TO PROVIDE THE BUYER WITH ANY KNOWN INFORMATION ON RADON TEST RESULTS OF THE RESIDENTIAL REAL PROPERTY. The current state brochure is available from https://cdphe.colorado.gov/hm/radon-and-real-estate.');
  paragraph('Statutory special taxing district notice', 'SPECIAL TAXING DISTRICTS MAY BE SUBJECT TO GENERAL OBLIGATION INDEBTEDNESS PAID FROM ANNUAL PROPERTY TAX LEVIES. OWNERS MAY FACE HIGHER MILL LEVIES AND TAXES IF A DISTRICT CANNOT PAY ITS DEBT OTHERWISE. BUYERS SHOULD INVESTIGATE THE PROPERTY’S DISTRICTS THROUGH THE COUNTY TREASURER, TAX CERTIFICATE, COUNTY COMMISSIONERS, CLERK AND RECORDER, OR ASSESSOR.');
  if (t.disclosures.sellerReportsHoa === true) paragraph('Statutory common interest community notice', 'THE PROPERTY IS IN A COMMON INTEREST COMMUNITY SUBJECT TO ITS DECLARATION. OWNERS MUST JOIN THE ASSOCIATION AND FOLLOW ITS BYLAWS AND RULES, INCLUDING ASSESSMENTS. UNPAID ASSESSMENTS MAY LEAD TO A LIEN AND SALE OF THE PROPERTY. PROPERTY CHANGES MAY REQUIRE ARCHITECTURAL REVIEW AND APPROVAL. BUYERS SHOULD INVESTIGATE FINANCIAL OBLIGATIONS AND READ THE DECLARATION, BYLAWS AND RULES.');
  paragraph('Statutory mineral and water advisory', 'THE SURFACE ESTATE MAY BE OWNED SEPARATELY FROM MINERALS OR WATER RIGHTS. THIRD PARTIES MAY HOLD OIL, GAS, MINERAL, GEOTHERMAL OR WATER RIGHTS AND MAY HAVE RIGHTS TO ACCESS THE SURFACE. BUYERS SHOULD REVIEW RECORDED INTERESTS AND ANY SURFACE USE AGREEMENT.');
  paragraph('10. Default and entire agreement', `A party alleging material default must deliver written notice and may seek remedies available under Colorado law, including performance, damages and proper earnest money disposition. The parties may agree to mediate. This version and expressly incorporated signed documents form the agreement. Changes and counteroffers require a new signed writing. Additional terms: ${t.additionalTerms || 'none'}.`);
  paragraph('11. Expiration and acceptance', `This version expires at ${t.delivery.expiresAt}. A binding agreement requires all required parties to sign the same immutable version and acceptance to be communicated before expiration. Electronic signatures and delivery authorized: ${yesNo(t.delivery.electronicDeliveryAuthorized)}.`);
  section('Version signatures');
  for (const [side, parties] of [['Buyer', input.version.buyers], ['Seller', input.version.sellers]] as const) {
    for (const person of parties) {
      const signed = person.signature.status === 'signed' && person.signature.signedAt;
      row(`${side}: ${person.legalName}`, signed ? `/s/ ${person.legalName} at ${person.signature.signedAt?.toDate().toISOString()}` : 'Awaiting signature');
    }
  }
  const pageCount = pdf.bufferedPageRange().count;
  for (let index = 0; index < pageCount; index++) {
    pdf.switchToPage(index);
    drawNavStreetPdfChrome(pdf, { stateName: 'Colorado', referenceNumber: input.offer.referenceNumber,
      versionNumber: input.version.versionNumber, pageNumber: index + 1, pageCount });
  }
  pdf.end();
  let buffer = await completed;
  if (pageCount > 1) {
    // PDFKit's final buffered page retains the footer, but its SVG banner can
    // be hidden by the final page stream. Copy the rendered vector banner from
    // page one after PDFKit has finished writing the document.
    const source = await PdfLibDocument.load(buffer);
    const finished = await PdfLibDocument.load(buffer);
    const banner = await finished.embedPage(source.getPage(0), {
      left: 36, bottom: 720, right: 576, top: 768,
    });
    finished.getPages()[pageCount - 1].drawPage(banner, {
      x: 36, y: 720, width: 540, height: 48,
    });
    buffer = Buffer.from(await finished.save());
  }
  return { buffer, fileName: `NavStreet-CO-${input.offer.referenceNumber}-v${input.version.versionNumber}.pdf`, pageCount };
}