import type { OklahomaOfferTerms } from '../../../../../core/domains/offers/state-contracts/oklahoma/models/oklahoma-offer-terms.model';

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

export function updateOklahomaOfferTerms(
  terms: OklahomaOfferTerms,
  fieldPath: string,
  value: unknown
): OklahomaOfferTerms {
  const segments = fieldPath.split('.').map(value => value.trim()).filter(Boolean);
  if (!segments.length || segments.some(segment => FORBIDDEN.has(segment))) {
    throw new Error('The offer field path is invalid.');
  }
  return updatePath(terms, segments, value) as unknown as OklahomaOfferTerms;
}

function updatePath(source: unknown, segments: readonly string[], value: unknown): Record<string, unknown> {
  const [segment, ...remaining] = segments;
  const record = isRecord(source) ? source : {};
  if (!segment) return record;
  return {
    ...record,
    [segment]: remaining.length ? updatePath(record[segment], remaining, value) : value,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
