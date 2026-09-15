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
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  OfferDocument
} from '../../../core/domains/offers/models/offer-document.model';

import {
  OFFER_STATUS_LABELS,
  OFFER_VERSION_STATUS_LABELS
} from '../../../core/domains/offers/models/offer-status.model';

import {
  Offer
} from '../../../core/domains/offers/models/offer.model';

import {
  OfferVersion,
  OfferVersionPartySnapshot
} from '../../../core/domains/offers/models/offer-version.model';

import {
  OfferDocumentService
} from '../../../core/domains/offers/services/offer-document.service';

import {
  OfferParticipantAccess,
  OfferService
} from '../../../core/domains/offers/services/offer.service';


@Component({
  selector: 'app-offer-details',
  standalone: true,

  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule
  ],

  templateUrl:
    './offer-details.component.html',

  styleUrl:
    './offer-details.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class OfferDetailsComponent
implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly offerService =
    inject(OfferService);

  private readonly offerDocumentService =
    inject(OfferDocumentService);

  readonly loading =
    signal(true);

  readonly processing =
    signal(false);

  readonly openingDocument =
    signal(false);

  readonly errorMessage =
    signal('');

  readonly successMessage =
    signal('');

  readonly signingPanelOpen =
    signal(false);

  readonly declinePanelOpen =
    signal(false);

  readonly offer =
    signal<Offer | null>(null);

  readonly currentVersion =
    signal<OfferVersion | null>(null);

  readonly versions =
    signal<OfferVersion[]>([]);

  readonly agreementDocument =
    signal<OfferDocument | null>(null);

  readonly access =
    computed<OfferParticipantAccess | null>(
      () => {
        const offer =
          this.offer();

        const version =
          this.currentVersion();

        if (!offer || !version) {
          return null;
        }

        return this.offerService
          .getParticipantAccess(
            offer,
            version
          );
      }
    );

  readonly currentUserParty =
    computed<
      OfferVersionPartySnapshot |
      null
    >(
      () => {
        const version =
          this.currentVersion();

        const access =
          this.access();

        if (!version || !access) {
          return null;
        }

        return [
          ...version.buyers,
          ...version.sellers
        ].find(
          party =>
            party.userUid ===
            access.userUid
        ) ?? null;
      }
    );

  readonly isReceivingParty =
    computed(
      () => {
        const version =
          this.currentVersion();

        const access =
          this.access();

        if (!version || !access) {
          return false;
        }

        return (
          version.initiatedBy ===
            'buyer' &&
          access.isSeller
        ) || (
          version.initiatedBy ===
            'seller' &&
          access.isBuyer
        );
      }
    );

  readonly isClosedDueToContract =
    computed(
      () =>
        this.offer()?.status ===
          'closed_due_to_contract'
    );

  readonly isPropertySold =
    computed(
      () =>
        this.offer()?.status ===
          'converted_to_contract' &&
        this.offer()?.contract?.status ===
          'closed'
    );

  readonly actionHeading =
    computed(
      () => {
        const offer =
          this.offer();

        const version =
          this.currentVersion();

        if (
          offer?.status ===
            'closed_due_to_contract'
        ) {
          return 'No action available';
        }

        if (
          offer?.status ===
            'converted_to_contract'
        ) {
          return this.isPropertySold()
            ? 'Property sold'
            : 'Contract effective';
        }

        if (this.isReceivingParty()) {
          return 'Respond to this offer';
        }

        if (
          version?.status === 'delivered' ||
          version?.status === 'signed'
        ) {
          return 'Offer sent';
        }

        return 'Complete and send this offer';
      }
    );

  readonly actionNote =
    computed(
      () => {
        const offer =
          this.offer();

        const version =
          this.currentVersion();

        if (
          offer?.status ===
            'closed_due_to_contract'
        ) {
          return this.access()?.isBuyer
            ? 'The seller accepted another buyer\u2019s offer. This offer is closed, and no further action is available.'
            : 'Another offer for this property was accepted. This offer closed automatically, and no further action is available.';
        }

        if (
          offer?.status ===
            'converted_to_contract'
        ) {
          if (this.isPropertySold()) {
            return 'The seller confirmed that closing was completed. No further action is required.';
          }

          return this.access()?.isSeller
            ? 'All required parties have signed. No response is required. The property is now under contract.'
            : 'All required parties have signed. No action is currently required from you.';
        }

        if (
          this.actionHeading() !==
            'Offer sent' ||
          !version
        ) {
          return '';
        }

        return version.initiatedBy ===
          'buyer'
          ? 'Waiting for the seller to respond.'
          : 'Waiting for the buyer to respond.';
      }
    );

  readonly signButtonLabel =
    computed(
      () =>
        this.isReceivingParty()
          ? 'Accept and Sign'
          : 'Sign and Send'
    );

  readonly offerStatusLabel =
    computed(
      () => {
        const offer =
          this.offer();

        const version =
          this.currentVersion();

        if (
          offer &&
          version &&
          this.isPrivatePreparedVersion(
            version
          ) &&
          this.isUserOnInitiatingSide(
            offer,
            version
          )
        ) {
          return 'Draft';
        }

        if (
          offer?.status === 'countered' &&
          version?.initiatedBy === 'seller' &&
          this.isUserOnInitiatingSide(
            offer,
            version
          )
        ) {
          return 'Counteroffer sent';
        }

        if (
          offer?.status ===
            'closed_due_to_contract'
        ) {
          return 'Closed — another offer accepted';
        }

        if (this.isPropertySold()) {
          return 'Sold — closing confirmed';
        }

        return offer
          ? OFFER_STATUS_LABELS[
            offer.status
          ]
          : '';
      }
    );

  readonly currentVersionStatusLabel =
    computed(
      () => {
        const version =
          this.currentVersion();

        if (
          version &&
          this.isPrivatePreparedVersion(
            version
          ) &&
          this.isUserOnInitiatingSide(
            this.offer(),
            version
          )
        ) {
          if (
            version.status ===
              'awaiting_signatures'
          ) {
            return 'Ready to sign';
          }

          if (
            version.status ===
              'partially_signed'
          ) {
            return 'Signing in progress';
          }

          return 'Draft';
        }

        if (
          version?.status === 'superseded' &&
          this.isClosedDueToContract()
        ) {
          return 'Closed \u2014 another offer accepted';
        }

        return version
          ? OFFER_VERSION_STATUS_LABELS[
            version.status
          ]
          : '';
      }
    );

  readonly signingForm =
    this.formBuilder.nonNullable.group({
      typedSignature: [
        '',
        [
          Validators.required,
          Validators.maxLength(200)
        ]
      ],

      consentToElectronicRecords: [
        false,
        [
          Validators.requiredTrue
        ]
      ],

      consentToElectronicSignature: [
        false,
        [
          Validators.requiredTrue
        ]
      ],

      certificationAccepted: [
        false,
        [
          Validators.requiredTrue
        ]
      ]
    });

  readonly declineForm =
    this.formBuilder.nonNullable.group({
      note: [
        '',
        [
          Validators.maxLength(1000)
        ]
      ]
    });

  private readonly offerUid =
    this.route.snapshot.paramMap.get(
      'offerUid'
    ) ?? '';


  async ngOnInit(): Promise<void> {
    await this.loadOffer();
  }


  getVersionLabel(
    version: OfferVersion
  ): string {
    const offer =
      this.offer();

    if (!offer) {
      return `Version ${version.versionNumber}`;
    }

    return `${offer.referenceNumber}-${version.versionNumber}`;
  }


  getVersionTypeLabel(
    version: OfferVersion
  ): string {
    return version.versionNumber === 1
      ? 'Offer'
      : 'Counteroffer';
  }


  getVersionSenderName(
    version: OfferVersion
  ): string {
    const parties =
      version.initiatedBy === 'buyer'
        ? version.buyers
        : version.sellers;

    const initiatingParty =
      parties.find(
        party =>
          party.userUid ===
          version.initiatedByUid
      ) ?? parties[0];

    return initiatingParty?.legalName ||
      (
        version.initiatedBy === 'buyer'
          ? 'Buyer'
          : 'Seller'
      );
  }


  getVersionStatusLabel(
    version: OfferVersion
  ): string {
    if (
      this.isPrivatePreparedVersion(
        version
      ) &&
      this.isUserOnInitiatingSide(
        this.offer(),
        version
      )
    ) {
      if (
        version.status ===
          'awaiting_signatures'
      ) {
        return 'Ready to sign';
      }

      if (
        version.status ===
          'partially_signed'
      ) {
        return 'Signing in progress';
      }

      return 'Draft';
    }

    if (
      version.status === 'superseded' &&
      this.isClosedDueToContract()
    ) {
      return 'Closed — another offer accepted';
    }

    return OFFER_VERSION_STATUS_LABELS[
      version.status
    ];
  }


  getDueDiligenceDeadline(
    version: OfferVersion
  ): string {
    const deposits =
      version.terms.deposits;

    if (
      deposits.dueDiligenceDeadlineType ===
      'specific_date'
    ) {
      return deposits.dueDiligenceEndDate ||
        'Not provided';
    }

    if (
      deposits.dueDiligenceDeadlineType ===
      'days_after_effective_date'
    ) {
      const days =
        deposits
          .dueDiligenceDaysAfterEffectiveDate;

      return typeof days === 'number'
        ? `${days} calendar days after the Effective Date`
        : 'Not provided';
    }

    return 'Not selected';
  }


  dollarsFromCents(
    cents: number | undefined
  ): number {
    return (
      typeof cents === 'number'
        ? cents
        : 0
    ) / 100;
  }


  openSigningPanel(): void {
    this.clearMessages();

    const party =
      this.currentUserParty();

    this.signingForm.reset({
      typedSignature:
        party?.legalName ?? '',

      consentToElectronicRecords:
        false,

      consentToElectronicSignature:
        false,

      certificationAccepted:
        false
    });

    this.declinePanelOpen.set(false);
    this.signingPanelOpen.set(true);
  }


  closeSigningPanel(): void {
    if (this.processing()) {
      return;
    }

    this.signingPanelOpen.set(false);
  }


  openDeclinePanel(): void {
    this.clearMessages();
    this.declineForm.reset();
    this.signingPanelOpen.set(false);
    this.declinePanelOpen.set(true);
  }


  closeDeclinePanel(): void {
    if (this.processing()) {
      return;
    }

    this.declinePanelOpen.set(false);
  }


  async openAgreement(): Promise<void> {
    const document =
      this.agreementDocument();

    if (!document) {
      this.errorMessage.set(
        'The agreement PDF has not been generated yet.'
      );

      return;
    }

    this.openingDocument.set(true);
    this.clearMessages();

    const previewWindow =
      window.open('', '_blank');

    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.document.title =
        'Opening agreement PDF…';
    }

    try {
      const downloadUrl =
        await this.offerDocumentService
          .getDownloadUrl(document);

      if (previewWindow) {
        previewWindow.location.replace(
          downloadUrl
        );
      } else {
        window.location.assign(
          downloadUrl
        );
      }
    } catch (error) {
      previewWindow?.close();

      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.openingDocument.set(false);
    }
  }


  async prepareAgreement(): Promise<void> {
    const version =
      this.currentVersion();

    if (!version) {
      return;
    }

    this.processing.set(true);
    this.clearMessages();

    try {
      await this.offerDocumentService
        .generateAgreement(
          this.offerUid,
          version.Uid,
          version.status === 'accepted'
            ? 'accepted_agreement'
            : version.versionNumber === 1
              ? 'offer_agreement'
              : 'counteroffer_agreement'
        );

      await this.loadOffer(false);

      this.successMessage.set(
        'The agreement PDF is ready for review and signature.'
      );
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.processing.set(false);
    }
  }


  async signAgreement(): Promise<void> {
    this.signingForm.markAllAsTouched();

    if (this.signingForm.invalid) {
      this.errorMessage.set(
        'Enter your verified legal name and accept all three electronic-signature confirmations.'
      );

      return;
    }

    const version =
      this.currentVersion();

    const document =
      this.agreementDocument();

    if (!version || !document) {
      this.errorMessage.set(
        'The agreement PDF must be generated before signing.'
      );

      return;
    }

    this.processing.set(true);
    this.clearMessages();

    try {
      const formValue =
        this.signingForm.getRawValue();

      const result =
        await this.offerService.signOffer(
          this.offerUid,
          version.Uid,
          document.Uid,
          formValue.typedSignature,
          formValue.consentToElectronicRecords,
          formValue.consentToElectronicSignature,
          formValue.certificationAccepted
        );

      let finalAgreementPrepared =
        true;

      if (result.fullyExecuted) {
        try {
          await this.offerDocumentService
            .generateAgreement(
              this.offerUid,
              version.Uid,
              'accepted_agreement'
            );
        } catch (error) {
          finalAgreementPrepared =
            false;

          console.error(
            'The contract became effective, but its final accepted PDF could not be prepared automatically.',
            error
          );
        }
      }

      this.signingPanelOpen.set(false);

      await this.loadOffer(false);

      this.successMessage.set(
        result.fullyExecuted
          ? finalAgreementPrepared
            ? 'All required parties have signed. The property is now under contract, and the final agreement PDF is ready.'
            : 'All required parties have signed. The property is now under contract.'
          : this.isReceivingParty()
            ? 'Your signature was recorded.'
            : 'Your signature was recorded and the offer was sent to the receiving party.'
      );

      if (
        result.fullyExecuted &&
        !finalAgreementPrepared
      ) {
        this.errorMessage.set(
          'The signatures were recorded, but the final agreement PDF still needs to be prepared. Select Prepare Final Agreement PDF to retry.'
        );
      }
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.processing.set(false);
    }
  }


  async declineOffer(): Promise<void> {
    const version =
      this.currentVersion();

    if (!version) {
      return;
    }

    this.processing.set(true);
    this.clearMessages();

    try {
      await this.offerService
        .declineOffer(
          this.offerUid,
          version.Uid,
          this.declineForm.controls
            .note.value
        );

      this.declinePanelOpen.set(false);

      await this.loadOffer(false);

      this.successMessage.set(
        'The offer was declined. Its complete history remains available.'
      );
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.processing.set(false);
    }
  }


  async createCounteroffer(): Promise<void> {
    const offer =
      this.offer();

    const version =
      this.currentVersion();

    if (!offer || !version) {
      return;
    }

    this.processing.set(true);
    this.clearMessages();

    try {
      const result =
        await this.offerService
          .createCounteroffer(
            offer.Uid,
            version.Uid
          );

      await this.router.navigate(
        [
          '/listings',
          offer.listingUid,
          'offer'
        ],
        {
          queryParams: {
            offerUid:
              result.offerUid,

            offerVersionUid:
              result.offerVersionUid
          }
        }
      );
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error)
      );

      this.processing.set(false);
    }
  }


  async continueEditing(): Promise<void> {
    const offer =
      this.offer();

    const version =
      this.currentVersion();

    if (
      !offer ||
      !version ||
      !this.access()?.canEditCurrentDraft
    ) {
      return;
    }

    await this.router.navigate(
      [
        '/listings',
        offer.listingUid,
        'offer'
      ],
      {
        queryParams: {
          offerUid:
            offer.Uid,

          offerVersionUid:
            version.Uid
        }
      }
    );
  }


  async withdrawOffer(): Promise<void> {
    const offer =
      this.offer();

    const version =
      this.currentVersion();

    if (!offer || !version) {
      return;
    }

    const isUnsignedDraft =
      offer.status === 'draft';

    const confirmed =
      window.confirm(
        isUnsignedDraft
          ? 'Discard this unsigned offer draft? It will be closed and cannot be resumed.'
          : 'Withdraw this offer? The negotiation will close, but its complete history will remain available.'
      );

    if (!confirmed) {
      return;
    }

    this.processing.set(true);
    this.clearMessages();

    try {
      await this.offerService
        .withdrawOffer(
          this.offerUid,
          version.Uid
        );

      await this.loadOffer(false);

      this.successMessage.set(
        isUnsignedDraft
          ? 'The unsigned offer draft was discarded.'
          : 'The current offer was withdrawn. Its history remains available.'
      );
    } catch (error) {
      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.processing.set(false);
    }
  }


  async returnToDashboard(): Promise<void> {
    await this.router.navigate([
      '/dashboard'
    ]);
  }


  private async loadOffer(
    showLoading = true
  ): Promise<void> {
    if (!this.offerUid) {
      this.loading.set(false);
      this.errorMessage.set(
        'The offer identifier is missing.'
      );

      return;
    }

    if (showLoading) {
      this.loading.set(true);
    }

    this.errorMessage.set('');

    try {
      const offer =
        await this.offerService
          .getOffer(this.offerUid);

      if (!offer) {
        throw new Error(
          'The requested offer could not be found.'
        );
      }

      const [
        latestVersion,
        versions
      ] = await Promise.all([
        this.offerService.getVersion(
          offer.Uid,
          offer.currentVersionUid
        ),

        this.offerService
          .getVersionHistory(
            offer.Uid
          )
      ]);

      if (!latestVersion) {
        throw new Error(
          'The current offer version could not be found.'
        );
      }

      let visibleVersion =
        latestVersion;

      if (
        this.isUndeliveredVersion(
          offer,
          latestVersion
        ) &&
        !this.isUserOnInitiatingSide(
          offer,
          latestVersion
        )
      ) {
        if (!offer.lastDeliveredVersionUid) {
          throw new Error(
            'This offer has not been signed and sent to you yet.'
          );
        }

        visibleVersion =
          versions.find(
            version =>
              version.Uid ===
              offer.lastDeliveredVersionUid
          ) ??
          await this.offerService.getVersion(
            offer.Uid,
            offer.lastDeliveredVersionUid
          ) ??
          latestVersion;
      }

      const documents =
        await this.offerDocumentService
          .getDocumentsForVersion(
            offer.Uid,
            visibleVersion.Uid
          );

      this.offer.set(offer);
      this.currentVersion.set(
        visibleVersion
      );

      this.versions.set(
        versions
          .filter(
            version =>
              !this.isUndeliveredVersion(
                offer,
                version
              ) ||
              this.isUserOnInitiatingSide(
                offer,
                version
              )
          )
          .sort(
            (left, right) =>
              right.versionNumber -
              left.versionNumber
          )
      );

      this.agreementDocument.set(
        this.findAgreementDocument(
          documents,
          visibleVersion
        )
      );
       } catch (error: unknown) {
      console.error(
        'Unable to load offer details:',
        error
      );

      this.errorMessage.set(
        this.getErrorMessage(error)
      );
    } finally {
      this.loading.set(false);
    }
  }

    private isPrivatePreparedVersion(
    version: OfferVersion
  ): boolean {
    return (
      version.status === 'draft' ||
      version.status ===
        'awaiting_signatures' ||
      version.status ===
        'partially_signed'
    );
  }


  private isUndeliveredVersion(
    offer: Offer,
    version: OfferVersion
  ): boolean {
    return (
      this.isPrivatePreparedVersion(
        version
      ) ||
      (
        !!offer.lastDeliveredVersionUid &&
        version.Uid !==
          offer.lastDeliveredVersionUid &&
        !version.deliveredAt
      )
    );
  }


  private isUserOnInitiatingSide(
    offer: Offer | null,
    version: OfferVersion
  ): boolean {
    if (!offer) {
      return false;
    }

    const userUid =
      this.offerService.currentUserUid;

    return version.initiatedBy === 'buyer'
      ? offer.buyerUids.includes(
          userUid
        )
      : offer.sellerUids.includes(
          userUid
        );
  }


  private findAgreementDocument(
    documents: OfferDocument[],
    version: OfferVersion
  ): OfferDocument | null {
    if (version.status === 'accepted') {
      return documents.find(
        document =>
          document.type ===
          'accepted_agreement'
      ) ?? null;
    }

    const expectedType =
      version.versionNumber === 1
        ? 'offer_agreement'
        : 'counteroffer_agreement';

    return documents.find(
      document =>
        document.type ===
        expectedType
    ) ?? null;
  }


  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }


  private getErrorMessage(
    error: unknown
  ): string {
    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return 'The offer action could not be completed. Please try again.';
  }
}
