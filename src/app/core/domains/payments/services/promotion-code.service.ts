import {
    Injectable,
    signal
} from '@angular/core';

import {
    httpsCallable
} from 'firebase/functions';

import {
    functions
} from '../../../infrastructure/firebase/firebase';

import type {
    CreatePromotionCodeInput,
    CreatePromotionCodeResult,
    ListPromotionCodesResult,
    PromotionCode,
    UpdatePromotionCodeInput,
    UpdatePromotionCodeResult
} from '../models/promotion-code.model';

@Injectable({
    providedIn: 'root'
})
export class PromotionCodeService {

    readonly promotionCodes =
        signal<PromotionCode[]>([]);

    readonly isLoading =
        signal(false);

    readonly errorMessage =
        signal('');

    async loadPromotionCodes(
        includeInactive = true
    ): Promise<PromotionCode[]> {
        this.isLoading.set(true);
        this.errorMessage.set('');

        try {
            const callable =
                httpsCallable<
                    {
                        includeInactive:
                            boolean;
                    },
                    ListPromotionCodesResult
                >(
                    functions,
                    'listPromotionCodes'
                );

            const result =
                await callable({
                    includeInactive
                });

            const promotionCodes =
                result.data
                    .promotionCodes ??
                [];

            this.promotionCodes.set(
                promotionCodes
            );

            return promotionCodes;
        } catch (error: unknown) {
            const message =
                this.getErrorMessage(
                    error,
                    'Promotion codes could not be loaded.'
                );

            this.errorMessage.set(
                message
            );

            throw new Error(
                message
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    async createPromotionCode(
        input:
            CreatePromotionCodeInput
    ): Promise<PromotionCode> {
        this.isLoading.set(true);
        this.errorMessage.set('');

        try {
            const callable =
                httpsCallable<
                    CreatePromotionCodeInput,
                    CreatePromotionCodeResult
                >(
                    functions,
                    'createPromotionCode'
                );

            const result =
                await callable(
                    this.removeUndefinedValues(
                        input
                    )
                );

            const promotionCode =
                result.data
                    .promotionCode;

            this.promotionCodes.update(
                existingPromotionCodes => [
                    promotionCode,
                    ...existingPromotionCodes
                        .filter(
                            existingPromotionCode =>
                                existingPromotionCode
                                    .uid !==
                                promotionCode.uid
                        )
                ]
            );

            return promotionCode;
        } catch (error: unknown) {
            const message =
                this.getErrorMessage(
                    error,
                    'The promotion code could not be created.'
                );

            this.errorMessage.set(
                message
            );

            throw new Error(
                message
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    async setPromotionCodeActive(
        promotionCodeUid: string,
        active: boolean
    ): Promise<PromotionCode> {
        this.isLoading.set(true);
        this.errorMessage.set('');

        try {
            const callable =
                httpsCallable<
                    UpdatePromotionCodeInput,
                    UpdatePromotionCodeResult
                >(
                    functions,
                    'updatePromotionCode'
                );

            const result =
                await callable({
                    promotionCodeUid,
                    active
                });

            const updatedPromotionCode =
                result.data
                    .promotionCode;

            this.promotionCodes.update(
                existingPromotionCodes =>
                    existingPromotionCodes.map(
                        promotionCode =>
                            promotionCode.uid ===
                                updatedPromotionCode
                                    .uid
                                ? updatedPromotionCode
                                : promotionCode
                    )
            );

            return updatedPromotionCode;
        } catch (error: unknown) {
            const message =
                this.getErrorMessage(
                    error,
                    'The promotion code could not be updated.'
                );

            this.errorMessage.set(
                message
            );

            throw new Error(
                message
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    clearError(): void {
        this.errorMessage.set('');
    }

    private getErrorMessage(
        error: unknown,
        fallback: string
    ): string {
        if (
            error instanceof Error &&
            error.message
        ) {
            return this.cleanErrorMessage(
                error.message
            );
        }

        if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            typeof error.message ===
                'string'
        ) {
            return this.cleanErrorMessage(
                error.message
            );
        }

        return fallback;
    }

    private cleanErrorMessage(
        message: string
    ): string {
        return message
            .replace(
                /^Firebase:\s*/i,
                ''
            )
            .replace(
                /\s*\(functions\/[^)]+\)\.?$/i,
                ''
            )
            .trim();
    }

    private removeUndefinedValues<
        ValueType
    >(
        value: ValueType
    ): ValueType {
        if (Array.isArray(value)) {
            return value.map(item =>
                this.removeUndefinedValues(
                    item
                )
            ) as ValueType;
        }

        if (
            value !== null &&
            typeof value === 'object'
        ) {
            return Object.fromEntries(
                Object.entries(value)
                    .filter(
                        ([, item]) =>
                            item !== undefined
                    )
                    .map(
                        ([key, item]) => [
                            key,
                            this.removeUndefinedValues(
                                item
                            )
                        ]
                    )
            ) as ValueType;
        }

        return value;
    }
}