export function getListingOfferAvailabilityMessage(
  listingData: Record<string, unknown>
): string {
  const status =
    typeof listingData['status'] === 'string'
      ? listingData['status'].trim().toLowerCase()
      : '';

  switch (status) {
    case 'under_contract':
      return 'This property is under contract and is not currently accepting offers.';

    case 'sold':
      return 'This property has been sold and is no longer accepting offers.';

    case 'coming_soon':
      return 'This property is coming soon and is not yet accepting offers.';

    case 'paused':
      return 'The seller has temporarily paused offers on this property.';

    case 'pending':
      return 'This property is pending and is not currently accepting offers.';

    case 'expired':
      return 'This listing has expired and is no longer accepting offers.';

    case 'withdrawn':
      return 'This property has been withdrawn and is no longer accepting offers.';

    case 'active':
      return listingData['acceptingOffers'] === false
        ? 'The seller has temporarily paused offers on this property.'
        : 'This property is currently accepting offers.';

    default:
      return 'This property is not currently accepting offers.';
  }
}
