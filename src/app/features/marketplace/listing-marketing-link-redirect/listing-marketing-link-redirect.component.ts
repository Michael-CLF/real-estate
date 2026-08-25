import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  ListingMarketingService
} from '../../../core/domains/listings/services/listing-marketing.service';

@Component({
  selector:
    'app-listing-marketing-link-redirect',

  standalone:
    true,

  imports: [
    RouterLink
  ],

  template: `
    <main class="marketing-link">
      @if (loadError()) {
        <section
          class="marketing-link__card"
          role="alert"
        >
          <span
            class="marketing-link__icon
                   marketing-link__icon--error"
            aria-hidden="true"
          >
            <i
              class="fa-solid fa-link-slash"
            ></i>
          </span>

          <p class="marketing-link__eyebrow">
            Listing unavailable
          </p>

          <h1>
            We couldn’t open this property
          </h1>

          <p>
            {{ loadError() }}
          </p>

          <a
            class="marketing-link__button"
            routerLink="/homes"
          >
            Browse homes
          </a>
        </section>
      } @else {
        <section
          class="marketing-link__card"
          aria-live="polite"
        >
          <span
            class="marketing-link__icon"
            aria-hidden="true"
          >
            <i
              class="fa-solid fa-spinner fa-spin"
            ></i>
          </span>

          <p class="marketing-link__eyebrow">
            NavStreet property
          </p>

          <h1>
            Opening this listing
          </h1>

          <p>
            Please wait while we connect you to
            the property.
          </p>
        </section>
      }
    </main>
  `,

  styles: [`
    :host {
      display: block;
    }

    .marketing-link {
      display: grid;
      min-height: 65vh;
      padding: 2rem 1rem;
      place-items: center;
      color: #102e45;
      background: #f4f7f9;
    }

    .marketing-link__card {
      width: min(100%, 620px);
      padding: 3rem 2rem;
      border: 1px solid #cfdae3;
      border-radius: 16px;
      text-align: center;
      background: #ffffff;
      box-shadow:
        0 16px 40px
        rgba(15, 50, 73, 0.09);
    }

    .marketing-link__icon {
      display: grid;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      margin: 0 auto 1.25rem;
      place-items: center;
      color: #008f88;
      background: #e7f7f5;
      font-size: 1.3rem;
    }

    .marketing-link__icon--error {
      color: #b42318;
      background: #feeceb;
    }

    .marketing-link__eyebrow {
      margin: 0 0 0.5rem;
      color: #008f88;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      color: #0d3048;
      font-size: clamp(2rem, 6vw, 2.75rem);
      line-height: 1.1;
    }

    .marketing-link__card > p:last-of-type {
      margin: 1rem auto 0;
      color: #5e7486;
      line-height: 1.6;
    }

    .marketing-link__button {
      display: inline-flex;
      min-height: 46px;
      padding: 0.75rem 1.25rem;
      margin-top: 1.5rem;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: #ffffff;
      background: #154360;
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 600px) {
      .marketing-link__card {
        padding: 2.25rem 1.25rem;
      }

      .marketing-link__button {
        width: 100%;
      }
    }
  `],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingMarketingLinkRedirectComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly marketingService =
    inject(ListingMarketingService);

  protected readonly loadError =
    signal('');

  async ngOnInit(): Promise<void> {
    const shareCode =
      this.route.snapshot.paramMap.get(
        'shareCode'
      ) ?? '';

    if (!shareCode) {
      this.loadError.set(
        'This listing link is invalid.'
      );

      return;
    }

    try {
      const result =
        await this.marketingService.resolveLink(
          shareCode
        );

      await this.router.navigateByUrl(
        result.listingPath,
        {
          replaceUrl: true
        }
      );
    } catch (error: unknown) {
      this.loadError.set(
        error instanceof Error
          ? error.message
          : 'This listing link is unavailable.'
      );
    }
  }
}