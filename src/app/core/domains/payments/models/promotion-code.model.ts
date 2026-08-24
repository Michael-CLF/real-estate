export type PromotionDiscountType =
    | 'percentage'
    | 'fixed_amount';

export type PromotionEligibleProduct =
    | 'property_listing'
    | 'featured_listing'
    | 'business_profile';

export type PromotionCodeStatus =
    | 'active'
    | 'inactive'
    | 'expired';

export interface PromotionCode {
    uid: string;

    name: string;
    code: string;

    discountType:
        PromotionDiscountType;

    percentOff?: number;
    amountOffCents?: number;
    currency?: string;

    eligibleProduct:
        PromotionEligibleProduct;

    eligiblePriceId: string;
    stripeProductId: string;

    stripeCouponId: string;
    stripePromotionCodeId: string;

    status:
        PromotionCodeStatus;

    active: boolean;

    firstTimeTransactionOnly:
        boolean;

    maxRedemptions:
        number | null;

    timesRedeemed:
        number;

    expiresAt:
        string | null;

    createdByUid: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePromotionCodeInput {
    name: string;
    code: string;

    discountType:
        PromotionDiscountType;

    percentOff?: number;
    amountOffCents?: number;
    currency?: string;

    eligibleProduct:
        PromotionEligibleProduct;

    expiresAt?: string | null;

    maxRedemptions?: number | null;

    firstTimeTransactionOnly:
        boolean;
}

export interface UpdatePromotionCodeInput {
    promotionCodeUid: string;
    active: boolean;
}

export interface CreatePromotionCodeResult {
    promotionCode:
        PromotionCode;
}

export interface UpdatePromotionCodeResult {
    promotionCode:
        PromotionCode;
}

export interface ListPromotionCodesResult {
    promotionCodes:
        PromotionCode[];
}

export interface PromotionProductOption {
    value:
        PromotionEligibleProduct;

    label: string;
    description: string;
    priceLabel: string;
}

export const PROMOTION_PRODUCT_OPTIONS:
    ReadonlyArray<PromotionProductOption> = [
        {
            value:
                'property_listing',

            label:
                'Property listing',

            description:
                'The standard one-time NavStreet property-listing fee.',

            priceLabel:
                '$49'
        },

        {
            value:
                'featured_listing',

            label:
                'Featured Property upgrade',

            description:
                'The optional one-time Featured Property enhancement.',

            priceLabel:
                '$10'
        },

        {
            value:
                'business_profile',

            label:
                'Full Business Profile',

            description:
                'The recurring NavStreet professional-profile subscription.',

            priceLabel:
                '$49 per month'
        }
    ];