
import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import {
  Router,
  NavigationStart,
  NavigationEnd
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface PageSeoConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  imageAlt?: string;
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PageSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly siteUrl = 'https://navstreet.com';

  private explicitCanonicalUrl: string | null = null;

  private readonly socialTags = [
    { selector: 'property="og:type"', attribute: 'property', key: 'og:type' },
    { selector: 'property="og:title"', attribute: 'property', key: 'og:title' },
    { selector: 'property="og:description"', attribute: 'property', key: 'og:description' },
    { selector: 'property="og:url"', attribute: 'property', key: 'og:url' },
    { selector: 'property="og:image"', attribute: 'property', key: 'og:image' },
    { selector: 'property="og:image:alt"', attribute: 'property', key: 'og:image:alt' },
    { selector: 'name="twitter:card"', attribute: 'name', key: 'twitter:card' },
    { selector: 'name="twitter:title"', attribute: 'name', key: 'twitter:title' },
    { selector: 'name="twitter:description"', attribute: 'name', key: 'twitter:description' },
    { selector: 'name="twitter:image"', attribute: 'name', key: 'twitter:image' },
    { selector: 'name="twitter:image:alt"', attribute: 'name', key: 'twitter:image:alt' }
  ] as const;

  private readonly originalSocialTags = this.socialTags.map(tag => ({
    ...tag,
    content: this.meta.getTag(tag.selector)?.content ?? null
  }));

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.explicitCanonicalUrl = null;

          this.set(
            'NavStreet',
            'Home listings, education and real estate services on NavStreet.'
          );

          this.restoreSocialTags();
        }

        if (event instanceof NavigationEnd) {
          this.updateCanonicalUrl();
        }
      });
  }

  /**
   * Existing API. Preserved for all current NavStreet pages.
   */
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
      content: noIndex ? 'noindex, follow' : 'index, follow'
    });

    this.updateCanonicalUrl();
  }

  /**
   * Reusable SEO configuration for prerendered landing pages.
   */
  setPage(config: PageSeoConfig): void {
    const canonicalUrl = new URL(config.canonicalUrl);

    if (
      canonicalUrl.origin !== this.siteUrl ||
      canonicalUrl.search ||
      canonicalUrl.hash
    ) {
      throw new Error('Invalid NavStreet canonical URL');
    }

    this.explicitCanonicalUrl = canonicalUrl.href;

    this.set(
      config.title,
      config.description,
      config.noIndex ?? false
    );

    const imageUrl =
      config.imageUrl ??
      `${this.siteUrl}/assets/images/navstreet-social.png`;

    this.updateSocialTag('property', 'og:type', 'website');
    this.updateSocialTag('property', 'og:title', config.title);
    this.updateSocialTag('property', 'og:description', config.description);
    this.updateSocialTag('property', 'og:url', canonicalUrl.href);
    this.updateSocialTag('property', 'og:image', imageUrl);

    this.updateSocialTag('name', 'twitter:card', 'summary_large_image');
    this.updateSocialTag('name', 'twitter:title', config.title);
    this.updateSocialTag('name', 'twitter:description', config.description);
    this.updateSocialTag('name', 'twitter:image', imageUrl);

    if (config.imageAlt) {
      this.updateSocialTag(
        'property',
        'og:image:alt',
        config.imageAlt
      );

      this.updateSocialTag(
        'name',
        'twitter:image:alt',
        config.imageAlt
      );
    } else {
      this.meta.removeTag('property="og:image:alt"');
      this.meta.removeTag('name="twitter:image:alt"');
    }
  }

  private updateSocialTag(
    attribute: 'name' | 'property',
    key: string,
    content: string
  ): void {
    this.meta.updateTag(
      { [attribute]: key, content },
      `${attribute}="${key}"`
    );
  }

  private restoreSocialTags(): void {
    for (const tag of this.originalSocialTags) {
      if (tag.content === null) {
        this.meta.removeTag(tag.selector);
      } else {
        this.updateSocialTag(
          tag.attribute,
          tag.key,
          tag.content
        );
      }
    }
  }

  private updateCanonicalUrl(): void {
    let canonicalUrl = this.explicitCanonicalUrl;

    if (!canonicalUrl) {
      const currentUrl = this.router.url.split('#')[0];
      const [path, queryString] = currentUrl.split('?');

      let canonicalPath = path || '/';

      if (canonicalPath !== '/') {
        canonicalPath = canonicalPath.replace(/\/+$/, '');

        const requiresTrailingSlash =
          canonicalPath.startsWith('/states/') ||
          canonicalPath === '/list-house-for-sale-by-owner' ||
          canonicalPath === '/homes' ||
          /^\/homes\/page\/\d+$/.test(canonicalPath) ||
          canonicalPath === '/calculators' ||
          canonicalPath.startsWith('/calculators/') ||
          [
            '/contact',
            '/faq',
            '/how-navstreet-works',
            '/pricing',
            '/privacy',
            '/terms'
          ].includes(canonicalPath);

        if (requiresTrailingSlash) {
          canonicalPath += '/';
        }
      }

      // Preserve the existing state-filter canonical behavior.
      if (canonicalPath === '/homes/' && queryString) {
        const parameters = new URLSearchParams(queryString);
        const state = parameters.get('state');

        if (state) {
          canonicalPath =
            `/homes?state=${encodeURIComponent(state)}`;
        }
      }

      canonicalUrl = `${this.siteUrl}${canonicalPath}`;
    }

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
