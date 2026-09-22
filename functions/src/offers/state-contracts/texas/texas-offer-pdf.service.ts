import {
  createHash,
} from 'node:crypto';

import {
  existsSync,
} from 'node:fs';

import {
  readFile,
} from 'node:fs/promises';

import {
  resolve,
} from 'node:path';

import {
  PDFDocument,
  PDFForm,
  StandardFonts,
} from 'pdf-lib';

import type {
  GenerateStateAgreementInput,
  GeneratedStateAgreement,
} from '../state-contract-package';

import type {
  OfferVersionPartySnapshotDocument,
} from '../../offer-types';

import type {
  TexasAddendumSelectionDocument,
  TexasNoticeContactDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
} from './texas-offer-terms.document';

import {
  TREC_20_19_TEMPLATE,
} from './contracts/one-to-four-family-resale/trec-20-19-template';


type TexasAgreementInput =
  GenerateStateAgreementInput<
    TexasOneToFourFamilyResaleOfferTermsDocument
  >;


export async function generateTexasOfferPdf(
  input: TexasAgreementInput
): Promise<GeneratedStateAgreement> {
  const terms = requireTrec2019Terms(
    input.version.terms
  );

  const templateBytes =
    await loadVerifiedTemplate();

  const pdfDocument =
    await PDFDocument.load(templateBytes, {
      updateMetadata: false,
    });

  if (
    pdfDocument.getPageCount() !==
    TREC_20_19_TEMPLATE.pageCount
  ) {
    throw new Error(
      'The TREC 20-19 template page count is invalid.'
    );
  }

  const form = pdfDocument.getForm();

  assertRequiredFields(form);

  populateContract(
    form,
    terms,
    input.version.buyers,
    input.version.sellers
  );

  const appearanceFont =
    await pdfDocument.embedFont(
      StandardFonts.Helvetica
    );

  form.updateFieldAppearances(
    appearanceFont
  );

  pdfDocument.setTitle(
    input.documentTitle
  );
  pdfDocument.setAuthor('NavStreet');
  pdfDocument.setSubject(
    `${TREC_20_19_TEMPLATE.formName} - ${input.documentStatus}`
  );
  pdfDocument.setProducer('NavStreet');
  pdfDocument.setCreator('NavStreet');
  pdfDocument.setCreationDate(
    input.generatedAt
  );
  pdfDocument.setModificationDate(
    input.generatedAt
  );

  const generatedBytes =
    await pdfDocument.save({
      useObjectStreams: false,
      addDefaultPage: false,
      updateFieldAppearances: false,
    });

  return {
    buffer: Buffer.from(generatedBytes),
    fileName:
      createAgreementFileName(
        input.offer.referenceNumber,
        input.version.versionNumber
      ),
    pageCount:
      pdfDocument.getPageCount(),
  };
}


function requireTrec2019Terms(
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): TexasOneToFourFamilyResaleOfferTermsDocument {
  if (
    terms.stateCode !== 'TX' ||
    terms.contractType !==
    TREC_20_19_TEMPLATE.contractType ||
    terms.form.formId !==
    TREC_20_19_TEMPLATE.formId ||
    terms.form.effectiveDate !==
    TREC_20_19_TEMPLATE.effectiveDate ||
    terms.form.revisionDate !==
    TREC_20_19_TEMPLATE.revisionDate
  ) {
    throw new Error(
      'The Texas agreement generator supports only the current TREC 20-19 contract package.'
    );
  }

  return terms;
}


async function loadVerifiedTemplate(): Promise<Uint8Array> {
  const templatePath = resolveTemplatePath();
  const bytes = await readFile(templatePath);
  const actualHash = createHash('sha256')
    .update(bytes)
    .digest('hex');

  if (actualHash !== TREC_20_19_TEMPLATE.sha256) {
    throw new Error(
      'The TREC 20-19 template failed its integrity check.'
    );
  }

  return bytes;
}


function resolveTemplatePath(): string {
  const relativePath =
    TREC_20_19_TEMPLATE.assetRelativePath;

  const candidates = [
    resolve(process.cwd(), relativePath),
    resolve(__dirname, '../../../../', relativePath),
  ];

  const templatePath = candidates.find(
    candidate => existsSync(candidate)
  );

  if (!templatePath) {
    throw new Error(
      `The TREC 20-19 template asset is missing. Expected ${relativePath}.`
    );
  }

  return templatePath;
}


function assertRequiredFields(
  form: PDFForm
): void {
  const availableFields = new Set(
    form.getFields().map(
      field => field.getName()
    )
  );

  const textFields =
    Object.entries(
      TREC_20_19_TEMPLATE.fields
    )
      .flatMap(
        ([key, value]) =>
          key === 'headerAddresses'
            ? [...value]
            : [value as string]
      );

  const checkboxFields =
    Object.values(
      TREC_20_19_TEMPLATE.checkboxes
    );

  const missingFields = [
    ...textFields,
    ...checkboxFields,
  ].filter(
    fieldName =>
      !availableFields.has(fieldName)
  );

  if (missingFields.length > 0) {
    throw new Error(
      `The TREC 20-19 template is missing mapped fields: ${missingFields.join(', ')}.`
    );
  }
}


function populateContract(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument,
  buyers: OfferVersionPartySnapshotDocument[],
  sellers: OfferVersionPartySnapshotDocument[]
): void {
  const fields = TREC_20_19_TEMPLATE.fields;
  const checks = TREC_20_19_TEMPLATE.checkboxes;
  const propertyAddress =
    formatPropertyAddress(terms);

  setText(
    form,
    fields.sellerNames,
    formatPartyNames(sellers)
  );
  setText(
    form,
    fields.buyerNames,
    formatPartyNames(buyers)
  );

  setText(form, fields.lot, terms.propertyIdentification.lot);
  setText(form, fields.block, terms.propertyIdentification.block);
  setText(form, fields.addition, terms.propertyIdentification.addition);
  setText(form, fields.city, terms.property.city);
  setText(form, fields.county, terms.property.county);
  setText(form, fields.propertyAddress, propertyAddress);

  const exclusionLines = splitText(
    terms.propertyTerms.exclusions,
    75
  );
  setText(form, fields.exclusionsLine1, exclusionLines[0]);
  setText(form, fields.exclusionsLine2, exclusionLines[1]);

  setText(form, fields.cashPortion, money(terms.salesPrice.cashPortionInCents));
  setText(form, fields.financingAmount, money(terms.salesPrice.financingInCents));
  setText(form, fields.salesPrice, money(terms.salesPrice.salesPriceInCents));

  setChecked(
    form,
    checks.thirdPartyFinancing,
    terms.salesPrice.financingAddenda.includes(
      'third_party_financing'
    )
  );
  setChecked(
    form,
    checks.loanAssumption,
    terms.salesPrice.financingAddenda.includes(
      'loan_assumption'
    )
  );
  setChecked(
    form,
    checks.sellerFinancing,
    terms.salesPrice.financingAddenda.includes(
      'seller_financing'
    )
  );

  setChecked(form, fields.residentialLeases, terms.leases.residentialLeasesExist === true);
  setChecked(form, fields.fixtureLeases, terms.leases.fixtureLeasesExist === true);
  setChecked(
    form,
    fields.naturalResourceLeases,
    terms.leases.naturalResourceLeaseStatus === 'delivered' ||
    terms.leases.naturalResourceLeaseStatus === 'not_delivered'
  );
  setChecked(
    form,
    fields.naturalResourceLeasesDelivered,
    terms.leases.naturalResourceLeaseStatus === 'delivered'
  );
  setChecked(
    form,
    fields.naturalResourceLeasesNotDelivered,
    terms.leases.naturalResourceLeaseStatus === 'not_delivered'
  );
  setText(
    form,
    fields.naturalResourceLeaseTerminationDays,
    integer(terms.leases.naturalResourceLeaseTerminationDays)
  );

  const escrowAddress = splitText(
    terms.earnestMoneyAndOption.escrowAgentAddress,
    62
  );
  setText(form, fields.escrowAgentName, terms.earnestMoneyAndOption.escrowAgentName);
  setText(form, fields.escrowAgentAddressLine1, escrowAddress[0]);
  setText(form, fields.escrowAgentAddressLine2, escrowAddress[1]);
  setText(form, fields.earnestMoney, money(terms.earnestMoneyAndOption.earnestMoneyInCents));
  setText(form, fields.optionFee, money(terms.earnestMoneyAndOption.optionFeeInCents));
  setText(form, fields.additionalEarnestMoney, money(terms.earnestMoneyAndOption.additionalEarnestMoneyInCents));
  setText(form, fields.additionalEarnestMoneyDeliveryDays, integer(terms.earnestMoneyAndOption.additionalEarnestMoneyDeliveryDays));
  setText(form, fields.optionPeriodDays, integer(terms.earnestMoneyAndOption.optionPeriodDays));

  setText(form, fields.titleCompanyName, terms.titlePolicy.titleCompanyName);
  setChecked(form, fields.titlePolicySellerExpense, terms.titlePolicy.titlePolicyExpensePayer === 'seller');
  setChecked(form, fields.titlePolicyBuyerExpense, terms.titlePolicy.titlePolicyExpensePayer === 'buyer');
  setChecked(form, fields.boundaryNotAmended, terms.titlePolicy.boundaryExceptionTreatment === 'not_amended_or_deleted');
  setChecked(form, fields.boundaryAmended, terms.titlePolicy.boundaryExceptionTreatment === 'amended_to_shortages_in_area');
  setChecked(form, fields.boundaryAmendmentBuyerExpense,
    terms.titlePolicy.boundaryExceptionTreatment === 'amended_to_shortages_in_area' &&
    terms.titlePolicy.boundaryAmendmentExpensePayer === 'buyer');
  setChecked(form, fields.boundaryAmendmentSellerExpense,
    terms.titlePolicy.boundaryExceptionTreatment === 'amended_to_shortages_in_area' &&
    terms.titlePolicy.boundaryAmendmentExpensePayer === 'seller');

  populateSurvey(form, terms);
  populateDisclosuresAndCondition(form, terms);
  populateClosingAndPossession(form, terms);
  populateNotices(form, terms);
  populateAttorneys(form, terms);
  populateAddenda(form, terms);

  for (const headerField of fields.headerAddresses) {
    setText(form, headerField, propertyAddress);
  }
}


function populateSurvey(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const fields = TREC_20_19_TEMPLATE.fields;
  const survey = terms.survey;

  setChecked(form, fields.surveySellerExisting, survey.selection === 'seller_existing_survey');
  setChecked(form, fields.surveyBuyerNew, survey.selection === 'buyer_new_survey');
  setChecked(form, fields.surveySellerNew, survey.selection === 'seller_new_survey');

  if (survey.selection === 'seller_existing_survey') {
    setText(form, fields.surveyExistingDeliveryDays, integer(survey.deliveryDays));
    setChecked(form, fields.surveyRejectedSellerExpense, survey.newSurveyIfExistingRejectedExpensePayer === 'seller');
    setChecked(form, fields.surveyRejectedBuyerExpense, survey.newSurveyIfExistingRejectedExpensePayer === 'buyer');
  } else if (survey.selection === 'buyer_new_survey') {
    setText(form, fields.surveyBuyerNewDeliveryDays, integer(survey.deliveryDays));
  } else if (survey.selection === 'seller_new_survey') {
    setText(form, fields.surveySellerNewDeliveryDays, integer(survey.deliveryDays));
  }

  setText(form, fields.prohibitedUse, survey.prohibitedUseOrActivity);
  setText(form, fields.titleObjectionDays, integer(survey.titleObjectionDays));
  setChecked(form, fields.propertyAssociationYes, terms.propertyAssociation.mandatoryMembership === true);
  setChecked(form, fields.propertyAssociationNo, terms.propertyAssociation.mandatoryMembership === false);
}


function populateDisclosuresAndCondition(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const fields = TREC_20_19_TEMPLATE.fields;
  const disclosure = terms.disclosures.propertyCondition;

  setChecked(form, fields.sellerDisclosureReceived, disclosure.status === 'received');
  setChecked(form, fields.sellerDisclosureNotReceived, disclosure.status === 'not_received');
  setChecked(form, fields.sellerDisclosureExempt, disclosure.status === 'exempt');
  setText(form, fields.sellerDisclosureDeliveryDays, integer(disclosure.deliveryDays));

  const condition = terms.propertyCondition;
  setChecked(form, fields.propertyAcceptedAsIs, condition.acceptance === 'as_is');
  setChecked(form, fields.propertyAcceptedWithRepairs, condition.acceptance === 'as_is_with_specific_repairs');

  const repairLines = splitText(
    condition.partyProvidedRepairsAndTreatments,
    93
  );
  setText(form, fields.repairsLine1, repairLines[0]);
  setText(form, fields.repairsLine2, repairLines[1]);
  setText(form, fields.serviceContractReimbursement, money(condition.residentialServiceContractReimbursementInCents));

  const waterDisclosure = terms.disclosures.waterRights;
  setChecked(form, TREC_20_19_TEMPLATE.checkboxes.waterDisclosureReceived,
    waterDisclosure.status === 'received');
  setChecked(form, TREC_20_19_TEMPLATE.checkboxes.waterDisclosureNotReceived,
    waterDisclosure.status === 'not_received');
  setChecked(form, TREC_20_19_TEMPLATE.checkboxes.waterDisclosureExempt,
    waterDisclosure.status === 'exempt');
  setText(form, fields.waterDisclosureDeliveryDays, integer(waterDisclosure.deliveryDays));

  const waterSupplierLines = splitText(
    terms.disclosures.exemptWaterSupplierName,
    90
  );
  setText(form, fields.exemptWaterSupplierLine1, waterSupplierLines[0]);
  setText(form, fields.exemptWaterSupplierLine2, waterSupplierLines[1]);
}


function populateClosingAndPossession(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const fields = TREC_20_19_TEMPLATE.fields;
  const closingDate = parseIsoDate(
    terms.closingAndPossession.closingDate
  );

  setText(form, fields.closingDate, closingDate?.monthAndDay);
  setText(form, fields.closingYear, closingDate?.twoDigitYear);
  setChecked(form, fields.possessionAtClosing, terms.closingAndPossession.possession === 'upon_closing_and_funding');
  setChecked(form, fields.possessionByLease, terms.closingAndPossession.possession === 'temporary_residential_lease');

  const specialProvisionLines = splitText(
    terms.specialProvisions.included
      ? terms.specialProvisions.partyProvidedText
      : undefined,
    105
  );
  setText(form, fields.specialProvisionsLine1, specialProvisionLines[0]);
  setText(form, fields.specialProvisionsLine2, specialProvisionLines[1]);
  setText(form, fields.specialProvisionsLine3, specialProvisionLines[2]);

  const brokerDisclosureLines = splitText(
    terms.brokerOrSalesAgentDisclosure,
    105
  );
  setText(form, fields.brokerDisclosureLine1, brokerDisclosureLines[0]);
  setText(form, fields.brokerDisclosureLine2, brokerDisclosureLines[1]);
  setText(form, fields.brokerDisclosureLine3, brokerDisclosureLines[2]);
  setText(form, fields.sellerContributionToBuyerExpenses, money(terms.expenses.sellerContributionToBuyerExpensesInCents));

  populateBrokerContribution(
    form,
    terms.expenses.sellerContributionToBuyerBroker,
    {
      none: TREC_20_19_TEMPLATE.checkboxes.sellerBrokerContributionNone,
      amountSelected: TREC_20_19_TEMPLATE.checkboxes.sellerBrokerContributionAmountSelected,
      percentageSelected: TREC_20_19_TEMPLATE.checkboxes.sellerBrokerContributionPercentageSelected,
      amount: fields.sellerBrokerContributionAmount,
      percentage: fields.sellerBrokerContributionPercentage,
    }
  );
  populateBrokerContribution(
    form,
    terms.expenses.buyerContributionToSellerBroker,
    {
      none: TREC_20_19_TEMPLATE.checkboxes.buyerBrokerContributionNone,
      amountSelected: TREC_20_19_TEMPLATE.checkboxes.buyerBrokerContributionAmountSelected,
      percentageSelected: TREC_20_19_TEMPLATE.checkboxes.buyerBrokerContributionPercentageSelected,
      amount: fields.buyerBrokerContributionAmount,
      percentage: fields.buyerBrokerContributionPercentage,
    }
  );
}


function populateBrokerContribution(
  form: PDFForm,
  contribution: {
    contributionType:
    'unselected' |
    'none' |
    'amount' |
    'percentage';
    amountInCents?: number;
    percentageOfSalesPrice?: number;
  },
  names: {
    none: string;
    amountSelected: string;
    percentageSelected: string;
    amount: string;
    percentage: string;
  }
): void {
  setChecked(form, names.none, contribution.contributionType === 'none');
  setChecked(form, names.amountSelected, contribution.contributionType === 'amount');
  setChecked(form, names.percentageSelected, contribution.contributionType === 'percentage');
  setText(form, names.amount,
    contribution.contributionType === 'amount'
      ? money(contribution.amountInCents)
      : '');
  setText(form, names.percentage,
    contribution.contributionType === 'percentage' &&
      contribution.percentageOfSalesPrice !== undefined
      ? String(contribution.percentageOfSalesPrice)
      : '');
}


function populateNotices(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const fields = TREC_20_19_TEMPLATE.fields;

  populateNoticeContact(form, terms.notices.buyer, {
    addressLine1: fields.buyerNoticeAddressLine1,
    addressLine2: fields.buyerNoticeAddressLine2,
    phone: fields.buyerNoticePhone,
    email: fields.buyerNoticeEmail,
  });
  populateNoticeContact(form, terms.notices.seller, {
    addressLine1: fields.sellerNoticeAddressLine1,
    addressLine2: fields.sellerNoticeAddressLine2,
    phone: fields.sellerNoticePhone,
    email: fields.sellerNoticeEmail,
  });
  populateNoticeContact(form, terms.notices.buyerAgent, {
    addressLine1: fields.buyerAgentAddressLine1,
    addressLine2: fields.buyerAgentAddressLine2,
    phone: fields.buyerAgentPhone,
    email: fields.buyerAgentEmail,
  });
  populateNoticeContact(form, terms.notices.sellerAgent, {
    addressLine1: fields.sellerAgentAddressLine1,
    addressLine2: fields.sellerAgentAddressLine2,
    phone: fields.sellerAgentPhone,
    email: fields.sellerAgentEmail,
  });
}


function populateNoticeContact(
  form: PDFForm,
  contact: TexasNoticeContactDocument | undefined,
  names: {
    addressLine1: string;
    addressLine2: string;
    phone: string;
    email: string;
  }
): void {
  const addressLines = formatNoticeAddress(contact);

  setText(form, names.addressLine1, addressLines[0]);
  setText(form, names.addressLine2, addressLines[1]);
  setText(form, names.phone, contact?.phone);
  setText(form, names.email, contact?.email);
}


function populateAttorneys(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const fields = TREC_20_19_TEMPLATE.fields;
  const buyer = terms.attorneys.buyerAttorney;
  const seller = terms.attorneys.sellerAttorney;
  const buyerPhone = splitPhone(buyer?.phone);
  const buyerFax = splitPhone(buyer?.fax);
  const sellerPhone = splitPhone(seller?.phone);
  const sellerFax = splitPhone(seller?.fax);

  setText(form, fields.buyerAttorneyName, buyer?.name);
  setText(form, fields.buyerAttorneyPhoneAreaCode, buyerPhone.areaCode);
  setText(form, fields.buyerAttorneyPhoneNumber, buyerPhone.number);
  setText(form, fields.buyerAttorneyFaxAreaCode, buyerFax.areaCode);
  setText(form, fields.buyerAttorneyFaxNumber, buyerFax.number);
  setText(form, fields.buyerAttorneyEmail, buyer?.email);

  setText(form, fields.sellerAttorneyName, seller?.name);
  setText(form, fields.sellerAttorneyPhoneAreaCode, sellerPhone.areaCode);
  setText(form, fields.sellerAttorneyPhoneNumber, sellerPhone.number);
  setText(form, fields.sellerAttorneyFaxAreaCode, sellerFax.areaCode);
  setText(form, fields.sellerAttorneyFaxNumber, sellerFax.number);
  setText(form, fields.sellerAttorneyEmail, seller?.email);
}


function populateAddenda(
  form: PDFForm,
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): void {
  const checks = TREC_20_19_TEMPLATE.checkboxes;
  const selected = terms.addenda.filter(
    addendum => addendum.included
  );

  const has = (...tokens: string[]): boolean =>
    selected.some(
      addendum => addendumMatches(addendum, tokens)
    );

  setChecked(form, checks.addendumThirdPartyFinancing,
    terms.salesPrice.financingAddenda.includes('third_party_financing') || has('third-party-financing', 'third party financing'));
  setChecked(form, checks.addendumLoanAssumption,
    terms.salesPrice.financingAddenda.includes('loan_assumption') || has('loan-assumption', 'loan assumption'));
  setChecked(form, checks.addendumSellerFinancing,
    terms.salesPrice.financingAddenda.includes('seller_financing') || has('seller-financing', 'seller financing'));
  setChecked(form, checks.addendumResidentialLeases,
    terms.leases.residentialLeasesExist === true || has('residential-leases', 'residential leases'));
  setChecked(form, checks.addendumFixtureLeases,
    terms.leases.fixtureLeasesExist === true || has('fixture-leases', 'fixture leases'));
  setChecked(form, checks.addendumLeadBasedPaint,
    terms.disclosures.leadBasedPaintApplies === true || has('lead-based-paint', 'lead based paint'));
  setChecked(form, checks.addendumPropertyAssociation,
    terms.propertyAssociation.mandatoryMembership === true || has('mandatory-poa-membership', 'mandatory membership'));
  setChecked(form, checks.addendumMineralReservation,
    terms.propertyTerms.mineralWaterTimberReservationApplies === true || has('mineral-reservation', 'reservation of oil'));
  setChecked(form, checks.addendumBuyerTemporaryLease,
    has('buyer-temporary-residential-lease', 'buyer temporary residential lease'));
  setChecked(form, checks.addendumSellerTemporaryLease,
    has('seller-temporary-residential-lease', 'seller temporary residential lease'));
  setChecked(form, checks.addendumBackupContract,
    has('backup-contract', 'back-up contract', 'backup contract'));
  setChecked(form, checks.addendumSaleOfOtherProperty,
    has('sale-of-other-property', 'sale of other property'));
  setChecked(form, checks.addendumSection1031,
    has('section-1031', '1031 exchange'));
  setChecked(form, checks.addendumPropaneGas,
    has('propane-gas', 'propane gas'));
  setChecked(form, checks.addendumPublicImprovementDistrict,
    has('public-improvement-district', 'public improvement district'));
}


function addendumMatches(
  addendum: TexasAddendumSelectionDocument,
  tokens: string[]
): boolean {
  const searchable = `${addendum.formId} ${addendum.title}`
    .toLowerCase();

  return tokens.some(
    token => searchable.includes(token)
  );
}


function setText(
  form: PDFForm,
  fieldName: string,
  value: string | undefined
): void {
  form.getTextField(fieldName).setText(
    value?.trim() ?? ''
  );
}


function setChecked(
  form: PDFForm,
  fieldName: string,
  checked: boolean
): void {
  const field = form.getCheckBox(fieldName);

  if (checked) {
    field.check();
  } else {
    field.uncheck();
  }
}


function formatPartyNames(
  parties: OfferVersionPartySnapshotDocument[]
): string {
  return [...parties]
    .sort((left, right) => left.sequence - right.sequence)
    .map(party => party.legalName.trim())
    .filter(Boolean)
    .join(' and ');
}


function formatPropertyAddress(
  terms: TexasOneToFourFamilyResaleOfferTermsDocument
): string {
  const property = terms.property;
  const street = [
    property.addressLine1,
    property.addressLine2,
  ].filter(Boolean).join(', ');

  return `${street}, ${property.city}, TX ${property.zipCode}`;
}


function formatNoticeAddress(
  contact: TexasNoticeContactDocument | undefined
): [string, string] {
  if (!contact) {
    return ['', ''];
  }

  const cityStateZip = [
    contact.city,
    contact.state,
    contact.zipCode,
  ].filter(Boolean).join(' ');

  return [
    contact.addressLine1?.trim() ?? '',
    [contact.addressLine2, cityStateZip]
      .filter(Boolean)
      .join(', '),
  ];
}


function money(
  cents: number | undefined
): string {
  if (
    cents === undefined ||
    !Number.isFinite(cents)
  ) {
    return '';
  }

  return (cents / 100).toFixed(2);
}


function integer(
  value: number | undefined
): string {
  return value === undefined
    ? ''
    : String(value);
}


function splitText(
  value: string | undefined,
  maximumCharactersPerLine: number
): string[] {
  const text = value?.trim();

  if (!text) {
    return [];
  }

  const words = text.split(/\s+/u);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current
      ? `${current} ${word}`
      : word;

    if (
      current &&
      candidate.length > maximumCharactersPerLine
    ) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}


function parseIsoDate(
  value: string
): {
  monthAndDay: string;
  twoDigitYear: string;
} | undefined {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);

  if (!match) {
    return undefined;
  }

  return {
    monthAndDay: `${match[2]}/${match[3]}`,
    twoDigitYear: match[1]!.slice(-2),
  };
}


function splitPhone(
  value: string | undefined
): {
  areaCode: string;
  number: string;
} {
  const digits = value?.replace(/\D/gu, '') ?? '';

  if (digits.length === 10) {
    return {
      areaCode: digits.slice(0, 3),
      number: `${digits.slice(3, 6)}-${digits.slice(6)}`,
    };
  }

  return {
    areaCode: '',
    number: value?.trim() ?? '',
  };
}


function createAgreementFileName(
  referenceNumber: string,
  versionNumber: number
): string {
  const safeReference = referenceNumber
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/gu, '-')
    .replace(/^-+|-+$/gu, '') || 'offer';

  return `${safeReference}-v${versionNumber}-trec-20-19.pdf`;
}
