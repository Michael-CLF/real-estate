import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/authentication/services/auth.service';

import {
  getStateDisclosureRequirements
} from '../../../core/configuration/state-disclosures.config';

import {
  ListingDisclosureDocument
} from '../../../core/domains/disclosures/models/listing-disclosure-document.model';

import {
  DisclosureDocumentType,
  StateDisclosureRequirement
} from '../../../core/domains/disclosures/models/state-disclosure-requirement.model';

import {
  ListingDisclosureService
} from '../../../core/domains/disclosures/services/listing-disclosure.service';

import {
  Listing
} from '../../../core/domains/listings/models/listing.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

@Component({
  selector:
    'app-listing-disclosures-management',

  standalone: true,

  imports: [
    DatePipe,
    RouterLink
  ],

  templateUrl:
    './listing-disclosures-management.component.html',

  styleUrl:
    './listing-disclosures-management.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingDisclosuresManagementComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly authService =
    inject(AuthService);

  private readonly listingService =
    inject(ListingService);

  private readonly disclosureService =
    inject(ListingDisclosureService);

  protected readonly listing =
    signal<Listing | null>(null);

  protected readonly requirements =
    signal<
      readonly StateDisclosureRequirement[]
    >([]);

  protected readonly disclosures =
    signal<
      Partial<
        Record<
          DisclosureDocumentType,
          ListingDisclosureDocument
        >
      >
    >({});

  protected readonly selectedFiles =
    signal<
      Partial<
        Record<
          DisclosureDocumentType,
          File
        >
      >
    >({});

  protected readonly uploadingType =
    signal<DisclosureDocumentType | null>(
      null
    );

  protected readonly isLoading =
    signal(true);

  protected readonly loadError =
    signal('');

  protected readonly actionError =
    signal('');

  protected readonly successMessage =
    signal('');

  protected readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';

  async ngOnInit(): Promise<void> {
    if (!this.listingUid) {
      this.loadError.set(
        'The selected listing could not be identified.'
      );

      this.isLoading.set(false);
      return;
    }

    const currentUserUid =
      this.authService.currentUserUid;

    if (!currentUserUid) {
      this.loadError.set(
        'You must be signed in to manage property disclosures.'
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
        currentUserUid
      ) {
        this.loadError.set(
          'You do not have permission to manage disclosures for this listing.'
        );

        return;
      }

      this.listing.set(listing);

      const requirements =
        getStateDisclosureRequirements(
          this.normalizeState(
            listing.state
          )
        );

      this.requirements.set(
        [...requirements].sort(
          (
            firstRequirement,
            secondRequirement
          ) =>
            firstRequirement.sortOrder -
            secondRequirement.sortOrder
        )
      );

      await this.loadDisclosures();
    } catch (error: unknown) {
      console.error(
        'Unable to load property disclosures:',
        error
      );

      this.loadError.set(
        'We could not load the property disclosures. Please return to the listing and try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected disclosureFor(
    documentType:
      DisclosureDocumentType
  ): ListingDisclosureDocument | null {
    return (
      this.disclosures()[
        documentType
      ] ?? null
    );
  }

  protected selectedFileFor(
    documentType:
      DisclosureDocumentType
  ): File | null {
    return (
      this.selectedFiles()[
        documentType
      ] ?? null
    );
  }

  protected isUploading(
    documentType:
      DisclosureDocumentType
  ): boolean {
    return (
      this.uploadingType() ===
      documentType
    );
  }

  protected onFileSelected(
    event: Event,
    documentType:
      DisclosureDocumentType
  ): void {
    this.actionError.set('');
    this.successMessage.set('');

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      this.removeSelectedFile(
        documentType
      );

      return;
    }

    if (
      file.type !==
      'application/pdf'
    ) {
      input.value = '';

      this.removeSelectedFile(
        documentType
      );

      this.actionError.set(
        'Disclosure documents must be uploaded as PDF files.'
      );

      return;
    }

    if (
      file.size >
      15 * 1024 * 1024
    ) {
      input.value = '';

      this.removeSelectedFile(
        documentType
      );

      this.actionError.set(
        'The disclosure PDF cannot exceed 15 MB.'
      );

      return;
    }

    this.selectedFiles.update(
      currentFiles => ({
        ...currentFiles,
        [documentType]: file
      })
    );
  }

  protected async uploadDisclosure(
    requirement:
      StateDisclosureRequirement
  ): Promise<void> {
    const listing =
      this.listing();

    const sellerUid =
      this.authService.currentUserUid;

    const file =
      this.selectedFileFor(
        requirement.documentType
      );

    if (
      !listing ||
      !sellerUid ||
      !file ||
      this.uploadingType()
    ) {
      return;
    }

    this.actionError.set('');
    this.successMessage.set('');

    this.uploadingType.set(
      requirement.documentType
    );

    try {
      const uploadedDocument =
        await this.disclosureService
          .uploadDisclosure(
            sellerUid,
            this.listingUid,
            this.normalizeState(
              listing.state
            ),
            requirement.documentType,
            file
          );

      this.disclosures.update(
        currentDisclosures => ({
          ...currentDisclosures,

          [requirement.documentType]:
            uploadedDocument
        })
      );

      this.removeSelectedFile(
        requirement.documentType
      );

      this.successMessage.set(
        `${requirement.shortTitle} uploaded successfully.`
      );
    } catch (error: unknown) {
      console.error(
        'Unable to upload disclosure:',
        error
      );

      this.actionError.set(
        error instanceof Error
          ? error.message
          : 'The disclosure could not be uploaded.'
      );
    } finally {
      this.uploadingType.set(null);
    }
  }

  protected async openDisclosure(
    disclosure:
      ListingDisclosureDocument
  ): Promise<void> {
    this.actionError.set('');
    this.successMessage.set('');

    try {
      await this.disclosureService
        .openDisclosure(disclosure);
    } catch (error: unknown) {
      console.error(
        'Unable to open disclosure:',
        error
      );

      this.actionError.set(
        error instanceof Error
          ? error.message
          : 'The disclosure could not be opened.'
      );
    }
  }

  private async loadDisclosures():
    Promise<void> {
    const summaries =
      await this.disclosureService
        .getListingDisclosures(
          this.listingUid
        );

    const disclosureMap:
      Partial<
        Record<
          DisclosureDocumentType,
          ListingDisclosureDocument
        >
      > = {};

    for (const summary of summaries) {
      disclosureMap[
        summary.documentType
      ] =
        summary.currentDocument;
    }

    this.disclosures.set(
      disclosureMap
    );
  }

  private removeSelectedFile(
    documentType:
      DisclosureDocumentType
  ): void {
    this.selectedFiles.update(
      currentFiles => {
        const nextFiles = {
          ...currentFiles
        };

        delete nextFiles[
          documentType
        ];

        return nextFiles;
      }
    );
  }

  private normalizeState(
    state: string
  ): string {
    const normalizedState =
      state.trim().toLowerCase();

    if (
      normalizedState === 'nc' ||
      normalizedState ===
        'north carolina'
    ) {
      return 'NC';
    }

    return state
      .trim()
      .toUpperCase();
  }
}