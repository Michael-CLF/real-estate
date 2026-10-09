/** Split a value into page-sized pieces using the caller's active PDFKit font. */
export function paginatePdfText(
  pdf: PDFKit.PDFDocument, value: string, width: number, maximumHeight: number, lineGap = 0,
): string[] {
  const result: string[] = [];
  let remaining = value;
  while (remaining) {
    if (pdf.heightOfString(remaining, { width, lineGap }) <= maximumHeight) { result.push(remaining); break; }
    let low = 1; let high = remaining.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (pdf.heightOfString(remaining.slice(0, middle), { width, lineGap }) <= maximumHeight) low = middle;
      else high = middle - 1;
    }
    let end = low;
    const space = remaining.slice(0, end).search(/\s+\S*$/u);
    if (space > end / 2) end = space;
    if (/[\uD800-\uDBFF]/u.test(remaining[end - 1])) end--;
    if (end < 1) throw new Error('PDF text cannot fit the configured page area.');
    result.push(remaining.slice(0, end)); remaining = remaining.slice(end);
  }
  return result;
}
