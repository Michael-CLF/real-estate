import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    computed,
    inject,
    signal
} from '@angular/core';

import {
    FormControl,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';

import {
    PromotionCodeService
} from '../../../../core/domains/payments/services/promotion-code.service';

import {
    PROMOTION_PRODUCT_OPTIONS
} from '../../../../core/domains/payments/models/promotion-code.model';

import type {
    CreatePromotionCodeInput,
    PromotionCode,
    PromotionDiscountType,
    PromotionEligibleProduct
} from '../../../../core/domains/payments/models/promotion-code.model';

interface PromotionCodeForm {
    name:
        FormControl<string>;

    code:
        FormControl<string>;

    eligibleProduct:
        FormControl<PromotionEligibleProduct>;

    discountType:
        FormControl<PromotionDiscountType>;

    percentOff:
        FormControl<number>;

    amountOffDollars:
        FormControl<number | null>;

    expiresAt:
        FormControl<string>;

    maxRedemptions:
        FormControl<number | null>;

    firstTimeTransactionOnly:
        FormControl<boolean>;
}

@Component({
    selector:
        'app-promotion-codes',

    standalone:
        true,

    imports: [
        ReactiveFormsModule
    ],

    templateUrl:
        './promotion-codes.component.html',

    styleUrl:
        './promotion-codes.component.scss',

    changeDetection:
        ChangeDetectionStrategy.OnPush
})
export class PromotionCodesComponent
    implements OnInit {

    private readonly promotionCodeService =
        inject(
            PromotionCodeService
        );

    protected readonly productOptions =
        PROMOTION_PRODUCT_OPTIONS;

    protected readonly promotionCodes =
        this.promotionCodeService
            .promotionCodes;

    protected readonly isLoading =
        this.promotionCodeService
            .isLoading;

    protected readonly loadError =
        signal('');

    protected readonly saveError =
        signal('');

    protected readonly successMessage =
        signal('');

    protected readonly isSaving =
        signal(false);

    protected readonly updatingCodeUid =
        signal<string | null>(
            null
        );

    protected readonly activeCodeCount =
        computed(
            () =>
                this.promotionCodes()
                    .filter(
                        promotionCode =>
                            promotionCode
                                .status ===
                            'active'
                    )
                    .length
        );

    protected readonly totalRedemptions =
        computed(
            () =>
                this.promotionCodes()
                    .reduce(
                        (
                            total,
                            promotionCode
                        ) =>
                            total +
                            promotionCode
                                .timesRedeemed,
                        0
                    )
        );

    protected readonly form =
        new FormGroup<PromotionCodeForm>({
            name:
                new FormControl(
                    '',
                    {
                        nonNullable:
                            true,

                        validators: [
                            Validators.required,
                            Validators.maxLength(
                                80
                            )
                        ]
                    }
                ),

            code:
                new FormControl(
                    '',
                    {
                        nonNullable:
                            true,

                        validators: [
                            Validators.required,
                            Validators.minLength(
                                4
                            ),
                            Validators.maxLength(
                                32
                            ),
                            Validators.pattern(
                                /^[A-Za-z0-9]+$/
                            )
                        ]
                    }
                ),

            eligibleProduct:
                new FormControl<PromotionEligibleProduct>(
                    'property_listing',
                    {
                        nonNullable:
                            true,

                        validators: [
                            Validators.required
                        ]
                    }
                ),

            discountType:
                new FormControl<PromotionDiscountType>(
                    'percentage',
                    {
                        nonNullable:
                            true,

                        validators: [
                            Validators.required
                        ]
                    }
                ),

            percentOff:
                new FormControl(
                    100,
                    {
                        nonNullable:
                            true,

                        validators: [
                            Validators.required,
                            Validators.min(1),
                            Validators.max(100)
                        ]
                    }
                ),

            amountOffDollars:
                new FormControl<
                    number |
                    null
                >(
                    null,
                    {
                        validators: [
                            Validators.min(
                                0.01
                            )
                        ]
                    }
                ),

            expiresAt:
                new FormControl(
                    '',
                    {
                        nonNullable:
                            true
                    }
                ),

            maxRedemptions:
                new FormControl<
                    number |
                    null
                >(
                    null,
                    {
                        validators: [
                            Validators.min(1)
                        ]
                    }
                ),

            firstTimeTransactionOnly:
                new FormControl(
                    false,
                    {
                        nonNullable:
                            true
                    }
                )
        });

    async ngOnInit():
        Promise<void> {
        await this.loadPromotionCodes();
    }

    protected async createPromotionCode():
        Promise<void> {
        this.saveError.set('');
        this.successMessage.set('');

        this.normalizeCode();

        if (
            this.form.invalid ||
            !this.hasValidDiscount()
        ) {
            this.form.markAllAsTouched();

            this.saveError.set(
                'Complete the required promotion-code information before continuing.'
            );

            return;
        }

        this.isSaving.set(true);

        try {
            const formValue =
                this.form.getRawValue();

            const input:
                CreatePromotionCodeInput = {
                name:
                    formValue.name
                        .trim(),

                code:
                    formValue.code
                        .trim()
                        .toUpperCase(),

                eligibleProduct:
                    formValue
                        .eligibleProduct,

                discountType:
                    formValue
                        .discountType,

                firstTimeTransactionOnly:
                    formValue
                        .firstTimeTransactionOnly,

                expiresAt:
                    this.toIsoDate(
                        formValue.expiresAt
                    ),

                maxRedemptions:
                    formValue
                        .maxRedemptions
            };

            if (
                formValue.discountType ===
                    'percentage'
            ) {
                input.percentOff =
                    formValue.percentOff;
            } else {
                input.amountOffCents =
                    Math.round(
                        (
                            formValue
                                .amountOffDollars ??
                            0
                        ) *
                        100
                    );

                input.currency =
                    'usd';
            }

            const promotionCode =
                await this
                    .promotionCodeService
                    .createPromotionCode(
                        input
                    );

            this.successMessage.set(
                `Promotion code ${promotionCode.code} was created successfully.`
            );

            this.resetForm();
        } catch (error: unknown) {
            this.saveError.set(
                this.getErrorMessage(
                    error,
                    'The promotion code could not be created.'
                )
            );
        } finally {
            this.isSaving.set(false);
        }
    }

    protected async togglePromotionCode(
        promotionCode:
            PromotionCode
    ): Promise<void> {
        if (
            this.updatingCodeUid()
        ) {
            return;
        }

        this.saveError.set('');
        this.successMessage.set('');

        this.updatingCodeUid.set(
            promotionCode.uid
        );

        try {
            const updatedPromotionCode =
                await this
                    .promotionCodeService
                    .setPromotionCodeActive(
                        promotionCode.uid,
                        !promotionCode.active
                    );

            this.successMessage.set(
                updatedPromotionCode.active
                    ? `Promotion code ${updatedPromotionCode.code} is now active.`
                    : `Promotion code ${updatedPromotionCode.code} has been deactivated.`
            );
        } catch (error: unknown) {
            this.saveError.set(
                this.getErrorMessage(
                    error,
                    'The promotion code could not be updated.'
                )
            );
        } finally {
            this.updatingCodeUid.set(
                null
            );
        }
    }

    protected reloadPromotionCodes():
        void {
        void this.loadPromotionCodes();
    }

    protected normalizeCode():
        void {
        const normalizedCode =
            this.form.controls
                .code.value
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ''
                );

        this.form.controls
            .code
            .setValue(
                normalizedCode
            );
    }

    protected formatDiscount(
        promotionCode:
            PromotionCode
    ): string {
        if (
            promotionCode.discountType ===
                'percentage'
        ) {
            return (
                `${promotionCode.percentOff ?? 0}%`
            );
        }

        return new Intl.NumberFormat(
            'en-US',
            {
                style:
                    'currency',

                currency:
                    (
                        promotionCode.currency ??
                        'usd'
                    ).toUpperCase()
            }
        ).format(
            (
                promotionCode
                    .amountOffCents ??
                0
            ) /
            100
        );
    }

    protected getProductLabel(
        eligibleProduct:
            PromotionEligibleProduct
    ): string {
        return (
            this.productOptions.find(
                product =>
                    product.value ===
                    eligibleProduct
            )
                ?.label ??
            'NavStreet product'
        );
    }

    protected formatDate(
        value:
            string |
            null
    ): string {
        if (!value) {
            return 'No expiration';
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return 'No expiration';
        }

        return new Intl.DateTimeFormat(
            'en-US',
            {
                dateStyle:
                    'medium',

                timeStyle:
                    'short'
            }
        ).format(date);
    }

    protected isExpired(
        promotionCode:
            PromotionCode
    ): boolean {
        return (
            promotionCode.status ===
            'expired'
        );
    }

    protected hasControlError(
        controlName:
            keyof PromotionCodeForm,
        errorName:
            string
    ): boolean {
        const control =
            this.form.controls[
                controlName
            ];

        return (
            control.touched &&
            control.hasError(
                errorName
            )
        );
    }

    private async loadPromotionCodes():
        Promise<void> {
        this.loadError.set('');

        try {
            await this
                .promotionCodeService
                .loadPromotionCodes(
                    true
                );
        } catch (error: unknown) {
            this.loadError.set(
                this.getErrorMessage(
                    error,
                    'Promotion codes could not be loaded.'
                )
            );
        }
    }

    private hasValidDiscount():
        boolean {
        const formValue =
            this.form.getRawValue();

        if (
            formValue.discountType ===
                'percentage'
        ) {
            return (
                formValue.percentOff >
                    0 &&
                formValue.percentOff <=
                    100
            );
        }

        return (
            typeof formValue
                .amountOffDollars ===
                'number' &&
            formValue
                .amountOffDollars >
                0
        );
    }

    private toIsoDate(
        value: string
    ): string | null {
        if (!value.trim()) {
            return null;
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return null;
        }

        return date.toISOString();
    }

    private resetForm():
        void {
        this.form.reset({
            name:
                '',

            code:
                '',

            eligibleProduct:
                'property_listing',

            discountType:
                'percentage',

            percentOff:
                100,

            amountOffDollars:
                null,

            expiresAt:
                '',

            maxRedemptions:
                null,

            firstTimeTransactionOnly:
                false
        });

        this.form.markAsPristine();
        this.form.markAsUntouched();
    }

    private getErrorMessage(
        error: unknown,
        fallback: string
    ): string {
        if (
            error instanceof Error &&
            error.message
        ) {
            return error.message;
        }

        return fallback;
    }
}