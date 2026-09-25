/*
 * Immutable metadata and AcroForm field names for the official
 * TREC 20-19 form effective July 1, 2026.
 *
 * TREC's internal PDF field names are not semantic and must not leak
 * into the document-generation service. A future TREC revision gets
 * its own template module and PDF asset.
 */
export const TREC_20_19_TEMPLATE = {
  stateCode: 'TX',
  contractType: 'one_to_four_family_resale',
  formId: '20-19',
  formName:
    'One to Four Family Residential Contract (Resale)',
  effectiveDate: '2026-07-01',
  revisionDate: '2026-05-04',
  templateVersion: '20-19.2026-07-01',
  pageCount: 12,
  officialPdfFileName: '20-19_4.pdf',
  assetRelativePath:
    'assets/offers/texas/contracts/20-19/20-19_4.pdf',
  sha256:
    '3f458518e9e01fc9c84cab420dcd0ce9793113c4b356ed5caf7a2fb1bdef2ca5',
  fields: {
    sellerNames:
      '1 PARTIES The parties to this contract are',
    buyerNames: 'Seller and',

    lot: 'A LAND Lot',
    block: 'Block',
    addition: 'undefined',
    city: 'Addition City of',
    county: 'County of',
    propertyAddress: 'Texas known as',
    exclusionsLine1:
      'be removed prior to delivery of possession',
    exclusionsLine2: 'undefined_2',

    cashPortion: 'undefined_3',
    financingAmount: 'undefined_4',
    salesPrice: 'undefined_5',

    residentialLeases:
      'i will not be amended or deleted from the title policy or',
    fixtureLeases:
      'ii will be amended to read shortages in area at the expense of',
    naturalResourceLeases:
      'A TITLE POLICY Seller shall furnish to Buyer at',
    naturalResourceLeasesDelivered: 'Sellers',
    naturalResourceLeasesNotDelivered: 'Seller',
    naturalResourceLeaseTerminationDays:
      'to escrow agent within 1',

    escrowAgentName: 'undefined_6',
    escrowAgentAddressLine1:
      'other party in writing before entering into a contract of sale  Disclose if applicable',
    escrowAgentAddressLine2: 'undefined_7',
    earnestMoney: 'as earnest money to',
    optionFee: 'as earnest money to 2',
    additionalEarnestMoney: 'earnest money of',
    additionalEarnestMoneyDeliveryDays:
      'to escrow agent within',
    optionPeriodDays:
      'the Title Company and Buyers lenders Check one box only',

    titleCompanyName:
      'insurance Title Policy issued by',
    titlePolicySellerExpense: 'Sellers_2',
    titlePolicyBuyerExpense:
      'Buyers expense no later',
    boundaryNotAmended: '2Within',
    boundaryAmended: '3Within',
    boundaryAmendmentBuyerExpense: 'is',
    boundaryAmendmentSellerExpense: 'is not',

    surveySellerExisting: 'Buyer',
    surveyExistingDeliveryDays:
      'than 3 days prior to Closing Date',
    surveyRejectedSellerExpense: 'Within one',
    surveyRejectedBuyerExpense: 'Within two',
    surveyBuyerNew: 'Within three',
    surveyBuyerNewDeliveryDays: '3 days prior',
    surveySellerNew: 'Within four',
    surveySellerNewDeliveryDays:
      'receipt or the date specified in this paragraph whichever is earlier',
    prohibitedUse:
      'Commitment other than items 6A1 through 9 above or which prohibit the following use',
    titleObjectionDays:
      'the Commitment Exception Documents and the survey Buyers failure to object within the',

    propertyAssociationYes: '1Within',
    propertyAssociationNo: '2 Within',

    sellerDisclosureReceived:
      '1 Buyer accepts the Property As Is',
    sellerDisclosureNotReceived:
      '2 Buyer accepts the Property As Is provided Seller at Sellers expense shall complete the',
    sellerDisclosureDeliveryDays: 'Within',
    sellerDisclosureExempt: 'upon',

    propertyAcceptedAsIs: 'As Is',
    propertyAcceptedWithRepairs: 'As Is except',
    repairsLine1:
      'following specific repairs and treatments',
    repairsLine2: 'undefined_13',
    serviceContractReimbursement:
      'service contract in an amount not exceeding0',
    waterDisclosureDeliveryDays:
      'service contract in an amount not exceeding1',
    exemptWaterSupplierLine1:
      'service contract in an amount not exceeding3',
    exemptWaterSupplierLine2:
      'service contract in an amount not exceeding',

    brokerDisclosureLine1: 'Brokers and Sales4',
    brokerDisclosureLine2: 'Brokers and Sales',
    brokerDisclosureLine3: 'Brokers and Sales 2',

    closingDate: 'A The closing of the sale will be on or before',
    closingYear: '20',
    possessionAtClosing: 'will',
    possessionByLease:
      'will not be credited to the Sales Price at closing Time is of the',
    specialProvisionsLine1: 'Text3',
    specialProvisionsLine2: 'Text3 2',
    specialProvisionsLine3: 'Text3 3',
    sellerContributionToBuyerExpenses:
      'acknowledged by Seller and Buyers agreement to pay Seller 1',
    sellerBrokerContributionAmount:
      'acknowledged by Seller and Buyers agreement to pay Seller 130',
    sellerBrokerContributionPercentage:
      'acknowledged by Seller and Buyers agreement to pay Seller 31',
    buyerBrokerContributionAmount:
      'acknowledged by Seller and Buyers agreement to pay Seller 32',
    buyerBrokerContributionPercentage:
      'acknowledged by Seller and Buyers agreement to pay Seller 40',

    buyerNoticeAddressLine1:
      'when mailed to handdelivered at or transmitted by fax or electronic transmission as follow15',
    buyerNoticeAddressLine2: 'at7',
    buyerNoticePhone: 'Phone 5217',
    buyerNoticeEmail: 'undefined_2013',
    sellerNoticeAddressLine1: 'undefined6',
    sellerNoticeAddressLine2: 'at_28',
    sellerNoticePhone: 'undefined numb 2110',
    sellerNoticeEmail: 'undefined numb 2214',
    buyerAgentAddressLine1:
      'when mailed to handdelivered at or transmitted by fax or electronic transmission as follows',
    buyerAgentAddressLine2: 'at',
    buyerAgentPhone: 'Phone 52',
    buyerAgentEmail: 'undefined_20',
    sellerAgentAddressLine1: 'undefined_19',
    sellerAgentAddressLine2: 'at_2',
    sellerAgentPhone: 'undefined numb 21',
    sellerAgentEmail: 'undefined numb 22',

    buyerAttorneyName: 'Attorney is',
    buyerAttorneyAddress: 'undefined_24',
    buyerAttorneyPhoneAreaCode: 'Text2',
    buyerAttorneyPhoneNumber: 'Text1',
    buyerAttorneyFaxAreaCode: 'Text7',
    buyerAttorneyFaxNumber: 'Text6',
    buyerAttorneyEmail: 'Email',
    sellerAttorneyName: 'Attorney is_2',
    sellerAttorneyAddress: 'undefined_25',
    sellerAttorneyPhoneAreaCode: 'Text22',
    sellerAttorneyPhoneNumber: 'Phone11',
    sellerAttorneyFaxAreaCode: 'Text23',
    sellerAttorneyFaxNumber: 'Phone 2',
    sellerAttorneyEmail: 'Email_2',

    headerAddresses: [
      'Page 2 of 10',
      'Page 3 of 10',
      'Contract Concerning',
      'Contract Concerning_2',
      'Contract Concerning_3',
      'Page 7 of 10',
      'Contract Concerning_4',
      'Address of Property',
      'Addr of Prop',
    ],
  },
  checkboxes: {
    thirdPartyFinancing:
      'B Sum of all financing described in the attached',
    loanAssumption: 'Check Box2',
    sellerFinancing: 'Loan Assumption Addendum',

    addendumThirdPartyFinancing:
      'Addendum for Reservation of Oil Gas',
    addendumLoanAssumption:
      'Environmental Assessment Threatened or',
    addendumSellerFinancing:
      'Addend. for Sellers Disclos',
    addendumResidentialLeases:
      'Sellers Temporary Residential Lease',
    addendumFixtureLeases:
      'Seller Financing Addendum',
    addendumBuyerTemporaryLease:
      'Short Sale Addendum',
    addendumSellerTemporaryLease:
      'Addendum for Property Subject to',
    addendumLeadBasedPaint:
      'Loan Assumption Addendum_2',
    addendumPropertyAssociation: 'Check Box9',
    addendumBackupContract:
      'Check box 10',
    addendumMineralReservation: 'Buyer only',
    addendumSaleOfOtherProperty:
      'Sellers Disclos',
    addendumSection1031: 'Other',
    addendumPropaneGas:
      'Addendum for Sale of Other Property by',
    addendumPublicImprovementDistrict: 'PID',

    waterDisclosureReceived:
      'Seller as List Brok Sub agent2',
    waterDisclosureNotReceived: 'Dollar Amt2',
    waterDisclosureExempt: 'Dollar Amt',

    sellerBrokerContributionNone:
      'Seller as List Brok Sub agent',
    sellerBrokerContributionAmountSelected:
      'Seller as List Brok Sub agent27',
    sellerBrokerContributionPercentageSelected:
      'Seller only as Sellers agent',
    buyerBrokerContributionNone: 'Dollar Amt4',
    buyerBrokerContributionAmountSelected:
      'Dollar Amt5',
    buyerBrokerContributionPercentageSelected:
      'Percentage',
  },
} as const;


export type Trec2019TextFieldName =
  typeof TREC_20_19_TEMPLATE.fields[
    Exclude<
      keyof typeof TREC_20_19_TEMPLATE.fields,
      'headerAddresses'
    >
  ];


export type Trec2019CheckboxFieldName =
  typeof TREC_20_19_TEMPLATE.checkboxes[
    keyof typeof TREC_20_19_TEMPLATE.checkboxes
  ];
