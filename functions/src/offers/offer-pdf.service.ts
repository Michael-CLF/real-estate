import PDFDocument from 'pdfkit';

import type {
  OfferDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
} from './offer-types';


const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const PAGE_MARGIN = 54;
const CONTENT_WIDTH =
  PAGE_WIDTH - PAGE_MARGIN * 2;

const NAVSTREET_BLUE = '#154360';
const NAVSTREET_TEAL = '#1F7A8C';
const TEXT_COLOR = '#1B2A34';
const MUTED_COLOR = '#61727C';
const BORDER_COLOR = '#D8E2E7';
const LIGHT_BACKGROUND = '#F2F7F9';
const WARNING_BACKGROUND = '#FFF4D6';
const WARNING_COLOR = '#805B00';


export interface GenerateOfferPdfInput {
  offer: OfferDocument;
  version: OfferVersionDocument;

  documentTitle: string;

  generatedAt: Date;

  documentStatus:
    | 'prototype'
    | 'approved';
}


export interface GeneratedOfferPdf {
  buffer: Buffer;

  fileName: string;
  pageCount: number;
}


/*
 * Generates a printable NavStreet offer or counteroffer
 * PDF from one immutable offer version.
 */
export async function generateOfferPdf(
  input: GenerateOfferPdfInput
): Promise<GeneratedOfferPdf> {
  const document =
    new PDFDocument({
      size: 'LETTER',

      margins: {
        top: PAGE_MARGIN,
        right: PAGE_MARGIN,
        bottom: 72,
        left: PAGE_MARGIN,
      },

      bufferPages: true,

      info: {
        Title:
          input.documentTitle,

        Author:
          'NavStreet',

        Subject:
          `${input.documentTitle} — ${input.offer.referenceNumber}`,

        Keywords:
          'NavStreet, residential real estate, offer, purchase agreement',

        CreationDate:
          input.generatedAt,
      },
    });

  const chunks: Buffer[] = [];

  document.on(
    'data',
    chunk => {
      chunks.push(
        Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk)
      );
    }
  );

  const completed =
    new Promise<Buffer>(
      (resolve, reject) => {
        document.on(
          'end',
          () => {
            resolve(
              Buffer.concat(chunks)
            );
          }
        );

        document.on(
          'error',
          reject
        );
      }
    );

  renderHeader(
    document,
    input
  );

  renderTemplateNotice(
    document,
    input.documentStatus
  );

  renderAgreementIntroduction(
    document,
    input
  );

  renderParties(
    document,
    input.version
  );

  renderProperty(
    document,
    input.version
  );

  renderPurchaseTerms(
    document,
    input.version
  );

  renderDepositTerms(
    document,
    input.version
  );

  renderFinancingAndPropertySale(
    document,
    input.version
  );

  renderInvestigations(
    document,
    input.version
  );

  renderConcessions(
    document,
    input.version
  );

  renderPropertyInclusions(
    document,
    input.version
  );

  renderSettlement(
    document,
    input.version
  );

  renderDisclosuresAndAddenda(
    document,
    input.version
  );

  renderAdditionalTerms(
    document,
    input.version
  );

  renderDeliveryAndExpiration(
    document,
    input.version
  );

  renderElectronicTransactionNotice(
    document
  );

  renderSignatures(
    document,
    input.version
  );

  renderDocumentCertification(
    document,
    input
  );

  addPageFooters(
    document,
    input.offer.referenceNumber,
    input.version.versionNumber
  );

  const pageRange =
    document.bufferedPageRange();

  document.end();

  const buffer =
    await completed;

  return {
    buffer,

    fileName:
      createFileName(
        input.offer.referenceNumber,
        input.version.versionNumber,
        input.documentTitle
      ),

    pageCount:
      pageRange.count,
  };
}


function renderHeader(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  document
    .fillColor(
      NAVSTREET_BLUE
    )
    .font('Helvetica-Bold')
    .fontSize(22)
    .text(
      'NAVSTREET',
      PAGE_MARGIN,
      PAGE_MARGIN,
      {
        width: CONTENT_WIDTH,
        align: 'center',
      }
    );

  document
    .moveDown(0.25)
    .fillColor(TEXT_COLOR)
    .font('Helvetica-Bold')
    .fontSize(15)
    .text(
      input.documentTitle.toUpperCase(),
      {
        align: 'center',
      }
    );

  document
    .moveDown(0.35)
    .fillColor(MUTED_COLOR)
    .font('Helvetica')
    .fontSize(9)
    .text(
      `Offer reference: ${input.offer.referenceNumber}  |  Version: ${input.version.versionNumber}  |  State: ${input.offer.stateCode}`,
      {
        align: 'center',
      }
    );

  document
    .moveDown(0.6)
    .strokeColor(
      NAVSTREET_TEAL
    )
    .lineWidth(2)
    .moveTo(
      PAGE_MARGIN,
      document.y
    )
    .lineTo(
      PAGE_WIDTH -
        PAGE_MARGIN,
      document.y
    )
    .stroke();

  document.moveDown(0.8);
}


function renderTemplateNotice(
  document: PDFKit.PDFDocument,
  documentStatus:
    'prototype' | 'approved'
): void {
  if (
    documentStatus !== 'prototype'
  ) {
    return;
  }

  ensureSpace(
    document,
    62
  );

  const top =
    document.y;

  document
    .roundedRect(
      PAGE_MARGIN,
      top,
      CONTENT_WIDTH,
      48,
      6
    )
    .fill(
      WARNING_BACKGROUND
    );

  document
    .fillColor(
      WARNING_COLOR
    )
    .font('Helvetica-Bold')
    .fontSize(9)
    .text(
      'PROTOTYPE TEMPLATE — NOT FOR EXECUTION',
      PAGE_MARGIN + 12,
      top + 10,
      {
        width:
          CONTENT_WIDTH - 24,

        align: 'center',
      }
    );

  document
    .font('Helvetica')
    .fontSize(8)
    .text(
      'This document demonstrates NavStreet’s offer workflow and PDF layout. The production North Carolina agreement language must be activated before this template may be used for an enforceable transaction.',
      {
        width:
          CONTENT_WIDTH - 24,

        align: 'center',
      }
    );

  document.y =
    top + 58;
}


function renderAgreementIntroduction(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  addSectionHeading(
    document,
    'Agreement overview'
  );

  addParagraph(
    document,
    `This document records Version ${input.version.versionNumber} of NavStreet Offer ${input.offer.referenceNumber} concerning the residential property identified below. It contains the transaction information supplied by the participating buyer and seller.`
  );

  addDataRow(
    document,
    'Document generated',
    formatDateTime(
      input.generatedAt
    )
  );

  addDataRow(
    document,
    'Initiating party',
    capitalize(
      input.version.initiatedBy
    )
  );

  addDataRow(
    document,
    'Version status',
    formatStatus(
      input.version.status
    )
  );
}


function renderParties(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  addSectionHeading(
    document,
    '1. Parties'
  );

  addPartyGroup(
    document,
    'Buyer',
    version.buyers
  );

  addPartyGroup(
    document,
    'Seller',
    version.sellers
  );
}


function addPartyGroup(
  document: PDFKit.PDFDocument,
  groupLabel: string,
  parties:
    OfferVersionPartySnapshotDocument[]
): void {
  parties.forEach(
    (party, index) => {
      ensureSpace(
        document,
        116
      );

      document
        .fillColor(
          NAVSTREET_TEAL
        )
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `${groupLabel} ${index + 1}`
        );

      addDataRow(
        document,
        'Legal name',
        party.legalName
      );

      addDataRow(
        document,
        'Capacity',
        formatStatus(
          party.capacity
        )
      );

      addDataRow(
        document,
        'Email',
        party.email
      );

      addDataRow(
        document,
        'Phone',
        party.phone
      );

      addDataRow(
        document,
        'Mailing address',
        formatAddress(
          party.mailingAddress
        )
      );

      if (
        party.intendedUse
      ) {
        addDataRow(
          document,
          'Intended use',
          formatStatus(
            party.intendedUse
          )
        );
      }

      if (
        party.proposedDeedName
      ) {
        addDataRow(
          document,
          'Proposed deed name',
          party.proposedDeedName
        );
      }

      document.moveDown(0.35);
    }
  );
}


function renderProperty(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const terms =
    version.terms;

  const property =
    getObject(
      terms,
      'property'
    );

  addSectionHeading(
    document,
    '2. Property'
  );

  addDataRow(
    document,
    'Property address',
    formatPropertyAddress(
      property
    )
  );

  addDataRow(
    document,
    'County',
    getText(
      property,
      'county'
    )
  );

  addDataRow(
    document,
    'Property type',
    formatStatus(
      getText(
        property,
        'propertyType'
      )
    )
  );

  addOptionalDataRow(
    document,
    'Parcel identification',
    getOptionalText(
      property,
      'parcelIdentificationNumber'
    )
  );

  const deedReference = [
    getOptionalText(
      property,
      'deedBook'
    ),

    getOptionalText(
      property,
      'deedPage'
    ),
  ]
    .filter(Boolean)
    .join(' / ');

  addOptionalDataRow(
    document,
    'Deed reference',
    deedReference
  );

  addOptionalDataRow(
    document,
    'Legal description',
    getOptionalText(
      property,
      'legalDescription'
    )
  );
}


function renderPurchaseTerms(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const purchase =
    getObject(
      version.terms,
      'purchase'
    );

  addSectionHeading(
    document,
    '3. Purchase price and payment'
  );

  addDataRow(
    document,
    'Purchase price',
    formatCurrency(
      getNumber(
        purchase,
        'purchasePriceInCents'
      )
    )
  );

  addDataRow(
    document,
    'Payment method',
    formatStatus(
      getText(
        purchase,
        'financingType'
      )
    )
  );

  addDataRow(
    document,
    'Loan type',
    formatStatus(
      getText(
        purchase,
        'loanType'
      )
    )
  );

  addOptionalMoneyRow(
    document,
    'Proposed loan amount',
    getOptionalNumber(
      purchase,
      'proposedLoanAmountInCents'
    )
  );

  addOptionalMoneyRow(
    document,
    'Proposed down payment',
    getOptionalNumber(
      purchase,
      'proposedDownPaymentInCents'
    )
  );

  addOptionalMoneyRow(
    document,
    'Proposed cash contribution',
    getOptionalNumber(
      purchase,
      'proposedCashContributionInCents'
    )
  );

  addBooleanRow(
    document,
    'Preapproval provided',
    purchase[
      'preapprovalProvided'
    ] === true
  );

  addBooleanRow(
    document,
    'Proof of funds provided',
    purchase[
      'proofOfFundsProvided'
    ] === true
  );

  addBooleanRow(
    document,
    'Loan required to complete purchase',
    purchase[
      'loanRequiredToCompletePurchase'
    ] === true
  );

  addBooleanRow(
    document,
    'Lender appraisal anticipated',
    purchase[
      'lenderAppraisalAnticipated'
    ] === true
  );
}


function renderDepositTerms(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const deposits =
    getObject(
      version.terms,
      'deposits'
    );

  addSectionHeading(
    document,
    '4. Due diligence and deposits'
  );

  addDataRow(
    document,
    'Due-diligence fee',
    formatCurrency(
      getNumber(
        deposits,
        'dueDiligenceFeeInCents'
      )
    )
  );

  addDataRow(
    document,
    'Due-diligence fee delivery deadline',
    formatDateTimeValue(
      deposits[
        'dueDiligenceFeeDeliveryDeadline'
      ]
    )
  );

  addDataRow(
    document,
    'Due-diligence expiration',
    formatDateTimeValue(
      deposits[
        'dueDiligenceExpiration'
      ]
    )
  );

  addDataRow(
    document,
    'Initial earnest money',
    formatCurrency(
      getNumber(
        deposits,
        'initialEarnestMoneyInCents'
      )
    )
  );

  addDataRow(
    document,
    'Initial earnest-money deadline',
    formatDateTimeValue(
      deposits[
        'initialEarnestMoneyDeliveryDeadline'
      ]
    )
  );

  addDataRow(
    document,
    'Additional earnest money',
    formatCurrency(
      getNumber(
        deposits,
        'additionalEarnestMoneyInCents'
      )
    )
  );

  addOptionalDataRow(
    document,
    'Additional earnest-money deadline',
    formatOptionalDateTimeValue(
      deposits[
        'additionalEarnestMoneyDeliveryDeadline'
      ]
    )
  );

  addDataRow(
    document,
    'Escrow agent',
    getText(
      deposits,
      'escrowAgentName'
    )
  );

  addOptionalDataRow(
    document,
    'Escrow agent email',
    getOptionalText(
      deposits,
      'escrowAgentEmail'
    )
  );

  addOptionalDataRow(
    document,
    'Escrow agent phone',
    getOptionalText(
      deposits,
      'escrowAgentPhone'
    )
  );
}


function renderFinancingAndPropertySale(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const propertySale =
    getObject(
      version.terms,
      'existingPropertySale'
    );

  addSectionHeading(
    document,
    '5. Buyer’s existing property'
  );

  addBooleanRow(
    document,
    'Sale or closing of another property required',
    propertySale['required'] ===
      true
  );

  if (
    propertySale['required'] === true
  ) {
    addDataRow(
      document,
      'Existing property address',
      getText(
        propertySale,
        'propertyAddress'
      )
    );

    addDataRow(
      document,
      'Current status',
      formatStatus(
        getText(
          propertySale,
          'status'
        )
      )
    );

    addOptionalDataRow(
      document,
      'Anticipated closing date',
      getOptionalText(
        propertySale,
        'anticipatedClosingDate'
      )
    );
  }
}


function renderInvestigations(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const investigations =
    getObject(
      version.terms,
      'investigations'
    );

  addSectionHeading(
    document,
    '6. Planned due-diligence investigations'
  );

  const investigationLabels:
    Record<string, string> = {
      generalHomeInspection:
        'General home inspection',

      woodDestroyingInsectInspection:
        'Wood-destroying insect inspection',

      radonTesting:
        'Radon testing',

      wellWaterTesting:
        'Well-water testing',

      septicInspection:
        'Septic inspection',

      survey:
        'Survey',

      appraisal:
        'Appraisal',

      insuranceReview:
        'Insurance review',

      floodZoneReview:
        'Flood-zone review',

      environmentalReview:
        'Environmental review',

      hoaDocumentReview:
        'HOA document review',

      titleAndCovenantReview:
        'Title and restrictive-covenant review',
    };

  for (
    const [
      fieldName,
      label,
    ] of Object.entries(
      investigationLabels
    )
  ) {
    addDataRow(
      document,
      label,
      formatStatus(
        getText(
          investigations,
          fieldName
        )
      )
    );
  }

  if (
    investigations[
      'otherInvestigationRequested'
    ] === true
  ) {
    addOptionalDataRow(
      document,
      'Other investigation',
      getOptionalText(
        investigations,
        'otherInvestigationDescription'
      )
    );
  }
}


function renderConcessions(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const concessions =
    getObject(
      version.terms,
      'concessions'
    );

  addSectionHeading(
    document,
    '7. Seller concessions'
  );

  addBooleanAndMoneyRow(
    document,
    'Seller-paid buyer expenses',
    concessions[
      'sellerPaidBuyerExpensesRequested'
    ] === true,

    getNumber(
      concessions,
      'sellerPaidBuyerExpensesInCents'
    )
  );

  addBooleanAndMoneyRow(
    document,
    'Home warranty',
    concessions[
      'homeWarrantyRequested'
    ] === true,

    getNumber(
      concessions,
      'homeWarrantyInCents'
    )
  );

  addBooleanAndMoneyRow(
    document,
    'Buyer-agent compensation',
    concessions[
      'buyerAgentCompensationRequested'
    ] === true,

    getNumber(
      concessions,
      'buyerAgentCompensationInCents'
    )
  );

  if (
    concessions[
      'otherConcessionRequested'
    ] === true
  ) {
    addOptionalDataRow(
      document,
      'Other concession',
      getOptionalText(
        concessions,
        'otherConcessionDescription'
      )
    );

    addDataRow(
      document,
      'Other concession amount',
      formatCurrency(
        getNumber(
          concessions,
          'otherConcessionInCents'
        )
      )
    );
  }
}


function renderPropertyInclusions(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const inclusions =
    getObject(
      version.terms,
      'propertyInclusions'
    );

  addSectionHeading(
    document,
    '8. Fixtures and personal property'
  );

  const items =
    inclusions['items'];

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    addParagraph(
      document,
      'No additional fixture, personal-property or leased-equipment selections were recorded.'
    );
  } else {
    items.forEach(
      item => {
        const itemData =
          asObject(item);

        addDataRow(
          document,
          getText(
            itemData,
            'name'
          ),

          formatStatus(
            getText(
              itemData,
              'treatment'
            )
          )
        );
      }
    );
  }

  addOptionalDataRow(
    document,
    'Additional personal property',
    getOptionalText(
      inclusions,
      'additionalPersonalPropertyDescription'
    )
  );

  addBooleanRow(
    document,
    'Leased equipment present',
    inclusions[
      'leasedEquipmentPresent'
    ] === true
  );

  addBooleanRow(
    document,
    'Leased-equipment obligations accepted',
    inclusions[
      'leasedEquipmentObligationsAccepted'
    ] === true
  );
}


function renderSettlement(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const settlement =
    getObject(
      version.terms,
      'settlement'
    );

  addSectionHeading(
    document,
    '9. Settlement, closing and possession'
  );

  addDataRow(
    document,
    'Settlement date',
    formatDateValue(
      settlement[
        'settlementDate'
      ]
    )
  );

  addDataRow(
    document,
    'Closing date',
    formatDateValue(
      settlement[
        'closingDate'
      ]
    )
  );

  addOptionalDataRow(
    document,
    'Proposed closing attorney',
    getOptionalText(
      settlement,
      'proposedClosingAttorneyName'
    )
  );

  addOptionalDataRow(
    document,
    'Settlement location',
    getOptionalText(
      settlement,
      'proposedSettlementLocation'
    )
  );

  addDataRow(
    document,
    'Possession',
    formatStatus(
      getText(
        settlement,
        'possessionTiming'
      )
    )
  );

  addOptionalDataRow(
    document,
    'Possession date',
    getOptionalText(
      settlement,
      'possessionDate'
    )
  );

  addOptionalDataRow(
    document,
    'Possession time',
    getOptionalText(
      settlement,
      'possessionTime'
    )
  );

  addDataRow(
    document,
    'Proposed deed name',
    getText(
      settlement,
      'proposedDeedName'
    )
  );
}


function renderDisclosuresAndAddenda(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  addSectionHeading(
    document,
    '10. Disclosures and addenda'
  );

  const disclosures =
    version.terms[
      'disclosures'
    ];

  if (
    Array.isArray(disclosures) &&
    disclosures.length > 0
  ) {
    document
      .fillColor(
        NAVSTREET_TEAL
      )
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Disclosures');

    disclosures.forEach(
      disclosure => {
        const data =
          asObject(
            disclosure
          );

        addDataRow(
          document,
          getText(
            data,
            'title'
          ),

          data['acknowledged'] ===
            true
            ? 'Received and acknowledged'
            : 'Not acknowledged'
        );
      }
    );
  } else {
    addParagraph(
      document,
      'No disclosures were attached to this prototype version.'
    );
  }

  const addenda =
    version.terms[
      'addenda'
    ];

  if (
    Array.isArray(addenda) &&
    addenda.length > 0
  ) {
    document
      .moveDown(0.4)
      .fillColor(
        NAVSTREET_TEAL
      )
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Addenda');

    addenda.forEach(
      addendum => {
        const data =
          asObject(
            addendum
          );

        addDataRow(
          document,
          getText(
            data,
            'title'
          ),

          data['selected'] ===
            true
            ? 'Included'
            : 'Not included'
        );
      }
    );
  } else {
    addParagraph(
      document,
      'No addenda were attached to this prototype version.'
    );
  }
}


function renderAdditionalTerms(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  addSectionHeading(
    document,
    '11. Additional terms'
  );

  const requests =
    version.terms[
      'additionalTermRequests'
    ];

  if (
    !Array.isArray(requests) ||
    requests.length === 0
  ) {
    addParagraph(
      document,
      'No additional terms were included.'
    );

    return;
  }

  requests.forEach(
    (request, index) => {
      const data =
        asObject(
          request
        );

      addDataRow(
        document,
        `Additional term ${index + 1}`,
        getText(
          data,
          'plainLanguageRequest'
        )
      );

      addDataRow(
        document,
        'Resolution',
        formatStatus(
          getText(
            data,
            'resolution'
          )
        )
      );

      addOptionalDataRow(
        document,
        'Attorney-prepared language',
        getOptionalText(
          data,
          'attorneyPreparedText'
        )
      );
    }
  );
}


function renderDeliveryAndExpiration(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  const delivery =
    getObject(
      version.terms,
      'delivery'
    );

  addSectionHeading(
    document,
    '12. Offer expiration and delivery'
  );

  addDataRow(
    document,
    'Offer expires',
    formatDateTimeValue(
      delivery['expiresAt']
    )
  );

  addDataRow(
    document,
    'Time zone',
    getText(
      delivery,
      'timeZone'
    )
  );

  addDataRow(
    document,
    'Buyer delivery email',
    getText(
      delivery,
      'buyerDeliveryEmail'
    )
  );

  addDataRow(
    document,
    'Seller delivery email',
    getText(
      delivery,
      'sellerDeliveryEmail'
    )
  );

  addBooleanRow(
    document,
    'Electronic delivery authorized',
    delivery[
      'electronicDeliveryAuthorized'
    ] === true
  );
}


function renderElectronicTransactionNotice(
  document: PDFKit.PDFDocument
): void {
  addSectionHeading(
    document,
    '13. Electronic records and signatures'
  );

  addParagraph(
    document,
    'The parties’ electronic-transaction consent, identity-verification results, signature timestamps, delivery events and document hash are maintained in the NavStreet audit record associated with this agreement.'
  );

  addParagraph(
    document,
    'NavStreet does not draft transaction-specific special provisions. Any term that is not covered by the approved agreement or an approved addendum must be supplied through the authorized attorney-prepared-language workflow.'
  );
}


function renderSignatures(
  document: PDFKit.PDFDocument,
  version: OfferVersionDocument
): void {
  addSectionHeading(
    document,
    '14. Signatures'
  );

  [
    ...version.buyers,
    ...version.sellers,
  ].forEach(
    party => {
      ensureSpace(
        document,
        112
      );

      document
        .fillColor(TEXT_COLOR)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `${capitalize(
            party.role
          )}: ${party.legalName}`
        );

      document.moveDown(0.45);

      const lineY =
        document.y + 18;

      document
        .strokeColor(
          BORDER_COLOR
        )
        .lineWidth(1)
        .moveTo(
          PAGE_MARGIN,
          lineY
        )
        .lineTo(
          PAGE_MARGIN + 315,
          lineY
        )
        .stroke();

      document
        .fillColor(MUTED_COLOR)
        .font('Helvetica')
        .fontSize(8)
        .text(
          party.signature.status ===
            'signed'
            ? 'Electronically signed'
            : 'Electronic signature pending',
          PAGE_MARGIN,
          lineY + 5,
          {
            width: 315,
          }
        );

      document
        .fillColor(TEXT_COLOR)
        .fontSize(8)
        .text(
          party.signature.signedAt
            ? formatDateTime(
              party.signature
                .signedAt
                .toDate()
            )
            : '',
          PAGE_MARGIN + 330,
          lineY + 5,
          {
            width: 174,
            align: 'right',
          }
        );

      document.y =
        lineY + 30;
    }
  );
}


function renderDocumentCertification(
  document: PDFKit.PDFDocument,
  input: GenerateOfferPdfInput
): void {
  addSectionHeading(
    document,
    'Document record'
  );

  addDataRow(
    document,
    'Offer reference',
    input.offer.referenceNumber
  );

  addDataRow(
    document,
    'Offer UID',
    input.offer.Uid
  );

  addDataRow(
    document,
    'Offer-version UID',
    input.version.Uid
  );

  addDataRow(
    document,
    'Version number',
    input.version
      .versionNumber
      .toString()
  );

  addDataRow(
    document,
    'Generated',
    formatDateTime(
      input.generatedAt
    )
  );

  addParagraph(
    document,
    'The permanent stored document record will include a SHA-256 hash and electronic-signature completion certificate after generation and signing are complete.'
  );
}


function addSectionHeading(
  document: PDFKit.PDFDocument,
  title: string
): void {
  ensureSpace(
    document,
    50
  );

  document.moveDown(0.65);

  const top =
    document.y;

  document
    .roundedRect(
      PAGE_MARGIN,
      top,
      CONTENT_WIDTH,
      25,
      4
    )
    .fill(
      LIGHT_BACKGROUND
    );

  document
    .fillColor(
      NAVSTREET_BLUE
    )
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(
      title,
      PAGE_MARGIN + 10,
      top + 7,
      {
        width:
          CONTENT_WIDTH - 20,
      }
    );

  document.y =
    top + 33;
}


function addDataRow(
  document: PDFKit.PDFDocument,
  label: string,
  value: string
): void {
  const normalizedValue =
    value.trim().length > 0
      ? value.trim()
      : 'Not provided';

  const labelWidth = 190;
  const valueWidth =
    CONTENT_WIDTH - labelWidth;

  const rowHeight =
    Math.max(
      18,

      document.heightOfString(
        normalizedValue,
        {
          width:
            valueWidth - 12,
        }
      ) + 8
    );

  ensureSpace(
    document,
    rowHeight + 2
  );

  const top =
    document.y;

  document
    .strokeColor(
      BORDER_COLOR
    )
    .lineWidth(0.5)
    .moveTo(
      PAGE_MARGIN,
      top + rowHeight
    )
    .lineTo(
      PAGE_WIDTH -
        PAGE_MARGIN,
      top + rowHeight
    )
    .stroke();

  document
    .fillColor(
      MUTED_COLOR
    )
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(
      label,
      PAGE_MARGIN,
      top + 5,
      {
        width:
          labelWidth - 10,
      }
    );

  document
    .fillColor(
      TEXT_COLOR
    )
    .font('Helvetica')
    .fontSize(8.5)
    .text(
      normalizedValue,
      PAGE_MARGIN +
        labelWidth,
      top + 5,
      {
        width:
          valueWidth - 8,
      }
    );

  document.y =
    top + rowHeight + 2;
}


function addOptionalDataRow(
  document: PDFKit.PDFDocument,
  label: string,
  value: string | undefined
): void {
  if (
    !value ||
    value.trim().length === 0
  ) {
    return;
  }

  addDataRow(
    document,
    label,
    value
  );
}


function addBooleanRow(
  document: PDFKit.PDFDocument,
  label: string,
  value: boolean
): void {
  addDataRow(
    document,
    label,
    value ? 'Yes' : 'No'
  );
}


function addBooleanAndMoneyRow(
  document: PDFKit.PDFDocument,
  label: string,
  selected: boolean,
  amountInCents: number
): void {
  addDataRow(
    document,
    label,
    selected
      ? `Yes — ${formatCurrency(
        amountInCents
      )}`
      : 'No'
  );
}


function addOptionalMoneyRow(
  document: PDFKit.PDFDocument,
  label: string,
  amountInCents:
    number | undefined
): void {
  if (
    amountInCents === undefined
  ) {
    return;
  }

  addDataRow(
    document,
    label,
    formatCurrency(
      amountInCents
    )
  );
}


function addParagraph(
  document: PDFKit.PDFDocument,
  text: string
): void {
  const height =
    document.heightOfString(
      text,
      {
        width:
          CONTENT_WIDTH,
        lineGap: 2,
      }
    ) + 10;

  ensureSpace(
    document,
    height
  );

  document
    .fillColor(TEXT_COLOR)
    .font('Helvetica')
    .fontSize(9)
    .text(
      text,
      {
        width:
          CONTENT_WIDTH,
        lineGap: 2,
        align: 'left',
      }
    );

  document.moveDown(0.45);
}


function ensureSpace(
  document: PDFKit.PDFDocument,
  requiredHeight: number
): void {
  const maximumY =
    PAGE_HEIGHT - 76;

  if (
    document.y +
      requiredHeight >
    maximumY
  ) {
    document.addPage();
  }
}


function addPageFooters(
  document: PDFKit.PDFDocument,
  referenceNumber: string,
  versionNumber: number
): void {
  const range =
    document.bufferedPageRange();

  for (
    let pageIndex = 0;
    pageIndex < range.count;
    pageIndex += 1
  ) {
    document.switchToPage(
      range.start +
        pageIndex
    );

    document
      .strokeColor(
        BORDER_COLOR
      )
      .lineWidth(0.5)
      .moveTo(
        PAGE_MARGIN,
        PAGE_HEIGHT - 52
      )
      .lineTo(
        PAGE_WIDTH -
          PAGE_MARGIN,
        PAGE_HEIGHT - 52
      )
      .stroke();

    document
      .fillColor(
        MUTED_COLOR
      )
      .font('Helvetica')
      .fontSize(7.5)
      .text(
        `${referenceNumber}  |  Version ${versionNumber}`,
        PAGE_MARGIN,
        PAGE_HEIGHT - 42,
        {
          width:
            CONTENT_WIDTH / 2,
          align: 'left',
        }
      );

    document.text(
      `Page ${pageIndex + 1} of ${range.count}`,
      PAGE_MARGIN +
        CONTENT_WIDTH / 2,
      PAGE_HEIGHT - 42,
      {
        width:
          CONTENT_WIDTH / 2,
        align: 'right',
      }
    );
  }
}


function getObject(
  parent: Record<string, unknown>,
  key: string
): Record<string, unknown> {
  return asObject(
    parent[key]
  );
}


function asObject(
  value: unknown
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value as
    Record<string, unknown>;
}


function getText(
  data: Record<string, unknown>,
  key: string
): string {
  const value =
    data[key];

  return typeof value === 'string'
    ? value
    : '';
}


function getOptionalText(
  data: Record<string, unknown>,
  key: string
): string | undefined {
  const value =
    getText(
      data,
      key
    )
      .trim();

  return value.length > 0
    ? value
    : undefined;
}


function getNumber(
  data: Record<string, unknown>,
  key: string
): number {
  const value =
    data[key];

  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : 0;
}


function getOptionalNumber(
  data: Record<string, unknown>,
  key: string
): number | undefined {
  const value =
    data[key];

  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : undefined;
}


function formatCurrency(
  amountInCents: number
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
    }
  ).format(
    amountInCents / 100
  );
}


function formatAddress(
  address: {
    addressLine1: string;
    addressLine2?: string;

    city: string;
    state: string;
    zipCode: string;
    country: string;
  }
): string {
  return [
    address.addressLine1,
    address.addressLine2,

    [
      address.city,
      address.state,
      address.zipCode,
    ]
      .filter(Boolean)
      .join(' '),

    address.country !== 'US'
      ? address.country
      : undefined,
  ]
    .filter(Boolean)
    .join(', ');
}


function formatPropertyAddress(
  property:
    Record<string, unknown>
): string {
  return [
    getOptionalText(
      property,
      'addressLine1'
    ),

    getOptionalText(
      property,
      'addressLine2'
    ),

    [
      getOptionalText(
        property,
        'city'
      ),

      getOptionalText(
        property,
        'state'
      ),

      getOptionalText(
        property,
        'zipCode'
      ),
    ]
      .filter(Boolean)
      .join(' '),
  ]
    .filter(Boolean)
    .join(', ');
}


function formatDateTimeValue(
  value: unknown
): string {
  if (typeof value !== 'string') {
    return 'Not provided';
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? value
    : formatDateTime(date);
}


function formatOptionalDateTimeValue(
  value: unknown
): string | undefined {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    return undefined;
  }

  return formatDateTimeValue(
    value
  );
}


function formatDateValue(
  value: unknown
): string {
  if (typeof value !== 'string') {
    return 'Not provided';
  }

  const date =
    new Date(
      `${value}T12:00:00Z`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    }
  ).format(date);
}


function formatDateTime(
  date: Date
): string {
  return new Intl.DateTimeFormat(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',

      hour: 'numeric',
      minute: '2-digit',

      timeZoneName: 'short',

      timeZone:
        'America/New_York',
    }
  ).format(date);
}


function formatStatus(
  value: string
): string {
  return value
    .split('_')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');
}


function capitalize(
  value: string
): string {
  if (value.length === 0) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}


function createFileName(
  referenceNumber: string,
  versionNumber: number,
  title: string
): string {
  const normalizedTitle =
    title
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-|-$/g,
        ''
      );

  return [
    referenceNumber,
    `version-${versionNumber}`,
    normalizedTitle,
  ].join('-') + '.pdf';
}