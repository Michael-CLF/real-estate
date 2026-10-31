import { Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly siteUrl = 'https://navstreet.com';

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.set(
            'NavStreet',
            'Home listings, education and real estate services on NavStreet.'
          );
        }
      });
  }

  set(
    title: string,
    description: string,
    noIndex = false
  ): void {
    this.title.setTitle(title);

    this.meta.updateTag({
      name: 'description',
      content: description
    });

    this.meta.updateTag({
      name: 'robots',
      content: noIndex
        ? 'noindex, follow'
        : 'index, follow'
    });

    this.updateCanonicalUrl();
  }

  private updateCanonicalUrl(): void {
    const currentUrl = this.router.url.split('#')[0];
    const [path, queryString] = currentUrl.split('?');

    let canonicalPath = path || '/';

    if (canonicalPath !== '/') {
      canonicalPath = canonicalPath.replace(/\/+$/, '');
    }

    if (canonicalPath === '/homes' && queryString) {
      const parameters = new URLSearchParams(queryString);

      const state = parameters.get('state');

      if (state) {
        canonicalPath =
          `/homes?state=${encodeURIComponent(state)}`;
      }
    }

    const canonicalUrl = `${this.siteUrl}${canonicalPath}`;

    let canonical = this.document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);
  }
}