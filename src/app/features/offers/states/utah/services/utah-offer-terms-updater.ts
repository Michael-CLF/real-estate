import type { UtahOfferTerms } from '../../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['legalDescription', 'purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateUtahOfferTerms(terms: UtahOfferTerms, fieldPath: string, value: unknown): UtahOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Utah offer field.');
  }
  // The renderer's choice controls emit strings. Utah yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  return updatePath(terms, segments, selected) as unknown as UtahOfferTerms;
}

function updatePath(source: unknown, [head, ...tail]: readonly string[], value: unknown): Record<string, unknown> {
  const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : {};
  if (!head) return record;
  return { ...record, [head]: tail.length ? updatePath(record[head], tail, value) : value };
}
