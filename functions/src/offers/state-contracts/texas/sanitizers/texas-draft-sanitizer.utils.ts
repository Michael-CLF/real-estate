/*texas-draft-sanitizer.utils.ts*/

export type UnknownRecord =
  Record<string, unknown>;


export function asRecord(
  value: unknown
): UnknownRecord {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value as UnknownRecord
    : {};
}


export function section(
  parent: UnknownRecord,
  fieldName: string
): UnknownRecord {
  return asRecord(parent[fieldName]);
}


export function owns(
  data: UnknownRecord,
  fieldName: string
): boolean {
  return Object.prototype.hasOwnProperty.call(
    data,
    fieldName
  );
}


export function text(
  data: UnknownRecord,
  fieldName: string,
  current: string,
  maximumLength: number
): string {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return typeof value === 'string'
    ? value.trim().slice(0, maximumLength)
    : current;
}


export function optionalText(
  data: UnknownRecord,
  fieldName: string,
  current: string | undefined,
  maximumLength: number
): string | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return current;
  }

  const normalized =
    value.trim().slice(0, maximumLength);

  return normalized.length > 0
    ? normalized
    : undefined;
}


export function optionalIdentifier(
  data: UnknownRecord,
  fieldName: string,
  current: string | undefined
): string | undefined {
  const value = optionalText(
    data,
    fieldName,
    current,
    200
  );

  return value && !value.includes('/')
    ? value
    : value === undefined
      ? undefined
      : current;
}


export function booleanValue(
  data: UnknownRecord,
  fieldName: string,
  current: boolean
): boolean {
  if (!owns(data, fieldName)) {
    return current;
  }

  return typeof data[fieldName] === 'boolean'
    ? data[fieldName] as boolean
    : current;
}


export function optionalBoolean(
  data: UnknownRecord,
  fieldName: string,
  current: boolean | undefined
): boolean | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return typeof value === 'boolean'
    ? value
    : current;
}


export function nullableBoolean(
  data: UnknownRecord,
  fieldName: string,
  current: boolean | null
): boolean | null {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'boolean' ||
    value === null
  )
    ? value
    : current;
}


export function nonNegativeInteger(
  data: UnknownRecord,
  fieldName: string,
  current: number
): number {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
    ? value
    : current;
}


export function optionalNonNegativeInteger(
  data: UnknownRecord,
  fieldName: string,
  current: number | undefined
): number | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
    ? value
    : current;
}


export function optionalNumber(
  data: UnknownRecord,
  fieldName: string,
  current: number | undefined,
  minimum: number,
  maximum: number
): number | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  )
    ? value
    : current;
}


export function enumValue<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue,
  allowedValues: readonly TValue[]
): TValue {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'string' &&
    allowedValues.includes(value as TValue)
  )
    ? value as TValue
    : current;
}


export function optionalEnumValue<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue | undefined,
  allowedValues: readonly TValue[]
): TValue | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'string' &&
    allowedValues.includes(value as TValue)
  )
    ? value as TValue
    : current;
}


export function enumArray<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue[],
  allowedValues: readonly TValue[]
): TValue[] {
  if (!owns(data, fieldName)) {
    return [...current];
  }

  const value = data[fieldName];

  if (!Array.isArray(value)) {
    return [...current];
  }

  return Array.from(
    new Set(
      value.filter(
        candidate =>
          typeof candidate === 'string' &&
          allowedValues.includes(
            candidate as TValue
          )
      ) as TValue[]
    )
  );
}
