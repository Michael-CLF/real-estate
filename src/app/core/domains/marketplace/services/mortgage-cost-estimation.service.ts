import {
  Injectable,
} from '@angular/core';

export interface MortgageCostAssumptions {
  readonly propertyTaxRate: number;

  readonly homeownersInsuranceRate:
    number;
}

/*
 * Statewide fallback estimates.
 * Actual listing amounts take precedence
 * when available.
 */
const PROFILES: Readonly<
  Record<
    string,
    MortgageCostAssumptions
  >
> = {
  AL: {
    propertyTaxRate: 0.0041,
    homeownersInsuranceRate: 0.011,
  },
  AK: {
    propertyTaxRate: 0.0104,
    homeownersInsuranceRate: 0.0045,
  },
  AZ: {
    propertyTaxRate: 0.0062,
    homeownersInsuranceRate: 0.006,
  },
  AR: {
    propertyTaxRate: 0.0062,
    homeownersInsuranceRate: 0.01,
  },
  CA: {
    propertyTaxRate: 0.0074,
    homeownersInsuranceRate: 0.0045,
  },
  CO: {
    propertyTaxRate: 0.0049,
    homeownersInsuranceRate: 0.007,
  },
  CT: {
    propertyTaxRate: 0.0215,
    homeownersInsuranceRate: 0.0055,
  },
  DE: {
    propertyTaxRate: 0.0057,
    homeownersInsuranceRate: 0.0045,
  },
  FL: {
    propertyTaxRate: 0.0089,
    homeownersInsuranceRate: 0.0175,
  },
  GA: {
    propertyTaxRate: 0.0092,
    homeownersInsuranceRate: 0.009,
  },
  HI: {
    propertyTaxRate: 0.0032,
    homeownersInsuranceRate: 0.0035,
  },
  ID: {
    propertyTaxRate: 0.0063,
    homeownersInsuranceRate: 0.0045,
  },
  IL: {
    propertyTaxRate: 0.0223,
    homeownersInsuranceRate: 0.0075,
  },
  IN: {
    propertyTaxRate: 0.0083,
    homeownersInsuranceRate: 0.007,
  },
  IA: {
    propertyTaxRate: 0.0157,
    homeownersInsuranceRate: 0.0075,
  },
  KS: {
    propertyTaxRate: 0.0141,
    homeownersInsuranceRate: 0.011,
  },
  KY: {
    propertyTaxRate: 0.0086,
    homeownersInsuranceRate: 0.008,
  },
  LA: {
    propertyTaxRate: 0.0056,
    homeownersInsuranceRate: 0.018,
  },
  ME: {
    propertyTaxRate: 0.0128,
    homeownersInsuranceRate: 0.005,
  },
  MD: {
    propertyTaxRate: 0.0109,
    homeownersInsuranceRate: 0.0055,
  },
  MA: {
    propertyTaxRate: 0.0114,
    homeownersInsuranceRate: 0.0045,
  },
  MI: {
    propertyTaxRate: 0.0138,
    homeownersInsuranceRate: 0.0075,
  },
  MN: {
    propertyTaxRate: 0.0111,
    homeownersInsuranceRate: 0.007,
  },
  MS: {
    propertyTaxRate: 0.0079,
    homeownersInsuranceRate: 0.012,
  },
  MO: {
    propertyTaxRate: 0.0098,
    homeownersInsuranceRate: 0.009,
  },
  MT: {
    propertyTaxRate: 0.0083,
    homeownersInsuranceRate: 0.006,
  },
  NE: {
    propertyTaxRate: 0.0167,
    homeownersInsuranceRate: 0.01,
  },
  NV: {
    propertyTaxRate: 0.0059,
    homeownersInsuranceRate: 0.0045,
  },
  NH: {
    propertyTaxRate: 0.0218,
    homeownersInsuranceRate: 0.0045,
  },
  NJ: {
    propertyTaxRate: 0.0247,
    homeownersInsuranceRate: 0.0055,
  },
  NM: {
    propertyTaxRate: 0.0067,
    homeownersInsuranceRate: 0.007,
  },
  NY: {
    propertyTaxRate: 0.0162,
    homeownersInsuranceRate: 0.0055,
  },
  NC: {
    propertyTaxRate: 0.0075,
    homeownersInsuranceRate: 0.009,
  },
  ND: {
    propertyTaxRate: 0.0098,
    homeownersInsuranceRate: 0.007,
  },
  OH: {
    propertyTaxRate: 0.0159,
    homeownersInsuranceRate: 0.007,
  },
  OK: {
    propertyTaxRate: 0.009,
    homeownersInsuranceRate: 0.011,
  },
  OR: {
    propertyTaxRate: 0.0093,
    homeownersInsuranceRate: 0.0045,
  },
  PA: {
    propertyTaxRate: 0.0153,
    homeownersInsuranceRate: 0.006,
  },
  RI: {
    propertyTaxRate: 0.0153,
    homeownersInsuranceRate: 0.0055,
  },
  SC: {
    propertyTaxRate: 0.0057,
    homeownersInsuranceRate: 0.01,
  },
  SD: {
    propertyTaxRate: 0.0124,
    homeownersInsuranceRate: 0.009,
  },
  TN: {
    propertyTaxRate: 0.0067,
    homeownersInsuranceRate: 0.009,
  },
  TX: {
    propertyTaxRate: 0.01881,
    homeownersInsuranceRate: 0.0092,
  },
  UT: {
    propertyTaxRate: 0.0058,
    homeownersInsuranceRate: 0.0045,
  },
  VT: {
    propertyTaxRate: 0.019,
    homeownersInsuranceRate: 0.005,
  },
  VA: {
    propertyTaxRate: 0.0082,
    homeownersInsuranceRate: 0.0055,
  },
  WA: {
    propertyTaxRate: 0.0094,
    homeownersInsuranceRate: 0.0045,
  },
  WV: {
    propertyTaxRate: 0.0058,
    homeownersInsuranceRate: 0.0065,
  },
  WI: {
    propertyTaxRate: 0.0161,
    homeownersInsuranceRate: 0.006,
  },
  WY: {
    propertyTaxRate: 0.0056,
    homeownersInsuranceRate: 0.006,
  },
  DC: {
    propertyTaxRate: 0.0057,
    homeownersInsuranceRate: 0.0045,
  },
};

const STATE_CODES: Readonly<
  Record<string, string>
> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new-hampshire': 'NH',
  'new-jersey': 'NJ',
  'new-mexico': 'NM',
  'new-york': 'NY',
  'north-carolina': 'NC',
  'north-dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode-island': 'RI',
  'south-carolina': 'SC',
  'south-dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west-virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district-of-columbia': 'DC',
};

@Injectable({
  providedIn: 'root',
})
export class MortgageCostEstimationService {
  estimateAnnualPropertyTax(
    homePrice: number,
    state: string,
    actualAnnualAmount?: number,
  ): number {
    return this.actualOrEstimate(
      actualAnnualAmount,
      homePrice,
      state,
      profile =>
        profile.propertyTaxRate,
    );
  }

  estimateAnnualHomeownersInsurance(
    homePrice: number,
    state: string,
    actualAnnualAmount?: number,
  ): number {
    return this.actualOrEstimate(
      actualAnnualAmount,
      homePrice,
      state,
      profile =>
        profile.homeownersInsuranceRate,
    );
  }

  getStateAssumptions(
    state: string,
  ): MortgageCostAssumptions {
    const normalizedState =
      state
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');

    const stateCode =
      normalizedState.length === 2
        ? normalizedState.toUpperCase()
        : STATE_CODES[normalizedState];

    const profile =
      stateCode
        ? PROFILES[stateCode]
        : undefined;

    if (!profile) {
      throw new Error(
        `Mortgage cost estimates are not configured for ${
          state || 'this state'
        }.`,
      );
    }

    return profile;
  }

  private actualOrEstimate(
    actualAnnualAmount: number | undefined,
    homePrice: number,
    state: string,
    selectRate: (
      profile:
        MortgageCostAssumptions,
    ) => number,
  ): number {
    const hasActualAmount =
      actualAnnualAmount !== undefined &&
      Number.isFinite(
        actualAnnualAmount,
      );

    const amount =
      hasActualAmount
        ? Math.max(
            actualAnnualAmount,
            0,
          )
        : Math.max(homePrice, 0) *
          selectRate(
            this.getStateAssumptions(
              state,
            ),
          );

    return (
      Math.round(amount * 100) /
      100
    );
  }
}