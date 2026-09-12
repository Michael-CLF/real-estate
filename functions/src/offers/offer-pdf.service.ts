import PDFDocument from 'pdfkit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import SVGtoPDF from 'svg-to-pdfkit';

import type {
  OfferDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
} from './offer-types';

const PAGE_WIDTH = 612;
const PAGE_MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - (PAGE_MARGIN * 2);
const CONTENT_TOP = 88;
const FOOTER_Y = 730;

const NAVSTREET_BLUE = '#154360';
const NAVSTREET_TEAL = '#1F7A8C';
const TEXT_COLOR = '#1B2A34';
const MUTED_COLOR = '#61727C';
const LIGHT_BACKGROUND = '#EDF5F7';
const NOTICE_BACKGROUND = '#F3FAFB';

const NAVSTREET_LOGO_SVG = readFileSync(
  join(__dirname, '../../assets/navstreet-transparent.svg'),
  'utf8'
);

const REGULAR_FONT_PATH = join(
  __dirname,
  '../../node_modules/@fontsource/barlow/files/barlow-latin-400-normal.woff'
);

const BOLD_FONT_PATH = join(
  __dirname,
  '../../node_modules/@fontsource/barlow/files/barlow-latin-700-normal.woff'
);

const ITALIC_FONT_PATH = join(
  __dirname,
  '../../node_modules/@fontsource/barlow/files/barlow-latin-400-italic.woff'
);

export interface GenerateOfferPdfInput {
  offer: OfferDocument;
  version: OfferVersionDocument;
  documentTitle: string;
  generatedAt: Date;
  documentStatus: 'prototype' | 'approved';
}

export interface GeneratedOfferPdf {
  buffer: Buffer;
  fileName: string;
  pageCount: number;
}

/** Generates the seven-page NavStreet North Carolina purchase agreement. */
export async function generateOfferPdf(
  input: GenerateOfferPdfInput
): Promise<GeneratedOfferPdf> {
  const document = new PDFDocument({
    size: 'LETTER',
    margins: {
      top: CONTENT_TOP,
      right: PAGE_MARGIN,
      bottom: 34,
      left: PAGE_MARGIN,
    },
    bufferPages: true,
    autoFirstPage: true,
    info: {
      Title: input.documentTitle,
      Author: 'NavStreet',
      Subject: `${input.documentTitle} - ${input.offer.referenceNumber}`,
      Keywords: 'NavStreet, residential real estate, offer, purchase agreement',
      CreationDate: input.generatedAt,
    },
  });

  document.registerFont('NavStreet-Regular', REGULAR_FONT_PATH);
  document.registerFont('NavStreet-Bold', BOLD_FONT_PATH);
  document.registerFont('NavStreet-Italic', ITALIC_FONT_PATH);

  const chunks: Buffer[] = [];
  document.on('data', chunk => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });

  renderPageOne(document, input);
  addAgreementPage(document, input, 2);
  renderPageTwo(document, input);
  addAgreementPage(document, input, 3);
  renderPageThree(document);
  addAgreementPage(document, input, 4);
  renderPageFour(document);
  addAgreementPage(document, input, 5);
  renderPageFive(document);
  addAgreementPage(document, input, 6);
  renderPageSix(document, input);
  addAgreementPage(document, input, 7);
  renderPageSeven(document, input);

  document.end();
  const buffer = await completed;
  return {
    buffer,
    fileName: createFileName(
      input.offer.referenceNumber,
      input.version.versionNumber,
      input.documentTitle
    ),
    pageCount: 7,
  };
}

function renderPageOne(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  renderPageChrome(document, input, 1);
  document.y = CONTENT_TOP;

  if (input.documentStatus === 'prototype') {
    document
      .fillColor('#8A5A00')
      .font('NavStreet-Bold')
      .fontSize(6.5)
      .text('PROTOTYPE TEMPLATE - NOT FOR EXECUTION', PAGE_MARGIN, document.y, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    document.moveDown(0.5);
  }

  addNoticeBox(
    document,
    'IMPORTANT AGREEMENT',
    'This document is an offer by Buyer to purchase the Property. Once Seller accepts it and acceptance is communicated to Buyer, it becomes a binding contract.\nThe negotiated terms below and the Standard Terms and Conditions are part of the same agreement. The parties should consult a North Carolina real estate attorney if they do not understand this agreement or are unsure whether it fits their transaction.'
  );
  addSectionBar(document, 'NEGOTIATED TERMS');

  const version = input.version;
  const property = version.terms.property;
  const propertyTerms = version.terms.propertyTerms;
  const purchase = version.terms.purchase;
  const deposits = version.terms.deposits;
  const concessions = version.terms.concessions;
  const settlement = version.terms.settlement;

  addTableRow(document, '1. Buyer', partyNames(version.buyers));
  addTableRow(document, '2. Seller', partyNames(version.sellers));
  addTableRow(document, '3. Property', formatPropertyAddress(asObject(property)));
  addTableRow(document, 'County', property.county || 'Not provided');
  addTableRow(
    document,
    'Parcel ID (PIN/PID)',
    property.parcelIdentificationNumber || 'Not provided'
  );
  addTableRow(
    document,
    'Deed reference',
    formatDeedReference(property.deedBook, property.deedPage)
  );
  addTableRow(
    document,
    'Other property reference',
    property.legalDescription || property.otherPropertyReference || 'Not provided'
  );
  addCheckboxRow(
    document,
    propertyTerms.manufacturedHomeIncluded,
    'A manufactured or mobile home is included.'
  );
  addCheckboxRow(
    document,
    propertyTerms.separatePropertyIncluded,
    propertyTerms.separatePropertyDescription
      ? `A separate lot, boat slip, garage, parking space, or storage unit is included: ${propertyTerms.separatePropertyDescription}`
      : 'A separate lot, boat slip, garage, parking space, or storage unit is included.'
  );
  addTableRow(
    document,
    '4. Total purchase price',
    formatCurrency(purchase.purchasePriceInCents)
  );
  addTableRow(
    document,
    'Deposit',
    `${formatCurrency(deposits.depositInCents)} - payable to the Escrow Agent within ${deposits.depositDeliveryDays} calendar days after the Effective Date`
  );
  addTableRow(
    document,
    'Balance at Settlement',
    formatCurrency(Math.max(0, purchase.purchasePriceInCents - deposits.depositInCents))
  );
  addTableRow(document, '5. How Buyer will pay', formatFinancing(purchase.financingType));
  addInlineNote(
    document,
    'This agreement is not conditioned on Buyer obtaining a loan, on any appraisal, or on the sale or lease of any other property.'
  );
  addTableRow(document, '6. Seller concessions', formatConcessions(concessions));
  addTableRow(document, '7. Due Diligence Period ends', formatDueDiligence(deposits));
  addTableRow(document, '8. Settlement date', formatDateValue(settlement.settlementDate));
  addTableRow(document, '9. Possession', formatPossession(settlement.possessionTiming));
  addTableRow(document, '10. Escrow Agent', deposits.escrowAgentName || 'Not provided');
  addTableRow(document, '11. Home warranty', formatHomeWarranty(concessions));
  addTableRow(
    document,
    '12. Additional included items',
    propertyTerms.includedItemsDescription || 'None indicated.'
  );
}

function renderPageTwo(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  const version = input.version;
  const propertyTerms = version.terms.propertyTerms;
  const delivery = version.terms.delivery;
  const disclosures = version.terms.buyerDisclosures;
  const seller = version.terms.sellerStatements;

  addTableRow(document, 'Excluded items', propertyTerms.excludedItemsDescription || 'None indicated.');
  addTableRow(document, 'Leased or seller-nonowned items', propertyTerms.leasedItemsDescription || 'None indicated.');
  addTableRow(
    document,
    '13. Additional Terms Exhibit',
    version.terms.additionalTermsExhibit.included ? 'Included.' : 'Not included.'
  );
  addTableRow(document, '14. Offer expiration', formatDateTimeValue(delivery.expiresAt));

  addSectionBar(document, 'BUYER DISCLOSURE ACKNOWLEDGMENTS');
  addTableRow(
    document,
    "Residential Property and Owners' Association Disclosure Statement",
    formatDisclosureReceipt(
      disclosures.residentialProperty.status,
      disclosures.residentialProperty.acknowledged
    )
  );
  addTableRow(
    document,
    'Mineral and Oil and Gas Rights Mandatory Disclosure Statement',
    formatDisclosureReceipt(
      disclosures.mineralOilGasRights.status,
      disclosures.mineralOilGasRights.acknowledged
    )
  );

  addSectionBar(document, 'SELLER STATEMENTS');
  addTableRow(document, 'Ownership', formatOwnership(seller.ownershipStatus));
  addTableRow(document, 'Lead-based paint', formatLeadPaint(seller));
  addTableRow(document, "Owners' association", formatOwnersAssociation(seller));
  addTableRow(document, 'Fuel tank', formatFuelTank(seller));
  addTableRow(document, 'Existing leases', formatExistingLeases(seller));

  document.y += 10;

  addNoticeBox(document, 'DISCLOSURE DELIVERY RECORD', disclosureDeliveryRecord(version), true);
}

function renderPageThree(document: PDFKit.PDFDocument): void {
  addSectionBar(document, 'STANDARD TERMS AND CONDITIONS');
  addLegalSection(document, 'SECTION 1. WORDS WITH SPECIAL MEANING', [
    '(a) The Contract is this document together with every addendum or written change the parties later make under Section 13.',
    '(b) The Property is the real estate identified in the Negotiated Terms, everything permanently attached to it, all rights that go with it, and the items described in Sections 2 and 3. Taxing, zoning, school-district, utility, and mail boundaries may not match the street address.',
    '(c) The Purchase Price is the total amount Buyer agrees to pay for the Property.',
    '(d) The Due Diligence Period is the time stated in the Negotiated Terms during which Buyer may investigate the Property and decide, for any reason or no reason, whether to proceed. Time is critical, and the period ends exactly when this Contract states.',
    '(e) The Deposit is the money Buyer pays toward the purchase. The Escrow Agent holds it. If Buyer ends this Contract during the Due Diligence Period, the Deposit is refunded to Buyer. After that period ends, the Deposit becomes non-refundable unless this Contract expressly provides otherwise or Seller materially breaches. At Closing, the Deposit is credited to Buyer. If entitlement is disputed, the Escrow Agent may continue to hold it, pay it to the clerk of court, or release it as North Carolina law allows.',
    "(f) The Escrow Agent is the person or firm named in the Negotiated Terms. The parties authorize the Escrow Agent to share information about the Deposit with the parties, their agents, and Buyer's lender. A real estate firm serving as Escrow Agent may place it in an interest-bearing trust account and retain the interest to cover account costs.",
    '(g) The Effective Date is the date on which the last Buyer or Seller signs this offer or the final counteroffer and that signing is communicated to the other party. The Contract takes effect even if Buyer has not yet paid the Deposit.',
    '(h) Settlement occurs when all documents needed to complete the sale are properly signed and delivered to the closing attorney and that attorney has received all funds needed to complete the sale.',
    '(i) Closing is completion of the legal steps transferring title: Settlement, a satisfactory title update, authorization to disburse funds, and recording of the deed and any deed of trust. Proceeds are disbursed under Chapter 45A of the North Carolina General Statutes. If title defects or funding problems prevent disbursement, Closing is paused and Settlement is treated as delayed under Section 11.',
    "(j) A Special Assessment is a governmental charge in addition to regular property taxes, or an owners' association charge in addition to regular dues, that may become a lien.",
  ]);
  addLegalSection(document, 'SECTION 2. WHAT IS INCLUDED IN THE SALE', [
    '(a) Unless excluded in the Negotiated Terms, every fixture now on the Property is included in the Purchase Price free of any lien. A fixture is an item attached to the Property so that it is treated as part of the real estate. Included items cover ordinary and smart versions and dedicated equipment or remote controls.',
    "(b) Personal property listed as included transfers to Buyer at Closing at no separate charge and free of any lien. Buyer should confirm with Buyer's lender that these items may be included.",
    '(c) Leased items, seller-nonowned items, and items Seller excludes do not transfer.',
    '(d) Before Closing, Seller will unpair every connected device that transfers with the Property, remove personal data, and reset it to factory settings unless the parties agree otherwise. This obligation survives Closing.',
    '(e) Seller will repair, in a good and workmanlike manner, damage caused by removal of an excluded item and notify Buyer when the repair is complete.',
  ]);
  addLegalSection(document, "SECTION 3. BUYER'S INVESTIGATION AND RIGHT TO TERMINATE", [
    "(a) No financing, appraisal, or sale contingency. This Contract does not depend on Buyer obtaining a loan, on the Property appraising at any value, or on Buyer selling or leasing other property. The Due Diligence Period is Buyer's opportunity and only built-in protection to investigate and decide whether to proceed.",
    "(b) During the Due Diligence Period, Buyer and Buyer's agents may, at Buyer's expense, conduct inspections, tests, appraisals, surveys, title review, insurance review, zoning and permit review, environmental review, utility and access review, owners' association review, and any other investigation Buyer considers appropriate.",
    '(c) Unless the parties agree otherwise in writing, the Property is sold in its current condition and Seller is not required to make repairs. Any repair agreement must be written and signed under Section 13.',
    "(d) Buyer will promptly repair damage Buyer or Buyer's contractors cause, except damage from accepted professional practices, and will protect Seller from claims arising from Buyer's investigations except those caused by preexisting conditions or Seller's negligence or misconduct. These duties survive termination.",
  ]);
}

function renderPageFour(document: PDFKit.PDFDocument): void {
  addLegalParagraphs(document, [
    '(e) Buyer may terminate for any reason or no reason by delivering written notice to Seller before the Due Diligence Period ends. Time is critical. The Contract then ends and the Deposit is refunded.',
    '(f) After the Due Diligence Period ends, the Deposit becomes non-refundable. If Buyer terminates without a contractual right or fails to complete the purchase, Buyer forfeits the Deposit as stated in Sections 1(e) and 17.',
  ]);
  addLegalSection(document, "SECTION 4. BUYER'S STATEMENTS", [
    "(a) Buyer's obligation to close is not conditioned on receiving funds from anyone other than Buyer's own resources. To Buyer's knowledge, no condition exists on the offer date that would prevent Buyer from meeting the obligations in this Contract. If Buyer selected all cash, Seller may request proof of funds before accepting.",
    '(b) If Buyer will sell or lease other property to fund this purchase, that statement is a disclosure only and does not create a contingency. A true sale contingency requires a separate attorney-drafted addendum.',
    "(c) Buyer's Residential Property and Owners' Association Disclosure selection appears in the Buyer Disclosure Acknowledgments. If Buyer did not receive the statement, Buyer may have a three-calendar-day cancellation right under N.C. Gen. Stat. Section 47E-5, ending at the earliest statutory deadline.",
    "(d) Buyer's Mineral and Oil and Gas Rights Mandatory Disclosure selection also appears in the Buyer Disclosure Acknowledgments. Receiving that statement does not mean Buyer approves a past transfer of mineral, oil, or gas rights.",
  ]);
  addLegalSection(document, "SECTION 5. BUYER'S OBLIGATIONS", [
    '(a) Buyer must pay the Deposit when due. If Buyer misses the deadline or payment is dishonored, Buyer has one banking day after written notice to deliver good funds. If Buyer does not, Seller may terminate by written notice and pursue remedies allowed for dishonored funds.',
    "(b) Buyer pays costs of any loan, appraisal, title search, title insurance, Buyer's settlement documents, recording the deed, securing any deferred purchase money, and owners' association charges assigned to Buyer under Section 8(b).",
    '(c) Buyer takes the Property subject to any Special Assessment approved after Settlement.',
    '(d) Buyer will provide the closing attorney information needed for government reporting, including applicable Financial Crimes Enforcement Network reporting requirements.',
  ]);
  addLegalSection(document, "SECTION 6. SELLER'S STATEMENTS", [
    "(a) Seller's ownership statement is shown above.",
    '(b) If the Property is residential and was built before 1978, Seller must provide the required lead-based paint disclosure and pamphlet before accepting this offer. Buyer may have rights under federal law if they are not provided.',
    "(c) If an owners' association applies, Seller authorizes the association, manager, insurer, and Seller's former attorney to provide Buyer and Buyer's representatives governing documents, budgets, financial and insurance information, dues, rules, parking and architectural information, and Seller's account statement.",
    '(d) If a fuel tank is present, any Seller-owned tank transfers free of liens unless excluded. Seller may use the fuel through Settlement but may not remove or resell it. Fuel remaining at Settlement transfers free of liens. Only the supplier or tank owner may fill or disconnect an LP gas tank.',
    '(e) If the Property is subject to leases, the parties should attach the appropriate rental or vacation-rental addendum.',
  ]);
  addLegalSection(document, "SECTION 7. SELLER'S OBLIGATIONS", [
    "(a) Seller will promptly provide the closing attorney all available title information and information needed to obtain payoff and owners' association statements. Seller appoints the closing attorney to request them and will pay association statement fees.",
    "(b) Through the earlier of Closing or Buyer's possession, Seller will provide reasonable access for due diligence, repair confirmation, and final walk-through, and will keep existing utilities operating at Seller's expense. Seller may limit physical access until the Deposit is delivered.",
    '(c) By possession, Seller will remove personal property not included in the sale and all trash and debris.',
    '(d) By Settlement, Seller will execute and deliver a General Warranty Deed conveying fee simple, marketable, insurable title free of monetary liens and material title defects, except current-year taxes, utility easements, unviolated restrictions, and matters Buyer approves in writing. The Property must have legal access to a public road.',
    '(e) Seller must convey the Property free of material violations of law, ordinance, permit, or governmental regulation unless disclosed before the Effective Date. If Seller does not cure a newly discovered violation before Closing, Buyer may accept it and close or terminate and receive the Deposit.',
  ]);
}

function renderPageFive(document: PDFKit.PDFDocument): void {
  addLegalParagraphs(document, [
    '(f) Seller will appoint any required lien agent, satisfy deeds of trust, deferred taxes, liens, and other charges Buyer is not assuming, and obtain cancellations.',
    "(g) Seller will provide affidavits and indemnities reasonably required for materialmen's liens and title insurance and, if applicable, a FIRPTA non-foreign status certification.",
    "(h) Seller pays for preparation of the deed and Seller's documents, excise taxes, deferred or rollback taxes, and local conveyance fees. The deed may name Buyer, a solely owned entity, a trust for Buyer, or Buyer's relative without a separate assignment.",
    '(i) Seller pays charges assigned under Section 8(a), Special Assessments approved before Settlement, late-listing tax penalties, and agreed repairs. Buyer may confirm repairs before Settlement.',
  ]);
  addLegalSection(document, "SECTION 8. OWNERS' ASSOCIATION CHARGES", [
    "(a) Seller pays fees for completing the Residential Property and Owners' Association Disclosure Statement and any resale certificate; charges to confirm Seller's dues or assessment account, including permitted expedite fees; charges to transfer or update ownership records; and association charges not assigned to Buyer below.",
    "(b) Buyer pays charges for information Buyer's lender requires; working-capital contributions, membership fees, and move-in fees tied to Buyer taking possession; and charges to confirm compliance with restrictive covenants.",
  ]);
  addLegalSection(document, 'SECTION 9. PRORATIONS', [
    "Unless the parties agree otherwise, property taxes, recurring governmental service fees, applicable personal-property taxes, rents, and regular owners' association dues are prorated as of the Settlement date. Seller is responsible through that date and is entitled to rents through that date.",
  ]);
  addLegalSection(document, 'SECTION 10. CONDITION AT CLOSING AND RISK OF LOSS', [
    '(a) If the Property is not in substantially the same or better condition at Closing as on the offer date, ordinary wear excepted, Buyer may terminate by written notice and receive the Deposit. If Buyer closes, Buyer receives any insurance proceeds Seller receives for the damage in addition to the Property.',
    '(b) Until Closing, risk of fire or other casualty remains with Seller. Seller should not cancel insurance until the deed is confirmed recorded.',
  ]);
  addLegalSection(document, 'SECTION 11. DELAY AT SETTLEMENT', [
    'If one party is ready to settle on the Settlement Date and the other cannot, the delayed party receives a short delay and must give as much notice as possible. If that party still cannot settle within seven days after the Settlement Date, including any written extension, the party is in breach and the other may terminate and pursue available remedies.',
  ]);
  addLegalSection(document, 'SECTION 12. POSSESSION', [
    'Unless the Negotiated Terms state otherwise, Seller must deliver possession, including keys, codes, openers, and other access means, at Closing. Possession before or after Closing, or subject to tenant rights, must be stated in an attached possession agreement.',
  ]);
  addLegalSection(document, 'SECTION 13. ADDENDA AND CHANGES', [
    'Real estate brokers may not draft addenda to this Contract. Every addendum or change must be in writing and signed by all parties.',
  ]);
  addLegalSection(document, 'SECTION 14. ASSIGNMENT', [
    'Neither party may assign this Contract without written consent of all parties, except in connection with a tax-deferred exchange. An agreed assignment binds and benefits the assignee.',
  ]);
  addLegalSection(document, 'SECTION 15. TAX-DEFERRED EXCHANGE', [
    'If either party wants to structure the sale as a tax-deferred exchange, the other will cooperate and sign reasonable documents at no added cost or liability to the cooperating party. The exchanging party bears all extra costs.',
  ]);
}

function renderPageSix(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  addLegalSection(document, 'SECTION 16. GENERAL PROVISIONS', [
    '(a) This Contract binds and benefits the parties and their heirs, successors, and permitted assigns. Singular includes plural, and words of one gender include others as context requires.',
    '(b) An obligation intended by its nature to be performed after Closing survives until performed.',
    '(c) This Contract is the complete agreement and replaces earlier understandings. It does not modify a listing or agency agreement. Neither this Contract nor a memorandum may be recorded without both parties\' written consent.',
    "(d) The parties may transact electronically, including signing and giving notices. Notice or payment may be delivered to a party or agent at an address, email, or fax in the Notice Information. Electronic notice is delivered when the sender completes the final sending step in a form the recipient's system can process. Notice Information and money-receipt details are not material terms, and changing them is not a rejection or counteroffer.",
    '(e) This Contract may be signed in counterparts that together form one agreement.',
    '(f) Days are consecutive calendar days, including weekends and holidays. Counting begins the day after the triggering act. Dates and times are North Carolina time. A banking day is Monday through Friday excluding Federal Reserve holidays.',
  ]);
  addLegalSection(document, 'SECTION 17. BREACH AND REMEDIES', [
    "(a) If Buyer materially breaches after the Due Diligence Period, Seller keeps the Deposit as agreed damages and Seller's sole remedy, except rights for investigation damage and dishonored funds. The parties agree the Deposit, including zero, is a reasonable estimate of difficult-to-measure loss and not a penalty.",
    '(b) If Seller materially breaches, Buyer may terminate and recover the Deposit plus reasonable out-of-pocket due-diligence costs, or keep the Contract in force and seek specific performance.',
    "(c) If either party sues to recover the Deposit or those due-diligence costs, the party entitled to the money may recover reasonable attorneys' fees to the extent permitted by N.C. Gen. Stat. Sections 6-21.2 and 6-21.3.",
  ]);
  addLegalSection(document, 'SECTION 18. REQUIRED NORTH CAROLINA NOTICES', [
    '(a) The North Carolina State Bar has determined that most work required to close a real estate sale is the practice of law and must be handled by a North Carolina-licensed attorney. Non-attorney settlement agents may perform only limited tasks. Buyer is strongly encouraged to hire a North Carolina attorney for Closing.',
    "(b) This is a general agreement and may not fit every transaction. A party who does not understand it or is unsure it meets that party's needs should consult a North Carolina real estate attorney before signing.",
  ]);
  addLegalSection(document, 'SECTION 19. WIRE FRAUD WARNING', [
    'Criminals target real estate transactions with fraudulent wiring instructions. Before wiring money, independently verify the instructions by calling a known, trusted number for the closing attorney or Escrow Agent - never a number received with the instructions. Neither party nor their agents are responsible for money sent using unverified fraudulent instructions.',
  ]);
  addLegalSection(document, 'SECTION 20. ADDITIONAL TERMS EXHIBIT', [
    'If an Additional Terms Exhibit is included, it is incorporated into this Contract. The parties may use it for terms not covered here, and it may be prepared by an attorney or a party. Because its terms are negotiated for this sale, the Exhibit controls over conflicting printed terms unless the Exhibit states otherwise. A real estate broker may not draft the Exhibit or any other addendum.',
    "This offer becomes binding on the Effective Date. Unless this Contract states otherwise, Buyer's failure to deliver the Deposit on time does not prevent formation, although it may give Seller a right to terminate.",
  ]);
  addSectionBar(document, 'ATTACHMENTS INCORPORATED BY REFERENCE');
  addAttachmentRows(document, input.version);
}

function renderPageSeven(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  addSectionBar(document, 'ELECTRONIC SIGNATURES');
  addLegalParagraphs(document, [
    'By signing below, Buyer makes this offer and Seller, upon signing, accepts it. Each signer confirms that the signer has reviewed the complete agreement and all incorporated attachments, intends to sign electronically, and has authority to sign in the capacity shown.',
  ], 7.2, 1.25);
  for (const party of input.version.buyers) {
    addSignaturePanel(document, 'BUYER', party);
  }
  for (const party of input.version.sellers) {
    addSignaturePanel(document, 'SELLER', party);
  }

  document.y += 10;

  addNoticeBox(
    document,
    'EFFECTIVE DATE',
    'The Effective Date is the date on which the last required Buyer or Seller signs this offer or the final counteroffer and that signing is communicated to the other party.',
    true
  );
  document
    .fillColor(MUTED_COLOR)
    .font('NavStreet-Regular')
    .fontSize(6.3)
    .text(
      `Document generated ${formatDateTime(input.generatedAt)}. Offer-version UID: ${input.version.Uid}. The permanent NavStreet record maintains the document hash, identity-verification result, delivery events and signature audit trail.`,
      PAGE_MARGIN,
      document.y + 10,
      { width: CONTENT_WIDTH, lineGap: 1 }
    );
}

function addAgreementPage(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput,
  pageNumber: number
): void {
  document.addPage();
  renderPageChrome(document, input, pageNumber);
  document.y = CONTENT_TOP;
}

function renderPageChrome(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput,
  pageNumber: number
): void {
  const headerX = 36;
  const headerY = 24;
  const headerWidth = PAGE_WIDTH - 72;
  const headerHeight = 48;
  document.save().rect(headerX, headerY, headerWidth, headerHeight).fill(NAVSTREET_BLUE);
  SVGtoPDF(document, NAVSTREET_LOGO_SVG, headerX + 8, headerY + 1, {
    width: 118,
    height: 46,
    preserveAspectRatio: 'xMidYMid meet',
  });
  document.restore();
  document
    .fillColor('#FFFFFF')
    .font('NavStreet-Bold')
    .fontSize(9.4)
    .text('RESIDENTIAL PURCHASE\nAND SALE AGREEMENT', headerX + 145, headerY + 9, {
      width: 210,
      lineGap: 1.5,
      characterSpacing: 1.3,
    })
    .font('NavStreet-Regular')
    .fontSize(5.6)
    .fillOpacity(0.9)
    .text(
      `Offer | ${input.offer.referenceNumber} | Version ${input.version.versionNumber}`,
      headerX + 145,
      headerY + 36,
      { width: 300, characterSpacing: 0.25 }
    )
    .fillOpacity(1);
  document
    .fillColor(MUTED_COLOR)
    .font('NavStreet-Regular')
    .fontSize(5.6)
    .text(
      `NavStreet | ${input.offer.referenceNumber} | Version ${input.version.versionNumber}`,
      PAGE_MARGIN,
      FOOTER_Y,
      { width: CONTENT_WIDTH / 2, lineBreak: false }
    )
    .text(`Page ${pageNumber} of 7`, PAGE_WIDTH - PAGE_MARGIN - 90, FOOTER_Y, {
      width: 90,
      align: 'right',
      lineBreak: false,
    });
}

function addSectionBar(document: PDFKit.PDFDocument, title: string): void {
  document.moveDown(0.65);
  const top = document.y;
  document.rect(PAGE_MARGIN, top, CONTENT_WIDTH, 17).fill(NAVSTREET_BLUE);
  document
    .fillColor('#FFFFFF')
    .font('NavStreet-Bold')
    .fontSize(7)
    .text(title, PAGE_MARGIN + 9, top + 5, {
      width: CONTENT_WIDTH - 18,
      characterSpacing: 0.8,
      lineBreak: false,
    });
  document.y = top + 23;
}

function addNoticeBox(
  document: PDFKit.PDFDocument,
  title: string,
  body: string,
  compact = false
): void {
  const bodySize = compact ? 6.8 : 6.6;
  const bodyWidth = CONTENT_WIDTH - 24;
  document.font('NavStreet-Regular').fontSize(bodySize);
  const bodyHeight = document.heightOfString(body, { width: bodyWidth, lineGap: 1.1 });
  const height = bodyHeight + (compact ? 29 : 34);
  const top = document.y;
  document
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, height, 2)
    .fillAndStroke(NOTICE_BACKGROUND, NAVSTREET_TEAL);
  document
    .fillColor(NAVSTREET_BLUE)
    .font('NavStreet-Bold')
    .fontSize(7)
    .text(title, PAGE_MARGIN + 12, top + 8, {
      width: bodyWidth,
      characterSpacing: 0.75,
    });
  document
    .fillColor(TEXT_COLOR)
    .font('NavStreet-Regular')
    .fontSize(bodySize)
    .text(body, PAGE_MARGIN + 12, top + 19, {
      width: bodyWidth,
      lineGap: 1.1,
    });
  document.y = top + height + 2;
}

function addTableRow(
  document: PDFKit.PDFDocument,
  label: string,
  value: string
): void {
  const labelWidth = 206;
  const valueWidth = CONTENT_WIDTH - labelWidth;
  document.font('NavStreet-Regular').fontSize(6.7);
  const height = Math.max(
    22,
    document.heightOfString(value, { width: valueWidth - 14, lineGap: 1 }) + 11,
    document.heightOfString(label, { width: labelWidth - 14, lineGap: 1 }) + 11
  );
  const top = document.y;
  document.rect(PAGE_MARGIN, top, CONTENT_WIDTH, height).fill(LIGHT_BACKGROUND);
  document
    .fillColor(TEXT_COLOR)
    .font('NavStreet-Bold')
    .fontSize(6.7)
    .text(label, PAGE_MARGIN + 8, top + 6, { width: labelWidth - 14, lineGap: 1 });
  document
    .font('NavStreet-Regular')
    .text(value || 'Not provided', PAGE_MARGIN + labelWidth + 6, top + 6, {
      width: valueWidth - 14,
      lineGap: 1,
    });
  document
    .strokeColor('#FFFFFF')
    .lineWidth(1)
    .moveTo(PAGE_MARGIN, top + height)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, top + height)
    .stroke();
  document.y = top + height;
}

function addCheckboxRow(
  document: PDFKit.PDFDocument,
  checked: boolean,
  label: string
): void {
  const top = document.y + 4;
  const boxSize = 8;
  document.rect(PAGE_MARGIN + 4, top, boxSize, boxSize).strokeColor(NAVSTREET_TEAL).stroke();
  if (checked) {
    document
      .fillColor(NAVSTREET_BLUE)
      .font('NavStreet-Bold')
      .fontSize(7)
      .text('X', PAGE_MARGIN + 5.4, top + 0.2, { width: boxSize, lineBreak: false });
  }
  document
    .fillColor(TEXT_COLOR)
    .font('NavStreet-Regular')
    .fontSize(6.4)
    .text(label, PAGE_MARGIN + 18, top - 0.2, {
      width: CONTENT_WIDTH - 18,
      lineGap: 1,
    });
  document.y = Math.max(document.y, top + 14);
}

function addInlineNote(document: PDFKit.PDFDocument, text: string): void {
  document
    .fillColor(TEXT_COLOR)
    .font('NavStreet-Regular')
    .fontSize(6.2)
    .text(text, PAGE_MARGIN + 8, document.y + 4, {
      width: CONTENT_WIDTH - 16,
      lineGap: 1,
    });
  document.moveDown(0.4);
}

function addLegalSection(
  document: PDFKit.PDFDocument,
  title: string,
  paragraphs: string[]
): void {
  document.moveDown(0.45);
  document
    .fillColor(NAVSTREET_BLUE)
    .font('NavStreet-Bold')
    .fontSize(6.8)
    .text(title, PAGE_MARGIN, document.y, {
      width: CONTENT_WIDTH,
      characterSpacing: 0.5,
    });
  document
    .strokeColor(NAVSTREET_TEAL)
    .lineWidth(0.6)
    .moveTo(PAGE_MARGIN, document.y + 2)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH, document.y + 2)
    .stroke();
  document.y += 6;
  addLegalParagraphs(document, paragraphs);
}

function addLegalParagraphs(
  document: PDFKit.PDFDocument,
  paragraphs: string[],
  fontSize = 6.35,
  lineGap = 0.75
): void {
  for (const paragraph of paragraphs) {
    document
      .fillColor(TEXT_COLOR)
      .font('NavStreet-Regular')
      .fontSize(fontSize)
      .text(paragraph, PAGE_MARGIN, document.y, {
        width: CONTENT_WIDTH,
        lineGap,
      });
    document.y += 2.1;
  }
}

function addAttachmentRows(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const residential = version.terms.buyerDisclosures.residentialProperty;
  const mineral = version.terms.buyerDisclosures.mineralOilGasRights;
  addCheckboxRow(
    document,
    Boolean(residential.documentUid),
    "Residential Property and Owners' Association Disclosure Statement"
  );
  addCheckboxRow(
    document,
    Boolean(mineral.documentUid),
    'Mineral and Oil and Gas Rights Mandatory Disclosure Statement'
  );
  for (const addendum of version.terms.addenda) {
    if (addendum.included) {
      addCheckboxRow(document, Boolean(addendum.documentUid), addendum.title);
    }
  }
  if (version.terms.additionalTermsExhibit.included) {
    addCheckboxRow(
      document,
      Boolean(version.terms.additionalTermsExhibit.documentUid),
      'Additional Terms Exhibit'
    );
  }
  addInlineNote(
    document,
    'A buyer disclosure selection records what the buyer states was received. A document is marked above only when a copy was attached to this offer through NavStreet.'
  );
}

function addSignaturePanel(
  document: PDFKit.PDFDocument,
  role: 'BUYER' | 'SELLER',
  party: OfferVersionPartySnapshotDocument
): void {
  const top = document.y + 12;
  const height = 82;
  document
    .roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, height, 2)
    .fillAndStroke(LIGHT_BACKGROUND, NAVSTREET_TEAL);
  document
    .fillColor(NAVSTREET_TEAL)
    .font('NavStreet-Bold')
    .fontSize(6.8)
    .text(role, PAGE_MARGIN + 10, top + 9, {
      width: 48,
      characterSpacing: 0.7,
      lineBreak: false,
    });
  document
    .fillColor(TEXT_COLOR)
    .font('NavStreet-Bold')
    .fontSize(7.5)
    .text(party.legalName, PAGE_MARGIN + 60, top + 8, {
      width: CONTENT_WIDTH - 70,
      lineBreak: false,
    });
  const signatureY = top + 41;
  document
    .strokeColor(MUTED_COLOR)
    .lineWidth(0.7)
    .moveTo(PAGE_MARGIN + 10, signatureY)
    .lineTo(PAGE_MARGIN + 355, signatureY)
    .stroke()
    .moveTo(PAGE_MARGIN + 405, signatureY)
    .lineTo(PAGE_MARGIN + CONTENT_WIDTH - 10, signatureY)
    .stroke();
  if (party.signature.status === 'signed') {
    document
      .fillColor(NAVSTREET_BLUE)
      .font('NavStreet-Italic')
      .fontSize(9.5)
      .text(`/s/ ${party.legalName}`, PAGE_MARGIN + 12, signatureY - 14, {
        width: 338,
        lineBreak: false,
      });
  }
  document
    .fillColor(MUTED_COLOR)
    .font('NavStreet-Regular')
    .fontSize(5.8)
    .text(
      party.signature.status === 'signed' ? 'Electronic signature' : 'Electronic signature pending',
      PAGE_MARGIN + 10,
      signatureY + 5,
      { width: 170, lineBreak: false }
    )
    .text('Date', PAGE_MARGIN + 405, signatureY + 5, {
      width: 40,
      lineBreak: false,
    })
    .fillColor(TEXT_COLOR)
    .fontSize(6.4)
    .text(`Email: ${party.email}`, PAGE_MARGIN + 10, signatureY + 22, {
      width: 300,
      lineBreak: false,
    });
  if (party.signature.signedAt) {
    document
      .fillColor(TEXT_COLOR)
      .fontSize(6.2)
      .text(
        formatDateTime(party.signature.signedAt.toDate()),
        PAGE_MARGIN + 405,
        signatureY - 13,
        {
          width: CONTENT_WIDTH - 415,
          align: 'right',
          lineBreak: false,
        }
      );
  }
  document.y = top + height;
}

function partyNames(parties: OfferVersionPartySnapshotDocument[]): string {
  return parties.map(party => party.legalName).join('; ') || 'Not provided';
}

function formatDeedReference(book?: string, page?: string): string {
  if (book && page) return `Book ${book}, Page ${page}`;
  if (book) return `Book ${book}`;
  if (page) return `Page ${page}`;
  return 'Not provided';
}

function formatFinancing(value: string): string {
  if (value === 'cash') return 'Buyer will pay cash.';
  if (value === 'loan') return 'Buyer intends to obtain a loan.';
  return 'Not selected.';
}

function formatConcessions(
  concessions: OfferVersionDocument['terms']['concessions']
): string {
  if (concessions.concessionType === 'amount') {
    return formatCurrency(concessions.sellerConcessionInCents ?? 0);
  }
  if (concessions.concessionType === 'percentage') {
    return `${concessions.sellerConcessionPercentage ?? 0}% of the purchase price`;
  }
  return 'None.';
}

function formatHomeWarranty(
  concessions: OfferVersionDocument['terms']['concessions']
): string {
  if (!concessions.homeWarrantyRequested) {
    return 'No seller-paid home warranty requested.';
  }
  return `Seller will pay up to ${formatCurrency(concessions.homeWarrantyInCents ?? 0)} for a one-year home warranty.`;
}

function formatDueDiligence(
  deposits: OfferVersionDocument['terms']['deposits']
): string {
  if (deposits.dueDiligenceDeadlineType === 'specific_date') {
    return `5:00 p.m. Eastern Time on ${formatDateValue(deposits.dueDiligenceEndDate)}`;
  }
  if (deposits.dueDiligenceDeadlineType === 'days_after_effective_date') {
    return `5:00 p.m. Eastern Time, ${deposits.dueDiligenceDaysAfterEffectiveDate ?? 0} calendar days after the Effective Date`;
  }
  return 'Not selected.';
}

function formatPossession(value: string): string {
  return value === 'at_closing'
    ? 'Buyer receives possession at Closing.'
    : 'As stated in the attached possession agreement.';
}

function formatOwnership(value: string | undefined): string {
  if (value === 'owned_at_least_one_year') return 'Seller has owned the Property for at least one year.';
  if (value === 'owned_less_than_one_year') return 'Seller has owned the Property for less than one year.';
  if (value === 'does_not_yet_own') return 'Seller does not yet own the Property.';
  return 'Not yet completed by Seller.';
}

function formatLeadPaint(
  seller: OfferVersionDocument['terms']['sellerStatements']
): string {
  if (seller.leadBasedPaintApplies === true) {
    return seller.leadBasedPaintDisclosureDocumentUid
      ? 'Applicable; disclosure attached.'
      : 'Applicable; Seller must provide the required disclosure before accepting.';
  }
  if (seller.leadBasedPaintApplies === false) return 'Not indicated as applicable.';
  return 'Not yet completed by Seller.';
}

function formatOwnersAssociation(
  seller: OfferVersionDocument['terms']['sellerStatements']
): string {
  if (seller.ownersAssociationApplies === false) return 'None indicated.';
  if (seller.ownersAssociationApplies !== true) return 'Not yet completed by Seller.';
  const details = [
    seller.ownersAssociationName,
    typeof seller.ownersAssociationDuesInCents === 'number'
      ? `${formatCurrency(seller.ownersAssociationDuesInCents)} ${seller.ownersAssociationDuesFrequency || ''}`.trim()
      : undefined,
    seller.ownersAssociationContact ? `Contact: ${seller.ownersAssociationContact}` : undefined,
  ].filter((value): value is string => Boolean(value));
  return details.join('; ') || 'Association applies; details not yet completed.';
}

function formatFuelTank(
  seller: OfferVersionDocument['terms']['sellerStatements']
): string {
  if (seller.fuelTankPresent === false) return 'None indicated.';
  if (seller.fuelTankPresent !== true) return 'Not yet completed by Seller.';
  return `Present; ${seller.fuelTankOwnership || 'ownership not yet specified'}.`;
}

function formatExistingLeases(
  seller: OfferVersionDocument['terms']['sellerStatements']
): string {
  if (seller.leasesExist === false) return 'None indicated.';
  if (seller.leasesExist !== true) return 'Not yet completed by Seller.';
  return seller.leaseAddendumDocumentUid
    ? 'Existing lease indicated; lease addendum attached.'
    : 'Existing lease indicated; Seller must attach the applicable addendum before accepting.';
}

function disclosureDeliveryRecord(version: OfferVersionDocument): string {
  const residential = version.terms.buyerDisclosures.residentialProperty;
  const mineral = version.terms.buyerDisclosures.mineralOilGasRights;
  const attached: string[] = [];
  if (residential.documentUid) {
    attached.push("Residential Property and Owners' Association Disclosure Statement");
  }
  if (mineral.documentUid) {
    attached.push('Mineral and Oil and Gas Rights Mandatory Disclosure Statement');
  }
  return attached.length > 0
    ? `Copies attached through NavStreet: ${attached.join('; ')}.`
    : "No disclosure documents were attached through NavStreet. The buyer acknowledgments above record the buyer's stated receipt status and do not require a platform-hosted copy.";
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getText(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value.trim() : '';
}

function formatPropertyAddress(property: Record<string, unknown>): string {
  const address = asObject(property['address']);
  const street = getText(property, 'streetAddress') || getText(property, 'addressLine1') || getText(address, 'streetAddress') || getText(address, 'line1');
  const city = getText(property, 'city') || getText(address, 'city');
  const state = getText(property, 'stateCode') || getText(property, 'state') || getText(address, 'stateCode') || getText(address, 'state');
  const zip = getText(property, 'postalCode') || getText(property, 'zipCode') || getText(address, 'postalCode') || getText(address, 'zipCode');
  return [street, [city, state].filter(Boolean).join(', '), zip].filter(Boolean).join(' ') || 'Not provided';
}

function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

function formatDateValue(value: string | undefined): string {
  if (!value) return 'Not provided';
  const date = new Date(`${value}T12:00:00-04:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York',
    }).format(date);
}

function formatDateTimeValue(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatDateTime(date);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: 'America/New_York',
  }).format(value);
}

function formatDisclosureReceipt(status: string, acknowledged: boolean): string {
  const confirmation = acknowledged ? ' Buyer confirmed this selection.' : '';
  if (status === 'received') {
    return `Buyer received the signed disclosure before making this offer.${confirmation}`;
  }
  if (status === 'not_received') {
    return `Buyer had not received the disclosure before making this offer.${confirmation}`;
  }
  if (status === 'exempt') {
    return `Buyer selected that the sale is exempt from this disclosure requirement.${confirmation}`;
  }
  return 'No selection recorded.';
}

function createFileName(
  referenceNumber: string,
  versionNumber: number,
  documentTitle: string
): string {
  const safeReference = referenceNumber.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  const safeTitle = documentTitle.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return `${safeReference}-version-${versionNumber}-${safeTitle}.pdf`;
}
