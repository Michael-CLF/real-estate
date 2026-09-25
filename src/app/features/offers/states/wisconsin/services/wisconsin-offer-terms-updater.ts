import type { WisconsinOfferTerms } from '../../../../../core/domains/offers/state-contracts/wisconsin/models/wisconsin-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['legalDescription', 'purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateWisconsinOfferTerms(terms: WisconsinOfferTerms, fieldPath: string, value: unknown): WisconsinOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Wisconsin offer field.');
  }
  // The renderer's choice controls emit strings. Wisconsin yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  return updatePath(terms, segments, selected) as unknown as WisconsinOfferTerms;
}

function updatePath(source: unknown, [head, ...tail]: readonly string[], value: unknown): Record<string, unknown> {
  const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : {};
  if (!head) return record;
  return { ...record, [head]: tail.length ? updatePath(record[head], tail, value) : value };
}
