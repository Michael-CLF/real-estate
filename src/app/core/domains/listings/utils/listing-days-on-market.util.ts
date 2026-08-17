interface FirestoreTimestampLike {
  toDate(): Date;
}

export function calculateDaysOnMarket(
  publishedAt: unknown,
  currentDate: Date = new Date()
): number {
  const publishedDate =
    convertToDate(publishedAt);

  if (!publishedDate) {
    return 0;
  }

  const publishedDayUtc =
    Date.UTC(
      publishedDate.getFullYear(),
      publishedDate.getMonth(),
      publishedDate.getDate()
    );

  const currentDayUtc =
    Date.UTC(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return Math.max(
    0,
    Math.floor(
      (
        currentDayUtc -
        publishedDayUtc
      ) /
      millisecondsPerDay
    )
  );
}

function convertToDate(
  value: unknown
): Date | null {
  if (value instanceof Date) {
    return isValidDate(value)
      ? value
      : null;
  }

  if (isFirestoreTimestampLike(value)) {
    const convertedDate = value.toDate();

    return isValidDate(convertedDate)
      ? convertedDate
      : null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    const convertedDate =
      new Date(value);

    return isValidDate(convertedDate)
      ? convertedDate
      : null;
  }

  return null;
}

function isFirestoreTimestampLike(
  value: unknown
): value is FirestoreTimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (
      value as FirestoreTimestampLike
    ).toDate === 'function'
  );
}

function isValidDate(
  value: Date
): boolean {
  return !Number.isNaN(
    value.getTime()
  );
}