import { buildListingStatementPayload } from '../../../core/domains/listings/state-packages/listing-statement-mapping';
import { validateListingStatementAnswers } from '../../../core/domains/listings/state-packages/listing-statement-validation';
import { validateStateListingQuestionAnswers } from '../../../core/domains/listings/state-packages/listing-question-validation';
import { getStateListingFormRestorer, getStateListingFormSerializer, restoreStateListingSellerStatements } from '../../../core/domains/listings/state-packages/state-listing.registry';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { auth } from '../../../core/infrastructure/firebase/firebase';
import { GuestListingSessionService } from './guest-listing-session.service';
import { OtpService } from '../../../core/authentication/services/otp.service';
import { AuthService } from '../../../core/authentication/services/auth.service';
import { FirebaseUserRepository } from '../../../core/infrastructure/firebase/firebase-user.repository';
import { AccountState } from '../../../core/authentication/state/account.state';
import { ListingService } from '../../../core/domains/listings/services/listing.service';
import { IdentityVerificationService } from '../../identity/services/identity-verification.service';
import {
  ListingDraftStep,
  ListingEnhancements,
  ListingFeatures,
} from '../../../core/domains/listings/models/listing.model';
import {
  AddressFormValue,
  AddressStepComponent,
} from './components/address-step/address-step.component';
import {
  PropertyDetailsFormValue,
  PropertyDetailsStepComponent,
} from './components/property-details-step/property-details-step.component';
import {
  PropertyFeaturesStepComponent,
  PropertyFeaturesStepValue,
} from './components/property-features-step/property-features-step.component';
import {
  ListingPhoto,
  PhotosStepComponent,
} from './components/photos-step/photos-step.component';
import {
  PricingFormValue,
  PricingStepComponent,
} from './components/pricing-step/pricing-step.component';
import { ReviewStepComponent } from './components/review-step/review-step.component';
import { ListingPhotoStorageService } from '../../../core/infrastructure/listings/listing-photo-storage.service';
import {
  getStateListingPackage,
} from '../../../core/domains/listings/state-packages/state-listing.registry';
import {
} from '../../../core/domains/listings/state-packages/state-listing-package';
import { DocumentChecklistComponent, ListingChecklistLocation } from './components/document-checklist/document-checklist.component';
import { LISTING_CHECKLIST_STATES } from '../../../core/configuration/listing-document-checklist.config';
interface WizardStep {
  number: number;
  label: string;
}
@Component({
  selector: 'app-listing-wizard',
  standalone: true,
  imports: [
    DocumentChecklistComponent,
    AddressStepComponent,
    PropertyDetailsStepComponent,
    PropertyFeaturesStepComponent,
    PhotosStepComponent,
    PricingStepComponent,
    ReviewStepComponent,
    RouterLink,
  ],
  templateUrl: './listing-wizard.component.html',
  styleUrl: './listing-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingWizardComponent implements OnInit {
  private readonly listingService = inject(ListingService);
  private readonly guestSession = inject(GuestListingSessionService);
  private readonly otpService = inject(OtpService);
  private readonly authService = inject(AuthService);
  private readonly userRepository = inject(FirebaseUserRepository);
  private readonly accountState = inject(AccountState);
  // The authenticated account email is the source of truth for verification.
  // Recalculate when the seller edits their listing contact email.
  protected readonly authenticatedEmail = signal('');
  protected readonly sellerEmailVerified = computed(() => {
    const listingEmail = this.propertyDetailsData()?.primarySeller?.email?.trim().toLowerCase();
    return !!listingEmail && listingEmail === this.authenticatedEmail();
  });
  protected readonly emailVerificationOpen = signal(false);
  protected readonly emailVerificationBusy = signal(false);
  protected readonly emailVerificationSent = signal(false);
  protected readonly emailVerificationCode = signal('');
  protected readonly emailVerificationError = signal('');
  private readonly identityVerificationService = inject(
    IdentityVerificationService,
  );
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listingPhotoStorageService = inject(
    ListingPhotoStorageService,
  );
  protected readonly showDocumentChecklist = signal(false);
  protected readonly checklistState = signal('');
  protected readonly checklistLocation = signal<ListingChecklistLocation | null>(null);
  protected readonly listingUid = signal<string | null>(null);
  protected readonly isInitializing = signal(true);
  protected readonly initializationError = signal('');
  protected readonly currentStep = signal(1);
  protected readonly completedSteps = signal<ListingDraftStep[]>([]);
  protected readonly addressData = signal<AddressFormValue | null>(null);
  protected readonly propertyDetailsData =
    signal<PropertyDetailsFormValue | null>(null);
  protected readonly propertyFeaturesData =
    signal<PropertyFeaturesStepValue | null>(null);
  protected readonly photosData = signal<ListingPhoto[]>([]);
  protected readonly pricingData = signal<PricingFormValue | null>(null);
  protected readonly featuredListing = signal(false);
  protected readonly certificationAccepted = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isSavingPhotos = signal(false);
  protected readonly saveError = signal('');
  protected readonly photoSaveError = signal('');
  protected readonly listingContentComplete = signal(false);
  protected readonly stepValidity = signal<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
  });
  protected readonly steps: WizardStep[] = [
    {
      number: 1,
      label: 'Address',
    },
    {
      number: 2,
      label: 'Property Details',
    },
    {
      number: 3,
      label: 'Features',
    },
    {
      number: 4,
      label: 'Photos',
    },
    {
      number: 5,
      label: 'Pricing',
    },
    {
      number: 6,
      label: 'Review',
    },
  ];
  constructor() {
    afterRenderEffect({
      write: () => {
        // Scroll after the new wizard section has rendered.
        this.currentStep();
        this.showDocumentChecklist();
        if (!this.isInitializing()) {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      },
    });
  }
  async ngOnInit(): Promise<void> {
    // Never overwrite an existing authenticated draft with browser-session data.
    if (!this.route.snapshot.paramMap.get('listingUid')) {
      const saved = this.guestSession.load();
      if (saved) {
        this.addressData.set(saved.address);
        this.propertyDetailsData.set(saved.propertyDetails);
        this.checklistLocation.set(saved.checklistLocation);
        this.checklistState.set(saved.checklistState);
        this.currentStep.set(saved.currentStep);
        if (saved.address) this.setStepValidity(1, true);
        // Section 2 validity must be recalculated by its reactive form.
      }
    }
    
    await auth.authStateReady();
    this.authenticatedEmail.set(auth.currentUser?.email?.trim().toLowerCase() ?? '');
    await this.initializeDraft();
  }
  private async initializeDraft(): Promise<void> {
    const user = auth.currentUser;
    const routeListingUid = this.route.snapshot.paramMap.get('listingUid');
    try {
      if (routeListingUid) {
        if (!user) throw new Error('Please sign in to edit this listing.');
        await this.loadExistingDraft(routeListingUid, user.uid);
        return;
      }
      // Returning from email verification: save both pending sections before
      // entering the authenticated listing workspace.
      if (user && this.route.snapshot.queryParamMap.get('resumeGuest') === '1') {
        await this.persistPendingGuestListing(user.uid);
        return;
      }
      this.showDocumentChecklist.set(!this.guestSession.load()?.address);
    } catch (error) {
      console.error('Failed to initialize listing draft.', error);
      this.initializationError.set(
        error instanceof Error
          ? error.message
          : 'We could not open your listing draft.',
      );
    } finally {
      this.isInitializing.set(false);
    }
  }
  protected openDocumentChecklist(): void {
    const address = this.addressData();
    if (address) this.checklistLocation.set({ zipCode: address.zipCode, city: address.city, state: address.state, county: address.county });
    this.checklistState.set(address?.state ?? this.checklistState());
    this.showDocumentChecklist.set(true);
    this.scrollToTop();
  }
  protected async continueFromChecklist(location: ListingChecklistLocation): Promise<void> {
    const stateCode = location.state;
    if (this.isSaving() || !LISTING_CHECKLIST_STATES.some(state => state.abbreviation === stateCode)) return;
    this.checklistState.set(stateCode);
    this.checklistLocation.set(location);
    this.saveGuestSession();
    if (this.listingUid()) {
      this.showDocumentChecklist.set(false);
      this.scrollToTop();
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      // Guests complete the checklist and first two sections locally.
      this.addressData.set({
        addressLine1: '', addressLine2: '', city: location.city ?? '',
        state: stateCode, zipCode: location.zipCode ?? '', county: location.county ?? '',
      });
      this.showDocumentChecklist.set(false);
      this.saveGuestSession();
      this.scrollToTop();
      return;
    }
    this.initializationError.set('');
    this.isSaving.set(true);
    try {
      await this.createNewDraft(user.uid);
      this.showDocumentChecklist.set(false);
    } catch (error) {
      this.initializationError.set(error instanceof Error ? error.message : 'We could not open your listing draft. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
  private async createNewDraft(sellerUid: string): Promise<void> {
    const listingUid = await this.listingService.createInitialDraft(sellerUid);
    this.listingUid.set(listingUid);
    const location = this.checklistLocation();
    this.addressData.set({ addressLine1: '', addressLine2: '', city: location?.city ?? '', state: this.checklistState(), zipCode: location?.zipCode ?? '', county: location?.county ?? '' });
    await this.router.navigate(['/sell/listings', listingUid, 'edit'], {
      replaceUrl: true,
      queryParams: { checklistState: this.checklistState(), checklistZip: location?.zipCode, checklistCity: location?.city, checklistCounty: location?.county },
    });
  }
  private async persistPendingGuestListing(sellerUid: string): Promise<void> {
    const pending = this.guestSession.load();
    if (!pending?.address || !pending.propertyDetails || pending.currentStep !== 2) {
      throw new Error('Your pending listing could not be restored. Please start again.');
    }
    const sellerEmail = pending.propertyDetails.primarySeller?.email?.trim().toLowerCase();
    if (!sellerEmail || sellerEmail !== auth.currentUser?.email?.trim().toLowerCase()) {
      throw new Error('Please verify the email address entered for the primary seller.');
    }
    // Set the draft UID immediately so retries do not accidentally create
    // multiple drafts within this component instance.
    if (!this.listingUid()) {
      this.listingUid.set(await this.listingService.createInitialDraft(sellerUid));
    }
    this.addressData.set(pending.address);
    this.propertyDetailsData.set(pending.propertyDetails);
    this.currentStep.set(1);
    await this.saveCurrentStep();
    this.currentStep.set(2);
    await this.saveCurrentStep();
    const listingUid = this.listingUid()!;
    await this.router.navigate(['/sell/listings', listingUid, 'edit'], { replaceUrl: true });
  }

  private async loadExistingDraft(
    listingUid: string,
    sellerUid: string,
  ): Promise<void> {
    const draft = await this.listingService.getSellerDraft(
      listingUid,
      sellerUid,
    );
    if (!draft) {
      throw new Error('This listing draft could not be found.');
    }
    this.listingUid.set(listingUid);
    this.completedSteps.set([...draft.progress.completedSteps]);
    if (!draft.address) {
      const selectedState = this.route.snapshot.queryParamMap.get('checklistState') ?? '';
      if (LISTING_CHECKLIST_STATES.some(state => state.abbreviation === selectedState)) {
        this.checklistState.set(selectedState);
        const location = { state: selectedState, zipCode: this.route.snapshot.queryParamMap.get('checklistZip') ?? '', city: this.route.snapshot.queryParamMap.get('checklistCity') ?? '', county: this.route.snapshot.queryParamMap.get('checklistCounty') ?? '' };
        this.checklistLocation.set(location);
        this.addressData.set({ addressLine1: '', addressLine2: '', ...location });
      }
    }
    if (draft.address) {
      this.addressData.set({
        addressLine1: draft.address.addressLine1,
        addressLine2: draft.address.addressLine2 ?? '',
        city: draft.address.city,
        state: draft.address.state,
        zipCode: draft.address.zipCode,
        county: draft.address.county,
      });
      this.setStepValidity(1, true);
    }
    if (draft.propertyDetails) {
      this.propertyDetailsData.set({
        propertyType: draft.propertyDetails.propertyType,
        bedrooms: draft.propertyDetails.bedrooms,
        bathrooms:
          draft.propertyDetails.fullBathrooms +
          draft.propertyDetails.halfBathrooms * 0.5,
        squareFeet: draft.propertyDetails.squareFeet,
        yearBuilt: draft.propertyDetails.yearBuilt ?? null,
        lotSize: draft.propertyDetails.lotSize ?? null,
        lotSizeUnit: draft.propertyDetails.lotSizeUnit ?? 'acres',
        lotNumber: draft.propertyDetails.lotNumber ?? '',
        blockNumber: draft.propertyDetails.blockNumber ?? '',
        subdivisionName: draft.propertyDetails.subdivisionName ?? '',
        legalDescription: draft.propertyDetails.legalDescription ?? '',
        coloradoPropertyFacts: draft.propertyDetails.coloradoPropertyFacts,
        coloradoAssumableLoan: getStateListingFormRestorer('coloradoAssumableLoan')(draft.propertyDetails.coloradoAssumableLoan),
        description: draft.propertyDetails.description ?? '',
        hoa: draft.hoa
          ? {
            hasHoa: draft.hoa.hasHoa,
            associationName: draft.hoa.associationName ?? '',
            managementCompany: draft.hoa.managementCompany ?? '',
            contactPhone: draft.hoa.contactPhone ?? '',
            feeAmount: draft.hoa.feeAmount ?? null,
            feeFrequency: draft.hoa.feeFrequency ?? '',
          }
          : {
            hasHoa: null,
            associationName: '',
            managementCompany: '',
            contactPhone: '',
            feeAmount: null,
            feeFrequency: '',
          },
        sellerStatements: {
          ...restoreStateListingSellerStatements(draft.sellerStatements),
          contractFacts: draft.sellerStatements?.contractFacts,
          ownershipStatus: draft.sellerStatements?.ownershipStatus ?? '',
          leadBasedPaintApplies:
            draft.sellerStatements?.leadBasedPaintApplies ?? null,
          ownersAssociationApplies:
            draft.sellerStatements?.ownersAssociationApplies ??
            draft.hoa?.hasHoa ??
            null,
          fuelTankPresent: draft.sellerStatements?.fuelTankPresent ?? null,
          fuelTankOwnership: draft.sellerStatements?.fuelTankOwnership ?? '',
          leasesExist: draft.sellerStatements?.leasesExist ?? null,
          residentialLeasesExist:
            draft.sellerStatements?.residentialLeasesExist ?? null,
          fixtureLeasesExist:
            draft.sellerStatements?.fixtureLeasesExist ?? null,
          naturalResourceLeasesExist:
            draft.sellerStatements?.naturalResourceLeasesExist ?? null,
          methamphetamineContaminationKnown:
            draft.sellerStatements?.methamphetamineContaminationKnown ?? null,
          additionalSellerIncluded:
            !!draft.sellerStatements?.additionalSeller,
          additionalSellerLegalName:
            draft.sellerStatements?.additionalSeller?.legalName ?? '',
          additionalSellerEmail:
            draft.sellerStatements?.additionalSeller?.email ?? '',
          additionalSellerPhone:
            draft.sellerStatements?.additionalSeller?.phone ?? '',
        },
      });
      this.setStepValidity(2, true);
    }
    if (draft.enhancements || draft.features) {
      const enhancements: ListingEnhancements = {
        ...(draft.enhancements ?? {}),
      };
      const hasEnhancements = Object.values(enhancements).some(
        (selectedValues) =>
          Array.isArray(selectedValues) && selectedValues.length > 0,
      );
      const legacyFeatures = draft.features as ListingFeatures | undefined;
      const hasLegacyFeatures = legacyFeatures
        ? Object.entries(legacyFeatures).some(
          ([key, value]) =>
            value === true ||
            (key === 'evChargingStatus' && value !== 'none'),
        )
        : false;
      this.propertyFeaturesData.set({
        mode: hasEnhancements || hasLegacyFeatures ? 'add' : 'skip',
        enhancements,
      });
      this.setStepValidity(3, true);
    }
    const restoredPhotos: ListingPhoto[] = [...(draft.photos ?? [])]
      .sort(
        (firstPhoto, secondPhoto) =>
          firstPhoto.sortOrder - secondPhoto.sortOrder,
      )
      .map((photo) => ({
        id: photo.id,
        originalFileName: photo.originalFileName,
        fullImage: {
          blob: null,
          previewUrl: photo.fullImageUrl,
          width: photo.width,
          height: photo.height,
          size: photo.sizeBytes,
          mimeType: 'image/webp',
        },
        thumbnail: {
          blob: null,
          previewUrl: photo.thumbnailUrl,
          width: photo.thumbnailWidth,
          height: photo.thumbnailHeight,
          size: photo.thumbnailSizeBytes,
          mimeType: 'image/webp',
        },
        isPrimary: photo.isPrimary,
        storageReference: photo,
      }));
    this.photosData.set(restoredPhotos);
    if (restoredPhotos.length > 0) {
      this.setStepValidity(4, true);
    }
    if (draft.pricing) {
      this.pricingData.set({
        listPrice: draft.pricing.listPrice,
      });
      this.setStepValidity(5, true);
    }
    this.featuredListing.set(draft.featuredListing);
    this.currentStep.set(
      this.stepNumberFromDraftStep(draft.progress.currentStep),
    );
  }
  private stepNumberFromDraftStep(draftStep: ListingDraftStep): number {
    switch (draftStep) {
      case 'property_details':
        return 2;
      case 'property_features':
        return 3;
      case 'photos':
        return 4;
      case 'pricing':
        return 5;
      case 'review':
        return 6;
      case 'address':
      default:
        return 1;
    }
  }
  protected onStepValidityChange(step: number, isValid: boolean): void {
    this.setStepValidity(step, isValid);
  }
  private setStepValidity(step: number, isValid: boolean): void {
    this.stepValidity.update((validity) => ({
      ...validity,
      [step]: isValid,
    }));
  }
  protected onAddressChange(value: AddressFormValue): void {
    this.addressData.set(value);
    this.saveGuestSession();
    this.invalidateCertification();
  }
  protected onPropertyDetailsChange(value: PropertyDetailsFormValue): void {
    this.propertyDetailsData.set(value);
    this.saveGuestSession();
    this.invalidateCertification();
  }
  protected onPropertyFeaturesChange(value: PropertyFeaturesStepValue): void {
    this.propertyFeaturesData.set(value);
    this.invalidateCertification();
  }
  protected async onPhotosChange(photos: ListingPhoto[]): Promise<void> {
    this.photosData.set(photos);
    this.invalidateCertification();
    const listingUid = this.listingUid();
    const user = auth.currentUser;
    if (!listingUid || !user || this.isSavingPhotos()) {
      return;
    }
    if (photos.length === 0) {
      this.photoSaveError.set('At least one listing photo is required.');
      return;
    }
    this.photoSaveError.set('');
    this.isSavingPhotos.set(true);
    try {
      const references = await this.listingPhotoStorageService.uploadPhotos(
        user.uid,
        listingUid,
        photos,
      );
      await this.listingService.updateDraftPhotos(
        listingUid,
        user.uid,
        references,
        this.completedSteps(),
      );
      this.addCompletedStep('photos');
      const persistedPhotos = photos.map((photo) => {
        const storageReference = references.find(
          (reference) => reference.id === photo.id,
        );
        if (!storageReference) {
          return photo;
        }
        this.revokeTemporaryPhotoUrls(photo);
        return {
          ...photo,
          fullImage: {
            ...photo.fullImage,
            blob: null,
            previewUrl: storageReference.fullImageUrl,
          },
          thumbnail: {
            ...photo.thumbnail,
            blob: null,
            previewUrl: storageReference.thumbnailUrl,
          },
          isPrimary: storageReference.isPrimary,
          storageReference,
        };
      });
      this.photosData.set(persistedPhotos);
    } catch (error) {
      console.error('Failed to save listing photos.', error);
      this.photoSaveError.set(
        error instanceof Error
          ? error.message
          : 'We could not save your listing photos. Please try again.',
      );
    } finally {
      this.isSavingPhotos.set(false);
    }
  }
  protected onPricingChange(value: PricingFormValue): void {
    this.pricingData.set(value);
    this.invalidateCertification();
  }
  protected onFeaturedListingChange(selected: boolean): void {
    this.featuredListing.set(selected);
    this.invalidateCertification();
  }
  protected onCertificationChange(accepted: boolean): void {
    this.certificationAccepted.set(accepted);
    this.setStepValidity(6, accepted);
  }
  protected isCurrentStepValid(): boolean {
    return this.stepValidity()[this.currentStep()] ?? false;
  }
  protected previousStep(): void {
    if (this.currentStep() <= 1 || this.isSaving() || this.isSavingPhotos()) {
      return;
    }
    this.currentStep.update((step) => step - 1);
    this.saveGuestSession();
    this.scrollToTop();
  }
  protected async nextStep(): Promise<void> {
    if (
      !this.isCurrentStepValid() ||
      this.isSaving() ||
      this.isSavingPhotos()
    ) {
      return;
    }
    this.saveError.set('');
    this.isSaving.set(true);
    try {
      if (auth.currentUser && !this.listingUid() && this.currentStep() === 2 &&
          this.guestSession.load()?.currentStep === 2) {
        this.saveGuestSession();
        await this.persistPendingGuestListing(auth.currentUser.uid);
        return;
      }
      if (!auth.currentUser && !this.listingUid()) {
        if (this.currentStep() === 1) {
          this.addCompletedStep('address');
        } else if (this.currentStep() === 2) {
          const seller = this.propertyDetailsData()?.primarySeller;
          if (!seller) throw new Error('Please complete the seller contact information.');
          this.saveGuestSession();
          await this.openEmailVerification();
          return;
        }
      } else {
        await this.saveCurrentStep();
      }
      if (this.currentStep() < this.steps.length) {
        this.currentStep.update((step) => step + 1);
        this.saveGuestSession();
        this.scrollToTop();
      }
    } catch (error) {
      console.error('Failed to save listing step.', error);
      this.saveError.set(
        error instanceof Error
          ? error.message
          : 'We could not save this step. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }
  protected async openEmailVerification(): Promise<void> {
    if (this.sellerEmailVerified()) return;
    const seller = this.propertyDetailsData()?.primarySeller;
    if (!seller?.firstName?.trim() || !seller.lastName?.trim() ||
        !seller.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email.trim()) ||
        seller.phone.replace(/\D/g, '').length !== 10) {
      this.saveError.set('Complete all four primary seller contact fields first.');
      return;
    }
    this.saveGuestSession();
    this.emailVerificationError.set('');
    this.emailVerificationOpen.set(true);
    this.emailVerificationSent.set(false);
    this.emailVerificationCode.set('');
    await this.sendListingOtp();
  }

  protected closeEmailVerification(): void {
    if (!this.emailVerificationBusy()) this.emailVerificationOpen.set(false);
  }

  protected async sendListingOtp(): Promise<void> {
    const email = this.propertyDetailsData()?.primarySeller?.email?.trim().toLowerCase();
    if (!email || this.emailVerificationBusy() || this.sellerEmailVerified()) return;
    this.emailVerificationBusy.set(true);
    this.emailVerificationError.set('');
    try {
      await this.otpService.sendOtp(email);
      this.emailVerificationSent.set(true);
    } catch (error) {
      this.emailVerificationError.set(error instanceof Error ? error.message : 'Could not send the verification code.');
    } finally {
      this.emailVerificationBusy.set(false);
    }
  }

  protected onListingCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = digits;
    this.emailVerificationCode.set(digits);
  }

  protected async verifyListingOtp(): Promise<void> {
    const seller = this.propertyDetailsData()?.primarySeller;
    const email = seller?.email?.trim().toLowerCase();
    if (!seller || !email || !/^\d{6}$/.test(this.emailVerificationCode()) || this.emailVerificationBusy()) return;
    this.emailVerificationBusy.set(true);
    this.emailVerificationError.set('');
    try {
      await this.otpService.verifyOtp(email, this.emailVerificationCode());
      const user = this.authService.currentUser;
      if (!user || user.email?.trim().toLowerCase() !== email) {
        throw new Error('The verified email does not match the primary seller email.');
      }
      const existing = await this.userRepository.getById(user.uid);
      if (!existing) {
        await this.userRepository.create({
          uid: user.uid,
          firstName: seller.firstName.trim(),
          lastName: seller.lastName.trim(),
          displayName: `${seller.firstName.trim()} ${seller.lastName.trim()}`,
          email,
          phone: seller.phone.replace(/\D/g, ''),
          photoURL: null,
          emailVerified: true,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
        });
      } else {
        await this.userRepository.update(user.uid, {
          emailVerified: true,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.accountState.refresh();
      if (!this.accountState.isActive()) throw new Error('Your NavStreet account could not be activated.');
      this.authenticatedEmail.set(email);
      // Email verification is independent of the rest of Section 2.
      // Keep the seller on this step until all required property fields are valid.
      this.emailVerificationOpen.set(false);
      if (!this.stepValidity()[2]) {
        this.saveError.set('Email verified. Complete the remaining required property details, then select Continue.');
        return;
      }
      await this.persistPendingGuestListing(user.uid);
    } catch (error) {
      this.emailVerificationError.set(error instanceof Error ? error.message : 'Verification failed. Try again.');
    } finally {
      this.emailVerificationBusy.set(false);
    }
  }

  protected goToStep(step: number): void {
    if (
      step < this.currentStep() &&
      !this.isSaving() &&
      !this.isSavingPhotos()
    ) {
      this.currentStep.set(step);
      this.saveGuestSession();
      this.scrollToTop();
    }
  }
  private async saveCurrentStep(): Promise<void> {
    const listingUid = this.listingUid();
    const user = auth.currentUser;
    if (!listingUid || !user) {
      throw new Error('Your authenticated listing session could not be found.');
    }
    switch (this.currentStep()) {
      case 1: {
        const address = this.addressData();
        if (!address) {
          throw new Error('Please complete the property address.');
        }
        await this.listingService.saveAddressStep(
          listingUid,
          user.uid,
          address,
        );
        this.addCompletedStep('address');
        return;
      }
      case 2: {
        const propertyDetails = this.propertyDetailsData();
        if (
          !propertyDetails ||
          !propertyDetails.propertyType ||
          (propertyDetails.propertyType !== 'land' && (propertyDetails.bedrooms === null ||
            propertyDetails.bathrooms === null ||
            propertyDetails.squareFeet === null ||
            propertyDetails.yearBuilt === null))
        ) {
          throw new Error('Please complete all required property details.');
        }
        const statements =
          propertyDetails.sellerStatements;
        const stateCode =
          this.addressData()
            ?.state
            ?.trim()
            .toUpperCase() ?? '';
        const statePackage =
          getStateListingPackage(stateCode);
        validateStateListingQuestionAnswers(statePackage, propertyDetails);
        validateListingStatementAnswers(statements, statePackage);
        const { hoaDetails, sellerStatements } = buildListingStatementPayload(
          stateCode, statePackage, statements, propertyDetails.hoa,
        );
        await this.listingService.savePropertyDetailsStep(
          listingUid,
          user.uid,
          {
            propertyType: propertyDetails.propertyType,
            bedrooms: propertyDetails.propertyType === 'land' ? 0 : propertyDetails.bedrooms!,
            fullBathrooms: propertyDetails.propertyType === 'land' ? 0 : Math.floor(propertyDetails.bathrooms!),
            halfBathrooms: propertyDetails.propertyType === 'land' || propertyDetails.bathrooms! % 1 === 0 ? 0 : 1,
            squareFeet: propertyDetails.propertyType === 'land' ? 0 : propertyDetails.squareFeet!,
            ...(propertyDetails.propertyType !== 'land' ? { yearBuilt: propertyDetails.yearBuilt! } : {}),
            lotSize: propertyDetails.lotSize ?? undefined,
            lotSizeUnit:
              propertyDetails.lotSize !== null
                ? propertyDetails.lotSizeUnit
                : undefined,
            lotNumber: propertyDetails.lotNumber.trim() || undefined,
            blockNumber: propertyDetails.blockNumber.trim() || undefined,
            subdivisionName:
              propertyDetails.subdivisionName.trim() || undefined,
            legalDescription:
              propertyDetails.legalDescription.trim() || undefined,
            description: propertyDetails.description,
            coloradoPropertyFacts: this.addressData()?.state === 'CO' ? propertyDetails.coloradoPropertyFacts : undefined,
            coloradoAssumableLoan: getStateListingFormSerializer('coloradoAssumableLoan')(this.addressData()?.state, propertyDetails.coloradoAssumableLoan),
          },
          hoaDetails,
          this.completedSteps(),
          sellerStatements,
        );
        this.addCompletedStep('property_details');
        // Both sections are now durably saved to the authenticated draft.
        this.guestSession.clear();
        return;
      }
      case 3: {
        const propertyFeatures = this.propertyFeaturesData();
        if (!propertyFeatures || propertyFeatures.mode === 'unselected') {
          throw new Error(
            'Please complete the property details and amenities step.',
          );
        }
        await this.listingService.saveEnhancementsStep(
          listingUid,
          user.uid,
          propertyFeatures.enhancements,
          this.completedSteps(),
        );
        this.addCompletedStep('property_features');
        return;
      }
      case 4: {
        const photos = this.photosData();
        if (photos.length === 0) {
          throw new Error('At least one listing photo is required.');
        }
        const references = photos
          .map((photo) => photo.storageReference)
          .filter((reference) => reference !== undefined);
        if (references.length !== photos.length) {
          throw new Error(
            'Your photos are still being saved. Please wait a moment and try again.',
          );
        }
        await this.listingService.updateDraftPhotos(
          listingUid,
          user.uid,
          references,
          this.completedSteps(),
        );
        this.addCompletedStep('photos');
        return;
      }
      case 5: {
        const pricing = this.pricingData();
        if (!pricing || pricing.listPrice === null || pricing.listPrice <= 0) {
          throw new Error('Please enter a valid listing price.');
        }
        await this.listingService.savePricingStep(
          listingUid,
          user.uid,
          {
            listPrice: pricing.listPrice,
          },
          this.featuredListing(),
          this.completedSteps(),
        );
        this.addCompletedStep('pricing');
        return;
      }
      default:
        return;
    }
  }
  protected async completeListing(): Promise<void> {
    if (
      this.isSaving() ||
      this.isSavingPhotos() ||
      !this.isCurrentStepValid()
    ) {
      return;
    }
    if (!this.certificationAccepted()) {
      this.saveError.set(
        'You must accept the seller certification before continuing.',
      );
      return;
    }
    const listingUid = this.listingUid();
    const user = auth.currentUser;
    if (!listingUid || !user) {
      this.saveError.set(
        'Your authenticated listing session could not be found.',
      );
      return;
    }
    this.saveError.set('');
    this.isSaving.set(true);
    try {
      const pricing = this.pricingData();
      if (!pricing || pricing.listPrice === null || pricing.listPrice <= 0) {
        throw new Error('The listing pricing information could not be found.');
      }
      /*
       * Persist the final Featured Listing selection made
       * on the Review step before identity and payment.
       */
      await this.listingService.savePricingStep(
        listingUid,
        user.uid,
        {
          listPrice: pricing.listPrice,
        },
        this.featuredListing(),
        this.completedSteps(),
      );
      await this.listingService.completeListingContent(
        listingUid,
        user.uid,
        true,
      );
      this.addCompletedStep('review');
      this.listingContentComplete.set(true);
      const verification =
        await this.identityVerificationService.startVerification(listingUid);
      if (verification.alreadyVerified) {
        await this.router.navigate(['/sell/listings', listingUid, 'payment'], {
          replaceUrl: true,
        });
        return;
      }
      if (verification.verificationUrl) {
        window.location.assign(verification.verificationUrl);
        return;
      }
      if (verification.status === 'processing') {
        await this.router.navigate(
          ['/sell/listings', listingUid, 'verification-return'],
          {
            replaceUrl: true,
          },
        );
        return;
      }
      throw new Error(
        'Stripe did not provide a verification link. Please try again.',
      );
    } catch (error) {
      console.error(
        'Failed to complete the listing or start identity verification.',
        error,
      );
      this.saveError.set(
        error instanceof Error
          ? error.message
          : 'We could not continue to identity verification. Please try again.',
      );
    } finally {
      this.isSaving.set(false);
    }
  }
  private addCompletedStep(completedStep: ListingDraftStep): void {
    const workflowOrder: ListingDraftStep[] = [
      'address',
      'property_details',
      'property_features',
      'photos',
      'pricing',
      'review',
    ];
    this.completedSteps.update((completedSteps) => {
      const uniqueSteps = new Set([...completedSteps, completedStep]);
      return workflowOrder.filter((step) => uniqueSteps.has(step));
    });
  }
  private invalidateCertification(): void {
    this.certificationAccepted.set(false);
    this.setStepValidity(6, false);
    this.listingContentComplete.set(false);
  }
  private revokeTemporaryPhotoUrls(photo: ListingPhoto): void {
    if (
      photo.fullImage.blob &&
      photo.fullImage.previewUrl.startsWith('blob:')
    ) {
      URL.revokeObjectURL(photo.fullImage.previewUrl);
    }
    if (
      photo.thumbnail.blob &&
      photo.thumbnail.previewUrl.startsWith('blob:')
    ) {
      URL.revokeObjectURL(photo.thumbnail.previewUrl);
    }
  }
  private saveGuestSession(): void {
    // Only a new, not-yet-persisted listing uses the temporary browser backup.
    // Never save data from an existing listing edit to this shared session key.
    if (this.route.snapshot.paramMap.get('listingUid') || this.currentStep() > 2) return;
    this.guestSession.save({
      address: this.addressData(),
      propertyDetails: this.propertyDetailsData(),
      checklistLocation: this.checklistLocation(),
      checklistState: this.checklistState(),
      currentStep: this.currentStep() === 2 ? 2 : 1,
    });
  }

  private scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
