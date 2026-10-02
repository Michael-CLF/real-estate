import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { ZipCodeService } from '../../../../../core/infrastructure/zip/zip-code.service';

import { STATES } from '../../../../../core/configuration/states.config';

import { normalizeDisclosureStateCode } from '../../../../../core/configuration/state-disclosures.config';

import {
  checklistApplicability,
  getChecklistRestrictionMessages,
  getListingDocumentChecklist,
  LISTING_CHECKLIST_STATES,
  ListingChecklistFacts,
} from '../../../../../core/configuration/listing-document-checklist.config';

export interface ListingChecklistLocation {
  readonly zipCode: string;
  readonly city: string;
  readonly state: string;
  readonly county: string;
}

@Component({
  selector: 'app-document-checklist',
  standalone: true,
  templateUrl: './document-checklist.component.html',
  styleUrl: './document-checklist.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentChecklistComponent {
  private readonly zipService = inject(ZipCodeService);

  readonly initialLocation =
    input<ListingChecklistLocation | null>(null);

  readonly facts = input<ListingChecklistFacts>({});

  readonly busy = input(false);

  readonly allowLocationChange = input(true);

  readonly proceed = output<ListingChecklistLocation>();

  protected readonly allStates = STATES;

  protected readonly stage =
    signal<'location' | 'checklist'>('location');

  protected readonly zipCode = signal('');

  protected readonly city = signal('');

  protected readonly selectedState = signal('');

  protected readonly county = signal('');

  protected readonly lookingUp = signal(false);

  protected readonly locationFound = signal(false);

  protected readonly zipError = signal('');

  protected readonly validZip = computed(() =>
    /^\d{5}$/.test(this.zipCode()),
  );

  protected readonly supportedState = computed(() =>
    LISTING_CHECKLIST_STATES.some(
      state => state.abbreviation === this.selectedState(),
    ),
  );

  protected readonly canConfirm = computed(() =>
    this.validZip() &&
    this.locationFound() &&
    this.city().trim().length > 0 &&
    this.supportedState(),
  );

  protected readonly stateName = computed(() =>
    STATES.find(
      state => state.abbreviation === this.selectedState(),
    )?.name ?? this.selectedState(),
  );

  protected readonly items = computed(() =>
    getListingDocumentChecklist(this.selectedState()),
  );

  protected readonly restrictions = computed(() =>
    getChecklistRestrictionMessages(
      this.selectedState(),
      this.facts(),
    ),
  );

  private lookupVersion = 0;

  constructor() {
    effect(() => {
      const location = this.initialLocation();

      if (!location) {
        return;
      }

      const stateCode =
        normalizeDisclosureStateCode(location.state);

      this.zipCode.set(location.zipCode);
      this.city.set(location.city);
      this.selectedState.set(stateCode);
      this.county.set(location.county);
      this.locationFound.set(true);

      const validLocation =
        /^\d{5}$/.test(location.zipCode) &&
        location.city.trim().length > 0 &&
        LISTING_CHECKLIST_STATES.some(
          state => state.abbreviation === stateCode,
        );

      if (validLocation) {
        this.stage.set('checklist');
      }
    });
  }

  protected changeZip(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.lookupVersion++;

    this.zipCode.set(target.value.trim());
    this.locationFound.set(false);
    this.city.set('');
    this.selectedState.set('');
    this.county.set('');
    this.zipError.set('');
  }

  protected changeCity(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.city.set(target.value);
    this.county.set('');
  }

  protected changeState(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    this.selectedState.set(target.value);
    this.county.set('');
  }

  protected applicability(id: string): string {
    return checklistApplicability(id, this.facts());
  }

  protected async findLocation(event: Event): Promise<void> {
    event.preventDefault();

    if (
      this.busy() ||
      this.lookingUp() ||
      !this.validZip()
    ) {
      return;
    }

    const request = ++this.lookupVersion;
    const zip = this.zipCode();

    this.zipError.set('');
    this.lookingUp.set(true);
    this.locationFound.set(false);

    try {
      await this.zipService.load();

      if (request !== this.lookupVersion) {
        return;
      }

      const location = this.zipService.lookup(zip);

      if (location) {
        this.city.set(location.city);

        this.selectedState.set(
          normalizeDisclosureStateCode(location.state),
        );

        this.county.set(location.county);
      } else {
        this.zipError.set(
          'We could not find that ZIP code in our data. ' +
          'Check the ZIP code, then enter the actual city and state below.',
        );

        this.city.set('');
        this.selectedState.set('');
        this.county.set('');
      }

      this.locationFound.set(true);
    } catch {
      if (request !== this.lookupVersion) {
        return;
      }

      this.zipError.set(
        'ZIP lookup is unavailable. ' +
        'Enter the property’s actual city and state below to continue.',
      );

      this.city.set('');
      this.selectedState.set('');
      this.county.set('');
      this.locationFound.set(true);
    } finally {
      this.lookingUp.set(false);
    }
  }

  protected confirmLocation(): void {
    if (!this.canConfirm() || this.busy()) {
      return;
    }

    this.stage.set('checklist');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  protected continueListing(): void {
    if (!this.canConfirm() || this.busy()) {
      return;
    }

    this.proceed.emit({
      zipCode: this.zipCode(),
      city: this.city().trim(),
      state: this.selectedState(),
      county: this.county(),
    });
  }
}