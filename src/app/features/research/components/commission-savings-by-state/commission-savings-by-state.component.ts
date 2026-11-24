import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PageSeoService } from '../../../../core/seo/page-seo.service';

import researchData from '../../data/commission-savings-by-state.json';

import usa from '@svg-maps/usa';

interface StateResearchRecord {
  state: string;
  stateCode: string;
  period: string;
  medianSalePrice: number;
  source: string;
  sourceUrl: string;
  sourceNote: string;
  listingFee: number;
  commission15: number;
  savings15: number;
  commission20: number;
  savings20: number;
  commission25: number;
  savings25: number;
  commission30: number;
  savings30: number;
}

type CommissionRate = 1.5 | 2 | 2.5 | 3;

type SortOption =
  | 'state-asc'
  | 'price-desc'
  | 'price-asc'
  | 'savings-desc'
  | 'savings-asc';

@Component({
  selector: 'app-commission-savings-by-state',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './commission-savings-by-state.component.html',
  styleUrl: './commission-savings-by-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommissionSavingsByStateComponent implements OnInit {

  private readonly seo = inject(PageSeoService);

  readonly states: readonly StateResearchRecord[] =
    researchData.states;

  readonly listingFee = 49;

  readonly commissionRates: readonly CommissionRate[] =
    [1.5, 2, 2.5, 3];

  readonly selectedRate = signal<CommissionRate>(3);

  readonly searchTerm = signal('');

  readonly sortOption = signal<SortOption>('savings-desc');

  readonly stateCount = this.states.length;

  readonly mapSelection = signal('');
  readonly mapPreview = signal('');
  readonly mapViewBox = usa.viewBox;

  readonly researchUrl =
    'https://navstreet.com/research/real-estate-commission-savings-by-state/';

  readonly researchCitation =
    'NavStreet Research. (2026). ' +
    'How Much Could You Save Selling Your Home Without a Realtor? ' +
    'A 50-State Analysis. ' +
    this.researchUrl;

  readonly citationStatus = signal('');
  readonly reportLinkStatus = signal('');

  readonly mapColors = [
    '#D1EAE7',
    '#80C8C0',
    '#008080',
    '#086479',
    '#154360'
  ] as const;

  readonly calculatedStates = computed(() =>
    this.states.map(state => ({
      ...state,
      estimatedCommission:
        state.medianSalePrice * this.selectedRate() / 100,
      potentialSavings:
        state.medianSalePrice * this.selectedRate() / 100
        - this.listingFee
    }))
  );

  readonly mapStates = computed(() => {
    const byCode = new Map(
      this.calculatedStates().map(state => [
        state.stateCode,
        state
      ])
    );

    return usa.locations.flatMap(location => {
      const code = location.id.toUpperCase();
      const state = byCode.get(code);

      return state
        ? [{
          ...state,
          code,
          path: location.path
        }]
        : [];
    });
  });

  readonly activeMapState = computed(() =>
    this.mapStates().find(state => state.code === (this.mapPreview() || this.mapSelection()))
  );

  mapBand(savings: number): number {
    if (savings < 5000) return 0;
    if (savings < 10000) return 1;
    if (savings < 15000) return 2;
    if (savings < 20000) return 3;
    return 4;
  }

  mapColor(savings: number): string {
    return this.mapColors[this.mapBand(savings)]
      ?? this.mapColors[0];
  }

  handleMapKey(event: Event, code: string): void {
    const keyboardEvent = event as KeyboardEvent;

    if (
      keyboardEvent.key === 'Enter' ||
      keyboardEvent.key === ' '
    ) {
      keyboardEvent.preventDefault();
      this.selectMapState(code);
    }

    if (keyboardEvent.key === 'Escape') {
      this.mapSelection.set('');
      this.mapPreview.set('');
    }
  }

  selectMapState(code: string): void {
    this.mapSelection.set(this.mapSelection() === code ? '' : code);
    this.searchTerm.set('');
  }

  readonly rankedStates = computed(() =>
    [...this.calculatedStates()].sort(
      (a, b) => b.potentialSavings - a.potentialSavings
    )
  );

  readonly highestSavings = computed(() =>
    this.rankedStates()[0]
  );

  readonly lowestSavings = computed(() =>
    this.rankedStates()[this.rankedStates().length - 1]
  );

  readonly averageSavings = computed(() => {
    const states = this.calculatedStates();

    if (!states.length) {
      return 0;
    }

    return states.reduce(
      (total, state) => total + state.potentialSavings,
      0
    ) / states.length;
  });

  readonly topFiveStates = computed(() =>
    this.rankedStates().slice(0, 5)
  );

  readonly maximumSavings = computed(() =>
    Math.max(this.highestSavings()?.potentialSavings ?? 0, 1)
  );

  readonly filteredStates = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();

    const selectedState = this.mapSelection();

    const states = this.calculatedStates().filter(state =>
      (!selectedState || state.stateCode === selectedState) &&
      (
        state.state.toLowerCase().includes(search) ||
        state.stateCode.toLowerCase().includes(search)
      )
    );

    switch (this.sortOption()) {

      case 'state-asc':
        return states.sort(
          (a, b) => a.state.localeCompare(b.state)
        );

      case 'price-desc':
        return states.sort(
          (a, b) => b.medianSalePrice - a.medianSalePrice
        );

      case 'price-asc':
        return states.sort(
          (a, b) => a.medianSalePrice - b.medianSalePrice
        );

      case 'savings-asc':
        return states.sort(
          (a, b) => a.potentialSavings - b.potentialSavings
        );

      default:
        return states.sort(
          (a, b) => b.potentialSavings - a.potentialSavings
        );
    }
  });

  ngOnInit(): void {

    const url = this.researchUrl;

    const headline =
      'How Much Could You Save Selling Your Home Without a Realtor? A 50-State Analysis';

    const title =
      'Real Estate Commission Savings by State (2026) | NavStreet';

    const description =
      'Compare potential real estate listing-agent commission savings across all 50 states using October 2026 median home sale prices and four negotiable commission scenarios.';

    const sources = Array.from(
      new Map(
        this.states.map(state => [
          state.sourceUrl,
          {
            '@type': 'CreativeWork',
            name: state.source,
            url: state.sourceUrl
          }
        ])
      ).values()
    );

    this.seo.setPage({
      title,
      description,
      canonicalUrl: url,
      ogType: 'article',

      imageAlt:
        'NavStreet 50-state real estate commission savings research',

      structuredData: {
        '@context': 'https://schema.org',

        '@graph': [
          {
            '@type': 'Article',
            '@id': `${url}#article`,

            headline,
            description,
            url,
            inLanguage: 'en-US',

            mainEntityOfPage: url,

            author: {
              '@type': 'Organization',
              name: 'NavStreet Research',
              url: 'https://navstreet.com/research/'
            },

            publisher: {
              '@type': 'Organization',
              name: 'NavStreet',
              url: 'https://navstreet.com/'
            },

            articleSection: 'Real Estate Research',

            keywords: [
              'Real estate commission savings',
              'For sale by owner',
              'FSBO',
              'Home selling costs',
              'Real estate commission by state',
              'Housing market data'
            ],

            citation: sources,

            about: {
              '@id': `${url}#dataset`
            }
          },

          {
            '@type': 'Dataset',
            '@id': `${url}#dataset`,

            name:
              '2026 Real Estate Commission Savings by State',

            alternateName:
              'NavStreet 50-State Commission Savings Analysis',

            description:
              'State-level median home sale prices and illustrative listing-agent commission savings for all 50 United States, calculated using commission scenarios of 1.5%, 2%, 2.5% and 3%, less a $49 NavStreet listing fee.',

            url,
            inLanguage: 'en-US',

            creator: {
              '@type': 'Organization',
              name: 'NavStreet Research',
              url: 'https://navstreet.com/research/'
            },

            publisher: {
              '@type': 'Organization',
              name: 'NavStreet',
              url: 'https://navstreet.com/'
            },

            temporalCoverage: '2026-10',

            spatialCoverage: {
              '@type': 'Country',
              name: 'United States'
            },

            keywords: [
              'Real estate',
              'Housing market',
              'Median home sale price',
              'Real estate commissions',
              'Commission savings',
              'For sale by owner',
              'United States'
            ],

            measurementTechnique:
              'State median home sale price multiplied by an illustrative listing-agent commission percentage, minus the $49 NavStreet listing fee.',

            variableMeasured: [
              {
                '@type': 'PropertyValue',
                name: 'Median home sale price',
                unitText: 'USD'
              },
              {
                '@type': 'PropertyValue',
                name: 'Illustrative listing-agent commission rate',
                unitText: 'Percent'
              },
              {
                '@type': 'PropertyValue',
                name: 'Estimated listing-agent commission',
                unitText: 'USD'
              },
              {
                '@type': 'PropertyValue',
                name: 'NavStreet listing fee',
                unitText: 'USD'
              },
              {
                '@type': 'PropertyValue',
                name: 'Potential commission savings',
                unitText: 'USD'
              }
            ],

            isBasedOn: sources,

            isAccessibleForFree: true
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
                item: 'https://navstreet.com/research/'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Real Estate Commission Savings by State',
                item: url
              }
            ]
          }
        ]
      }
    });
  }

  setCommissionRate(rate: CommissionRate): void {
    this.selectedRate.set(rate);
  }

  setSearchTerm(value: string): void {
    this.mapSelection.set('');
    this.searchTerm.set(value);
  }

  setSortOption(value: SortOption): void {
    this.sortOption.set(value);
  }

  resetFilters(): void {
    this.mapSelection.set('');
    this.mapPreview.set('');
    this.selectedRate.set(3);
    this.searchTerm.set('');
    this.sortOption.set('savings-desc');
  }

  barWidth(savings: number): number {
    return Math.max(
      0,
      Math.min(100, savings / this.maximumSavings() * 100)
    );
  }
  downloadResearchCsv(): void {
    const headers = [
      'State',
      'State Code',
      'Reporting Period',
      'Median Home Sale Price',
      'NavStreet Listing Fee',
      'Estimated Commission 1.5%',
      'Potential Savings 1.5%',
      'Estimated Commission 2%',
      'Potential Savings 2%',
      'Estimated Commission 2.5%',
      'Potential Savings 2.5%',
      'Estimated Commission 3%',
      'Potential Savings 3%',
      'Data Source',
      'Source URL',
      'Source Notes'
    ];

    const rows = [...this.states]
      .sort((a, b) => a.state.localeCompare(b.state))
      .map(state => [
        state.state,
        state.stateCode,
        state.period,
        state.medianSalePrice,
        state.listingFee,
        state.commission15,
        state.savings15,
        state.commission20,
        state.savings20,
        state.commission25,
        state.savings25,
        state.commission30,
        state.savings30,
        state.source,
        state.sourceUrl,
        state.sourceNote
      ]);

    const escapeCsv = (value: unknown): string => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const period = this.states[0]?.period ?? 'latest';

    link.href = url;
    link.download =
      `navstreet-commission-savings-by-state-${period}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async copyResearchCitation(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        this.researchCitation
      );

      this.citationStatus.set('Citation copied!');
      this.reportLinkStatus.set('');
    } catch {
      this.citationStatus.set(
        'Unable to copy. Please select and copy the citation manually.'
      );
    }
  }

  async copyResearchLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(
        this.researchUrl
      );

      this.reportLinkStatus.set('Report link copied!');
      this.citationStatus.set('');
    } catch {
      this.reportLinkStatus.set(
        'Unable to copy. Please copy the URL from your address bar.'
      );
    }
  }
}