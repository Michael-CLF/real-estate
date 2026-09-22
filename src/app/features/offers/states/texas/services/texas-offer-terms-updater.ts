import type {
  TexasOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/texas/models/texas-offer-terms.model';


const FORBIDDEN_PATH_SEGMENTS =
  new Set([
    '__proto__',
    'constructor',
    'prototype',
  ]);


/*
 * Applies one wizard field change without mutating the existing
 * offer terms. The field paths come from NavStreet's own question
 * definitions and never from user-supplied property names.
 */
export function updateTexasOfferTerms(
  terms: TexasOfferTerms,
  fieldPath: string,
  value: unknown
): TexasOfferTerms {
  const segments = fieldPath
    .split('.')
    .map(segment => segment.trim())
    .filter(Boolean);

  if (
    segments.length === 0 ||
    segments.some(
      segment =>
        FORBIDDEN_PATH_SEGMENTS.has(segment)
    )
  ) {
    throw new Error(
      'The offer field path is invalid.'
    );
  }

  return updateRecordPath(
    terms,
    segments,
    value
  ) as unknown as TexasOfferTerms;
}


function updateRecordPath(
  source: unknown,
  segments: readonly string[],
  value: unknown
): Record<string, unknown> {
  const [currentSegment, ...remaining] =
    segments;

  if (!currentSegment) {
    return asRecord(source);
  }

  const sourceRecord = asRecord(source);

  if (remaining.length === 0) {
    return {
      ...sourceRecord,
      [currentSegment]: value,
    };
  }

  return {
    ...sourceRecord,
    [currentSegment]: updateRecordPath(
      sourceRecord[currentSegment],
      remaining,
      value
    ),
  };
}


function asRecord(
  value: unknown
): Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value as Record<string, unknown>
    : {};
}
