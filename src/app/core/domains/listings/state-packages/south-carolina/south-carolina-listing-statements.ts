import { restoreSouthCarolinaListingAnswers } from './south-carolina-listing-form';
import type { ListingSellerStatements } from '../../models/listing.model';
import type { ListingStatementMappingAnswers } from '../listing-statement-mapping';

/** Preserve this state's existing saved seller-statement fields. */
export function mapSouthCarolinaListingStatements(
  statements: ListingStatementMappingAnswers,
): Partial<ListingSellerStatements> {
  return {
    southCarolina: {
      beachfrontApplies: statements.southCarolina!.beachfrontApplies!,
      futureVacationBookingsExist: statements.southCarolina!.futureVacationBookingsExist!,
    },
  };
}

export function restoreSouthCarolinaDraftSellerStatements(
  saved: ListingSellerStatements | null | undefined,
) {
  return { southCarolina: restoreSouthCarolinaListingAnswers(saved?.southCarolina) };
}
