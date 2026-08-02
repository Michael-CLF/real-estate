import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

type DiscountType = 'fixed' | 'percentage';

interface ValidateDiscountCodeRequest {
  code: string;
  subtotal: number;
}

interface DiscountCodeDocument {
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  active: boolean;
  startsAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
  maxUses?: number | null;
  currentUses?: number;
}

interface ValidDiscountCodeResult {
  valid: true;
  code: string;
  type: DiscountType;
  value: number;
  discountAmount: number;
  totalAfterDiscount: number;
  message: string;
}

interface InvalidDiscountCodeResult {
  valid: false;
  code: string;
  discountAmount: 0;
  message: string;
}

type ValidateDiscountCodeResult =
  | ValidDiscountCodeResult
  | InvalidDiscountCodeResult;

export const validateDiscountCode = onCall<
  ValidateDiscountCodeRequest,
  Promise<ValidateDiscountCodeResult>
>(async (request) => {
  const code = request.data.code
    ?.trim()
    .toUpperCase();

  const subtotal = request.data.subtotal;

  if (!code) {
    return invalidResult(
      '',
      'Enter a discount code.'
    );
  }

  if (
    typeof subtotal !== 'number' ||
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    return invalidResult(
      code,
      'The purchase amount is invalid.'
    );
  }

  const firestore = getFirestore();

  const discountReference = firestore
    .collection('discountCodes')
    .doc(code);

  const discountSnapshot =
    await discountReference.get();

  if (!discountSnapshot.exists) {
    return invalidResult(
      code,
      'This discount code is not valid.'
    );
  }

  const discount =
    discountSnapshot.data() as DiscountCodeDocument;

  if (!discount.active) {
    return invalidResult(
      code,
      'This discount code is no longer active.'
    );
  }

  if (
    discount.code &&
    discount.code.toUpperCase() !== code
  ) {
    return invalidResult(
      code,
      'This discount code is not valid.'
    );
  }

  const now = Timestamp.now();

  if (
    discount.startsAt &&
    discount.startsAt.toMillis() > now.toMillis()
  ) {
    return invalidResult(
      code,
      'This discount code is not active yet.'
    );
  }

  if (
    discount.expiresAt &&
    discount.expiresAt.toMillis() < now.toMillis()
  ) {
    return invalidResult(
      code,
      'This discount code has expired.'
    );
  }

  const currentUses =
    discount.currentUses ?? 0;

  if (
    discount.maxUses !== null &&
    discount.maxUses !== undefined &&
    currentUses >= discount.maxUses
  ) {
    return invalidResult(
      code,
      'This discount code has reached its usage limit.'
    );
  }

  if (
    discount.type !== 'fixed' &&
    discount.type !== 'percentage'
  ) {
    return invalidResult(
      code,
      'This discount code is not configured correctly.'
    );
  }

  if (
    typeof discount.value !== 'number' ||
    !Number.isFinite(discount.value) ||
    discount.value <= 0
  ) {
    return invalidResult(
      code,
      'This discount code is not configured correctly.'
    );
  }

  if (
    discount.type === 'percentage' &&
    discount.value > 100
  ) {
    return invalidResult(
      code,
      'This discount code is not configured correctly.'
    );
  }

  let discountAmount: number;

  if (discount.type === 'fixed') {
    discountAmount = Math.min(
      discount.value,
      subtotal
    );
  } else {
    discountAmount =
      subtotal * (discount.value / 100);
  }

  discountAmount =
    roundCurrency(discountAmount);

  const totalAfterDiscount =
    roundCurrency(
      Math.max(
        subtotal - discountAmount,
        0
      )
    );

  const message =
    discount.type === 'fixed'
      ? `$${discountAmount.toFixed(2)} discount applied.`
      : `${discount.value}% discount applied.`;

  return {
    valid: true,
    code,
    type: discount.type,
    value: discount.value,
    discountAmount,
    totalAfterDiscount,
    message
  };
});

function invalidResult(
  code: string,
  message: string
): InvalidDiscountCodeResult {
  return {
    valid: false,
    code,
    discountAmount: 0,
    message
  };
}

function roundCurrency(
  value: number
): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}