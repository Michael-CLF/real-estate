import { Injectable } from '@angular/core';

import {
  HttpsCallableResult,
  httpsCallable
} from 'firebase/functions';

import {
  ValidateDiscountCodeRequest,
  ValidateDiscountCodeResult
} from '../models/discount-code.model';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

@Injectable({
  providedIn: 'root'
})
export class DiscountCodeService {
  private readonly validateDiscountCodeFunction = httpsCallable<
    ValidateDiscountCodeRequest,
    ValidateDiscountCodeResult
  >(
    functions,
    'validateDiscountCode'
  );

  async validateCode(
    code: string,
    subtotal: number
  ): Promise<ValidateDiscountCodeResult> {
    const normalizedCode = code
      .trim()
      .toUpperCase();

    if (!normalizedCode) {
      return {
        valid: false,
        code: '',
        discountAmount: 0,
        message: 'Enter a discount code.'
      };
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return {
        valid: false,
        code: normalizedCode,
        discountAmount: 0,
        message: 'The purchase amount is invalid.'
      };
    }

    try {
      const result: HttpsCallableResult<ValidateDiscountCodeResult> =
        await this.validateDiscountCodeFunction({
          code: normalizedCode,
          subtotal
        });

      return result.data;
    } catch (error) {
      console.error(
        'Discount code validation failed.',
        error
      );

      return {
        valid: false,
        code: normalizedCode,
        discountAmount: 0,
        message:
          'We could not validate this discount code. Please try again.'
      };
    }
  }
}