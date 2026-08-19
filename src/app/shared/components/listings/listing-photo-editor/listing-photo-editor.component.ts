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
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray
} from '@angular/cdk/drag-drop';

import {
  ImageProcessingService
} from '../../../../core/infrastructure/image-processing/image-processing.service';

import {
  ListingPhotoReference
} from '../../../../core/domains/listings/models/listing.model';

export interface EditableListingPhoto {
  id: string;
  originalFileName: string;

  fullImage: {
    blob: Blob | null;
    previewUrl: string;
    width: number;
    height: number;
    size: number;
    mimeType: 'image/webp';
  };

  thumbnail: {
    blob: Blob | null;
    previewUrl: string;
    width: number;
    height: number;
    size: number;
    mimeType: 'image/webp';
  };

  isPrimary: boolean;

  storageReference?:
    ListingPhotoReference;
}

@Component({
  selector: 'app-listing-photo-editor',

  standalone: true,

  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList
  ],

  templateUrl:
    './listing-photo-editor.component.html',

  styleUrl:
    './listing-photo-editor.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class ListingPhotoEditorComponent {
  private readonly imageProcessingService =
    inject(ImageProcessingService);

  readonly initialPhotos =
    input<EditableListingPhoto[]>([]);

  readonly disabled =
    input(false);

  readonly photosChange =
    output<EditableListingPhoto[]>();

  readonly validityChange =
    output<boolean>();

  protected readonly photos =
    signal<EditableListingPhoto[]>([]);

  protected readonly isProcessing =
    signal(false);

  protected readonly errorMessage =
    signal('');

  protected readonly maxPhotos = 20;

  constructor() {
    effect(() => {
      const initialPhotos = [
        ...this.initialPhotos()
      ];

      this.photos.set(initialPhotos);

      this.validityChange.emit(
        initialPhotos.length > 0
      );
    });
  }

  protected async onFilesSelected(
    event: Event
  ): Promise<void> {
    const inputElement =
      event.target as HTMLInputElement;

    if (
      this.disabled() ||
      !inputElement.files?.length
    ) {
      return;
    }

    await this.addFiles(
      Array.from(inputElement.files)
    );

    inputElement.value = '';
  }

  protected onUploadDragOver(
    event: DragEvent
  ): void {
    if (this.disabled()) {
      return;
    }

    event.preventDefault();
  }

  protected async onUploadDrop(
    event: DragEvent
  ): Promise<void> {
    if (this.disabled()) {
      return;
    }

    event.preventDefault();

    if (!event.dataTransfer?.files.length) {
      return;
    }

    await this.addFiles(
      Array.from(event.dataTransfer.files)
    );
  }

  protected reorderPhotos(
    event:
      CdkDragDrop<
        EditableListingPhoto[]
      >
  ): void {
    if (
      this.disabled() ||
      event.previousIndex ===
        event.currentIndex
    ) {
      return;
    }

    const reorderedPhotos = [
      ...this.photos()
    ];

    moveItemInArray(
      reorderedPhotos,
      event.previousIndex,
      event.currentIndex
    );

    this.updatePhotos(
      reorderedPhotos
    );
  }

  protected movePhoto(
    photoId: string,
    direction: -1 | 1
  ): void {
    if (this.disabled()) {
      return;
    }

    const reorderedPhotos = [
      ...this.photos()
    ];

    const currentIndex =
      reorderedPhotos.findIndex(
        photo => photo.id === photoId
      );

    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      currentIndex + direction;

    if (
      targetIndex < 0 ||
      targetIndex >=
        reorderedPhotos.length
    ) {
      return;
    }

    moveItemInArray(
      reorderedPhotos,
      currentIndex,
      targetIndex
    );

    this.updatePhotos(
      reorderedPhotos
    );
  }

  protected removePhoto(
    photoId: string
  ): void {
    if (this.disabled()) {
      return;
    }

    const currentPhotos =
      this.photos();

    if (currentPhotos.length <= 1) {
      this.errorMessage.set(
        'A published listing must retain at least one photograph.'
      );

      return;
    }

    const removedPhoto =
      currentPhotos.find(
        photo => photo.id === photoId
      );

    if (
      removedPhoto?.fullImage.blob &&
      removedPhoto.fullImage.previewUrl
        .startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        removedPhoto.fullImage.previewUrl
      );
    }

    if (
      removedPhoto?.thumbnail.blob &&
      removedPhoto.thumbnail.previewUrl
        .startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        removedPhoto.thumbnail.previewUrl
      );
    }

    let updatedPhotos =
      currentPhotos.filter(
        photo => photo.id !== photoId
      );

    if (
      !updatedPhotos.some(
        photo => photo.isPrimary
      )
    ) {
      updatedPhotos =
        updatedPhotos.map(
          (photo, index) => ({
            ...photo,
            isPrimary: index === 0
          })
        );
    }

    this.errorMessage.set('');

    this.updatePhotos(
      updatedPhotos
    );
  }

  protected setPrimary(
    photoId: string
  ): void {
    if (this.disabled()) {
      return;
    }

    const updatedPhotos =
      this.photos().map(photo => ({
        ...photo,
        isPrimary:
          photo.id === photoId
      }));

    this.updatePhotos(
      updatedPhotos
    );
  }

  protected isFirstPhoto(
    photoId: string
  ): boolean {
    return (
      this.photos()[0]?.id ===
      photoId
    );
  }

  protected isLastPhoto(
    photoId: string
  ): boolean {
    const photos =
      this.photos();

    return (
      photos[
        photos.length - 1
      ]?.id === photoId
    );
  }

  protected formatFileSize(
    bytes: number
  ): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${
        (
          bytes / 1024
        ).toFixed(0)
      } KB`;
    }

    return `${
      (
        bytes /
        (1024 * 1024)
      ).toFixed(1)
    } MB`;
  }

  private async addFiles(
    files: File[]
  ): Promise<void> {
    this.errorMessage.set('');

    const existingPhotos =
      this.photos();

    const remainingSlots =
      this.maxPhotos -
      existingPhotos.length;

    if (remainingSlots <= 0) {
      this.errorMessage.set(
        `You can upload a maximum of ${this.maxPhotos} photographs.`
      );

      return;
    }

    const filesToProcess =
      files.slice(
        0,
        remainingSlots
      );

    if (
      files.length >
      remainingSlots
    ) {
      this.errorMessage.set(
        `Only ${remainingSlots} more photograph${
          remainingSlots === 1
            ? ''
            : 's'
        } can be added.`
      );
    }

    this.isProcessing.set(true);

    const processedPhotos:
      EditableListingPhoto[] = [];

    try {
      for (
        const file of filesToProcess
      ) {
        try {
          const processedImage =
            await this
              .imageProcessingService
              .process(file);

          processedPhotos.push({
            id:
              processedImage.id,

            originalFileName:
              processedImage
                .originalFileName,

            fullImage:
              processedImage
                .fullImage,

            thumbnail:
              processedImage
                .thumbnail,

            isPrimary:
              existingPhotos.length === 0 &&
              processedPhotos.length === 0
          });
        } catch (error) {
          this.errorMessage.set(
            error instanceof Error
              ? error.message
              : 'A photograph could not be processed.'
          );
        }
      }

      if (
        processedPhotos.length > 0
      ) {
        this.updatePhotos([
          ...existingPhotos,
          ...processedPhotos
        ]);
      }
    } finally {
      this.isProcessing.set(false);
    }
  }

  private updatePhotos(
    photos:
      EditableListingPhoto[]
  ): void {
    this.photos.set(photos);

    this.photosChange.emit(
      photos
    );

    this.validityChange.emit(
      photos.length > 0
    );
  }
}