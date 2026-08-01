import { Injectable } from '@angular/core';

import {
  ImageDimensions,
  ImageProcessingOptions,
  ProcessedImageVariant,
  ProcessedListingImage
} from './image-processing.models';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {
  private readonly supportedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp'
  ]);

  private readonly options: ImageProcessingOptions = {
    maxFullDimension: 1920,
    maxThumbnailDimension: 700,
    fullQuality: 0.82,
    thumbnailQuality: 0.78,
    maxInputFileSize: 20 * 1024 * 1024
  };

  async process(file: File): Promise<ProcessedListingImage> {
    this.validateFile(file);

    const image = await this.loadImage(file);

    try {
      const fullDimensions = this.calculateDimensions(
        image.naturalWidth,
        image.naturalHeight,
        this.options.maxFullDimension
      );

      const thumbnailDimensions = this.calculateDimensions(
        image.naturalWidth,
        image.naturalHeight,
        this.options.maxThumbnailDimension
      );

      const fullImage = await this.createVariant(
        image,
        fullDimensions,
        this.options.fullQuality
      );

      const thumbnail = await this.createVariant(
        image,
        thumbnailDimensions,
        this.options.thumbnailQuality
      );

      return {
        id: crypto.randomUUID(),
        originalFileName: file.name,
        fullImage,
        thumbnail
      };
    } finally {
      URL.revokeObjectURL(image.src);
    }
  }

  private validateFile(file: File): void {
    if (!this.supportedTypes.has(file.type)) {
      throw new Error(
        'Unsupported image type. Please upload a JPEG, PNG, or WebP image.'
      );
    }

    if (file.size > this.options.maxInputFileSize) {
      throw new Error(
        'This image is too large. Please upload an image smaller than 20 MB.'
      );
    }
  }

  private loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(
          new Error(
            'The selected image could not be read. Please choose another image.'
          )
        );
      };

      image.src = objectUrl;
    });
  }

  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxDimension: number
  ): ImageDimensions {
    if (
      originalWidth <= maxDimension &&
      originalHeight <= maxDimension
    ) {
      return {
        width: originalWidth,
        height: originalHeight
      };
    }

    const scale = Math.min(
      maxDimension / originalWidth,
      maxDimension / originalHeight
    );

    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale)
    };
  }

  private async createVariant(
    image: HTMLImageElement,
    dimensions: ImageDimensions,
    quality: number
  ): Promise<ProcessedImageVariant> {
    const canvas = document.createElement('canvas');

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error(
        'Your browser could not process this image.'
      );
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.drawImage(
      image,
      0,
      0,
      dimensions.width,
      dimensions.height
    );

    const blob = await this.canvasToWebP(
      canvas,
      quality
    );

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: dimensions.width,
      height: dimensions.height,
      size: blob.size,
      mimeType: 'image/webp'
    };
  }

  private canvasToWebP(
    canvas: HTMLCanvasElement,
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (!blob) {
            reject(
              new Error(
                'The image could not be converted to WebP.'
              )
            );

            return;
          }

          resolve(blob);
        },
        'image/webp',
        quality
      );
    });
  }
}