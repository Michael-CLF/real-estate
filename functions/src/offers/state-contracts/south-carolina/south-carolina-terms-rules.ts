import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';
export interface SouthCarolinaIssue { fieldPath: string; message: string; severity: 'error' | 'warning'; }
const money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);
const days = (n: number, min: number, max: number) => Number.isSafeInteger(n) && n >= min && n <= max;
export function validSouthCarolinaDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const date = new Date(s + 'T12:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === s;
}
export function southCarolinaTermsIssues(t: SouthCarolinaOfferTermsDocument, now: Date, submitting: boolean): SouthCarolinaIssue[] {
  const issues: SouthCarolinaIssue[] = [];
  const error = (fieldPath: string, message: string) => issues.push({fieldPath,message,severity:'error'});
  const p=t.purchase, d=t.deadlines, a=t.disclosures;
  if (t.stateCode !== 'SC' || t.property.state !== 'SC' || t.contractType !== 'navstreet_south_carolina_residential_sale_2026') error('form','Select the South Carolina residential resale agreement.');
  if (!['single_family','townhome','pud','condo'].includes(t.property.propertyType)) error('property.propertyType','This agreement supports houses, townhomes, PUDs and condos.');
  if (!money(p.purchasePriceInCents,true)) error('purchase.purchasePriceInCents','Enter a purchase price above $0.');
  if (typeof p.hasEarnestMoney !== 'boolean') error('purchase.hasEarnestMoney','Choose whether to offer an escrow deposit.');
  if (p.hasEarnestMoney) {
    if (!money(p.earnestMoneyInCents,true)) error('purchase.earnestMoneyInCents','Enter a positive deposit.');
    if (!days(p.earnestMoneyDueDays,1,30)) error('purchase.earnestMoneyDueDays','Choose 1 to 30 calendar days.');
    if (typeof t.conditions.additionalEarnestMoney !== 'boolean') error('conditions.additionalEarnestMoney','Choose whether another deposit is due.');
    if (t.conditions.additionalEarnestMoney && (!money(p.additionalEarnestMoneyInCents,true) || !days(p.additionalEarnestMoneyDueDays,1,60))) error('purchase.additionalEarnestMoneyInCents','Enter a positive additional deposit and 1 to 60 days.');
    if (p.earnestMoneyInCents + p.additionalEarnestMoneyInCents > p.purchasePriceInCents) error('purchase.earnestMoneyInCents','Total deposits cannot exceed the purchase price.');
  } else if (p.hasEarnestMoney === false && (p.earnestMoneyInCents !== 0 || p.additionalEarnestMoneyInCents !== 0 || t.conditions.additionalEarnestMoney !== false)) error('purchase.hasEarnestMoney','No deposit is due when none is offered.');
  if (!['cash','conventional','fha','va','usda'].includes(p.financingType)) error('purchase.financingType','Choose cash or a loan type.');
  if (p.financingType === 'cash') {
    if (p.loanAmountInCents !== 0 || t.conditions.financing !== false) error('purchase.financingType','Cash has no loan or financing contingency.');
  } else if (p.financingType !== 'unselected') {
    if (!money(p.loanAmountInCents,true) || p.loanAmountInCents > p.purchasePriceInCents) error('purchase.loanAmountInCents','Enter a positive loan amount no greater than the price.');
    if (!days(p.loanTermYears,1,40)) error('purchase.loanTermYears','Enter a term of 1 to 40 years.');
    if (typeof t.conditions.financing !== 'boolean') error('conditions.financing','Choose the financing contingency.');
    if (t.conditions.financing && (!days(p.loanApplicationDays,1,30) || !days(p.loanApprovalDays,1,90))) error('purchase.loanApprovalDays','Complete the loan application and approval periods.');
  }
  if (typeof t.conditions.appraisal !== 'boolean') error('conditions.appraisal','Choose whether an appraisal contingency applies.');
  if (t.conditions.appraisal && !days(d.appraisalPeriodDays,1,90)) error('deadlines.appraisalPeriodDays','Choose 1 to 90 days for appraisal review.');
  if (!money(p.sellerConcessionsInCents) || p.sellerConcessionsInCents > p.purchasePriceInCents) error('purchase.sellerConcessionsInCents','Enter valid seller concessions.');
  if (t.conditions.dueDiligence !== true || !days(d.inspectionPeriodDays,1,60)) error('deadlines.inspectionPeriodDays','Choose an inspection contingency review period of 1 to 60 days.');
  if (t.propertyItems.fixturesIncluded !== true) error('propertyItems.fixturesIncluded','Installed fixtures are included except named exclusions.');
  if (typeof t.conditions.saleOfBuyersProperty !== 'boolean') error('conditions.saleOfBuyersProperty','Choose whether another property must sell.');
  if (t.conditions.saleOfBuyersProperty && !t.additionalTerms.trim()) error('additionalTerms','Describe the other property, deadline and cancellation terms.');
  if (!validSouthCarolinaDate(d.settlementDate)) error('deadlines.settlementDate','Enter a valid close-of-escrow date.');
  else if (submitting) {
    const today = new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    if (d.settlementDate < today) error('deadlines.settlementDate','Closing cannot be in the past.');
  }
  if (submitting && d.sellerDisclosureDate && d.sellerDisclosureDate < new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)) error('deadlines.sellerDisclosureDate','The agreed disclosure delivery date cannot be in the past.');
  if (d.sellerDisclosureDate && (!validSouthCarolinaDate(d.sellerDisclosureDate) || d.sellerDisclosureDate > d.settlementDate)) error('deadlines.sellerDisclosureDate','Choose a valid document deadline no later than closing.');
  if (t.settlement.possession !== 'at_recording') error('settlement.possession','This agreement requires vacant possession on recording; other occupancy needs a separate written agreement.');
  for (const key of ['specialAssessmentPayer','hoaTransferFeePayer'] as const) {
    if ((key !== 'hoaTransferFeePayer' || a.sellerReportsHoa) && !['buyer','seller','split'].includes(t.settlement[key])) error('settlement.'+key,'Choose the agreed allocation.');
  }
  if (!['buyer','seller'].includes(t.settlement.titlePolicyPayer)) error('settlement.titlePolicyPayer','Choose who pays the owner title policy.');
  if (!days(t.settlement.titleEvidenceDaysBeforeClosing,1,45)) error('settlement.titleEvidenceDaysBeforeClosing','Choose 1 to 45 days.');
  const status=(path:string,value:string,allowed:string[])=> {if(!allowed.includes(value)) error(path,'Select the actual document receipt or applicability status.');};
  status('disclosures.propertyConditionStatus', a.propertyConditionStatus, ['received','pending','exempt','waived']);
  status('disclosures.hoaDocumentsStatus', a.hoaDocumentsStatus, ['received','pending','not_applicable']);
  if (a.sellerReportsHoa === true && a.hoaDocumentsStatus === 'not_applicable') error('disclosures.hoaDocumentsStatus','Seller reports association membership; select received or pending.');
  if (a.propertyConditionStatus === 'exempt' && !a.propertyExemptionBasis.trim()) error('disclosures.propertyExemptionBasis','State the applicable exemption under S.C. Code 27-50-30 and supporting facts.');
  if (a.propertyConditionStatus === 'pending' && !validSouthCarolinaDate(d.sellerDisclosureDate)) error('deadlines.sellerDisclosureDate','Choose the agreed delivery date for the pending property condition statement.');
  if (typeof a.coastalApplies !== 'boolean') error('disclosures.coastalApplies','Confirm whether the seller reports property seaward of a beachfront setback or jurisdictional line.');
  if (a.coastalApplies) for (const key of ['coastalBaselineDescription','coastalSetbackDescription','coastalStructureCoordinates','coastalErosionRate'] as const) {
    if (!a[key].trim()) error('disclosures.'+key,'Include the seller-provided beachfront disclosure information required by S.C. Code 48-39-330.');
  }
  if (typeof a.vacationRentalsApply !== 'boolean') error('disclosures.vacationRentalsApply','Confirm whether existing vacation rental bookings apply.');
  if (a.vacationRentalsApply && !a.vacationRentalPeriods.trim()) error('disclosures.vacationRentalPeriods','Include all future vacation rental periods disclosed by seller before ratification.');
  status('disclosures.leadPaintStatus', a.leadPaintStatus, ['received','pending','exempt',
    ...(t.property.yearBuilt != null && t.property.yearBuilt >= 1978 ? ['built_1978_or_later'] : [])]);
  if (a.leadPaintStatus === 'exempt' && !a.leadExemptionBasis.trim()) error('disclosures.leadExemptionBasis','State the actual federal exemption and supporting facts.');
  if (submitting && a.leadPaintStatus === 'pending' && (t.property.yearBuilt == null || t.property.yearBuilt < 1978)) error('disclosures.leadPaintStatus','Your offer remains editable. Receive the applicable lead materials and update this status before preparing it for signature.');
  if (a.leadPaintStatus === 'received' && !['ten_days','waived','other_period'].includes(a.leadInspectionSelection)) error('disclosures.leadInspectionSelection','Choose the lead inspection opportunity.');
  if (a.leadPaintStatus === 'received' && a.leadInspectionSelection === 'other_period' && !days(a.leadInspectionDays,1,60)) error('disclosures.leadInspectionDays','Enter 1 to 60 agreed lead inspection days.');
  if (typeof a.sellerReportsExistingLeases !== 'boolean' || a.leaseStatementAcknowledged !== true) error('disclosures.leaseStatementAcknowledged','Review and acknowledge the seller lease statement.');
  if (a.southCarolinaNoticesAcknowledged !== true) error('disclosures.southCarolinaNoticesAcknowledged','Read the South Carolina disclosure and closing information.');
  if (t.delivery.timeZone !== 'America/New_York' || t.delivery.electronicDeliveryAuthorized !== true) error('delivery.electronicDeliveryAuthorized','Agree to electronic delivery and signatures in Eastern time.');
  if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(t.delivery.expiresAt) || !Number.isFinite(Date.parse(t.delivery.expiresAt)) || (submitting && Date.parse(t.delivery.expiresAt) <= now.getTime())) error('delivery.expiresAt','Choose a future expiration with a time-zone offset.');
  return issues;
}
