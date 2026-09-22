import {
    HttpsError,
} from 'firebase-functions/v2/https';

import type {
    OfferDocument,
    OfferVersionDocument,
} from '../../offer-types';

import type {
    ValidateStateSubmissionInput,
} from '../state-contract-package';


interface NorthCarolinaSubmissionConfiguration {
    stateCode: 'NC';

    defaultTimeZone:
    'America/New_York';
}

export function validateNorthCarolinaSubmission(
    input:
        ValidateStateSubmissionInput,

    configuration:
        NorthCarolinaSubmissionConfiguration
): void {
    const {
        offer,
        version,
    } = input;
    const terms =
        requireObject(
            version.terms,
            'The offer terms are missing.'
        );

    const stateCode =
        readRequiredString(
            terms,
            'stateCode',
            'The contract state is required.'
        )
            .toUpperCase();

    if (
        stateCode !==
        configuration.stateCode ||
        offer.stateCode
            .trim()
            .toUpperCase() !==
        configuration.stateCode
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The contract state does not match the offer state.'
        );
    }

    validateParties(version);
    validateProperty(terms, offer, configuration.stateCode);
    validatePropertyTerms(terms);
    validatePurchaseTerms(terms);
    validateDeposits(terms);
    validateConcessions(terms);
    validateSettlement(terms);
    validateDelivery(terms, version, configuration.stateCode);
    validateBuyerDisclosures(terms);
    validateSellerStatements(
        terms,
        version
    );
    validateAddenda(terms);
    validateAdditionalTerms(terms);
    validateChronology(terms);
}


function validateParties(
    version: OfferVersionDocument
): void {
    if (version.buyers.length !== 1) {
        throw new HttpsError(
            'failed-precondition',
            'The NavStreet offer form currently supports exactly one buyer.'
        );
    }

    if (version.sellers.length !== 1) {
        throw new HttpsError(
            'failed-precondition',
            'The NavStreet offer form currently supports exactly one seller.'
        );
    }

    for (
        const party of [
            ...version.buyers,
            ...version.sellers,
        ]
    ) {
        if (
            !party.legalName ||
            party.legalName.trim().length === 0
        ) {
            throw new HttpsError(
                'failed-precondition',
                'Every party must have a legal name.'
            );
        }

        if (!isValidEmail(party.email)) {
            throw new HttpsError(
                'failed-precondition',
                party.legalName +
                ' must have a valid email address.'
            );
        }

        if (
            !party.phone ||
            party.phone.trim().length === 0
        ) {
            throw new HttpsError(
                'failed-precondition',
                party.legalName +
                ' must have a phone number.'
            );
        }
    }

    /*
     * Only the party submitting this version must already
     * be identity verified.
     */
    const initiatingParties =
        version.initiatedBy === 'buyer'
            ? version.buyers
            : version.sellers;

    for (
        const party of initiatingParties
    ) {
        if (
            party.requiredSigner &&
            party.identityVerification
                .status !== 'verified'
        ) {
            throw new HttpsError(
                'failed-precondition',
                party.legalName +
                ' must complete identity verification before submitting this offer.'
            );
        }
    }
}


function validateProperty(
  terms: Record<string, unknown>,
  offer: OfferDocument,
  requiredStateCode: string
): void {
    const property =
        requireObject(
            terms['property'],
            'The property information is missing.'
        );

    const listingUid =
        readRequiredString(
            property,
            'listingUid',
            'The property listing identifier is missing.'
        );

    if (listingUid !== offer.listingUid) {
        throw new HttpsError(
            'failed-precondition',
            'The property information does not match this offer.'
        );
    }

    readRequiredString(
        property,
        'addressLine1',
        'The property street address is required.'
    );

    readRequiredString(
        property,
        'city',
        'The property city is required.'
    );

    const propertyState =
        readRequiredString(
            property,
            'state',
            'The property state is required.'
        )
            .toUpperCase();

    if (
        propertyState !==
        requiredStateCode
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The property state does not match the contract state.'
        );
    }

    readRequiredString(
        property,
        'zipCode',
        'The property ZIP code is required.'
    );

    readRequiredString(
        property,
        'county',
        'The property county is required.'
    );
}


function validatePropertyTerms(
    terms: Record<string, unknown>
): void {
    const propertyTerms =
        requireObject(
            terms['propertyTerms'],
            'Property inclusion terms are required.'
        );

    readRequiredBoolean(
        propertyTerms,
        'manufacturedHomeIncluded',
        'Specify whether a manufactured home is included.'
    );

    const separatePropertyIncluded =
        readRequiredBoolean(
            propertyTerms,
            'separatePropertyIncluded',
            'Specify whether separate property is included.'
        );

    if (separatePropertyIncluded) {
        readRequiredString(
            propertyTerms,
            'separatePropertyDescription',
            'Describe the separate property included in the purchase.'
        );
    }
}


function validatePurchaseTerms(
    terms: Record<string, unknown>
): void {
    const purchase =
        requireObject(
            terms['purchase'],
            'Purchase terms are required.'
        );

    const purchasePrice =
        readRequiredInteger(
            purchase,
            'purchasePriceInCents',
            'Enter a valid purchase price.'
        );

    if (purchasePrice <= 0) {
        throw new HttpsError(
            'failed-precondition',
            'The purchase price must be greater than zero.'
        );
    }

    const financingType =
        readRequiredString(
            purchase,
            'financingType',
            'Select cash or loan.'
        );

    if (
        financingType !== 'cash' &&
        financingType !== 'loan'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select cash or loan.'
        );
    }

    const otherPropertyWillFundPurchase =
        readRequiredBoolean(
            purchase,
            'otherPropertyWillFundPurchase',
            'Specify whether other property will fund this purchase.'
        );

    if (otherPropertyWillFundPurchase) {
        readRequiredString(
            purchase,
            'otherPropertyDescription',
            'Describe the other property that will fund this purchase.'
        );
    }
}


function validateDeposits(
    terms: Record<string, unknown>
): void {
    const deposits =
        requireObject(
            terms['deposits'],
            'Deposit and due-diligence terms are required.'
        );

    validateNonNegativeMoney(
        deposits,
        'depositInCents',
        'The deposit'
    );

    const depositDeliveryDays =
        readRequiredInteger(
            deposits,
            'depositDeliveryDays',
            'The deposit-delivery period is invalid.'
        );

    if (
        depositDeliveryDays < 1 ||
        depositDeliveryDays > 30
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Enter a deposit-delivery period from 1 to 30 calendar days after the Effective Date.'
        );
    }

    const escrowAgentName =
        deposits['escrowAgentName'];

    if (
        typeof escrowAgentName !== 'string' ||
        escrowAgentName.trim().length > 200
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The escrow-agent name must be 200 characters or fewer.'
        );
    }

    const deadlineType =
        readRequiredString(
            deposits,
            'dueDiligenceDeadlineType',
            'Select a due-diligence deadline.'
        );

    if (deadlineType === 'specific_date') {
        requireValidDate(
            deposits['dueDiligenceEndDate'],
            'Enter a valid due-diligence end date.'
        );
    } else if (
        deadlineType ===
        'days_after_effective_date'
    ) {
        const days =
            readRequiredInteger(
                deposits,
                'dueDiligenceDaysAfterEffectiveDate',
                'Enter the number of due-diligence days.'
            );

        if (days <= 0 || days > 365) {
            throw new HttpsError(
                'failed-precondition',
                'The due-diligence period must be between 1 and 365 days.'
            );
        }
    } else {
        throw new HttpsError(
            'failed-precondition',
            'Select a due-diligence deadline.'
        );
    }

    if (
        deposits['dueDiligenceEndTime'] !==
        '17:00'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The due-diligence deadline must use 5:00 p.m.'
        );
    }
}


function validateConcessions(
    terms: Record<string, unknown>
): void {
    const concessions =
        requireObject(
            terms['concessions'],
            'Seller-concession terms are required.'
        );

    const concessionType =
        readRequiredString(
            concessions,
            'concessionType',
            'Select the seller-concession type.'
        );

    if (concessionType === 'amount') {
        const amount =
            readRequiredInteger(
                concessions,
                'sellerConcessionInCents',
                'Enter a valid seller-concession amount.'
            );

        if (amount <= 0) {
            throw new HttpsError(
                'failed-precondition',
                'The seller-concession amount must be greater than zero.'
            );
        }
    } else if (
        concessionType === 'percentage'
    ) {
        const percentage =
            readRequiredNumber(
                concessions,
                'sellerConcessionPercentage',
                'Enter a valid seller-concession percentage.'
            );

        if (
            percentage <= 0 ||
            percentage > 100
        ) {
            throw new HttpsError(
                'failed-precondition',
                'The seller-concession percentage must be greater than 0 and no more than 100.'
            );
        }
    } else if (
        concessionType !== 'none'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select a valid seller-concession type.'
        );
    }

    const homeWarrantyRequested =
        readRequiredBoolean(
            concessions,
            'homeWarrantyRequested',
            'Specify whether a home warranty is requested.'
        );

    if (homeWarrantyRequested) {
        const warrantyAmount =
            readRequiredInteger(
                concessions,
                'homeWarrantyInCents',
                'Enter a valid home-warranty amount.'
            );

        if (warrantyAmount <= 0) {
            throw new HttpsError(
                'failed-precondition',
                'The home-warranty amount must be greater than zero.'
            );
        }
    }
}


function validateSettlement(
    terms: Record<string, unknown>
): void {
    const settlement =
        requireObject(
            terms['settlement'],
            'Settlement terms are required.'
        );

    requireValidDate(
        settlement['settlementDate'],
        'Enter a valid settlement date.'
    );

    const possessionTiming =
        readRequiredString(
            settlement,
            'possessionTiming',
            'Select when possession will be delivered.'
        );

    if (
        possessionTiming !== 'at_closing' &&
        possessionTiming !== 'other'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select when possession will be delivered.'
        );
    }

    if (possessionTiming === 'other') {
        readRequiredString(
            settlement,
            'possessionAgreementDocumentUid',
            'Attach the separate possession agreement.'
        );
    }
}


function validateDelivery(
  terms: Record<string, unknown>,
  version: OfferVersionDocument,
  requiredTimeZone: string
): void {
    const delivery =
        requireObject(
            terms['delivery'],
            'Offer delivery terms are required.'
        );

    const expiresAt =
        requireValidDateTime(
            delivery['expiresAt'],
            'Enter a valid offer expiration date and time.'
        );

    if (
        expiresAt.getTime() <=
        Date.now()
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The offer expiration must be in the future.'
        );
    }

    if (
        version.expiresAt !==
        delivery['expiresAt']
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The offer expiration values do not match. Save the offer and try again.'
        );
    }

    if (
        delivery['timeZone'] !==
        requiredTimeZone
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The offer does not use the required contract timezone.'
        );
    }

    if (
        delivery[
        'electronicDeliveryAuthorized'
        ] !== true
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Electronic delivery must be authorized before submission.'
        );
    }

    if (
        !isValidEmail(
            delivery[
            'buyerDeliveryEmail'
            ]
        ) ||
        !isValidEmail(
            delivery[
            'sellerDeliveryEmail'
            ]
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Valid buyer and seller delivery emails are required.'
        );
    }
}


function validateBuyerDisclosures(
    terms: Record<string, unknown>
): void {
    const disclosures =
        requireObject(
            terms['buyerDisclosures'],
            'Buyer disclosure selections are required.'
        );

    validateDisclosureReceipt(
        disclosures['residentialProperty'],
        'Residential Property and Owners Association Disclosure Statement'
    );

    validateDisclosureReceipt(
        disclosures['mineralOilGasRights'],
        'Mineral and Oil and Gas Rights Mandatory Disclosure Statement'
    );
}


function validateDisclosureReceipt(
    value: unknown,
    label: string
): void {
    const receipt =
        requireObject(
            value,
            label + ' selection is required.'
        );

    const status =
        readRequiredString(
            receipt,
            'status',
            'Select the status of the ' +
            label + '.'
        );

    if (
        status !== 'received' &&
        status !== 'not_received' &&
        status !== 'exempt'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select the status of the ' +
            label + '.'
        );
    }

    if (receipt['acknowledged'] !== true) {
        throw new HttpsError(
            'failed-precondition',
            'Acknowledge the ' +
            label + ' selection.'
        );
    }

    if (status === 'exempt') {
        readRequiredString(
            receipt,
            'exemptionReason',
            'Enter the reason this sale is exempt from the ' +
            label + '.'
        );
    }
}


function validateSellerStatements(
    terms: Record<string, unknown>,
    version: OfferVersionDocument
): void {
    const statements =
        requireObject(
            terms['sellerStatements'],
            'Seller statements are invalid.'
        );

    /*
     * A buyer does not answer Section 6 for the seller.
     * A seller-created counteroffer must contain the seller's
     * completed statements before the seller submits it.
     */
    if (version.initiatedBy !== 'seller') {
        return;
    }

    const ownershipStatus =
        readRequiredString(
            statements,
            'ownershipStatus',
            'Select how long the seller has owned the property.'
        );

    if (
        ownershipStatus !==
        'owned_at_least_one_year' &&
        ownershipStatus !==
        'owned_less_than_one_year' &&
        ownershipStatus !==
        'does_not_yet_own'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select a valid seller ownership status.'
        );
    }

    const leadBasedPaintApplies =
        readRequiredBoolean(
            statements,
            'leadBasedPaintApplies',
            'Complete the lead-based-paint statement.'
        );

    if (leadBasedPaintApplies) {
        readRequiredString(
            statements,
            'leadBasedPaintDisclosureDocumentUid',
            'Attach the lead-based-paint disclosure.'
        );
    }

    readRequiredBoolean(
        statements,
        'ownersAssociationApplies',
        'Specify whether an owners association applies.'
    );

    const fuelTankPresent =
        readRequiredBoolean(
            statements,
            'fuelTankPresent',
            'Specify whether a fuel tank is present.'
        );

    if (fuelTankPresent) {
        const fuelTankOwnership =
            readRequiredString(
                statements,
                'fuelTankOwnership',
                'Specify whether the fuel tank is owned or leased.'
            );

        if (
            fuelTankOwnership !== 'owned' &&
            fuelTankOwnership !== 'leased'
        ) {
            throw new HttpsError(
                'failed-precondition',
                'Specify whether the fuel tank is owned or leased.'
            );
        }
    }

    const leasesExist =
        readRequiredBoolean(
            statements,
            'leasesExist',
            'Specify whether any leases exist.'
        );

    if (leasesExist) {
        readRequiredString(
            statements,
            'leaseAddendumDocumentUid',
            'Attach the applicable lease addendum.'
        );
    }
}


function validateAddenda(
    terms: Record<string, unknown>
): void {
    const addenda =
        terms['addenda'];

    if (!Array.isArray(addenda)) {
        throw new HttpsError(
            'failed-precondition',
            'The offer addenda are invalid.'
        );
    }

    for (const addendum of addenda) {
        const addendumData =
            requireObject(
                addendum,
                'An offer addendum is invalid.'
            );

        const included =
            readRequiredBoolean(
                addendumData,
                'included',
                'Specify whether each addendum is included.'
            );

        if (!included) {
            continue;
        }

        readRequiredString(
            addendumData,
            'addendumUid',
            'An included addendum is missing its identifier.'
        );

        readRequiredString(
            addendumData,
            'title',
            'An included addendum is missing its title.'
        );

        readRequiredString(
            addendumData,
            'documentUid',
            'An included addendum is missing its document.'
        );

        validatePreparedBy(
            addendumData['preparedBy']
        );
    }
}


function validateAdditionalTerms(
    terms: Record<string, unknown>
): void {
    const exhibit =
        requireObject(
            terms['additionalTermsExhibit'],
            'The additional-terms exhibit selection is invalid.'
        );

    const included =
        readRequiredBoolean(
            exhibit,
            'included',
            'Specify whether an additional-terms exhibit is included.'
        );

    if (!included) {
        return;
    }

    validatePreparedBy(
        exhibit['preparedBy']
    );

    readRequiredString(
        exhibit,
        'documentUid',
        'Attach the additional-terms exhibit.'
    );
}


function validatePreparedBy(
    value: unknown
): void {
    if (
        value !== 'buyer' &&
        value !== 'seller' &&
        value !== 'attorney'
    ) {
        throw new HttpsError(
            'failed-precondition',
            'Select who prepared the attached terms.'
        );
    }
}


function validateChronology(
    terms: Record<string, unknown>
): void {
    const deposits =
        requireObject(
            terms['deposits'],
            'Deposit terms are required.'
        );

    const settlement =
        requireObject(
            terms['settlement'],
            'Settlement terms are required.'
        );

    const delivery =
        requireObject(
            terms['delivery'],
            'Delivery terms are required.'
        );

    const offerExpiration =
        requireValidDateTime(
            delivery['expiresAt'],
            'The offer expiration is invalid.'
        );

    const settlementDate =
        requireValidDate(
            settlement['settlementDate'],
            'The settlement date is invalid.'
        );

    /*
     * Use the end of the proposed settlement date for this
     * comparison because settlement has no time-of-day field.
     */
    settlementDate.setUTCHours(
        23,
        59,
        59,
        999
    );

    if (
        offerExpiration.getTime() >=
        settlementDate.getTime()
    ) {
        throw new HttpsError(
            'failed-precondition',
            'The offer must expire before the proposed settlement date.'
        );
    }

    if (
        deposits[
        'dueDiligenceDeadlineType'
        ] === 'specific_date'
    ) {
        const dueDiligenceDate =
            requireValidDate(
                deposits['dueDiligenceEndDate'],
                'The due-diligence end date is invalid.'
            );

        if (
            dueDiligenceDate.getTime() >=
            settlementDate.getTime()
        ) {
            throw new HttpsError(
                'failed-precondition',
                'The due-diligence period must end before settlement.'
            );
        }
    }
}


function validateNonNegativeMoney(
    data: Record<string, unknown>,
    fieldName: string,
    label: string
): number {
    const amount =
        readRequiredInteger(
            data,
            fieldName,
            label + ' must be a valid amount.'
        );

    if (amount < 0) {
        throw new HttpsError(
            'failed-precondition',
            label + ' cannot be negative.'
        );
    }

    return amount;
}


function requireValidDateTime(
    value: unknown,
    message: string
): Date {
    if (
        typeof value !== 'string' ||
        !/(Z|[+-]\d{2}:\d{2})$/.test(
            value
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    const parsedDate =
        new Date(value);

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return parsedDate;
}


function requireValidDate(
    value: unknown,
    message: string
): Date {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    const parsedDate =
        new Date(
            value + 'T12:00:00Z'
        );

    if (
        Number.isNaN(
            parsedDate.getTime()
        ) ||
        parsedDate
            .toISOString()
            .slice(0, 10) !== value
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return parsedDate;
}


function requireObject(
    value: unknown,
    message: string
): Record<string, unknown> {
    if (
        value === null ||
        typeof value !== 'object' ||
        Array.isArray(value)
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return value as
        Record<string, unknown>;
}


function readRequiredString(
    data: Record<string, unknown>,
    fieldName: string,
    message: string
): string {
    const value =
        data[fieldName];

    if (
        typeof value !== 'string' ||
        value.trim().length === 0
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return value.trim();
}


function readRequiredInteger(
    data: Record<string, unknown>,
    fieldName: string,
    message: string
): number {
    const value =
        data[fieldName];

    if (
        typeof value !== 'number' ||
        !Number.isInteger(value)
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return value;
}


function readRequiredNumber(
    data: Record<string, unknown>,
    fieldName: string,
    message: string
): number {
    const value =
        data[fieldName];

    if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
    ) {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return value;
}


function readRequiredBoolean(
    data: Record<string, unknown>,
    fieldName: string,
    message: string
): boolean {
    const value =
        data[fieldName];

    if (typeof value !== 'boolean') {
        throw new HttpsError(
            'failed-precondition',
            message
        );
    }

    return value;
}


function isValidEmail(
    value: unknown
): boolean {
    return (
        typeof value === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            value.trim()
        )
    );
}