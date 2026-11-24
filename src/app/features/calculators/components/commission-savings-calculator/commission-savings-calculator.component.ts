
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  PageSeoService
} from '../../../../core/seo/page-seo.service';

@Component({
  selector: 'app-commission-savings-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './commission-savings-calculator.component.html',
  styleUrl: './commission-savings-calculator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionSavingsCalculatorComponent implements OnInit {

  private readonly seo = inject(PageSeoService);

  readonly salePrice = signal(400000);
  readonly listingCommission = signal(3);
  readonly buyerCommission = signal(2.5);
  readonly fsboBuyerCommission = signal(2.5);
  readonly additionalExpenses = signal(0);

  readonly navstreetFee = 49;

  readonly listingAgentCost = computed(() =>
    this.salePrice() * this.listingCommission() / 100
  );

  readonly buyerAgentCost = computed(() =>
    this.salePrice() * this.buyerCommission() / 100
  );

  readonly traditionalCost = computed(() =>
    this.listingAgentCost() + this.buyerAgentCost()
  );

  readonly fsboBuyerAgentCost = computed(() =>
    this.salePrice() * this.fsboBuyerCommission() / 100
  );

  readonly fsboCost = computed(() =>
    this.navstreetFee +
    this.fsboBuyerAgentCost() +
    this.additionalExpenses()
  );

  readonly estimatedSavings = computed(() =>
    this.traditionalCost() - this.fsboCost()
  );

  readonly savingsPercentage = computed(() => {
    const total = this.traditionalCost();

    return total > 0
      ? this.estimatedSavings() / total * 100
      : 0;
  });

  readonly comparisonMaximum = computed(() =>
    Math.max(
      this.traditionalCost(),
      this.fsboCost(),
      1
    )
  );

  readonly traditionalBarWidth = computed(() =>
    this.traditionalCost() /
    this.comparisonMaximum() * 100
  );

  readonly fsboBarWidth = computed(() =>
    this.fsboCost() /
    this.comparisonMaximum() * 100
  );

  ngOnInit(): void {
    this.seo.setPage({
      title: 'Real Estate Commission Savings Calculator | NavStreet',

      description: 'Calculate how much you could save selling your home without a listing agent. Compare real estate commissions with NavStreet’s $49 FSBO listing fee.',

      canonicalUrl: 'https://navstreet.com/calculators/commission-savings/',

      imageAlt: 'NavStreet Real Estate Commission Savings Calculator'
    });
  }

  private normalize(
    value: unknown,
    maximum: number
  ): number {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.min(
      maximum,
      Math.max(0, numeric)
    );
  }

  setSalePrice(value: unknown): void {
    this.salePrice.set(
      this.normalize(value, 100000000)
    );
  }

  setListingCommission(value: unknown): void {
    this.listingCommission.set(
      this.normalize(value, 100)
    );
  }

  setBuyerCommission(value: unknown): void {
    this.buyerCommission.set(
      this.normalize(value, 100)
    );
  }

  setFsboBuyerCommission(value: unknown): void {
    this.fsboBuyerCommission.set(
      this.normalize(value, 100)
    );
  }

  setAdditionalExpenses(value: unknown): void {
    this.additionalExpenses.set(
      this.normalize(value, 100000000)
    );
  }

  resetCalculator(): void {
    this.salePrice.set(400000);
    this.listingCommission.set(3);
    this.buyerCommission.set(2.5);
    this.fsboBuyerCommission.set(2.5);
    this.additionalExpenses.set(0);
  }
}
