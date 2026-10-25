import { updatePath } from '../../../engine/offer-term-path';

import type { AlaskaOfferTerms } from '../../../../../core/domains/offers/state-contracts/alaska/models/alaska-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateAlaskaOfferTerms(terms: AlaskaOfferTerms, fieldPath: string, value: unknown): AlaskaOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Alaska offer field.');
  }
  // The renderer's choice controls emit strings. Alaska yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  const updated = updatePath(terms, segments, selected) as unknown as AlaskaOfferTerms;
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
