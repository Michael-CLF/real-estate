/** Format US phone numbers consistently in offer forms and party summaries. */
export function formatOfferPhone(value: string, allowPartial = false): string {
  const rawDigits = value.replace(/\D/g, '');
  const hasCountryCode = rawDigits.length === 11 && rawDigits.startsWith('1');
  const digits = (hasCountryCode ? rawDigits.slice(1) : rawDigits).slice(0, 10);

  if (!allowPartial && digits.length !== 10) return value;
  if (!digits) return '';

  let formatted = `(${digits.slice(0, 3)}`;
  if (digits.length > 3) formatted += `) ${digits.slice(3, 6)}`;
  if (digits.length > 6) formatted += `-${digits.slice(6)}`;

  return hasCountryCode ? `+1 ${formatted}` : formatted;
}
