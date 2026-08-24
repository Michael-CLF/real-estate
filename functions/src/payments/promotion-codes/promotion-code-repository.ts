import {
    adminFirestore
} from '../../shared/firebase-admin';

import type {
    PromotionCodeRecord
} from './promotion-code-types';

const PROMOTION_CODES_COLLECTION =
    'promotionCodes';

export function createPromotionCodeUid():
    string {
    return adminFirestore
        .collection(
            PROMOTION_CODES_COLLECTION
        )
        .doc()
        .id;
}

export async function savePromotionCode(
    promotionCode:
        PromotionCodeRecord
): Promise<void> {
    await adminFirestore
        .collection(
            PROMOTION_CODES_COLLECTION
        )
        .doc(
            promotionCode.uid
        )
        .set(
            promotionCode
        );
}

export async function getPromotionCodeByUid(
    promotionCodeUid: string
): Promise<PromotionCodeRecord | null> {
    const normalizedUid =
        promotionCodeUid.trim();

    if (!normalizedUid) {
        return null;
    }

    const snapshot =
        await adminFirestore
            .collection(
                PROMOTION_CODES_COLLECTION
            )
            .doc(
                normalizedUid
            )
            .get();

    if (!snapshot.exists) {
        return null;
    }

    return mapPromotionCodeRecord(
        snapshot.id,
        snapshot.data()
    );
}

export async function getPromotionCodeByCode(
    code: string
): Promise<PromotionCodeRecord | null> {
    const normalizedCode =
        normalizePromotionCode(code);

    if (!normalizedCode) {
        return null;
    }

    const snapshot =
        await adminFirestore
            .collection(
                PROMOTION_CODES_COLLECTION
            )
            .where(
                'code',
                '==',
                normalizedCode
            )
            .limit(1)
            .get();

    const documentSnapshot =
        snapshot.docs[0];

    if (!documentSnapshot) {
        return null;
    }

    return mapPromotionCodeRecord(
        documentSnapshot.id,
        documentSnapshot.data()
    );
}

export async function listPromotionCodeRecords(
    includeInactive: boolean
): Promise<PromotionCodeRecord[]> {
    const snapshot =
        await adminFirestore
            .collection(
                PROMOTION_CODES_COLLECTION
            )
            .get();

    return snapshot.docs
        .map(documentSnapshot =>
            mapPromotionCodeRecord(
                documentSnapshot.id,
                documentSnapshot.data()
            )
        )
        .filter(
            promotionCode =>
                includeInactive ||
                promotionCode.active
        )
        .sort(
            (
                firstPromotionCode,
                secondPromotionCode
            ) =>
                secondPromotionCode.createdAt
                    .localeCompare(
                        firstPromotionCode.createdAt
                    )
        );
}

export async function updatePromotionCodeRecord(
    promotionCodeUid: string,
    changes:
        Partial<PromotionCodeRecord>
): Promise<PromotionCodeRecord> {
    const normalizedUid =
        promotionCodeUid.trim();

    if (!normalizedUid) {
        throw new Error(
            'A promotion-code UID is required.'
        );
    }

    const documentReference =
        adminFirestore
            .collection(
                PROMOTION_CODES_COLLECTION
            )
            .doc(
                normalizedUid
            );

    await documentReference.update(
        removeUndefinedValues({
            ...changes,
            updatedAt:
                new Date().toISOString()
        })
    );

    const updatedSnapshot =
        await documentReference.get();

    if (!updatedSnapshot.exists) {
        throw new Error(
            'The updated promotion code could not be found.'
        );
    }

    return mapPromotionCodeRecord(
        updatedSnapshot.id,
        updatedSnapshot.data()
    );
}

export function normalizePromotionCode(
    code: string
): string {
    return code
        .trim()
        .toUpperCase()
        .replace(
            /[^A-Z0-9]/g,
            ''
        );
}

function mapPromotionCodeRecord(
    uid: string,
    data:
        FirebaseFirestore.DocumentData |
        undefined
): PromotionCodeRecord {
    if (!data) {
        throw new Error(
            `Promotion-code record ${uid} contains no data.`
        );
    }

    return {
        ...data,
        uid
    } as PromotionCodeRecord;
}

function removeUndefinedValues<
    ValueType
>(
    value: ValueType
): ValueType {
    if (Array.isArray(value)) {
        return value.map(item =>
            removeUndefinedValues(item)
        ) as ValueType;
    }

    if (
        value !== null &&
        typeof value === 'object' &&
        !(value instanceof Date)
    ) {
        return Object.fromEntries(
            Object.entries(value)
                .filter(
                    ([, item]) =>
                        item !== undefined
                )
                .map(
                    ([key, item]) => [
                        key,
                        removeUndefinedValues(
                            item
                        )
                    ]
                )
        ) as ValueType;
    }

    return value;
}