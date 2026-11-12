import { Injectable } from '@angular/core';
import type { AddressFormValue } from './components/address-step/address-step.component';
import type { PropertyDetailsFormValue } from './components/property-details-step/property-details-step.component';
import type { ListingChecklistLocation } from './components/document-checklist/document-checklist.component';

export interface GuestListingSession {
  address: AddressFormValue | null;
  propertyDetails: PropertyDetailsFormValue | null;
  checklistLocation: ListingChecklistLocation | null;
  checklistState: string;
  currentStep: 1 | 2;
}

/** Short-lived backup for an unpersisted listing, never an authentication store. */
@Injectable({ providedIn: 'root' })
export class GuestListingSessionService {
  private readonly key = 'navstreet:pending-listing:v1';

  load(): GuestListingSession | null {
    try {
      const raw = sessionStorage.getItem(this.key);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const value = parsed as Partial<GuestListingSession>;
      if (value.currentStep !== 1 && value.currentStep !== 2) return null;
      if (typeof value.checklistState !== 'string') return null;
      return {
        address: value.address ?? null,
        propertyDetails: value.propertyDetails ?? null,
        checklistLocation: value.checklistLocation ?? null,
        checklistState: value.checklistState,
        currentStep: value.currentStep,
      };
    } catch {
      return null;
    }
  }

  save(value: GuestListingSession): void {
    try {
      sessionStorage.setItem(this.key, JSON.stringify(value));
    } catch {
      // Storage can be disabled or full. Never block the wizard because of it.
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(this.key);
    } catch {
      // No-op when browser storage is unavailable.
    }
  }
}
