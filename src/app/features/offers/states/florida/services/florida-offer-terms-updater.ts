
import type { FloridaOfferTerms } from '../../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateFloridaOfferTerms(terms: FloridaOfferTerms, fieldPath: string, value: unknown): FloridaOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Florida offer field.');
  }
  // The renderer's choice controls emit strings. Florida yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  const updated = updatePath(terms, segments, selected) as unknown as FloridaOfferTerms;
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

function updatePath(source: unknown, [head, ...tail]: readonly string[], value: unknown): Record<string, unknown> {
  const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : {};
  if (!head) return record;
  return { ...record, [head]: tail.length ? updatePath(record[head], tail, value) : value };
}
