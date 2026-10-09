import type { OfferTerms } from '../../../../../core/domains/offers/models/offer-terms.model';

export interface NorthCarolinaRawOfferForm {
  readonly additionalTerms: {
    readonly documentUid: unknown;
    readonly hasAdditionalTerms: unknown;
    readonly preparedBy: unknown;
  };
  readonly concessions: {
    readonly concessionType: unknown;
    readonly homeWarrantyAmount: unknown;
    readonly homeWarrantyRequested: unknown;
    readonly sellerConcessionAmount: unknown;
    readonly sellerConcessionPercentage: unknown;
  };
  readonly depositsDueDiligence: {
    readonly depositAmount: unknown;
    readonly depositDeliveryDays: unknown;
    readonly dueDiligenceDaysAfterEffectiveDate: unknown;
    readonly dueDiligenceDeadlineType: unknown;
    readonly dueDiligenceEndDate: unknown;
    readonly escrowAgentName: unknown;
  };
  readonly disclosuresAddenda: {
    readonly mineralOilGasRightsAcknowledged: unknown;
    readonly mineralOilGasRightsDocumentUid: unknown;
    readonly mineralOilGasRightsDocumentVersionId: unknown;
    readonly mineralOilGasRightsExemptionReason: unknown;
    readonly mineralOilGasRightsStatus: unknown;
    readonly residentialPropertyAcknowledged: unknown;
    readonly residentialPropertyDocumentUid: unknown;
    readonly residentialPropertyDocumentVersionId: unknown;
    readonly residentialPropertyExemptionReason: unknown;
    readonly residentialPropertyStatus: unknown;
  };
  readonly offerExpiration: {
    readonly expirationDate: unknown;
    readonly expirationTime: unknown;
  };
  readonly offerReview: {
    readonly electronicRecordsConsent: unknown;
  };
  readonly priceFinancing: {
    readonly financingMethod: unknown;
    readonly otherPropertyDescription: unknown;
    readonly otherPropertyWillFundPurchase: unknown;
    readonly purchasePrice: unknown;
  };
  readonly propertyInclusions: {
    readonly excludedItemsDescription: unknown;
    readonly includedItemsDescription: unknown;
    readonly leasedItemsDescription: unknown;
    readonly manufacturedHomeIncluded: unknown;
    readonly separatePropertyDescription: unknown;
    readonly separatePropertyIncluded: unknown;
  };
  readonly settlementPossession: {
    readonly possessionAgreementDocumentUid: unknown;
    readonly possessionTiming: unknown;
    readonly settlementDate: unknown;
  };
}

export function createNorthCarolinaOfferTerms(form: NorthCarolinaRawOfferForm, existingTerms: OfferTerms): OfferTerms {
    const expiration = createExpirationIso(
      form.offerExpiration.expirationDate,
      form.offerExpiration.expirationTime,
    );

    return {
      stateCode: 'NC',

      property: existingTerms.property,

      propertyTerms: {
        manufacturedHomeIncluded:
          form.propertyInclusions
            .manufacturedHomeIncluded === true,
        separatePropertyIncluded:
          form.propertyInclusions
            .separatePropertyIncluded === true,
        separatePropertyDescription: optionalText(
          form.propertyInclusions
            .separatePropertyDescription,
        ),
        includedItemsDescription: optionalText(
          form.propertyInclusions
            .includedItemsDescription,
        ),
        excludedItemsDescription: optionalText(
          form.propertyInclusions
            .excludedItemsDescription,
        ),
        leasedItemsDescription: optionalText(
          form.propertyInclusions
            .leasedItemsDescription,
        ),
      },

      purchase: {
        purchasePriceInCents: toCents(
          form.priceFinancing.purchasePrice,
        ),
        financingType: (
          form.priceFinancing.financingMethod ||
          'unselected'
        ) as OfferTerms['purchase']['financingType'],
        otherPropertyWillFundPurchase:
          form.priceFinancing
            .otherPropertyWillFundPurchase === true,
        otherPropertyDescription: optionalText(
          form.priceFinancing
            .otherPropertyDescription,
        ),
      },

      deposits: {
        depositInCents: toCents(
          form.depositsDueDiligence.depositAmount,
        ),
        depositDeliveryDays: Number(
          form.depositsDueDiligence
            .depositDeliveryDays,
        ),
        escrowAgentName: String(
          form.depositsDueDiligence
            .escrowAgentName ?? '',
        ).trim(),
        dueDiligenceDeadlineType: (
          form.depositsDueDiligence
            .dueDiligenceDeadlineType ||
          'unselected'
        ) as OfferTerms[
          'deposits'
        ]['dueDiligenceDeadlineType'],
        dueDiligenceEndDate: optionalText(
          form.depositsDueDiligence
            .dueDiligenceEndDate,
        ),
        dueDiligenceDaysAfterEffectiveDate:
          optionalInteger(
            form.depositsDueDiligence
              .dueDiligenceDaysAfterEffectiveDate,
          ),
        dueDiligenceEndTime: '17:00',
      },

      concessions: {
        concessionType: (
          form.concessions.concessionType ||
          'none'
        ) as OfferTerms[
          'concessions'
        ]['concessionType'],
        sellerConcessionInCents: optionalCents(
          form.concessions
            .sellerConcessionAmount,
        ),
        sellerConcessionPercentage: optionalNumber(
          form.concessions
            .sellerConcessionPercentage,
        ),
        homeWarrantyRequested:
          form.concessions
            .homeWarrantyRequested === true,
        homeWarrantyInCents: optionalCents(
          form.concessions.homeWarrantyAmount,
        ),
      },

      settlement: {
        settlementDate: String(
          form.settlementPossession
            .settlementDate ?? '',
        ),
        possessionTiming: (
          form.settlementPossession
            .possessionTiming ||
          'at_closing'
        ) as OfferTerms[
          'settlement'
        ]['possessionTiming'],
        possessionAgreementDocumentUid:
          optionalText(
            form.settlementPossession
              .possessionAgreementDocumentUid,
          ),
      },

      buyerDisclosures: {
        residentialProperty: {
          status: (
            form.disclosuresAddenda
              .residentialPropertyStatus ||
            'unselected'
          ) as OfferTerms[
            'buyerDisclosures'
          ]['residentialProperty']['status'],
          documentUid: optionalText(
            form.disclosuresAddenda
              .residentialPropertyDocumentUid,
          ),
          documentVersionId: optionalText(
            form.disclosuresAddenda
              .residentialPropertyDocumentVersionId,
          ),
          exemptionReason: optionalText(
            form.disclosuresAddenda
              .residentialPropertyExemptionReason,
          ),
          acknowledged:
            form.disclosuresAddenda
              .residentialPropertyAcknowledged === true,
        },

        mineralOilGasRights: {
          status: (
            form.disclosuresAddenda
              .mineralOilGasRightsStatus ||
            'unselected'
          ) as OfferTerms[
            'buyerDisclosures'
          ]['mineralOilGasRights']['status'],
          documentUid: optionalText(
            form.disclosuresAddenda
              .mineralOilGasRightsDocumentUid,
          ),
          documentVersionId: optionalText(
            form.disclosuresAddenda
              .mineralOilGasRightsDocumentVersionId,
          ),
          exemptionReason: optionalText(
            form.disclosuresAddenda
              .mineralOilGasRightsExemptionReason,
          ),
          acknowledged:
            form.disclosuresAddenda
              .mineralOilGasRightsAcknowledged === true,
        },
      },

      sellerStatements:
        existingTerms.sellerStatements,

      addenda: existingTerms.addenda,

      additionalTermsExhibit: {
        included:
          form.additionalTerms
            .hasAdditionalTerms === true,
        preparedBy:
          form.additionalTerms
            .hasAdditionalTerms === true
            ? (
                form.additionalTerms.preparedBy ||
                undefined
              ) as OfferTerms[
                'additionalTermsExhibit'
              ]['preparedBy']
            : undefined,
        documentUid:
          form.additionalTerms
            .hasAdditionalTerms === true
            ? optionalText(
                form.additionalTerms.documentUid,
              )
            : undefined,
      },

      delivery: {
        expiresAt: expiration,
        timeZone: 'America/New_York',
        buyerDeliveryEmail:
          existingTerms.delivery
            .buyerDeliveryEmail,
        sellerDeliveryEmail:
          existingTerms.delivery
            .sellerDeliveryEmail,
        electronicDeliveryAuthorized:
          form.offerReview
            .electronicRecordsConsent === true,
      },
    };
}

export function createExpirationIso(
  expirationDate: unknown,
  expirationTime: unknown,
): string {
  if (
    !expirationDate ||
    !expirationTime
  ) {
    return '';
  }

  const expiration = new Date(
    String(expirationDate) +
    'T' +
    String(expirationTime) +
    ':00',
  );

  return Number.isNaN(
    expiration.getTime(),
  )
    ? ''
    : expiration.toISOString();
}

export function toCents(
  value: unknown,
): number {
  const amount = Number(
    value ?? 0,
  );

  return Number.isFinite(amount)
    ? Math.round(amount * 100)
    : 0;
}

export function optionalCents(
  value: unknown,
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  return toCents(Number(value));
}

export function optionalNumber(
  value: unknown,
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

export function optionalInteger(
  value: unknown,
): number | undefined {
  const parsed = optionalNumber(value);

  return (
    typeof parsed === 'number' &&
    Number.isInteger(parsed)
  )
    ? parsed
    : undefined;
}

export function optionalText(
  value: unknown,
): string | undefined {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : '';

  return normalized.length > 0
    ? normalized
    : undefined;
}
