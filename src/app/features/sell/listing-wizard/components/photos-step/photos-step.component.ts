import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';

import {
  ProcessedListingImage
} from '../../../../../core/infrastructure/image-processing/image-processing.models';

import {
  ImageProcessingService
} from '../../../../../core/infrastructure/image-processing/image-processing.service';

export interface ListingPhoto {
  id: string;
  originalFileName: string;
  fullImage: {
    blob: Blob;
    previewUrl: string;
    width: number;
    height: number;
    size: number;
    mimeType: 'image/webp';
  };
  thumbnail: {
    blob: Blob;
    previewUrl: string;
    width: number;
    height: number;
    size: number;
    mimeType: 'image/webp';
  };
  isPrimary: boolean;
}

@Component({
  selector: 'app-photos-step',
  standalone: true,
  imports: [],
  templateUrl: './photos-step.component.html',
  styleUrl: './photos-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotosStepComponent {
  private readonly imageProcessingService =
    inject(ImageProcessingService);

  readonly initialValue = input<ListingPhoto[]>([]);

  readonly validityChange = output<boolean>();
  readonly valueChange = output<ListingPhoto[]>();

  protected readonly photos = signal<ListingPhoto[]>([]);
  protected readonly isProcessing = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly maxPhotos = 20;

  constructor() {
    effect(() => {
      const initialPhotos = this.initialValue();

      this.photos.set(initialPhotos);
      this.validityChange.emit(initialPhotos.length >= 1);
    });
  }

  protected async onFilesSelected(
    event: Event
  ): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    await this.addFiles(
      Array.from(input.files)
    );

    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  protected async onDrop(
    event: DragEvent
  ): Promise<void> {
    event.preventDefault();

    if (!event.dataTransfer?.files.length) {
      return;
    }

    await this.addFiles(
      Array.from(event.dataTransfer.files)
    );
  }

  protected removePhoto(photoId: string): void {
    const currentPhotos = this.photos();

    const photoToRemove = currentPhotos.find(
      photo => photo.id === photoId
    );

    if (photoToRemove) {
      URL.revokeObjectURL(
        photoToRemove.fullImage.previewUrl
      );

      URL.revokeObjectURL(
        photoToRemove.thumbnail.previewUrl
      );
    }

    let updatedPhotos = currentPhotos.filter(
      photo => photo.id !== photoId
    );

    if (
      updatedPhotos.length > 0 &&
      !updatedPhotos.some(photo => photo.isPrimary)
    ) {
      updatedPhotos = updatedPhotos.map(
        (photo, index) => ({
          ...photo,
          isPrimary: index === 0
        })
      );
    }

    this.updatePhotos(updatedPhotos);
  }

  protected setPrimary(photoId: string): void {
    const updatedPhotos = this.photos().map(
      photo => ({
        ...photo,
        isPrimary: photo.id === photoId
      })
    );

    this.updatePhotos(updatedPhotos);
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  private async addFiles(files: File[]): Promise<void> {
    this.errorMessage.set(null);

    const remainingSlots =
      this.maxPhotos - this.photos().length;

    if (remainingSlots <= 0) {
      this.errorMessage.set(
        `You can upload a maximum of ${this.maxPhotos} photos.`
      );

      return;
    }

    const filesToProcess = files.slice(
      0,
      remainingSlots
    );

    if (files.length > remainingSlots) {
      this.errorMessage.set(
        `Only ${remainingSlots} more photo${
          remainingSlots === 1 ? '' : 's'
        } can be added.`
      );
    }

    this.isProcessing.set(true);

    try {
      for (const file of filesToProcess) {
        try {
          const processedImage =
            await this.imageProcessingService.process(file);

          this.addProcessedImage(processedImage);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'An image could not be processed.';

          this.errorMessage.set(message);
        }
      }
    } finally {
      this.isProcessing.set(false);
    }
  }

  private addProcessedImage(
    processedImage: ProcessedListingImage
  ): void {
    const currentPhotos = this.photos();

    const photo: ListingPhoto = {
      id: processedImage.id,
      originalFileName:
        processedImage.originalFileName,
      fullImage: processedImage.fullImage,
      thumbnail: processedImage.thumbnail,
      isPrimary: currentPhotos.length === 0
    };

    this.updatePhotos([
      ...currentPhotos,
      photo
    ]);
  }

  private updatePhotos(
    photos: ListingPhoto[]
  ): void {
    this.photos.set(photos);
    this.valueChange.emit(photos);
    this.validityChange.emit(
      photos.length >= 1
    );
  }
}