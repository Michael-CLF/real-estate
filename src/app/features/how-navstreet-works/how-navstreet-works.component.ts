import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  AnalyticsDataLayerService
} from '../../core/analytics/analytics-data-layer.service';

import {
  AudiencePathComponent
} from './components/audience-path/audience-path.component';

import {
  CapabilityGridComponent
} from './components/capability-grid/capability-grid.component';

import {
  JourneyTimelineComponent
} from './components/journey-timeline/journey-timeline.component';

import {
  AUDIENCE_PATHS,
  BUYER_JOURNEY_STEPS,
  CAPABILITY_SECTIONS,
  PRODUCT_TOUR_ACTIONS,
  SELLER_JOURNEY_STEPS
} from './how-navstreet-works.config';

import {
  AudiencePath,
  ProductTourAction
} from './models/how-navstreet-works.models';

interface ProductTourQuestion {
  answer: string;
  question: string;
}

@Component({
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  imports: [
    AudiencePathComponent,
    CapabilityGridComponent,
    JourneyTimelineComponent,
    RouterLink
  ],

  selector:
    'app-how-navstreet-works',

  standalone:
    true,

  styleUrl:
    './how-navstreet-works.component.scss',

  templateUrl:
    './how-navstreet-works.component.html'
})
export class HowNavStreetWorksComponent
  implements OnInit {

  private readonly analytics =
    inject(AnalyticsDataLayerService);

  protected readonly audiencePaths =
    AUDIENCE_PATHS;

  protected readonly buyerJourneySteps =
    BUYER_JOURNEY_STEPS;

  protected readonly capabilitySections =
    CAPABILITY_SECTIONS;

  protected readonly productTourActions =
    PRODUCT_TOUR_ACTIONS;

  protected readonly sellerJourneySteps =
    SELLER_JOURNEY_STEPS;

  protected readonly questions:
    readonly ProductTourQuestion[] = [
      {
        answer:
          'The listing process is organized into six clear steps: address, property details, features and amenities, photographs, pricing, and review. Your progress is saved so you can return later.',
        question:
          'How does the listing process work?'
      },
      {
        answer:
          'Sellers can upload as many as 20 photographs, arrange their order and select the primary listing photograph.',
        question:
          'How many photographs can I add?'
      },
      {
        answer:
          'No. Property enhancements are optional. Sellers can add information during listing creation or return to the listing later and continue improving it.',
        question:
          'Do I have to complete every enhancement?'
      },
      {
        answer:
          'A buyer can send a private property-specific message directly from the listing. The seller receives the inquiry information and an email notification.',
        question:
          'How do buyers contact sellers?'
      },
      {
        answer:
          'A buyer can request a preferred showing date and time. The seller can review the request, confirm it, decline it or propose an alternate time.',
        question:
          'How do showing requests work?'
      },
      {
        answer:
          'NavStreet includes mortgage, affordability and closing-cost tools. Calculations are estimates for informational purposes and are not loan approvals or offers of credit.',
        question:
          'Can buyers estimate mortgage costs?'
      },
      {
        answer:
          'The online offer workflow is planned but remains unavailable until the required attorney-approved purchase agreement and supporting process are completed.',
        question:
          'Can buyers submit offers online?'
      },
      {
        answer:
          'NavStreet is currently launching in North Carolina. Visitors in other states can explore state pages and request information about future availability.',
        question:
          'Where is NavStreet available?'
      }
    ];

  ngOnInit(): void {
    this.analytics.track(
      'how_navstreet_works_viewed',
      {
        section_name:
          'product_tour'
      }
    );
  }

  protected trackAction(
    action: ProductTourAction
  ): void {
    this.analytics.track(
      'how_navstreet_cta_clicked',
      {
        cta_name:
          action.analyticsName,

        destination:
          action.destination,

        section_name:
          'final_actions'
      }
    );
  }

  protected trackAudiencePath(
    path: AudiencePath
  ): void {
    this.analytics.track(
      'how_navstreet_path_selected',
      {
        audience_path:
          path.analyticsName,

        destination:
          `#${path.destination}`,

        section_name:
          'audience_paths'
      }
    );
  }
}