import { Injectable } from '@angular/core';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../../core/infrastructure/firebase/firebase';

export interface BlogImageUploadResult {
  url: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class BlogImageUploadService {
  async upload(file: File, onProgress: (percent: number) => void): Promise<BlogImageUploadResult> {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Select a JPG, PNG, or WebP image.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('The original image must be 10 MB or smaller.');
    }
    const bitmap = await createImageBitmap(file);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 675;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Image processing is unavailable in this browser.');
      const scale = Math.max(1200 / bitmap.width, 675 / bitmap.height);
      const width = bitmap.width * scale;
      const height = bitmap.height * scale;
      ctx.drawImage(bitmap, (1200 - width) / 2, (675 - height) / 2, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(result => result ? resolve(result) : reject(new Error('WebP conversion failed.')), 'image/webp', 0.82);
      });
      if (blob.type !== 'image/webp') throw new Error('WebP conversion is not supported by this browser.');
      if (blob.size > 2 * 1024 * 1024) throw new Error('Optimized image exceeds the 2 MB upload limit.');
      const path = `blog-images/${crypto.randomUUID()}.webp`;
      const objectRef = ref(storage, path);
      const task = uploadBytesResumable(objectRef, blob, { contentType: 'image/webp' });
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', snapshot => {
          if (snapshot.totalBytes) onProgress(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100));
        }, reject, resolve);
      });
      return { url: await getDownloadURL(objectRef), path };
    } finally {
      bitmap.close();
    }
  }
}
