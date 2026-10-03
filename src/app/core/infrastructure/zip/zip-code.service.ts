import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  firstValueFrom
} from 'rxjs';

import {
  STATES
} from '../../configuration/states.config';

import {
  ZipCodeRecord
} from './zip-code.model';

@Injectable({
  providedIn: 'root'
})
export class ZipCodeService {
  private readonly http =
    inject(HttpClient);

  private zipMap =
    new Map<string, ZipCodeRecord>();

  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const data = await firstValueFrom(
      this.http.get<Record<string, ZipCodeRecord>>(
        'assets/data/zip-data.json'
      )
    );

    this.zipMap =
      new Map(Object.entries(data));

    this.loaded = true;
  }

  lookup(
    zipCode: string
  ): ZipCodeRecord | null {
    return this.zipMap.get(zipCode) ?? null;
  }

  citiesForState(
    stateSlug: string
  ): string[] {
    const state = STATES.find(item =>
      item.slug === stateSlug
    );

    if (!state) {
      return [];
    }

    const cities = [
      ...this.zipMap.values()
    ]
      .filter(record =>
        this.matchesState(
          record,
          state.abbreviation,
          state.name
        )
      )
      .map(record => record.city)
      .filter(Boolean);

    return [...new Set(cities)]
      .sort((first, second) =>
        first.localeCompare(second)
      );
  }

  countiesForCity(
    stateSlug: string,
    city: string
  ): string[] {
    const state = STATES.find(item =>
      item.slug === stateSlug
    );

    if (!state || !city.trim()) {
      return [];
    }

    const counties = [
      ...this.zipMap.values()
    ]
      .filter(record =>
        this.matchesState(
          record,
          state.abbreviation,
          state.name
        ) &&
        record.city.trim().toLowerCase() ===
          city.trim().toLowerCase()
      )
      .map(record => record.county)
      .filter(Boolean);

    return [...new Set(counties)];
  }

  private matchesState(
    record: ZipCodeRecord,
    abbreviation: string,
    name: string
  ): boolean {
    return (
      record.state?.toUpperCase() === abbreviation ||
      record.state?.toLowerCase() === name.toLowerCase()
    );
  }
}