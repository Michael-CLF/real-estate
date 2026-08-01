export interface ProcessedListingImage {
  id: string;
  originalFileName: string;
  fullImage: ProcessedImageVariant;
  thumbnail: ProcessedImageVariant;
}

export interface ProcessedImageVariant {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  size: number;
  mimeType: 'image/webp';
}

export interface ImageProcessingOptions {
  maxFullDimension: number;
  maxThumbnailDimension: number;
  fullQuality: number;
  thumbnailQuality: number;
  maxInputFileSize: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}