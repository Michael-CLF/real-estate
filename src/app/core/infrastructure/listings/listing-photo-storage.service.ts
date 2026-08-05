import {
    Injectable
} from '@angular/core';

import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
} from 'firebase/storage';

import {
    storage
} from '../firebase/firebase';

import {
    ListingPhotoReference
} from '../../domains/listings/models/listing.model';

export interface UploadableListingPhoto {
    id: string;
    originalFileName: string;

    fullImage: {
        blob: Blob | null;
        width: number;
        height: number;
        size: number;
        mimeType: 'image/webp';
    };

    thumbnail: {
        blob: Blob | null;
        width: number;
        height: number;
        size: number;
        mimeType: 'image/webp';
    };

    isPrimary: boolean;
    storageReference?: ListingPhotoReference;
}


export interface UploadedListingPhoto {
    reference: ListingPhotoReference;

    fullImageUrl: string;
    thumbnailUrl: string;

    originalFileName: string;
}

@Injectable({
    providedIn: 'root'
})
export class ListingPhotoStorageService {

    async uploadPhotos(
        sellerUid: string,
        listingUid: string,
        photos: UploadableListingPhoto[]
    ): Promise<ListingPhotoReference[]> {
        const references: ListingPhotoReference[] = [];

        for (
            let sortOrder = 0;
            sortOrder < photos.length;
            sortOrder += 1
        ) {
            const photo = photos[sortOrder];

            if (photo.storageReference) {
                references.push({
                    ...photo.storageReference,
                    isPrimary: photo.isPrimary,
                    sortOrder
                });

                continue;
            }

            const uploadedPhoto =
                await this.uploadPhoto(
                    sellerUid,
                    listingUid,
                    photo,
                    sortOrder
                );

            references.push(
                uploadedPhoto.reference
            );
        }

        return references;
    }

    async uploadPhoto(
        sellerUid: string,
        listingUid: string,
        photo: UploadableListingPhoto,
        sortOrder: number
    ): Promise<UploadedListingPhoto> {
        if (!sellerUid) {
            throw new Error(
                'An authenticated seller is required to upload listing photos.'
            );
        }

        if (!listingUid) {
            throw new Error(
                'A listing draft is required before uploading photos.'
            );
        }

        const fullImageBlob =
            photo.fullImage.blob;

        const thumbnailBlob =
            photo.thumbnail.blob;

        if (
            !fullImageBlob ||
            !thumbnailBlob
        ) {
            throw new Error(
                'This listing photo does not contain image data that can be uploaded.'
            );
        }


        const photoFolder =
            this.buildPhotoFolder(
                sellerUid,
                listingUid,
                photo.id
            );

        const fullImageStoragePath =
            `${photoFolder}/full.webp`;

        const thumbnailStoragePath =
            `${photoFolder}/thumbnail.webp`;

        const fullImageReference =
            ref(
                storage,
                fullImageStoragePath
            );

        const thumbnailReference =
            ref(
                storage,
                thumbnailStoragePath
            );

        try {
            await uploadBytes(
                fullImageReference,
                fullImageBlob,
                {
                    contentType:
                        photo.fullImage.mimeType,

                    customMetadata: {
                        sellerUid,
                        listingUid,
                        photoId: photo.id,
                        variant: 'full',
                        originalFileName:
                            photo.originalFileName
                    }
                }
            );

            await uploadBytes(
                thumbnailReference,
                thumbnailBlob,
                {
                    contentType:
                        photo.thumbnail.mimeType,

                    customMetadata: {
                        sellerUid,
                        listingUid,
                        photoId: photo.id,
                        variant: 'thumbnail',
                        originalFileName:
                            photo.originalFileName
                    }
                }
            );

            const [
                fullImageUrl,
                thumbnailUrl
            ] = await Promise.all([
                getDownloadURL(
                    fullImageReference
                ),

                getDownloadURL(
                    thumbnailReference
                )
            ]);

            return {
                reference: {
                    id: photo.id,

                    originalFileName:
                        photo.originalFileName,

                    storagePath:
                        fullImageStoragePath,

                    thumbnailStoragePath,

                    fullImageUrl,
                    thumbnailUrl,

                    isPrimary:
                        photo.isPrimary,

                    sortOrder,

                    width:
                        photo.fullImage.width,

                    height:
                        photo.fullImage.height,

                    sizeBytes:
                        photo.fullImage.size,

                    thumbnailWidth:
                        photo.thumbnail.width,

                    thumbnailHeight:
                        photo.thumbnail.height,

                    thumbnailSizeBytes:
                        photo.thumbnail.size
                },

                fullImageUrl,
                thumbnailUrl,

                originalFileName:
                    photo.originalFileName
            };

        } catch (error) {
            /*
             * If either upload fails, remove any partially
             * uploaded files so Storage is not left with
             * incomplete photo data.
             */
            await Promise.allSettled([
                deleteObject(
                    fullImageReference
                ),

                deleteObject(
                    thumbnailReference
                )
            ]);

            throw error;
        }
    }

    async deletePhoto(
        photo: ListingPhotoReference
    ): Promise<void> {
        const deletionResults =
            await Promise.allSettled([
                deleteObject(
                    ref(
                        storage,
                        photo.storagePath
                    )
                ),

                deleteObject(
                    ref(
                        storage,
                        photo.thumbnailStoragePath
                    )
                )
            ]);

        const failedDeletion =
            deletionResults.find(
                result =>
                    result.status === 'rejected'
            );

        if (failedDeletion) {
            throw new Error(
                'One or more listing photo files could not be removed.'
            );
        }
    }

    async getPhotoUrls(
        photo: ListingPhotoReference
    ): Promise<{
        fullImageUrl: string;
        thumbnailUrl: string;
    }> {
        const [
            fullImageUrl,
            thumbnailUrl
        ] = await Promise.all([
            getDownloadURL(
                ref(
                    storage,
                    photo.storagePath
                )
            ),

            getDownloadURL(
                ref(
                    storage,
                    photo.thumbnailStoragePath
                )
            )
        ]);

        return {
            fullImageUrl,
            thumbnailUrl
        };
    }

    private buildPhotoFolder(
        sellerUid: string,
        listingUid: string,
        photoId: string
    ): string {
        return [
            'listing-images',
            sellerUid,
            listingUid,
            photoId
        ].join('/');
    }
}