import type { MarketplaceListing } from '../../../core/domains/marketplace/models/marketplace-listing.model';
import type { OfferPropertySnapshot } from '../../../core/domains/offers/models/offer-terms.model';

/** Shared property snapshot; state packages continue to supply their own contract terms. */
export function createOfferPropertySnapshot(
  listing: MarketplaceListing,
  stateCode: string,
): OfferPropertySnapshot {
  return {
    listingUid:
      listing.uid,

    addressLine1:
      listing.address.addressLine1,

    ...(
      listing.address.addressLine2
        ? {
          addressLine2:
            listing.address.addressLine2,
        }
        : {}
    ),

    city:
      listing.address.city,

    state: stateCode,

    zipCode:
      listing.address.postalCode,

    county:
      listing.address.county ?? '',

    propertyType:
      String(listing.propertyType),

    ...(
      typeof listing.yearBuilt === 'number'
        ? {
          yearBuilt:
            listing.yearBuilt,
        }
        : {}
    ),

    listPriceInCents:
      Math.round(
        listing.price * 100
      ),
  };
}
