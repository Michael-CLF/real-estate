import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';

type EnhancementStatus = 'not-started' | 'in-progress' | 'added';

interface EnhancementSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: EnhancementStatus;
}

@Component({
  selector: 'app-listing-enhancement',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listing-enhancement.component.html',
  styleUrl: './listing-enhancement.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingEnhancementComponent {
  readonly listingAddress = signal('Your property');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly enhancementSections = signal<EnhancementSection[]>([
    {
      id: 'accessibility',
      title: 'Accessibility',
      description:
        'Describe objective accessibility and aging-in-place features available in the home.',
      icon: 'fa-solid fa-universal-access',
      status: 'not-started',
    },
    {
      id: 'bedrooms-bathrooms',
      title: 'Bedrooms & Bathrooms',
      description:
        'Add primary-suite, closet, vanity, tub, shower, and bathroom comfort details.',
      icon: 'fa-solid fa-bed',
      status: 'not-started',
    },
    {
      id: 'community-amenities',
      title: 'Community Amenities',
      description:
        'Add shared amenities such as pools, clubhouses, trails, fitness facilities, and gated access.',
      icon: 'fa-solid fa-people-roof',
      status: 'not-started',
    },
    {
      id: 'construction',
      title: 'Construction & Exterior',
      description:
        'Add architectural style, exterior materials, roofing, foundation, and structural details.',
      icon: 'fa-solid fa-house-chimney',
      status: 'not-started',
    },
    {
      id: 'interior',
      title: 'Interior & Living Spaces',
      description:
        'Highlight flooring, fireplaces, living areas, offices, bonus rooms, and interior finishes.',
      icon: 'fa-solid fa-couch',
      status: 'not-started',
    },
    {
      id: 'kitchen',
      title: 'Kitchen',
      description:
        'Showcase countertops, appliances, cabinetry, pantry space, lighting, and other kitchen features.',
      icon: 'fa-solid fa-kitchen-set',
      status: 'not-started',
    },
    {
      id: 'outdoor-living',
      title: 'Outdoor Living',
      description:
        'Highlight decks, patios, porches, pools, spas, outdoor kitchens, gardens, and recreation areas.',
      icon: 'fa-solid fa-umbrella-beach',
      status: 'not-started',
    },
    {
      id: 'parking-storage',
      title: 'Parking & Storage',
      description:
        'Describe the garage, carport, driveway, EV charging, workshop, and storage options.',
      icon: 'fa-solid fa-car',
      status: 'not-started',
    },
    {
      id: 'schools',
      title: 'Nearby Schools',
      description:
        'Add assigned elementary, middle, and high school information for buyers to review.',
      icon: 'fa-solid fa-school',
      status: 'not-started',
    },
    {
      id: 'systems-utilities',
      title: 'Systems, Utilities & Efficiency',
      description:
        'Add heating, cooling, water, sewer, energy-efficiency, solar, and generator information.',
      icon: 'fa-solid fa-bolt',
      status: 'not-started',
    },
    {
      id: 'technology-security',
      title: 'Technology & Security',
      description:
        'Identify smart-home technology, structured wiring, security, automation, and connected features.',
      icon: 'fa-solid fa-house-signal',
      status: 'not-started',
    },
  ]);

  readonly addedSectionCount = () =>
    this.enhancementSections().filter(
      (section) => section.status === 'added',
    ).length;

  readonly totalSectionCount = () => this.enhancementSections().length;

  readonly progressPercentage = () => {
    const total = this.totalSectionCount();

    if (total === 0) {
      return 0;
    }

    return Math.round((this.addedSectionCount() / total) * 100);
  };

  async openSection(
    section: EnhancementSection
  ): Promise<void> {
    const listingUid =
      this.route.snapshot.paramMap.get('listingUid');

    if (!listingUid) {
      return;
    }

    await this.router.navigate([
      '/sell/listings',
      listingUid,
      'enhancements',
      section.id
    ]);
  }

  statusLabel(status: EnhancementStatus): string {
    switch (status) {
      case 'added':
        return 'Added';

      case 'in-progress':
        return 'In Progress';

      default:
        return 'Not Started';
    }
  }

  sectionActionLabel(status: EnhancementStatus): string {
    return status === 'not-started' ? 'Add Details' : 'Edit Details';
  }

  trackSection(
    _index: number,
    section: EnhancementSection,
  ): string {
    return section.id;
  }
}