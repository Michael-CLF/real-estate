import {
  DOCUMENT,
  isPlatformBrowser
} from '@angular/common';

import {
  inject,
  Injectable,
  PLATFORM_ID
} from '@angular/core';

type AnalyticsValue =
  | string
  | number
  | boolean
  | null;

export type AnalyticsParameters =
  Record<string, AnalyticsValue | undefined>;

type DataLayerEvent = {
  event: string;
} & Record<string, AnalyticsValue>;

type AnalyticsWindow = Window & {
  dataLayer?: DataLayerEvent[];
};

@Injectable({
  providedIn: 'root'
})
export class AnalyticsDataLayerService {
  private readonly document =
    inject(DOCUMENT);

  private readonly platformId =
    inject(PLATFORM_ID);

  track(
    eventName: string,
    parameters: AnalyticsParameters = {}
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const analyticsWindow =
      this.document.defaultView as AnalyticsWindow | null;

    if (!analyticsWindow) {
      return;
    }

    analyticsWindow.dataLayer ??= [];

    const sanitizedParameters =
      Object.fromEntries(
        Object.entries(parameters).filter(
          (
            entry
          ): entry is [
            string,
            AnalyticsValue
          ] => entry[1] !== undefined
        )
      );

    analyticsWindow.dataLayer.push({
      event: eventName,
      ...sanitizedParameters
    });
  }
}