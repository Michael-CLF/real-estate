import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  OfferSummary
} from '../../../../core/domains/offers/models/offer.model';

import {
  OFFER_STATUS_LABELS
} from '../../../../core/domains/offers/models/offer-status.model';

import {
  OfferService
} from '../../../../core/domains/offers/services/offer.service';


interface DashboardOfferItem {
  offer: OfferSummary;

  perspective:
    | 'buyer'
    | 'seller';

  actionRequired: boolean;
}


@Component({
  selector: 'app-dashboard-offers',

  standalone: true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './dashboard-offers.component.html',

  styleUrl:
    './dashboard-offers.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class DashboardOffersComponent
  implements OnInit {

  private readonly offerService =
    inject(OfferService);

  private readonly buyerOffers =
    signal<OfferSummary[]>([]);

  private readonly sellerOffers =
    signal<OfferSummary[]>([]);

  protected readonly offerItems =
    signal<DashboardOfferItem[]>([]);

  protected readonly offersLoading =
    signal(true);

  protected readonly offersError =
    signal('');

  protected readonly receivedOfferCount =
    computed(
      () =>
        this.sellerOffers().length
    );

  protected readonly submittedOfferCount =
    computed(
      () =>
        this.buyerOffers().length
    );

  protected readonly underNegotiationCount =
    computed(
      () =>
        this.offerItems().filter(
          item =>
            item.offer.status === 'submitted' ||
            item.offer.status === 'viewed' ||
            item.offer.status === 'countered'
        ).length
    );


  async ngOnInit(): Promise<void> {
    await this.loadOffers();
  }


  protected getOfferVersionLabel(
    offer: OfferSummary
  ): string {
    return (
      `${offer.referenceNumber}-` +
      `${offer.currentVersionNumber}`
    );
  }


  protected getOfferTypeLabel(
    offer: OfferSummary
  ): string {
    return offer.currentVersionNumber === 1
      ? 'Offer'
      : 'Counteroffer';
  }


  protected getOfferStatusLabel(
    item: DashboardOfferItem
  ): string {
    const offer = item.offer;
    const versionStatus =
      offer.currentVersionStatus;

    if (versionStatus === 'draft') {
      return 'Draft';
    }

    if (
      versionStatus ===
        'awaiting_signatures'
    ) {
      return 'Draft — ready to sign';
    }

    if (
      versionStatus ===
        'partially_signed'
    ) {
      return 'Draft — signing in progress';
    }

    if (
      offer.status ===
        'closed_due_to_contract'
    ) {
      return item.perspective === 'buyer'
        ? 'Not accepted — seller accepted another offer'
        : 'Closed — another offer accepted';
    }

    if (
      offer.status === 'countered' &&
      offer.currentVersionInitiatedBy ===
        'seller'
    ) {
      return item.perspective === 'seller'
        ? 'Counteroffer sent'
        : 'Counteroffer received';
    }

    return OFFER_STATUS_LABELS[
      offer.status
    ];
  }


  protected getOfferPrice(
    offer: OfferSummary
  ): string {
    return new Intl.NumberFormat(
      'en-US',
      {
        style:
          'currency',

        currency:
          'USD',

        maximumFractionDigits:
          0
      }
    ).format(
      offer.purchasePriceInCents /
      100
    );
  }


  private async loadOffers():
    Promise<void> {
    this.offersLoading.set(true);
    this.offersError.set('');

    const [
      buyerResult,
      sellerResult
    ] = await Promise.allSettled([
      this.offerService.getMyOffers({
        role:
          'buyer',

        limit:
          100
      }),

      this.offerService.getMyOffers({
        role:
          'seller',

        limit:
          100
      })
    ]);

    const buyerOffers =
      buyerResult.status === 'fulfilled'
        ? buyerResult.value
        : [];

    const sellerOffers =
      sellerResult.status === 'fulfilled'
        ? sellerResult.value
        : [];

    if (buyerResult.status === 'rejected') {
      console.error(
        'Unable to load submitted offers:',
        buyerResult.reason
      );
    }

    if (sellerResult.status === 'rejected') {
      console.error(
        'Unable to load received offers:',
        sellerResult.reason
      );
    }

    this.buyerOffers.set(
      buyerOffers
    );

    this.sellerOffers.set(
      sellerOffers
    );

    const itemsByOfferUid =
      new Map<
        string,
        DashboardOfferItem
      >();

    for (const offer of buyerOffers) {
      itemsByOfferUid.set(
        offer.Uid,
        this.createOfferItem(
          offer,
          'buyer'
        )
      );
    }

    for (const offer of sellerOffers) {
      if (!itemsByOfferUid.has(offer.Uid)) {
        itemsByOfferUid.set(
          offer.Uid,
          this.createOfferItem(
            offer,
            'seller'
          )
        );
      }
    }

    this.offerItems.set(
      Array.from(
        itemsByOfferUid.values()
      ).sort(
        (left, right) =>
          right.offer.lastActivityAt
            .getTime() -
          left.offer.lastActivityAt
            .getTime()
      )
    );

    if (
      buyerResult.status === 'rejected' &&
      sellerResult.status === 'rejected'
    ) {
      this.offersError.set(
        'Your offers could not be loaded. Please refresh the page and try again.'
      );
    } else if (
      buyerResult.status === 'rejected' ||
      sellerResult.status === 'rejected'
    ) {
      this.offersError.set(
        'Some offer activity could not be loaded. The available offers are shown below.'
      );
    }

    this.offersLoading.set(false);
  }


  private createOfferItem(
    offer: OfferSummary,
    perspective:
      | 'buyer'
      | 'seller'
  ): DashboardOfferItem {
    const actionableVersion =
      offer.currentVersionStatus ===
        'delivered' ||
      offer.currentVersionStatus ===
        'signed';

    const cameFromOtherParty =
      (
        perspective === 'buyer' &&
        offer.currentVersionInitiatedBy ===
          'seller'
      ) ||
      (
        perspective === 'seller' &&
        offer.currentVersionInitiatedBy ===
          'buyer'
      );

    return {
      offer,
      perspective,

      actionRequired:
        actionableVersion &&
        cameFromOtherParty
    };
  }
}
