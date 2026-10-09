import { HttpsError } from 'firebase-functions/v2/https';

/** Existing submission primitives; state validators retain their requirements and messages. */
export const requireValue = (condition: unknown, message: string): void => { if (!condition) throw new HttpsError('failed-precondition', message); };
export const money = (n: number, positive = false) => Number.isSafeInteger(n) && (positive ? n > 0 : n >= 0);
export const days = (n: number, min: number, max: number) => Number.isSafeInteger(n) && n >= min && n <= max;
export const date = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
