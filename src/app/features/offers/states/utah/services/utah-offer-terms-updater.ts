import { updatePath } from '../../../engine/offer-term-path';
import type { UtahOfferTerms } from '../../../../../core/domains/offers/state-contracts/utah/models/utah-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
const ALLOWED_ROOTS = new Set(['purchase', 'deadlines', 'conditions', 'propertyItems', 'settlement', 'disclosures', 'additionalTerms', 'delivery']);

export function updateUtahOfferTerms(terms: UtahOfferTerms, fieldPath: string, value: unknown): UtahOfferTerms {
  const segments = fieldPath.split('.');
  if (!segments.length || !ALLOWED_ROOTS.has(segments[0]) || segments.some(segment => !segment || FORBIDDEN.has(segment))) {
    throw new Error('Invalid Utah offer field.');
  }
  // The renderer's choice controls emit strings. Utah yes/no choices are persisted as booleans.
  const selected = value === 'true' ? true : value === 'false' ? false : value;
  return updatePath(terms, segments, selected) as unknown as UtahOfferTerms;
}

