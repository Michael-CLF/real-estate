import type { LouisianaOfferTerms } from '../../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ROOTS = new Set(['purchase', 'deadlines', 'conditions', 'propertyItems', 'disclosures', 'additionalTerms', 'delivery']);

export function updateLouisianaOfferTerms(terms: LouisianaOfferTerms, fieldPath: string, value: unknown): LouisianaOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Louisiana offer field.');
  }
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  const updated = updatePath(terms, segments, selected) as unknown as LouisianaOfferTerms;
  if (fieldPath === 'purchase.hasEarnestMoney' && selected === false) {
    return { ...updated, purchase: { ...updated.purchase, earnestMoneyInCents: 0, depositMethod: 'none', earnestMoneyHolder: '' } };
  }
  if (fieldPath === 'purchase.financingType' && selected === 'cash') {
    return { ...updated, purchase: { ...updated.purchase, loanAmountInCents: 0, financingSource: 'unselected', maxInterestRatePercent: 0 } };
  }
  if (fieldPath === 'propertyItems.mineralRightsReserved' && selected === false) {
    return { ...updated, propertyItems: { ...updated.propertyItems, mineralRightsPercent: 0 } };
  }
  return updated;
}

function updatePath(source: unknown, [head, ...tail]: readonly string[], value: unknown): Record<string, unknown> {
  const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : {};
  if (!head) return record;
  return { ...record, [head]: tail.length ? updatePath(record[head], tail, value) : value };
}