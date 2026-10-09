import { record, text as draftText, money, integer, finiteNumber as percent, bool, choice } from '../draft-term-values';
import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';

const text = (v: unknown, max = 4000) => draftText(v, max);

export function sanitizeLouisianaDraftTerms(input: SanitizeDraftTermsInput<LouisianaOfferTermsDocument>): LouisianaOfferTermsDocument {
  const r = record(input.requestedTerms);
  const p = record(r['purchase']); const c = record(r['conditions']);
  const i = record(r['propertyItems']); const d = record(r['deadlines']);
  const disclosures = record(r['disclosures']); const delivery = record(r['delivery']);
  const hasDeposit = bool(p['hasEarnestMoney']);
  const financingType = choice(p['financingType'], ['unselected', 'cash', 'financed'] as const, 'unselected');
  const mineralRightsReserved = bool(i['mineralRightsReserved']);
  const warranty = choice(c['warranty'], ['unselected', 'with_warranties', 'as_is', 'new_home_warranty'] as const, 'unselected');
  const homeServiceWarranty = choice(c['homeServiceWarranty'], ['unselected', 'will', 'will_not'] as const, 'unselected');
  const sanitized: LouisianaOfferTermsDocument = {
    ...input.currentTerms,
    stateCode: 'LA', contractType: input.currentTerms.contractType,
    property: input.currentTerms.property,
    legalDescription: input.currentTerms.legalDescription,
    propertyItems: {
      groundsDescription: input.currentTerms.propertyItems.groundsDescription,
      included: text(i['included'], 2000),
      excluded: text(i['excluded'], 2000),
      mineralRightsReserved,
      mineralRightsPercent: mineralRightsReserved
        ? percent(i['mineralRightsPercent'])
        : 0,
    },
    purchase: {
      purchasePriceInCents: money(p['purchasePriceInCents']),
      hasEarnestMoney: hasDeposit,
      earnestMoneyInCents: hasDeposit ? money(p['earnestMoneyInCents']) : 0,
      depositMethod: hasDeposit ? choice(p['depositMethod'], ['unselected', 'check', 'certified_funds', 'electronic_transfer'] as const, 'unselected') : 'none',
      earnestMoneyHolder: hasDeposit ? text(p['earnestMoneyHolder'], 250) : '',
      financingType,
      cashProofDays: integer(p['cashProofDays']),
      loanAmountInCents: financingType === 'financed' ? money(p['loanAmountInCents']) : 0,
      maxInterestRatePercent: financingType === 'financed' ? percent(p['maxInterestRatePercent']) : 0,
      loanTermYears: integer(p['loanTermYears']),
      financingSource: financingType === 'financed'
        ? choice(p['financingSource'], ['unselected', 'conventional', 'fha', 'va', 'rural_development', 'owner', 'bond', 'other'] as const, 'unselected')
        : 'unselected',
      otherFinancingConditions: text(p['otherFinancingConditions'], 700),
      loanApplicationDays: integer(p['loanApplicationDays']),
      sellerConcessionsInCents: money(p['sellerConcessionsInCents']),
      buyerBrokerCompensationInCents: money(p['buyerBrokerCompensationInCents']),
    },
    conditions: {
      saleOfBuyersProperty: bool(c['saleOfBuyersProperty']),
      saleOfBuyersPropertyTerms: text(c['saleOfBuyersPropertyTerms'], 2500),
      appraisal: bool(c['appraisal']),
      privateWaterSystems: integer(c['privateWaterSystems']),
      privateSepticSystems: integer(c['privateSepticSystems']),
      warranty,
      homeServiceWarranty,
      homeServiceWarrantyCostInCents: homeServiceWarranty === 'will' ? money(c['homeServiceWarrantyCostInCents']) : 0,
      homeServiceWarrantyPayer: homeServiceWarranty === 'will'
        ? choice(c['homeServiceWarrantyPayer'], ['unselected', 'buyer', 'seller'] as const, 'unselected') : 'unselected',
      homeServiceWarrantyOrderedBy: homeServiceWarranty === 'will' ? text(c['homeServiceWarrantyOrderedBy'], 200) : '',
    },
    deadlines: {
      settlementDate: text(d['settlementDate'], 10), inspectionPeriodDays: integer(d['inspectionPeriodDays']),
      appraisalCopyDays: integer(d['appraisalCopyDays']), appraisalResponseDays: integer(d['appraisalResponseDays']),
      titleCureDays: integer(d['titleCureDays']),
    },
    disclosures: {
      propertyDisclosureStatus: choice(disclosures['propertyDisclosureStatus'], ['unselected', 'received', 'pending'] as const, 'unselected'),
      leadPaintStatus: choice(disclosures['leadPaintStatus'], ['unselected', 'received', 'pending', 'built_1978_or_later', 'exempt'] as const, 'unselected'),
      leadInspectionSelection: choice(disclosures['leadInspectionSelection'], ['unselected', 'ten_days', 'waived', 'other_period'] as const, 'unselected'),
      leadInspectionDays: integer(disclosures['leadInspectionDays']),
    },
    additionalTerms: text(r['additionalTerms'], 5000),
    delivery: { expiresAt: text(delivery['expiresAt'], 40), timeZone: 'America/Chicago', electronicDeliveryAuthorized: bool(delivery['electronicDeliveryAuthorized']) },
  };
  if (input.initiatedBy === 'seller') {
    return {
      ...input.currentTerms,
      purchase: {
        ...input.currentTerms.purchase,
        purchasePriceInCents: sanitized.purchase.purchasePriceInCents,
        sellerConcessionsInCents: sanitized.purchase.sellerConcessionsInCents,
        buyerBrokerCompensationInCents: sanitized.purchase.buyerBrokerCompensationInCents,
      },
      delivery: { ...input.currentTerms.delivery, expiresAt: sanitized.delivery.expiresAt },
    };
  }
  return sanitized;
}