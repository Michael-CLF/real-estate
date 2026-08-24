import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  CurrencyPipe,
  DatePipe
} from '@angular/common';

import {
  AdministrationPayment,
  AdministrationPaymentsService,
  AdministrationPaymentStatus,
  AdministrationPaymentSummary
} from '../../data-access/administration-payments.service';

type PaymentStatusFilter =
  | 'all'
  | AdministrationPaymentStatus;

@Component({
  selector:
    'app-administration-payments',

  standalone:
    true,

  imports: [
    CurrencyPipe,
    DatePipe
  ],

  templateUrl:
    './payments.component.html',

  styleUrl:
    './payments.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PaymentsComponent
  implements OnInit {

  private readonly paymentsService =
    inject(
      AdministrationPaymentsService
    );

  protected readonly payments =
    signal<
      AdministrationPayment[]
    >([]);

  protected readonly summary =
    signal<AdministrationPaymentSummary>({
      totalTransactions: 0,
      paidTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      noPaymentRequiredTransactions: 0,
      grossAmount: 0,
      discountAmount: 0,
      collectedAmount: 0
    });

  protected readonly loading =
    signal(true);

  protected readonly error =
    signal<string | null>(null);

  protected readonly searchTerm =
    signal('');

  protected readonly statusFilter =
    signal<PaymentStatusFilter>(
      'all'
    );

  protected readonly filteredPayments =
    computed(() => {
      const search =
        this.searchTerm()
          .trim()
          .toLowerCase();

      const selectedStatus =
        this.statusFilter();

      return this.payments().filter(
        payment => {
          const matchesStatus =
            selectedStatus === 'all' ||
            payment.status ===
              selectedStatus;

          if (!matchesStatus) {
            return false;
          }

          if (!search) {
            return true;
          }

          return [
            payment.propertyAddress,
            payment.listingUid,
            payment.publishedListingUid ??
              '',
            payment.sellerUid,
            payment.stripeCheckoutSessionId,
            payment.stripePaymentIntentId ??
              '',
            payment.breakdown
              .promotionCode ?? ''
          ].some(
            value =>
              value
                .toLowerCase()
                .includes(search)
          );
        }
      );
    });

  ngOnInit(): void {
    void this.loadPayments();
  }

  protected onSearch(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.searchTerm.set(
      input.value
    );
  }

  protected setStatusFilter(
    status: PaymentStatusFilter
  ): void {
    this.statusFilter.set(status);
  }

  protected refresh(): void {
    void this.loadPayments();
  }

  protected formatStatus(
    status:
      AdministrationPaymentStatus
  ): string {
    switch (status) {
      case 'no_payment_required':
        return 'No payment required';

      default:
        return status.replace(
          /_/g,
          ' '
        );
    }
  }

  private async loadPayments():
    Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result =
        await this.paymentsService
          .getPayments();

      this.payments.set(
        result.payments
      );

      this.summary.set(
        result.summary
      );

    } catch (error: unknown) {
      this.error.set(
        error instanceof Error
          ? error.message
          : 'NavStreet payment records could not be loaded.'
      );

    } finally {
      this.loading.set(false);
    }
  }
}