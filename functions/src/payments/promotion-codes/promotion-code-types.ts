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

export interface CreatePromotionCodeRequest {
    name: string;
    code: string;

    discountType:
        PromotionDiscountType;

    percentOff?: number;
    amountOffCents?: number;
    currency?: string;

    eligibleProduct:
        PromotionEligibleProduct;

    /*
     * ISO-8601 date string. When omitted, the
     * promotion code has no scheduled expiration.
     */
    expiresAt?: string | null;

    /*
     * Maximum number of successful redemptions
     * across all customers. Null means unlimited.
     */
    maxRedemptions?: number | null;

    firstTimeTransactionOnly: boolean;
}

export interface UpdatePromotionCodeRequest {
    promotionCodeUid: string;

    /*
     * Stripe permits an existing promotion code to
     * be activated or deactivated. Changes to its
     * actual discount require creating a replacement.
     */
    active: boolean;
}

export interface ListPromotionCodesRequest {
    includeInactive?: boolean;
}

export interface PromotionCodeRecord {
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

export interface CreatePromotionCodeResponse {
    promotionCode:
        PromotionCodeRecord;
}

export interface UpdatePromotionCodeResponse {
    promotionCode:
        PromotionCodeRecord;
}

export interface ListPromotionCodesResponse {
    promotionCodes:
        PromotionCodeRecord[];
}
export interface ValidateListingPromotionRequest {
  listingUid: string;
  code: string;
}

export interface ValidateListingPromotionResponse {
  valid: true;

  code: string;

  stripePromotionCodeId:
    string;

  listingFeeCents:
    number;

  featuredListingFeeCents:
    number;

  subtotalAmountCents:
    number;

  discountAmountCents:
    number;

  totalAmountCents:
    number;
}