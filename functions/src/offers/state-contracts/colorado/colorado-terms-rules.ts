import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { COLORADO_ELECTION_DEFAULTS, COLORADO_FACT_DEFAULTS } from './colorado-contract-elections';

export type ColoradoIssue = { fieldPath: string; message: string };
const date = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const money = (v: number, positive = false) => Number.isSafeInteger(v) && (positive ? v > 0 : v >= 0);
export const coloradoFederalLoan = (t: ColoradoOfferTermsDocument) =>
  t.purchase.financingType === 'new_loan' && ['fha', 'va'].includes(t.purchase.newLoanType);
export function normalizeColoradoTerms(t: ColoradoOfferTermsDocument): ColoradoOfferTermsDocument {
  const p = t.purchase;
  const e = { ...COLORADO_ELECTION_DEFAULTS, ...t.elections };
  if (!e.extendedCoverage) { e.extendedCoveragePayer = 'unselected'; e.extendedCoverageOther = ''; }
  const federal = coloradoFederalLoan(t);
  const loan = p.financingType === 'new_loan' ? p.newLoanAmountInCents :
    p.financingType === 'assumption' ? (t.sellerLoan?.estimatedBalanceInCents ?? 0) : 0;
  const d = { ...t.deadlines, sellerPropertyDisclosure: '', leadDisclosure: '' };
  const clear = (...keys: (keyof typeof d)[]) => { for (const key of keys) if (typeof d[key] === 'string') (d as Record<string, unknown>)[key] = ''; };
  if (!p.earnestMoneyInCents) clear('alternativeEarnestMoney');
  if (p.financingType !== 'new_loan') clear('newLoanTerms', 'newLoanAvailability');
  if (!['new_loan', 'assumption'].includes(p.financingType)) clear('newLoanApplication');
  if (p.financingType !== 'assumption') clear('existingLoan', 'existingLoanTermination', 'loanTransferApproval');
  if (!t.conditions.inspection) clear('inspectionTermination', 'inspectionObjection', 'inspectionResolution');
  if (!t.conditions.appraisal || federal) clear('appraisal', 'appraisalObjection', 'appraisalResolution');
  if (t.conditions.newSurvey === 'none') clear('survey', 'surveyObjection', 'surveyResolution');
  if (!t.conditions.saleOfBuyerProperty) clear('conditionalSale');
  if (!e.insuranceReview) clear('insuranceTermination');
  if (!e.dueDiligenceReview) clear('dueDiligenceDelivery', 'dueDiligenceObjection', 'dueDiligenceResolution');
  if (!e.waterRightsExamination) clear('waterRightsExamination');
  if (!e.mineralRightsExamination) clear('mineralRightsExamination');
  if (t.disclosures.sellerReportsHoa !== true) clear('associationDocuments', 'associationTermination');
  if (t.disclosures.leadPaintStatus !== 'received' || t.disclosures.leadInspectionChoice === 'waived') clear('leadTermination');
  return {
    ...t, propertyFacts: { ...COLORADO_FACT_DEFAULTS, ...t.propertyFacts }, elections: e,
    purchase: { ...p, assumption: p.financingType === 'assumption' ? p.assumption : { maxTransferFeeInCents: 0, maxCashIncreaseInCents: 0, maxRatePercent: 0, maxPaymentInCents: 0, maxPaymentPeriod: 'month', sellerReleaseRequired: null, releaseEvidenceTiming: 'unselected', releaseCostPayer: 'unselected', maxReleaseCostInCents: 0 }, newLoanType: p.financingType === 'new_loan' ? p.newLoanType : 'unselected', newLoanAmountInCents: p.financingType === 'new_loan' ? p.newLoanAmountInCents : 0, cashAtClosingInCents: p.purchasePriceInCents - p.earnestMoneyInCents - loan },
    conditions: {
      ...t.conditions, appraisal: federal ? true : t.conditions.appraisal,
      surveyPayer: t.conditions.newSurvey === 'none' ? 'unselected' : t.conditions.surveyPayer
    },
    deadlines: d,
    disclosures: {
      ...t.disclosures, associationStatus: t.disclosures.sellerReportsHoa === false ? 'not_applicable' : t.disclosures.sellerReportsHoa === true && t.disclosures.associationStatus === 'not_applicable' ? 'unselected' : t.disclosures.associationStatus, leadInspectionChoice: t.disclosures.leadPaintStatus === 'received' ?
        (t.disclosures.leadInspectionChoice === 'waived' ? 'waived' : t.disclosures.leadInspectionChoice === 'unselected' ? 'unselected' : 'deadline') : 'unselected',
      leadInspectionDays: 0
    },
  };
}

export function coloradoTermIssues(t: ColoradoOfferTermsDocument): ColoradoIssue[] {
  const issues: ColoradoIssue[] = [];
  const fail = (fieldPath: string, message: string) => issues.push({ fieldPath, message });
  const p = t.purchase, c = t.conditions, d = t.deadlines, s = t.disclosures;
  const e = { ...COLORADO_ELECTION_DEFAULTS, ...t.elections };
  const facts = { ...COLORADO_FACT_DEFAULTS, ...t.propertyFacts };
  const text = (path: string, value: string, message: string) => { if (!value?.trim()) fail(path, message); };
  const flag = (path: string, value: boolean | null) => { if (typeof value !== 'boolean') fail(path, 'Choose YES or NO.'); };
  const select = (path: string, value: string, values: string[]) => { if (!values.includes(value)) fail(path, 'Select an option.'); };
  const amount = (path: string, value: number, positive = false) => { if (!money(value, positive)) fail(path, positive ? 'Enter an amount above $0.' : 'Enter a valid amount, or $0.'); };
  text('legalDescription', t.legalDescription, 'The seller must provide the legal description.');
  select('elections.vesting', e.vesting, ['joint_tenants', 'tenants_in_common', 'other']);
  if (e.vesting === 'other') text('elections.vestingOther', e.vestingOther, 'Describe the proposed title ownership.');
  for (const [fact, key] of [['leasedItems', 'assumeLeasedItems'], ['encumberedItems', 'assumeEncumberedItems'], ['solarPowerPlan', 'assumeSolarPlan']] as const)
    if (facts[fact].trim()) flag(`elections.${key}`, e[key]);
  flag('elections.separatePersonalPropertyAgreement', e.separatePersonalPropertyAgreement);
  if (e.separatePersonalPropertyAgreement) text('elections.personalPropertyAgreementDocument', e.personalPropertyAgreementDocument, 'Identify the separate personal-property agreement.');
  flag('elections.waterRightsExamination', e.waterRightsExamination);
  flag('elections.mineralRightsExamination', e.mineralRightsExamination);
  amount('purchase.purchasePriceInCents', p.purchasePriceInCents, true);
  amount('purchase.earnestMoneyInCents', p.earnestMoneyInCents);
  amount('purchase.sellerConcessionsInCents', p.sellerConcessionsInCents);
  if (p.earnestMoneyInCents) { text('purchase.earnestMoneyHolder', p.earnestMoneyHolder, 'Name the deposit holder.'); text('purchase.earnestMoneyForm', p.earnestMoneyForm, 'Specify the deposit payment method.'); }
  select('purchase.financingType', p.financingType, ['cash', 'new_loan', 'assumption']);
  if (p.financingType === 'new_loan') {
    select('purchase.newLoanType', p.newLoanType, ['conventional', 'fha', 'va', 'other']);
    amount('purchase.newLoanAmountInCents', p.newLoanAmountInCents, true);
    if (p.newLoanType === 'other') text('elections.otherLoanDescription', e.otherLoanDescription, 'Describe the institutional loan program. Seller/private financing is not supported.');
  }
  if (coloradoFederalLoan(t)) amount('elections.prohibitedFeeCapInCents', e.prohibitedFeeCapInCents);
  if (p.financingType === 'assumption') {
    const loan = t.sellerLoan, a = p.assumption;
    if (!loan?.available || !money(loan.estimatedBalanceInCents, true) || !money(loan.principalInterestPaymentInCents, true) || !(loan.ratePercent > 0) || !loan.paymentPeriod?.trim() || !date(loan.balanceAsOf))
      fail('purchase.financingType', 'The seller must complete existing-loan facts in the listing before an assumption offer.');
    amount('purchase.assumption.maxTransferFeeInCents', a.maxTransferFeeInCents);
    amount('purchase.assumption.maxCashIncreaseInCents', a.maxCashIncreaseInCents);
    amount('purchase.assumption.maxPaymentInCents', a.maxPaymentInCents, true);
    if (!Number.isFinite(a.maxRatePercent) || a.maxRatePercent <= 0 || a.maxRatePercent > 30) fail('purchase.assumption.maxRatePercent', 'Enter a maximum annual rate above 0% and no more than 30%.');
    text('purchase.assumption.maxPaymentPeriod', a.maxPaymentPeriod, 'Enter the payment period.');
    flag('purchase.assumption.sellerReleaseRequired', a.sellerReleaseRequired);
    if (a.sellerReleaseRequired) {
      select('purchase.assumption.releaseEvidenceTiming', a.releaseEvidenceTiming, ['approval_deadline', 'closing']);
      select('purchase.assumption.releaseCostPayer', a.releaseCostPayer, ['buyer', 'seller']);
      amount('purchase.assumption.maxReleaseCostInCents', a.maxReleaseCostInCents);
    }
  }
  const expectedCash = normalizeColoradoTerms(t).purchase.cashAtClosingInCents;
  if (!money(expectedCash) || p.cashAtClosingInCents !== expectedCash) fail('purchase.cashAtClosingInCents', 'The deposit and loan cannot exceed the price. Remaining purchase-price cash is calculated automatically.');
  flag('purchase.availableCashConfirmed', p.availableCashConfirmed);
  flag('elections.principalResidence', e.principalResidence);
  flag('conditions.saleOfBuyerProperty', c.saleOfBuyerProperty);
  if (c.saleOfBuyerProperty) text('conditions.saleOfBuyerPropertyAddress', c.saleOfBuyerPropertyAddress, 'Enter the property that must sell and close.');
  flag('conditions.inspection', c.inspection);
  if (!coloradoFederalLoan(t)) flag('conditions.appraisal', c.appraisal);
  if (c.appraisal || coloradoFederalLoan(t)) select('elections.appraisalPayer', e.appraisalPayer, ['buyer', 'seller']);
  flag('elections.insuranceReview', e.insuranceReview);
  flag('elections.dueDiligenceReview', e.dueDiligenceReview);
  select('conditions.ownerTitlePolicyPayer', c.ownerTitlePolicyPayer, ['buyer', 'seller']);
  select('elections.titleEvidence', e.titleEvidence, ['commitment', 'abstract']);
  flag('elections.extendedCoverage', e.extendedCoverage);
  if (e.extendedCoverage) {
    select('elections.extendedCoveragePayer', e.extendedCoveragePayer, ['buyer', 'seller', 'split', 'other']);
    if (e.extendedCoveragePayer === 'other') text('elections.extendedCoverageOther', e.extendedCoverageOther, 'Specify the additional premium allocation.');
  }
  select('elections.taxCertificatePayer', e.taxCertificatePayer, ['buyer', 'seller']);
  select('conditions.newSurvey', c.newSurvey, ['none', 'ilc', 'survey']);
  if (c.newSurvey !== 'none' && c.newSurvey !== 'unselected') {
    select('conditions.surveyPayer', c.surveyPayer, ['buyer', 'seller']);
    select('elections.surveyOrderer', e.surveyOrderer, ['buyer', 'seller']);
    if (c.newSurvey === 'survey') text('elections.surveyDescription', e.surveyDescription, 'Describe the type and requirements of the new survey.');
  }
  select('conditions.deedType', c.deedType, ['special_warranty', 'general_warranty', 'bargain_sale', 'quitclaim']);
  select('conditions.closingFeePayer', c.closingFeePayer, ['buyer', 'seller', 'split']);
  select('conditions.specialAssessmentPayer', c.specialAssessmentPayer, ['buyer', 'seller']);
  amount('conditions.possessionDelayChargeInCents', c.possessionDelayChargeInCents);
  flag('elections.closingInstructions', e.closingInstructions);
  if (e.closingInstructions) text('elections.closingInstructionsDocument', e.closingInstructionsDocument, 'Identify the signed closing instructions.');
  select('elections.taxProration', e.taxProration, ['previous_year', 'latest_assessment', 'other']);
  if (e.taxProration === 'other') text('elections.taxProrationOther', e.taxProrationOther, 'Describe the tax-proration method.');
  for (const key of ['transferTaxPayer', 'salesUseTaxPayer', 'privateTransferFeePayer', 'waterTransferFeePayer', 'utilityTransferFeePayer'] as const) select(`elections.${key}`, e[key], ['buyer', 'seller', 'split']);
  if (s.sellerReportsHoa === true) for (const key of ['associationRecordFeePayer', 'associationReservePayer', 'associationOtherFeePayer'] as const) select(`elections.${key}`, e[key], ['buyer', 'seller', 'split']);
  if (facts.leases.trim()) select('elections.rentProration', e.rentProration, ['received', 'accrued']);
  if (d.possession > d.closing) text('elections.postClosingOccupancyDocument', e.postClosingOccupancyDocument, 'Identify the post-closing occupancy agreement incorporated into this offer.');
  select('elections.buyerDefaultRemedy', e.buyerDefaultRemedy, ['liquidated_damages', 'specific_performance']);
  if (s.sellerPropertyStatus !== 'received') fail('disclosures.sellerPropertyStatus', 'Review the uploaded seller property disclosure before submitting.');
  for (const key of ['waterSourceAcknowledged', 'radonBrochureAcknowledged', 'radonInformationAcknowledged'] as const) if (s[key] !== true) fail(`disclosures.${key}`, 'Review this seller-provided information before confirming receipt.');
  if (typeof s.sellerReportsHoa !== 'boolean') fail('disclosures.associationStatus', 'The seller must identify association applicability in the listing.');
  else if (s.sellerReportsHoa ? !['received', 'pending'].includes(s.associationStatus) : s.associationStatus !== 'not_applicable') fail('disclosures.associationStatus', 'Select receipt status consistent with the seller association statement.');
  if (s.leadPaintStatus === 'not_applicable' && !(t.property.yearBuilt != null && t.property.yearBuilt >= 1978)) fail('disclosures.leadPaintStatus', 'Only a listing identified as built in 1978 or later can use this selection. Ask the seller to verify unknown construction dates.');
  else if (!['received', 'not_applicable'].includes(s.leadPaintStatus)) fail('disclosures.leadPaintStatus', 'Review the applicable seller lead disclosure, records and EPA pamphlet.');
  if (s.leadPaintStatus === 'received' && !['deadline', 'waived'].includes(s.leadInspectionChoice)) fail('disclosures.leadInspectionChoice', 'Choose an inspection termination date or waive only the lead inspection opportunity.');
  if (!['covered', 'not_applicable'].includes(facts.metroDistrict)) {
    fail(
      'propertyFacts.metroDistrict',
      'The seller must confirm metropolitan-district applicability in the listing.',
    );
  }
  if (facts.metroDistrict === 'covered' && (!/^https:\/\//.test(facts.metroDistrictWebsite) || !facts.metroDistrictDisclosure.trim())) fail('propertyFacts.metroDistrictDisclosure', 'Seller must provide the covered district disclosure and official website in the listing.');
  const required = new Set<string>(['closing', 'possession', 'recordTitle', 'recordTitleObjection', 'offRecordTitle', 'offRecordTitleObjection', 'titleResolution']);
  const need = (...keys: string[]) => keys.forEach(key => required.add(key));
  if (p.earnestMoneyInCents) need('alternativeEarnestMoney');
  if (p.financingType === 'new_loan') need('newLoanApplication', 'newLoanTerms', 'newLoanAvailability');
  if (p.financingType === 'assumption') need('existingLoan', 'existingLoanTermination', 'loanTransferApproval', 'newLoanApplication');
  if (c.inspection) need('inspectionTermination', 'inspectionObjection', 'inspectionResolution');
  if (c.appraisal && !coloradoFederalLoan(t)) need('appraisal', 'appraisalObjection', 'appraisalResolution');
  if (c.newSurvey === 'ilc' || c.newSurvey === 'survey') need('survey', 'surveyObjection', 'surveyResolution');
  if (c.saleOfBuyerProperty) need('conditionalSale');
  if (e.insuranceReview) need('insuranceTermination');
  if (e.dueDiligenceReview) need('dueDiligenceDelivery', 'dueDiligenceObjection', 'dueDiligenceResolution');
  if (e.waterRightsExamination) need('waterRightsExamination');
  if (e.mineralRightsExamination) need('mineralRightsExamination');
  if (facts.thirdPartyRights.trim()) need('thirdPartyApproval');
  if (s.sellerReportsHoa) need('associationDocuments', 'associationTermination');
  if (s.leadPaintStatus === 'received' && s.leadInspectionChoice !== 'waived') need('leadTermination');
  for (const [key, value] of Object.entries(d)) {
    if (['timeOfDay', 'extendHoliday', 'possessionTime'].includes(key)) continue;
    if (required.has(key) && !value) fail(`deadlines.${key}`, 'Choose the date for this selected contract protection.');
    else if (value && !date(String(value))) fail(`deadlines.${key}`, 'Enter a real calendar date.');
    if (value && date(String(value)) && date(d.closing) && key !== 'possession' && String(value) > d.closing) fail(`deadlines.${key}`, 'This deadline cannot be after closing.');
  }
  for (const [before, after] of [['recordTitle', 'recordTitleObjection'], ['offRecordTitle', 'offRecordTitleObjection'], ['recordTitleObjection', 'titleResolution'], ['offRecordTitleObjection', 'titleResolution'], ['existingLoan', 'existingLoanTermination'], ['existingLoanTermination', 'loanTransferApproval'], ['inspectionObjection', 'inspectionResolution'], ['appraisal', 'appraisalObjection'], ['appraisalObjection', 'appraisalResolution'], ['survey', 'surveyObjection'], ['surveyObjection', 'surveyResolution'], ['dueDiligenceDelivery', 'dueDiligenceObjection'], ['dueDiligenceObjection', 'dueDiligenceResolution'], ['associationDocuments', 'associationTermination']] as const)
    if (d[before] && d[after] && d[before] > d[after]) fail(`deadlines.${after}`, 'This date cannot precede the related delivery or objection date.');
  if (d.possession && d.closing && d.possession < d.closing) fail('deadlines.possession', 'Possession cannot precede closing.');
  for (const key of ['timeOfDay', 'possessionTime'] as const) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d[key])) fail(`deadlines.${key}`, 'Enter HH:mm in Mountain Time.');
  if (s.leadPaintStatus === 'received' && s.leadInspectionChoice === 'deadline' && date(d.leadTermination) && Number.isFinite(Date.parse(t.delivery.expiresAt))) {
    const expiryDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(t.delivery.expiresAt));
    if (d.leadTermination < expiryDate) fail('deadlines.leadTermination', 'Choose a lead inspection deadline on or after the offer expiration date so it remains available on acceptance.');
  }
  flag('deadlines.extendHoliday', d.extendHoliday);
  if (t.delivery.electronicDeliveryAuthorized !== true) fail('delivery.electronicDeliveryAuthorized', 'Authorize electronic delivery and signatures.');
  return issues;
}