import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';

import {
  ListingPhoto
} from '../../../../../core/domains/listings/models/listing-photo.model';

import {
  ListingBadge
} from '../../../../../core/domains/listings/models/listing-badge.model';

import {
  ListingBadgesComponent
} from '../listing-badges/listing-badges.component';

@Component({
  selector: 'app-listing-gallery',
  standalone: true,
  imports: [ListingBadgesComponent],
  templateUrl: './listing-gallery.component.html',
  styleUrl: './listing-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingGalleryComponent {
  readonly photos =
    input.required<readonly ListingPhoto[]>();

  readonly badges =
    input<readonly ListingBadge[]>([]);

  readonly fallbackImageUrl =
    input<string | undefined>();

  readonly listingTitle =
    input.required<string>();

  readonly selectedIndex = signal(0);

  readonly availablePhotos = computed<ListingPhoto[]>(() => {
    const validPhotos = this.photos()
      .filter(photo =>
        this.isUsableImageUrl(photo.url)
      )
      .sort(
        (firstPhoto, secondPhoto) =>
          firstPhoto.sortOrder -
          secondPhoto.sortOrder
      );

    if (validPhotos.length) {
      return validPhotos;
    }

    const fallbackImageUrl =
      this.fallbackImageUrl();

    if (
      !fallbackImageUrl ||
      !this.isUsableImageUrl(fallbackImageUrl)
    ) {
      return [];
    }

    return [
      {
        id: 'featured-fallback',
        listingId: '',
        url: fallbackImageUrl,
        storagePath: '',
        altText: this.listingTitle(),
        sortOrder: 0,
        isFeatured: true,
        createdAt: new Date()
      }
    ];
  });

  readonly selectedPhoto = computed(() => {
    const photos = this.availablePhotos();

    if (!photos.length) {
      return null;
    }

    const safeIndex = Math.min(
      this.selectedIndex(),
      photos.length - 1
    );

    return photos[safeIndex];
  });

  selectPhoto(index: number): void {
    if (
      index >= 0 &&
      index < this.availablePhotos().length
    ) {
      this.selectedIndex.set(index);
    }
  }

  showPreviousPhoto(): void {
    const photoCount =
      this.availablePhotos().length;

    if (photoCount <= 1) {
      return;
    }

    this.selectedIndex.update(currentIndex =>
      currentIndex === 0
        ? photoCount - 1
        : currentIndex - 1
    );
  }

  showNextPhoto(): void {
    const photoCount =
      this.availablePhotos().length;

    if (photoCount <= 1) {
      return;
    }

    this.selectedIndex.update(currentIndex =>
      currentIndex === photoCount - 1
        ? 0
        : currentIndex + 1
    );
  }

  private isUsableImageUrl(
    value: string | undefined
  ): value is string {
    if (!value?.trim()) {
      return false;
    }

    return (
      value.startsWith('https://') ||
      value.startsWith('http://') ||
      value.startsWith('data:image/') ||
      value.startsWith('blob:')
    );
  }
}