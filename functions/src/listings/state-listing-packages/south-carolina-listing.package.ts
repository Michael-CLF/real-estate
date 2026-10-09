import type { StateListingPackage } from './state-listing-package';
export const southCarolinaListingPackage: StateListingPackage = {stateCode:'SC',validateAdditionalSellerStatements: (_listingUid, statements) => {
    const facts = statements['southCarolina'];
    if (!facts || typeof facts !== 'object' || Array.isArray(facts)) {
      throw new Error('Answer the South Carolina disclosure applicability questions.');
    }
    const answers = facts as Record<string, unknown>;
    if (typeof answers['beachfrontApplies'] !== 'boolean' ||
        typeof answers['futureVacationBookingsExist'] !== 'boolean') {
      throw new Error('Answer both South Carolina disclosure applicability questions.');
    }
  },requiredSellerStatementFields:['leadBasedPaintApplies','ownersAssociationApplies','generalLeasesExist']};
