import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

import { ZipCodeRecord } from './zip-code.model';

@Injectable({
  providedIn: 'root'
})
export class ZipCodeService {

  private readonly http = inject(HttpClient);

  private zipMap = new Map<string, ZipCodeRecord>();

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

    this.zipMap = new Map(Object.entries(data));

    this.loaded = true;

  }

  lookup(zipCode: string): ZipCodeRecord | null {

    return this.zipMap.get(zipCode) ?? null;

  }

}