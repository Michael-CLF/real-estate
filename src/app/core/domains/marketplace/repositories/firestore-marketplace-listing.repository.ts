import { Injectable } from '@angular/core';
import {
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import {
    defer,
    map,
    Observable
} from 'rxjs';

import { firestore } from '../../../infrastructure/firebase/firebase';
import {
    ListingSearchFilters,
    ListingSearchResult,
    MarketplaceListingSummary
} from '../models/listing-search-filters.model';
import {
    MarketplaceListing
} from '../models/marketplace-listing.model';
import {
    MarketplaceListingRepository
} from './marketplace-listing.repository';

@Injectable()
export class FirestoreMarketplaceListingRepository
    extends MarketplaceListingRepository {

    override searchListings(
        filters: ListingSearchFilters
    ): Observable<ListingSearchResult> {
        return this.loadActiveListings().pipe(
            map(listings =>
                this.createSearchResult(
                    listings,
                    filters
                )
            )
        );
    }

    override getListingById(
        listingUid: string
    ): Observable<MarketplaceListing | null> {
        return this.loadActiveListings().pipe(
            map(listings =>
                listings.find(
                    listing => listing.uid === listingUid
                ) ?? null
            )
        );
    }

    override getListingsBySellerId(
        sellerUid: string
    ): Observable<MarketplaceListing[]> {
        const listingsReference = collection(
            firestore,
            'listings'
        );

        const sellerListingsQuery = query(
            listingsReference,
            where('sellerUid', '==', sellerUid)
        );

        return defer(() =>
            getDocs(sellerListingsQuery)
        ).pipe(
            map(snapshot =>
                snapshot.docs
                    .map(document =>
                        this.mapFirestoreListing(
                            document.id,
                            document.data()
                        )
                    )
                    .filter(
                        (
                            listing
                        ): listing is MarketplaceListing =>
                            listing !== null
                    )
            )
        );
    }

    override getFeaturedListings(
        limit: number
    ): Observable<MarketplaceListing[]> {
        return this.loadActiveListings().pipe(
            map(listings =>
                listings
                    .filter(listing =>
                        this.isFeaturedListing(listing)
                    )
                    .sort(
                        (firstListing, secondListing) =>
                            (
                                secondListing.publishedAt?.getTime() ??
                                0
                            ) -
                            (
                                firstListing.publishedAt?.getTime() ??
                                0
                            )
                    )
                    .slice(0, Math.max(limit, 0))
            )
        );
    }

    private loadActiveListings():
        Observable<MarketplaceListing[]> {
        const listingsReference = collection(
            firestore,
            'listings'
        );

        const activeListingsQuery = query(
            listingsReference,
            where('status', '==', 'active')
        );

        return defer(() =>
            getDocs(activeListingsQuery)
        ).pipe(
            map(snapshot =>
                snapshot.docs
                    .map(document =>
                        this.mapFirestoreListing(
                            document.id,
                            document.data()
                        )
                    )
                    .filter(
                        (
                            listing
                        ): listing is MarketplaceListing =>
                            listing !== null
                    )
            )
        );
    }

    private createSearchResult(
        listings: MarketplaceListing[],
        filters: ListingSearchFilters
    ): ListingSearchResult {
        const page = Math.max(
            filters.page ?? 1,
            1
        );

        const pageSize = Math.max(
            filters.pageSize ?? 12,
            1
        );

        let filteredListings = [...listings];

        if (filters.searchTerm) {
            const searchTerm =
                filters.searchTerm.trim().toLowerCase();

            filteredListings =
                filteredListings.filter(listing => {
                    const searchableText = [
                        listing.title,
                        listing.address.addressLine1,
                        listing.address.city,
                        listing.address.state,
                        listing.address.stateAbbreviation,
                        listing.address.postalCode,
                        listing.address.county ?? ''
                    ]
                        .join(' ')
                        .toLowerCase();

                    return searchableText.includes(searchTerm);
                });
        }

        if (filters.stateSlug) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        listing.address.stateSlug ===
                        filters.stateSlug
                );
        }

        if (filters.city) {
            const city =
                filters.city.trim().toLowerCase();

            filteredListings =
                filteredListings.filter(
                    listing =>
                        listing.address.city
                            .trim()
                            .toLowerCase() === city
                );
        }

        if (filters.postalCode) {
            const postalCode =
                filters.postalCode.trim();

            filteredListings =
                filteredListings.filter(
                    listing =>
                        listing.address.postalCode ===
                        postalCode
                );
        }

        if (filters.propertyTypes?.length) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        filters.propertyTypes?.includes(
                            listing.propertyType
                        )
                );
        }

        if (filters.minimumPrice !== undefined) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        listing.price >=
                        filters.minimumPrice!
                );
        }

        if (filters.maximumPrice !== undefined) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        listing.price <=
                        filters.maximumPrice!
                );
        }

        if (filters.minimumBedrooms !== undefined) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        (listing.bedrooms ?? 0) >=
                        filters.minimumBedrooms!
                );
        }

        if (filters.minimumBathrooms !== undefined) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        (listing.bathrooms ?? 0) >=
                        filters.minimumBathrooms!
                );
        }

        if (filters.minimumSquareFeet !== undefined) {
            filteredListings =
                filteredListings.filter(
                    listing =>
                        (listing.squareFeet ?? 0) >=
                        filters.minimumSquareFeet!
                );
        }

        filteredListings = this.sortListings(
            filteredListings,
            filters.sort ?? 'newest'
        );

        const totalCount =
            filteredListings.length;

        const totalPages = Math.max(
            Math.ceil(totalCount / pageSize),
            1
        );

        const safePage = Math.min(
            page,
            totalPages
        );

        const startIndex =
            (safePage - 1) * pageSize;

        return {
            listings: filteredListings
                .slice(
                    startIndex,
                    startIndex + pageSize
                )
                .map(listing =>
                    this.toListingSummary(listing)
                ),

            totalCount,
            page: safePage,
            pageSize,
            totalPages
        };
    }

    private mapFirestoreListing(
        documentId: string,
        data: Record<string, unknown>
    ): MarketplaceListing | null {
        const city = this.readString(
            data['city']
        );

        const state = this.readString(
            data['state']
        );

        const postalCode =
            this.readString(
                data['zipCode']
            );

        if (
            !city ||
            !state ||
            !postalCode
        ) {
            return null;
        }

        const addressLine1 =
            this.readString(
                data['addressLine1']
            );

        const stateAbbreviation =
            this.getStateAbbreviation(state);

        const photos = Array.isArray(
            data['photos']
        )
            ? data['photos'] as MarketplaceListing['photos']
            : [];

        const primaryPhotoUrl =
            this.readString(
                data['primaryPhotoUrl']
            ) ||
            this.readString(
                data['featuredPhotoUrl']
            ) ||
            this.readString(
                data['photoUrls'],
                0
            );

        const latitude =
            this.readNumber(
                data['latitude']
            ) ?? 0;

        const longitude =
            this.readNumber(
                data['longitude']
            ) ?? 0;

        return {
            uid:
                this.readString(data['Uid']) ||
                documentId,

            sellerUid:
                this.readString(
                    data['sellerUid']
                ),

            status:
                data['status'] as MarketplaceListing['status'],

            propertyType:
                data['propertyType'] as
                MarketplaceListing['propertyType'],

            title:
                this.readString(
                    data['title']
                ) ||
                addressLine1 ||
                `Home in ${city}`,

            description:
                this.readString(
                    data['description']
                ),

            price:
                this.readNumber(
                    data['listPrice']
                ) ?? 0,

            bedrooms:
                this.readNumber(
                    data['bedrooms']
                ),

            bathrooms:
                this.readNumber(
                    data['bathrooms']
                ),

            squareFeet:
                this.readNumber(
                    data['squareFeet']
                ),

            lotSizeAcres:
                this.readNumber(
                    data['lotSize']
                ),

            yearBuilt:
                this.readNumber(
                    data['yearBuilt']
                ),

            address: {
                addressLine1,

                addressLine2:
                    this.readString(
                        data['addressLine2']
                    ) || undefined,

                city,
                state:
                    this.getStateName(state),

                stateAbbreviation,

                stateSlug:
                    this.createStateSlug(state),

                postalCode,

                county:
                    this.readString(
                        data['county']
                    ) || undefined
            },

            location: {
                latitude,
                longitude,

                geohash:
                    this.readString(
                        data['geohash']
                    ) || undefined
            },

            photos,

            featuredPhotoUrl:
                primaryPhotoUrl || undefined,

            photoCount:
                photos.length ||
                (
                    Array.isArray(
                        data['photoUrls']
                    )
                        ? data['photoUrls'].length
                        : 0
                ),

            favoriteCount:
                this.readNumber(
                    data['favorites']
                ) ??
                this.readNumber(
                    data['favoriteCount']
                ) ??
                0,

            viewCount:
                this.readNumber(
                    data['views']
                ) ??
                this.readNumber(
                    data['viewCount']
                ) ??
                0,

            inquiryCount:
                this.readNumber(
                    data['inquiryCount']
                ) ?? 0,

            publishedAt:
                this.toDate(
                    data['publishedAt']
                ),

            createdAt:
                this.toDate(
                    data['createdAt']
                ) ?? new Date(),

            updatedAt:
                this.toDate(
                    data['updatedAt']
                ) ?? new Date()
        };
    }

    private sortListings(
        listings: MarketplaceListing[],
        sort: ListingSearchFilters['sort']
    ): MarketplaceListing[] {
        const sortedListings = [...listings];

        switch (sort) {
            case 'price_low_to_high':
                return sortedListings.sort(
                    (firstListing, secondListing) =>
                        firstListing.price -
                        secondListing.price
                );

            case 'price_high_to_low':
                return sortedListings.sort(
                    (firstListing, secondListing) =>
                        secondListing.price -
                        firstListing.price
                );

            case 'bedrooms_high_to_low':
                return sortedListings.sort(
                    (firstListing, secondListing) =>
                        (secondListing.bedrooms ?? 0) -
                        (firstListing.bedrooms ?? 0)
                );

            case 'square_feet_high_to_low':
                return sortedListings.sort(
                    (firstListing, secondListing) =>
                        (secondListing.squareFeet ?? 0) -
                        (firstListing.squareFeet ?? 0)
                );

            case 'newest':
            default:
                return sortedListings.sort(
                    (firstListing, secondListing) =>
                        (
                            secondListing.publishedAt?.getTime() ??
                            secondListing.createdAt.getTime()
                        ) -
                        (
                            firstListing.publishedAt?.getTime() ??
                            firstListing.createdAt.getTime()
                        )
                );
        }
    }

    private toListingSummary(
        listing: MarketplaceListing
    ): MarketplaceListingSummary {
        return {
            id: listing.uid,
            sellerUid: listing.sellerUid,

            title: listing.title,
            propertyType: listing.propertyType,

            price: listing.price,

            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            squareFeet: listing.squareFeet,

            city: listing.address.city,

            stateAbbreviation:
                listing.address.stateAbbreviation,

            postalCode:
                listing.address.postalCode,

            featuredPhotoUrl:
                listing.featuredPhotoUrl,

            favoriteCount:
                listing.favoriteCount,

            publishedAt:
                listing.publishedAt
        };
    }

    private isFeaturedListing(
        listing: MarketplaceListing
    ): boolean {
        return Boolean(
            (
                listing as MarketplaceListing & {
                    featuredListing?: boolean;
                }
            ).featuredListing
        );
    }

    private readString(
        value: unknown,
        arrayIndex?: number
    ): string {
        if (
            arrayIndex !== undefined &&
            Array.isArray(value)
        ) {
            const arrayValue =
                value[arrayIndex];

            return typeof arrayValue === 'string'
                ? arrayValue.trim()
                : '';
        }

        return typeof value === 'string'
            ? value.trim()
            : '';
    }

    private readNumber(
        value: unknown
    ): number | undefined {
        return typeof value === 'number' &&
            Number.isFinite(value)
            ? value
            : undefined;
    }

    private toDate(
        value: unknown
    ): Date | undefined {
        if (value instanceof Date) {
            return value;
        }

        if (
            value &&
            typeof value === 'object' &&
            'toDate' in value &&
            typeof (
                value as {
                    toDate?: unknown;
                }
            ).toDate === 'function'
        ) {
            return (
                value as {
                    toDate(): Date;
                }
            ).toDate();
        }

        if (
            typeof value === 'string' ||
            typeof value === 'number'
        ) {
            const date = new Date(value);

            return Number.isNaN(
                date.getTime()
            )
                ? undefined
                : date;
        }

        return undefined;
    }

    private getStateAbbreviation(
        state: string
    ): string {
        const normalizedState =
            state.trim().toLowerCase();

        if (
            normalizedState === 'nc' ||
            normalizedState ===
            'north carolina'
        ) {
            return 'NC';
        }

        return state.length === 2
            ? state.toUpperCase()
            : state;
    }

    private getStateName(
        state: string
    ): string {
        const normalizedState =
            state.trim().toLowerCase();

        if (
            normalizedState === 'nc' ||
            normalizedState ===
            'north carolina'
        ) {
            return 'North Carolina';
        }

        return state;
    }

    private createStateSlug(
        state: string
    ): string {
        const stateName =
            this.getStateName(state);

        return stateName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}