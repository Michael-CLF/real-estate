import { updatePath } from '../../../engine/offer-term-path';
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

