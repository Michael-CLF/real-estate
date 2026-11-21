
import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageSeoService } from '../../../../core/seo/page-seo.service';

@Component({
  selector: 'app-list-by-owner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './list-by-owner.component.html',
  styleUrl: './list-by-owner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListByOwnerComponent {
  private readonly pageSeo = inject(PageSeoService);

  constructor() {
    this.pageSeo.setPage({
      title: 'List Your House for Sale by Owner Online for $49 | NavStreet',
      description:
        'Sell your home for just $49 with NavStreet. Create your for-sale-by-owner listing, access marketing tools, and connect directly with buyers without paying a listing agent commission.',
      canonicalUrl:
        'https://navstreet.com/list-house-for-sale-by-owner/',
      imageUrl:
        'https://navstreet.com/assets/images/navstreet-social.png',
      imageAlt:
        'NavStreet - List your house for sale by owner online for $49'
    });
  }

  readonly faqs = [
    {
      question: 'How much does it cost to list my home on NavStreet?',
      answer: 'The standard property listing costs $49. Optional enhancements, if selected, may cost extra.',
    },
    {
      question: 'Do I need a real estate agent to list my property?',
      answer: 'No. NavStreet is designed to help homeowners advertise their property for sale by owner. You remain responsible for your sale and any professional services you choose to use.',
    },
    {
      question: 'Can buyers contact me directly?',
      answer: 'NavStreet supports buyer inquiries and showing requests, giving you tools to communicate with interested buyers.',
    },
    {
      question: 'Does the $49 listing include MLS placement?',
      answer: 'No. NavStreet is an independent property advertising platform; a NavStreet listing is not an MLS listing.',
    },
    {
      question: 'Will I still have closing costs or other selling expenses?',
      answer: 'Possibly. Closing costs, professional fees, negotiated buyer-agent compensation, and other expenses depend on your transaction and location.',
    },
  ] as const;
}
