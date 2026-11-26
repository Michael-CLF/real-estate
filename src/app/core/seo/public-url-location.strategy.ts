import { Injectable } from '@angular/core';
import { PathLocationStrategy } from '@angular/common';

@Injectable()
export class PublicUrlLocationStrategy extends PathLocationStrategy {

  override prepareExternalUrl(internal: string): string {
    const normalized = this.normalizePublicUrl(internal);

    return super.prepareExternalUrl(normalized);
  }

  private normalizePublicUrl(url: string): string {
    const match = url.match(/^([^?#]*)(.*)$/);

    if (!match) {
      return url;
    }

    const path = match[1];
    const suffix = match[2];

    const cleanPath = path.replace(/\/+$/, '');

    const publicRoutes = [
      /^\/homes$/,
      /^\/homes\/page\/\d+$/,
      /^\/states\/[a-z0-9-]+$/,
      /^\/listings\/[a-zA-Z0-9_-]+$/,
      /^\/blog(?:\/[a-z0-9-]+)?$/,
      /^\/calculators(?:\/[a-z0-9-]+)?$/,
      /^\/research(?:\/[a-z0-9-]+)?$/,
      /^\/list-house-for-sale-by-owner$/,
      /^\/how-navstreet-works$/,
      /^\/pricing$/,
      /^\/faq$/,
      /^\/contact$/,
      /^\/privacy$/,
      /^\/terms$/
    ];

    if (publicRoutes.some(pattern => pattern.test(cleanPath))) {
      return `${cleanPath}/${suffix}`;
    }

    return url;
  }
}