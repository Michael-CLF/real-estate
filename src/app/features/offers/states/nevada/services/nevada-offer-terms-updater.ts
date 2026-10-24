import { updatePath } from '../../../engine/offer-term-path';

import type { NevadaOfferTerms } from '../../../../../core/domains/offers/state-contracts/nevada/models/nevada-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateNevadaOfferTerms(terms: NevadaOfferTerms, fieldPath: string, value: unknown): NevadaOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Nevada offer field.');
  }
  // The renderer's choice controls emit strings. Nevada yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  const updated = updatePath(terms, segments, selected) as unknown as NevadaOfferTerms;
  if (fieldPath === 'purchase.hasEarnestMoney' && selected === false) {
    return {
      ...updated,
      purchase: { ...updated.purchase, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, earnestMoneyHolder: '' },
      conditions: { ...updated.conditions, additionalEarnestMoney: false },
    };
  }
  if (fieldPath === 'purchase.financingType' && selected === 'cash') {
    return { ...updated, purchase: { ...updated.purchase, loanAmountInCents: 0 }, conditions: { ...updated.conditions, financing: false, appraisal: false } };
  }
  return updated;
}
