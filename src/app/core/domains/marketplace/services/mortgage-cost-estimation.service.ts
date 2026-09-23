import {
  Injectable
} from '@angular/core';

interface MortgageCostAssumptions {
  propertyTaxRate: number;
  homeownersInsuranceRate: number;
}

const STATE_MORTGAGE_COST_ASSUMPTIONS:
  Readonly<
    Record<
      string,
      MortgageCostAssumptions
    >
  > = {
    'north-carolina': {
      /*
       * Estimated annual property taxes as a
       * percentage of the property value.
       */
      propertyTaxRate: 0.0075,

      /*
       * Estimated annual homeowners insurance
       * as a percentage of the property value.
       */
      homeownersInsuranceRate: 0.009
    },

    'texas': {
      /*
       * Texas has no state property tax. Local taxing
       * units set the rates. Use a practical Texas buyer
       * payment estimate that better reflects the combined
       * local tax burden shown for the listing market.
       */
      propertyTaxRate: 0.01881,

      /*
       * Estimated basic Texas homeowners insurance as a
       * percentage of the home's purchase price. Buyers can
       * replace this estimate with an actual insurance quote.
       */
      homeownersInsuranceRate: 0.0092
    }
  };

@Injectable({
  providedIn: 'root'
})
export class MortgageCostEstimationService {

  estimateAnnualPropertyTax(
    homePrice: number,
    stateSlug: string
  ): number {
    const assumptions =
      this.getStateAssumptions(
        stateSlug
      );

    if (!assumptions) {
      return 0;
    }

    return this.roundCurrency(
      this.nonNegative(homePrice) *
      assumptions.propertyTaxRate
    );
  }

  estimateAnnualHomeownersInsurance(
    homePrice: number,
    stateSlug: string
  ): number {
    const assumptions =
      this.getStateAssumptions(
        stateSlug
      );

    if (!assumptions) {
      return 0;
    }

    return this.roundCurrency(
      this.nonNegative(homePrice) *
      assumptions
        .homeownersInsuranceRate
    );
  }

  private getStateAssumptions(
    stateSlug: string
  ): MortgageCostAssumptions | undefined {
    const normalizedStateSlug =
      stateSlug
        .trim()
        .toLowerCase();

    return STATE_MORTGAGE_COST_ASSUMPTIONS[
      normalizedStateSlug
    ];
  }

  private nonNegative(
    value: number
  ): number {
    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      return 0;
    }

    return value;
  }

  private roundCurrency(
    value: number
  ): number {
    return (
      Math.round(
        value * 100
      ) / 100
    );
  }
}
