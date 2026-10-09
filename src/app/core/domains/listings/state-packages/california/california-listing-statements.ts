import { CALIFORNIA_LISTING_FACT_DEFAULTS } from './california-listing-facts.model';
import type { ListingSellerStatements } from '../../models/listing.model';
import type { ListingStatementMappingAnswers } from '../listing-statement-mapping';

/** Preserve this state's existing saved seller-statement fields. */
export function mapCaliforniaListingStatements(
  statements: ListingStatementMappingAnswers,
): Partial<ListingSellerStatements> {
  return { california: statements.california };
}

/** The outer wizard retains partial saved facts; the details form fills defaults later. */
export function restoreCaliforniaDraftSellerStatements(
  saved: ListingSellerStatements | null | undefined,
) {
  return { california: saved?.california ?? { ...CALIFORNIA_LISTING_FACT_DEFAULTS } };
}
