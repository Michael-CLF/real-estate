import { record as obj, text as draftText, money as cash, finiteNumber as num, bool as flag, choice as select } from '../draft-term-values';
import { normalizeColoradoTerms } from './colorado-terms-rules';
import { COLORADO_ELECTION_DEFAULTS } from './colorado-contract-elections';
import type { SanitizeDraftTermsInput } from '../state-contract-package';
import type { ColoradoOfferTermsDocument } from './colorado-offer-terms.document';
import { COLORADO_DEADLINE_KEYS } from './colorado-initial-terms';

const str = (v: unknown, n = 4000) => draftText(v, n);

export function sanitizeColoradoDraftTerms(input: SanitizeDraftTermsInput<ColoradoOfferTermsDocument>): ColoradoOfferTermsDocument {
  const r = obj(input.requestedTerms), p = obj(r['purchase']), a = obj(p['assumption']);
  const c = obj(r['conditions']), d = obj(r['deadlines']), i = obj(r['propertyItems']);
  const s = obj(r['disclosures']), delivery = obj(r['delivery']);
  const mode = select(p['financingType'], ['unselected', 'cash', 'new_loan', 'assumption'] as const, 'unselected');
  const incomingDeadlines = Object.fromEntries(COLORADO_DEADLINE_KEYS.map(key => [key, str(d[key], 10)])) as unknown as ColoradoOfferTermsDocument['deadlines'];
  const elections = obj(r['elections']);
  const cleaned = Object.fromEntries(Object.entries(COLORADO_ELECTION_DEFAULTS).map(([key, fallback]) => [key,
    fallback === null ? flag(elections[key]) : typeof fallback === 'number' ? cash(elections[key]) : str(elections[key], 4000) || fallback,
  ])) as unknown as ColoradoOfferTermsDocument['elections'];
  const sanitized: ColoradoOfferTermsDocument = {
    ...input.currentTerms,
    stateCode: 'CO', contractType: input.currentTerms.contractType,
    property: input.currentTerms.property,
    legalDescription: input.currentTerms.legalDescription,
    sellerLoan: input.currentTerms.sellerLoan,
    propertyFacts: input.currentTerms.propertyFacts,
    elections: cleaned,
    propertyItems: {
      included: str(i['included']), excluded: str(i['excluded']), leasedItems: input.currentTerms.propertyItems.leasedItems,
      waterRights: str(i['waterRights']), wellPermit: input.currentTerms.propertyItems.wellPermit, mineralRights: str(i['mineralRights']),
    },
    purchase: {
      purchasePriceInCents: cash(p['purchasePriceInCents']), earnestMoneyInCents: cash(p['earnestMoneyInCents']),
      earnestMoneyHolder: str(p['earnestMoneyHolder'], 200), earnestMoneyForm: str(p['earnestMoneyForm'], 120),
      financingType: mode, newLoanType: mode === 'new_loan' ? select(p['newLoanType'], ['unselected', 'conventional', 'fha', 'va', 'other'] as const, 'unselected') : 'unselected',
      newLoanAmountInCents: mode === 'new_loan' ? cash(p['newLoanAmountInCents']) : 0,
      cashAtClosingInCents: cash(p['cashAtClosingInCents']),
      availableCashConfirmed: flag(p['availableCashConfirmed']),
      sellerConcessionsInCents: cash(p['sellerConcessionsInCents']),
      assumption: {
        maxTransferFeeInCents: mode === 'assumption' ? cash(a['maxTransferFeeInCents']) : 0,
        maxCashIncreaseInCents: mode === 'assumption' ? cash(a['maxCashIncreaseInCents']) : 0,
        maxRatePercent: mode === 'assumption' ? num(a['maxRatePercent']) : 0,
        maxPaymentInCents: mode === 'assumption' ? cash(a['maxPaymentInCents']) : 0,
        maxPaymentPeriod: mode === 'assumption' ? str(a['maxPaymentPeriod'], 30) : '',
        sellerReleaseRequired: mode === 'assumption' ? flag(a['sellerReleaseRequired']) : null,
        releaseEvidenceTiming: mode === 'assumption' && a['sellerReleaseRequired'] === true ? select(a['releaseEvidenceTiming'], ['unselected', 'approval_deadline', 'closing'] as const, 'unselected') : 'unselected',
        releaseCostPayer: mode === 'assumption' && a['sellerReleaseRequired'] === true ? select(a['releaseCostPayer'], ['unselected', 'buyer', 'seller'] as const, 'unselected') : 'unselected',
        maxReleaseCostInCents: mode === 'assumption' && a['sellerReleaseRequired'] === true ? cash(a['maxReleaseCostInCents']) : 0,
      },
    },
    conditions: {
      saleOfBuyerProperty: flag(c['saleOfBuyerProperty']),
      saleOfBuyerPropertyAddress: str(c['saleOfBuyerPropertyAddress'], 300),
      appraisal: flag(c['appraisal']), inspection: flag(c['inspection']),
      newSurvey: select(c['newSurvey'], ['unselected', 'none', 'ilc', 'survey'] as const, 'unselected'),
      surveyPayer: select(c['surveyPayer'], ['unselected', 'buyer', 'seller'] as const, 'unselected'),
      ownerTitlePolicyPayer: select(c['ownerTitlePolicyPayer'], ['unselected', 'buyer', 'seller'] as const, 'unselected'),
      deedType: select(c['deedType'], ['unselected', 'special_warranty', 'general_warranty', 'bargain_sale', 'quitclaim'] as const, 'unselected'),
      closingFeePayer: select(c['closingFeePayer'], ['unselected', 'buyer', 'seller', 'split'] as const, 'unselected'),
      specialAssessmentPayer: select(c['specialAssessmentPayer'], ['unselected', 'buyer', 'seller'] as const, 'unselected'),
      possessionDelayChargeInCents: cash(c['possessionDelayChargeInCents']),
    },
    deadlines: { ...incomingDeadlines, sellerPropertyDisclosure: '', timeOfDay: str(d['timeOfDay'], 5),
      extendHoliday: flag(d['extendHoliday']), possessionTime: str(d['possessionTime'], 5) },
    disclosures: {
      sellerReportsHoa: input.currentTerms.disclosures.sellerReportsHoa,
      sellerPropertyStatus: select(s['sellerPropertyStatus'], ['unselected', 'received', 'pending'] as const, 'unselected'),
      leadPaintStatus: select(s['leadPaintStatus'], ['unselected', 'received', 'pending', 'not_applicable'] as const, 'unselected'),
      leadInspectionChoice: select(s['leadInspectionChoice'], ['unselected', 'ten_days', 'waived', 'other', 'deadline'] as const, 'unselected'),
      leadInspectionDays: Number.isSafeInteger(s['leadInspectionDays']) ? Number(s['leadInspectionDays']) : 0,
      associationStatus: select(s['associationStatus'], ['unselected', 'received', 'pending', 'not_applicable'] as const, 'unselected'),
      waterSourceAcknowledged: flag(s['waterSourceAcknowledged']),
      radonBrochureAcknowledged: flag(s['radonBrochureAcknowledged']),
      radonInformationAcknowledged: flag(s['radonInformationAcknowledged']),
    },
    additionalTerms: str(r['additionalTerms'], 5000),
    delivery: { expiresAt: str(delivery['expiresAt'], 40), timeZone: 'America/Denver',
      electronicDeliveryAuthorized: flag(delivery['electronicDeliveryAuthorized']) },
  };
  if (input.initiatedBy === 'seller') {
    return normalizeColoradoTerms({ ...input.currentTerms,
      purchase: { ...input.currentTerms.purchase,
        purchasePriceInCents: sanitized.purchase.purchasePriceInCents,
        sellerConcessionsInCents: sanitized.purchase.sellerConcessionsInCents },
            delivery: {
        ...input.currentTerms.delivery,
        expiresAt: sanitized.delivery.expiresAt,
        electronicDeliveryAuthorized:
          sanitized.delivery.electronicDeliveryAuthorized,
      },
    });
  }
  return normalizeColoradoTerms(sanitized);
}