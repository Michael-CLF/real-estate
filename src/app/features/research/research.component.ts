import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { PageSeoService } from '../../core/seo/page-seo.service';

@Component({
  selector: 'app-research',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './research.component.html',
  styleUrl: './research.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResearchComponent implements OnInit {

  private readonly seo = inject(PageSeoService);

  ngOnInit(): void {

    const url = 'https://navstreet.com/research/';

    const title =
      'Real Estate Research, Housing Data & Market Insights | NavStreet';

    const description =
      'Explore NavStreet real estate research, state-by-state housing market data, potential commission savings and home buying and selling insights.';

    this.seo.setPage({
      title,
      description,
      canonicalUrl: url,

      imageAlt:
        'NavStreet Real Estate Research and Housing Market Insights',

      structuredData: {
        '@context': 'https://schema.org',

        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${url}#webpage`,
            url,
            name: title,
            description,
            inLanguage: 'en-US',

            publisher: {
              '@type': 'Organization',
              name: 'NavStreet',
              url: 'https://navstreet.com/'
            },

            breadcrumb: {
              '@id': `${url}#breadcrumb`
            },

            mainEntity: {
              '@type': 'ItemList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Real Estate Commission Savings by State',
                  url: `${url}real-estate-commission-savings-by-state/`
                }
              ]
            }
          },

          {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumb`,

            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://navstreet.com/'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Research',
                item: url
              }
            ]
          }
        ]
      }
    });
  }
}