import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  DOCUMENT
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../../core/authentication/services/auth.service';

import {
  Listing
} from '../../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../../core/domains/listings/services/listing.service';

import {
  ListingMarketingService
} from '../../../../core/domains/listings/services/listing-marketing.service';

import * as QRCode from 'qrcode';

type CopyStatus =
  | 'idle'
  | 'copied'
  | 'error';

type CaptionType =
  | 'short'
  | 'detailed'
  | 'featured';

interface MarketingChecklistItem {
  id: string;
  label: string;
  description: string;
}

@Component({
  selector:
    'app-marketing-toolkit',

  standalone:
    true,

  imports: [
    RouterLink
  ],

  templateUrl:
    './marketing-toolkit.component.html',

  styleUrl:
    './marketing-toolkit.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class MarketingToolkitComponent
  implements OnInit, OnDestroy {

  private readonly route =
    inject(ActivatedRoute);

  private readonly document =
    inject(DOCUMENT);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly listingMarketingService =
    inject(ListingMarketingService);

  protected readonly checklistItems:
    MarketingChecklistItem[] = [
      {
        id:
          'copy-listing-link',

        label:
          'Copy the public listing link',

        description:
          'Keep the permanent property link ready for messages, posts, and advertisements.'
      },
      {
        id:
          'prepare-social-caption',

        label:
          'Prepare a social caption',

        description:
          'Choose and customize one of the suggested property captions.'
      },
      {
        id:
          'share-on-social-media',

        label:
          'Share the property on social media',

        description:
          'Post the property link to Facebook or another social network.'
      },
      {
        id:
          'email-potential-buyers',

        label:
          'Email potential buyers',

        description:
          'Send the property link to interested buyers and personal contacts.'
      },
      {
        id:
          'download-qr-code',

        label:
          'Download the property QR code',

        description:
          'Save the PNG or SVG version for printed marketing materials.'
      },
      {
        id:
          'add-qr-code-to-sign',

        label:
          'Add the QR code to a sign or flyer',

        description:
          'Place the QR code where prospective buyers can scan it easily.'
      },
      {
        id:
          'share-with-personal-network',

        label:
          'Share with your personal network',

        description:
          'Notify neighbors, friends, coworkers, and other local contacts.'
      },
      {
        id:
          'review-listing-accuracy',

        label:
          'Review the public listing',

        description:
          'Confirm the price, description, photographs, and property details are current.'
      }
    ];

  protected readonly completedChecklistItems =
    signal<string[]>([]);

  protected readonly checklistLoading =
    signal(true);

  protected readonly checklistSaving =
    signal(false);

  protected readonly checklistError =
    signal('');

  private listingCopyConfirmationTimer:
    number |
    null = null;

  private emailCopyConfirmationTimer:
    number |
    null = null;

  private captionCopyConfirmationTimer:
    number |
    null = null;

  private shareStatusTimer:
    number |
    null = null;

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly publicListingUrl =
    signal('');

  protected readonly linkCopyStatus =
    signal<CopyStatus>('idle');

  protected readonly emailLinkCopyStatus =
    signal<CopyStatus>('idle');

  protected readonly copiedCaption =
    signal<CaptionType | null>(null);

  protected readonly shareStatus =
    signal<
      'idle' |
      'shared' |
      'copied' |
      'error'
    >('idle');

  protected readonly qrCodeDataUrl =
    signal('');

  protected readonly qrCodeError =
    signal('');

  protected readonly isGeneratingQrCode =
    signal(false);

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const sellerUid =
      this.authService.currentUserUid;

    if (!sellerUid) {
      this.loadError.set(
        'You must be signed in to access the Marketing Toolkit.'
      );

      this.isLoading.set(false);
      return;
    }

    try {
      const listing =
        await this.listingService
          .getPublishedListing(
            this.listingUid
          );

      if (!listing) {
        this.loadError.set(
          'The selected listing could not be found.'
        );

        return;
      }

      if (
        listing.sellerUid !==
        sellerUid
      ) {
        this.loadError.set(
          'You do not have permission to market this listing.'
        );

        return;
      }

      this.listing.set(listing);

      const marketingLink =
        await this.listingMarketingService
          .ensureLink(
            listing.Uid
          );

      this.publicListingUrl.set(
        `${this.document.location.origin}${marketingLink.shortPath}`
      );
      await this.generateQrCode();
      await this.loadChecklist();
    } catch (error: unknown) {
      console.error(
        'Unable to load the Listing Marketing Toolkit:',
        error
      );

      this.loadError.set(
        error instanceof Error &&
          error.message
          ? error.message
          : 'The Marketing Toolkit could not be loaded. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.shareStatusTimer) {
      clearTimeout(
        this.shareStatusTimer
      );
    }
    if (
      this.listingCopyConfirmationTimer
    ) {
      clearTimeout(
        this.listingCopyConfirmationTimer
      );
    }

    if (
      this.emailCopyConfirmationTimer
    ) {
      clearTimeout(
        this.emailCopyConfirmationTimer
      );
    }

    if (
      this.captionCopyConfirmationTimer
    ) {
      clearTimeout(
        this.captionCopyConfirmationTimer
      );
    }
  }

  protected async copyListingLink():
    Promise<void> {
    try {

      await this.writePlainText(
        this.publicListingUrl()
      );

      this.showListingCopyStatus(
        'copied'
      );
    } catch (error: unknown) {
      console.error(
        'Unable to copy the listing link:',
        error
      );

      this.showListingCopyStatus(
        'error'
      );
    }
  }

  protected async copyEmailLink():
    Promise<void> {
    const publicUrl =
      this.publicListingUrl();

    const listing =
      this.listing();

    if (
      !publicUrl ||
      !listing
    ) {
      this.showEmailCopyStatus(
        'error'
      );

      return;
    }

    const linkText =
      'View this property on NavStreet';

    const html =
      `<a href="${this.escapeHtmlAttribute(publicUrl)}">` +
      `${linkText}</a>`;

    try {
      if (
        typeof ClipboardItem !==
        'undefined' &&
        navigator.clipboard?.write
      ) {
        const clipboardItem =
          new ClipboardItem({
            'text/plain':
              new Blob(
                [
                  `${linkText}: ${publicUrl}`
                ],
                {
                  type: 'text/plain'
                }
              ),

            'text/html':
              new Blob(
                [html],
                {
                  type: 'text/html'
                }
              )
          });

        await navigator.clipboard.write([
          clipboardItem
        ]);
      } else {
        await this.writePlainText(
          `${linkText}: ${publicUrl}`
        );
      }

      this.showEmailCopyStatus(
        'copied'
      );
    } catch (error: unknown) {
      console.error(
        'Unable to copy the email link:',
        error
      );

      this.showEmailCopyStatus(
        'error'
      );
    }
  }

  protected copyStatusMessage(
    status: CopyStatus
  ): string {
    switch (status) {
      case 'copied':
        return 'Copied';

      case 'error':
        return 'Copy failed';

      default:
        return '';
    }
  }

  protected get shortSocialCaption():
    string {
    const listing =
      this.listing();

    if (!listing) {
      return '';
    }

    return (
      `🏡 Just listed on NavStreet: ` +
      `${listing.addressLine1}, ` +
      `${listing.city}, ${listing.state} ` +
      `${listing.zipCode}. ` +
      `${listing.bedrooms} beds • ` +
      `${listing.bathrooms} baths • ` +
      `${this.formatNumber(listing.squareFeet)} sq. ft. ` +
      `View the property: ` +
      `${this.publicListingUrl()}`
    );
  }

  protected get detailedSocialCaption():
    string {
    const listing =
      this.listing();

    if (!listing) {
      return '';
    }

    return (
      `Take a closer look at ` +
      `${listing.addressLine1} in ` +
      `${listing.city}, ${listing.state}. ` +
      `This property offers ` +
      `${listing.bedrooms} bedrooms, ` +
      `${listing.bathrooms} bathrooms, and ` +
      `${this.formatNumber(listing.squareFeet)} ` +
      `square feet of living space. ` +
      `Offered at ` +
      `${this.formatCurrency(listing.listPrice)}. ` +
      `See photos and complete property details on ` +
      `NavStreet: ${this.publicListingUrl()}`
    );
  }

  protected get featuredSocialCaption():
    string {
    const listing =
      this.listing();

    if (!listing) {
      return '';
    }

    const introduction =
      listing.featuredListing
        ? '⭐ Featured property on NavStreet!'
        : '🏠 Now available on NavStreet!';

    return (
      `${introduction}\n\n` +
      `${listing.addressLine1}\n` +
      `${listing.city}, ${listing.state} ` +
      `${listing.zipCode}\n\n` +
      `💰 ${this.formatCurrency(listing.listPrice)}\n` +
      `🛏️ ${listing.bedrooms} bedrooms\n` +
      `🛁 ${listing.bathrooms} bathrooms\n` +
      `📐 ${this.formatNumber(listing.squareFeet)} sq. ft.\n\n` +
      `View this property and contact the seller:\n` +
      `${this.publicListingUrl()}`
    );
  }

  protected async copyCaption(
    caption: string,
    captionType: CaptionType
  ): Promise<void> {
    try {
      await this.writePlainText(
        caption
      );

      this.showCaptionCopyStatus(
        captionType
      );
    } catch (error: unknown) {
      console.error(
        'Unable to copy social caption:',
        error
      );
    }
  }

  private showListingCopyStatus(
    status: Exclude<
      CopyStatus,
      'idle'
    >
  ): void {
    if (
      this.listingCopyConfirmationTimer
    ) {
      clearTimeout(
        this.listingCopyConfirmationTimer
      );
    }

    this.linkCopyStatus.set('idle');

    this.listingCopyConfirmationTimer =
      window.setTimeout(
        () => {
          this.linkCopyStatus.set(
            status
          );

          this.listingCopyConfirmationTimer =
            window.setTimeout(
              () => {
                this.linkCopyStatus.set(
                  'idle'
                );

                this.listingCopyConfirmationTimer =
                  null;
              },
              3000
            );
        },
        0
      );
  }

  private showEmailCopyStatus(
    status: Exclude<
      CopyStatus,
      'idle'
    >
  ): void {
    if (
      this.emailCopyConfirmationTimer
    ) {
      clearTimeout(
        this.emailCopyConfirmationTimer
      );
    }

    this.emailLinkCopyStatus.set(
      'idle'
    );

    this.emailCopyConfirmationTimer =
      window.setTimeout(
        () => {
          this.emailLinkCopyStatus.set(
            status
          );

          this.emailCopyConfirmationTimer =
            window.setTimeout(
              () => {
                this.emailLinkCopyStatus.set(
                  'idle'
                );

                this.emailCopyConfirmationTimer =
                  null;
              },
              3000
            );
        },
        0
      );
  }

  private showCaptionCopyStatus(
    captionType: CaptionType
  ): void {
    if (
      this.captionCopyConfirmationTimer
    ) {
      clearTimeout(
        this.captionCopyConfirmationTimer
      );
    }

    this.copiedCaption.set(null);

    this.captionCopyConfirmationTimer =
      window.setTimeout(
        () => {
          this.copiedCaption.set(
            captionType
          );

          this.captionCopyConfirmationTimer =
            window.setTimeout(
              () => {
                this.copiedCaption.set(
                  null
                );

                this.captionCopyConfirmationTimer =
                  null;
              },
              3000
            );
        },
        0
      );
  }

  protected get nativeSharingAvailable():
    boolean {
    return (
      typeof navigator.share ===
      'function'
    );
  }

  protected async shareNatively():
    Promise<void> {
    const listing =
      this.listing();

    const publicUrl =
      this.publicListingUrl();

    if (
      !listing ||
      !publicUrl
    ) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    const shareData = {
      title:
        `${listing.addressLine1} | NavStreet`,

      text:
        `View ${listing.addressLine1} in ` +
        `${listing.city}, ${listing.state} ` +
        `on NavStreet.`,

      url:
        publicUrl
    };

    try {
      if (
        typeof navigator.share ===
        'function'
      ) {
        await navigator.share(
          shareData
        );

        this.showShareStatus(
          'shared'
        );

        return;
      }

      await this.writePlainText(
        publicUrl
      );

      this.showShareStatus(
        'copied'
      );
    } catch (error: unknown) {
      /*
       * AbortError means the user closed the share
       * panel without selecting a destination.
       */
      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        return;
      }

      console.error(
        'Unable to share the listing:',
        error
      );

      this.showShareStatus(
        'error'
      );
    }
  }

  protected shareOnFacebook():
    void {
    const publicUrl =
      this.publicListingUrl();

    if (!publicUrl) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    const facebookUrl =
      'https://www.facebook.com/sharer/sharer.php' +
      `?u=${encodeURIComponent(publicUrl)}`;

    const shareWindow =
      window.open(
        facebookUrl,
        'navstreet-facebook-share',
        'popup=yes,width=720,height=640'
      );

    if (!shareWindow) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    shareWindow.opener = null;

    this.showShareStatus(
      'shared'
    );
  }

  protected shareOnLinkedIn():
    void {
    const publicUrl =
      this.publicListingUrl();

    if (!publicUrl) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    const linkedInUrl =
      'https://www.linkedin.com/sharing/share-offsite/' +
      `?url=${encodeURIComponent(publicUrl)}`;

    this.openSocialShareWindow(
      linkedInUrl,
      'navstreet-linkedin-share'
    );
  }

  protected shareOnX():
    void {
    const listing =
      this.listing();

    const publicUrl =
      this.publicListingUrl();

    if (
      !listing ||
      !publicUrl
    ) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    const text =
      `View ${listing.addressLine1} in ` +
      `${listing.city}, ${listing.state} on NavStreet.`;

    const xUrl =
      'https://twitter.com/intent/tweet' +
      `?text=${encodeURIComponent(text)}` +
      `&url=${encodeURIComponent(publicUrl)}`;

    this.openSocialShareWindow(
      xUrl,
      'navstreet-x-share'
    );
  }

  protected shareByEmail():
    void {
    const listing =
      this.listing();

    const publicUrl =
      this.publicListingUrl();

    if (
      !listing ||
      !publicUrl
    ) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    const subject =
      `Property on NavStreet: ${listing.addressLine1}`;

    const body =
      `Take a look at this property on NavStreet:\n\n` +
      `${listing.addressLine1}\n` +
      `${listing.city}, ${listing.state} ` +
      `${listing.zipCode}\n\n` +
      `${publicUrl}`;

    this.document.location.href =
      `mailto:?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
  }

  private openSocialShareWindow(
    url: string,
    windowName: string
  ): void {
    const shareWindow =
      window.open(
        url,
        windowName,
        'popup=yes,width=720,height=640'
      );

    if (!shareWindow) {
      this.showShareStatus(
        'error'
      );

      return;
    }

    shareWindow.opener = null;

    this.showShareStatus(
      'shared'
    );
  }

  protected shareStatusMessage():
    string {
    switch (this.shareStatus()) {
      case 'shared':
        return 'Sharing option opened';

      case 'copied':
        return 'Link copied';

      case 'error':
        return 'Sharing could not be opened';

      default:
        return '';
    }
  }

  private showShareStatus(
    status:
      | 'shared'
      | 'copied'
      | 'error'
  ): void {
    if (this.shareStatusTimer) {
      clearTimeout(
        this.shareStatusTimer
      );
    }

    this.shareStatus.set('idle');

    this.shareStatusTimer =
      window.setTimeout(
        () => {
          this.shareStatus.set(
            status
          );

          this.shareStatusTimer =
            window.setTimeout(
              () => {
                this.shareStatus.set(
                  'idle'
                );

                this.shareStatusTimer =
                  null;
              },
              3000
            );
        },
        0
      );
  }

  protected downloadQrCodePng():
    void {
    const dataUrl =
      this.qrCodeDataUrl();

    const listing =
      this.listing();

    if (
      !dataUrl ||
      !listing
    ) {
      return;
    }

    this.downloadFile(
      dataUrl,
      `${this.createListingFileName(listing)}-qr-code.png`
    );
  }

  protected async downloadQrCodeSvg():
    Promise<void> {
    const publicUrl =
      this.publicListingUrl();

    const listing =
      this.listing();

    if (
      !publicUrl ||
      !listing
    ) {
      return;
    }

    try {
      const svg =
        await QRCode.toString(
          publicUrl,
          {
            type: 'svg',
            errorCorrectionLevel: 'H',
            margin: 4,
            width: 800,
            color: {
              dark: '#154360',
              light: '#ffffff'
            }
          }
        );

      const blob =
        new Blob(
          [svg],
          {
            type:
              'image/svg+xml;charset=utf-8'
          }
        );

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      this.downloadFile(
        objectUrl,
        `${this.createListingFileName(listing)}-qr-code.svg`
      );

      window.setTimeout(
        () => {
          URL.revokeObjectURL(
            objectUrl
          );
        },
        1000
      );
    } catch (error: unknown) {
      console.error(
        'Unable to download the SVG QR code:',
        error
      );

      this.qrCodeError.set(
        'The SVG QR code could not be downloaded.'
      );
    }
  }

  private async generateQrCode():
    Promise<void> {
    const publicUrl =
      this.publicListingUrl();

    if (!publicUrl) {
      return;
    }

    this.isGeneratingQrCode.set(true);
    this.qrCodeError.set('');

    try {
      const dataUrl =
        await QRCode.toDataURL(
          publicUrl,
          {
            errorCorrectionLevel: 'H',
            margin: 4,
            width: 800,
            color: {
              dark: '#154360',
              light: '#ffffff'
            }
          }
        );

      this.qrCodeDataUrl.set(
        dataUrl
      );
    } catch (error: unknown) {
      console.error(
        'Unable to generate the property QR code:',
        error
      );

      this.qrCodeDataUrl.set('');

      this.qrCodeError.set(
        'The property QR code could not be generated.'
      );
    } finally {
      this.isGeneratingQrCode.set(false);
    }
  }

  private downloadFile(
    url: string,
    fileName: string
  ): void {
    const link =
      this.document.createElement('a');

    link.href =
      url;

    link.download =
      fileName;

    link.rel =
      'noopener';

    this.document.body.appendChild(
      link
    );

    link.click();
    link.remove();
  }

  private createListingFileName(
    listing: Listing
  ): string {
    const address =
      [
        listing.addressLine1,
        listing.city,
        listing.state,
        listing.zipCode
      ]
        .filter(Boolean)
        .join('-')
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          '-'
        )
        .replace(
          /^-+|-+$/g,
          ''
        );

    return (
      address ||
      'navstreet-property'
    );
  }

  protected checklistItemCompleted(
  itemId: string
): boolean {
  return this.completedChecklistItems()
    .includes(itemId);
}

protected get checklistCompletionPercent():
  number {
  if (
    this.checklistItems.length === 0
  ) {
    return 0;
  }

  return Math.round(
    (
      this.completedChecklistItems()
        .length /
      this.checklistItems.length
    ) *
    100
  );
}

protected async toggleChecklistItem(
  itemId: string,
  completed: boolean
): Promise<void> {
  if (this.checklistSaving()) {
    return;
  }

  const previousItems = [
    ...this.completedChecklistItems()
  ];

  const nextItems =
    completed
      ? [
          ...new Set([
            ...previousItems,
            itemId
          ])
        ]
      : previousItems.filter(
          existingItem =>
            existingItem !== itemId
        );

  this.completedChecklistItems.set(
    nextItems
  );

  this.checklistSaving.set(true);
  this.checklistError.set('');

  try {
    const result =
      await this.listingMarketingService
        .updateChecklist(
          this.listingUid,
          nextItems
        );

    this.completedChecklistItems.set(
      result.completedItems
    );
  } catch (error: unknown) {
    this.completedChecklistItems.set(
      previousItems
    );

    this.checklistError.set(
      error instanceof Error
        ? error.message
        : 'The marketing checklist could not be saved.'
    );
  } finally {
    this.checklistSaving.set(false);
  }
}

private async loadChecklist():
  Promise<void> {
  this.checklistLoading.set(true);
  this.checklistError.set('');

  try {
    const result =
      await this.listingMarketingService
        .getChecklist(
          this.listingUid
        );

    this.completedChecklistItems.set(
      result.completedItems
    );
  } catch (error: unknown) {
    console.error(
      'Unable to load the marketing checklist:',
      error
    );

    this.checklistError.set(
      error instanceof Error
        ? error.message
        : 'The marketing checklist could not be loaded.'
    );
  } finally {
    this.checklistLoading.set(false);
  }
}

  private async writePlainText(
    value: string
  ): Promise<void> {
    if (
      !value ||
      !navigator.clipboard
        ?.writeText
    ) {
      throw new Error(
        'Clipboard access is unavailable.'
      );
    }

    await navigator.clipboard.writeText(
      value
    );
  }

  private escapeHtmlAttribute(
    value: string
  ): string {
    return value
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      );
  }

  private formatCurrency(
    value: number
  ): string {
    return new Intl.NumberFormat(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }
    ).format(value);
  }

  private formatNumber(
    value: number
  ): string {
    return new Intl.NumberFormat(
      'en-US'
    ).format(value);
  }
}