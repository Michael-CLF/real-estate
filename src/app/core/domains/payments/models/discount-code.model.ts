export type DiscountType = 'fixed' | 'percentage';

export interface DiscountCode {
  id: string;

  /**
   * Normalized uppercase promotion code.
   * Example: SUMMER25
   */
  code: string;

  /**
   * Optional admin-facing description.
   */
  description: string;

  /**
   * Determines how the discount is calculated.
   *
   * fixed:
   *   value = dollar amount
   *   Example: 10 = $10 off
   *
   * percentage:
   *   value = percentage
   *   Example: 20 = 20% off
   */
  type: DiscountType;

  value: number;

  /**
   * Allows an administrator to disable a code
   * without deleting it.
   */
  active: boolean;

  /**
   * Optional promotion date restrictions.
   */
  startsAt: Date | null;
  expiresAt: Date | null;

  /**
   * Optional maximum number of successful uses.
   * null = unlimited.
   */
  maxUses: number | null;

  /**
   * Number of completed uses.
   */
  currentUses: number;

  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ValidateDiscountCodeRequest {
  code: string;

  /**
   * Amount the discount will be applied against.
   *
   * For the listing workflow this will eventually
   * be the NavStreet listing charge plus applicable
   * optional upgrades.
   */
  subtotal: number;
}

export interface ValidDiscountCodeResult {
  valid: true;

  code: string;
  type: DiscountType;
  value: number;

  /**
   * Actual dollar amount being deducted after
   * applying the promotion rules.
   */
  discountAmount: number;

  /**
   * Amount remaining after the discount.
   */
  totalAfterDiscount: number;

  message: string;
}

export interface InvalidDiscountCodeResult {
  valid: false;

  code: string;
  discountAmount: 0;

  message: string;
}

export type ValidateDiscountCodeResult =
  | ValidDiscountCodeResult
  | InvalidDiscountCodeResult;