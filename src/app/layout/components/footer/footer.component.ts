import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import {
  RouterLink
} from '@angular/router';

interface FooterLink {
  label: string;
  route: string;
}

interface FooterSection {
  links: FooterLink[];
  title: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink
  ],
  selector: 'app-footer',
  standalone: true,
  styleUrl: './footer.component.scss',
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly footerSections: FooterSection[] = [
    {
      links: [
        {
          label: 'About',
          route: '/about'
        },
        {
          label: 'Contact',
          route: '/contact'
        },
        {
          label: 'Careers',
          route: '/careers'
        }
      ],
      title: 'Company'
    },
    {
      links: [
        {
          label: 'Buy a Home',
          route: '/buy'
        },
        {
          label: 'Sell a Home',
          route: '/sell'
        },
        {
          label: 'Mortgage',
          route: '/mortgage'
        }
      ],
      title: 'Services'
    },
    {
      links: [
        {
          label: 'Mortgage Calculators',
          route: '/mortgage/calculator'
        },
        {
          label: 'Affordability Calculator',
          route: '/mortgage/affordability'
        },
        {
          label: 'Closing Cost Calculator',
          route: '/mortgage/closing-costs'
        }
      ],
      title: 'Resources'
    },
    {
      links: [
        {
          label: 'Privacy Policy',
          route: '/privacy'
        },
        {
          label: 'Terms of Use',
          route: '/terms'
        },
        {
          label: 'Accessibility',
          route: '/accessibility'
        }
      ],
      title: 'Legal'
    }
  ];
}