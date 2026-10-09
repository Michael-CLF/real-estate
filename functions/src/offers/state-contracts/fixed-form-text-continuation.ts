import { PDFDocument, PDFFont, PDFForm, StandardFonts, rgb } from 'pdf-lib';

const CONTINUATION_REFERENCE = 'See appended continuation page for the complete provisions.';

/** Keep ordinary field mapping; move the entire value to a continuation when it cannot fit. */
export function fixedFormText(value: string | undefined, fieldCount: number, maximumPerField = 105):
  { fields: string[]; continuation: string | undefined } {
  const text = value?.trim() || '';
  const words = text.split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && next.length > maximumPerField) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > fieldCount || lines.some(item => item.length > maximumPerField)) {
    return { fields: [maximumPerField < CONTINUATION_REFERENCE.length ? 'See appended continuation page.' : CONTINUATION_REFERENCE], continuation: text };
  }
  return { fields: lines, continuation: undefined };
}

/** Break long tokens as well as words so every character remains within the page width. */
export function wrapContinuationText(text: string, font: PDFFont, width: number, size: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/u).filter(Boolean)) {
      if (line && font.widthOfTextAtSize(line + ' ' + word, size) <= width) { line += ' ' + word; continue; }
      if (line) { result.push(line); line = ''; }
      let fragment = '';
      for (const character of word) {
        if (fragment && font.widthOfTextAtSize(fragment + character, size) > width) {
          result.push(fragment); fragment = '';
        }
        fragment += character;
      }
      line = fragment;
    }
    result.push(line);
  }
  return result;
}

export async function appendFixedFormTextContinuation(
  pdf: PDFDocument, text: string | undefined, title: string, reference: string
): Promise<void> {
  if (!text) return;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const lines = wrapContinuationText(text, font, 516, 10);
  const pages = Math.ceil(lines.length / 43);
  for (let index = 0; index < pages; index++) {
    const page = pdf.addPage([612, 792]);
    page.drawRectangle({ x: 48, y: 718, width: 516, height: 30, color: rgb(.08, .26, .38) });
    page.drawText(title, { x: 58, y: 729, size: 11, font: bold, color: rgb(1, 1, 1) });
    const references = wrapContinuationText(reference, font, 516, 8);
    // Reference is administrative context; the complete contract text starts below.
    page.drawText(references[0] || '', { x: 48, y: 699, size: 8, font });
    for (const [row, line] of lines.slice(index * 43, (index + 1) * 43).entries()) {
      if (line) page.drawText(line, { x: 48, y: 672 - row * 14, size: 10, font });
    }
    page.drawText('NavStreet - continuation ' + (index + 1) + ' of ' + pages,
      { x: 48, y: 40, size: 8, font });
  }
}

export interface FixedFormTextSection {
  title: string;
  fields: readonly string[];
  value: string | undefined;
  maximumPerField: number;
}

/** One field-writing path and one complete overflow value per named form section. */
export function populateFixedFormTextSections(form: PDFForm, sections: readonly FixedFormTextSection[], font?: PDFFont):
  { title: string; text: string }[] {
  const continuations: { title: string; text: string }[] = [];
  for (const section of sections) {
    const prepared = fixedFormText(section.value, section.fields.length, section.maximumPerField);
    if (font && !prepared.continuation && prepared.fields.some((value, index) =>
      !fitsSingleLine(form.getTextField(section.fields[index]), value, font))) {
      prepared.continuation = section.value?.trim();
      prepared.fields = [continuationReference(form.getTextField(section.fields[0]), font)];
    } else if (font && prepared.continuation) {
      prepared.fields = [continuationReference(form.getTextField(section.fields[0]), font, prepared.fields[0])];
    }
    section.fields.forEach((name, index) => form.getTextField(name).setText(prepared.fields[index] || ''));
    if (prepared.continuation) continuations.push({ title: section.title, text: prepared.continuation });
  }
  return continuations;
}

export async function appendFixedFormTextSections(
  pdf: PDFDocument, sections: readonly { title: string; text: string }[], reference: string
): Promise<void> {
  const seen = new Set<string>();
  for (const section of sections) {
    const key = JSON.stringify([section.title, section.text]);
    if (seen.has(key)) continue;
    seen.add(key);
    await appendFixedFormTextContinuation(pdf, section.text, section.title, reference);
  }
}

export interface SingleLineFixedFormTextSection {
  title: string;
  field: string;
  value: string | undefined;
}

/** Detect clipping at the form's existing font size, without shrinking its text. */
export function populateSingleLineFixedFormTextSections(
  form: PDFForm, sections: readonly SingleLineFixedFormTextSection[], font: PDFFont
): { title: string; text: string }[] {
  const continuations: { title: string; text: string }[] = [];
  for (const section of sections) {
    const field = form.getTextField(section.field);
    const widgets = field.acroField.getWidgets();
    const width = Math.min(...widgets.map(widget => widget.getRectangle().width - 4));
    const appearance = field.acroField.getDefaultAppearance() || '';
    const size = Number(appearance.match(/([0-9.]+)\s+Tf/)?.[1]) || 9;
    const value = section.value ?? '';
    const needsContinuation = /[\r\n]/.test(value) || font.widthOfTextAtSize(value, size) > width;
    if (needsContinuation) {
      field.setText(continuationReference(field, font));
      continuations.push({ title: section.title, text: value });
    } else field.setText(value);
  }
  return continuations;
}

function fieldGeometry(field: ReturnType<PDFForm['getTextField']>) {
  return {
    width: Math.min(...field.acroField.getWidgets().map(widget => widget.getRectangle().width - 4)),
    size: Number((field.acroField.getDefaultAppearance() || '').match(/([0-9.]+)\s+Tf/)?.[1]) || 9,
  };
}
function fitsSingleLine(field: ReturnType<PDFForm['getTextField']>, value: string, font: PDFFont): boolean {
  const { width, size } = fieldGeometry(field);
  return !/[\r\n]/.test(value) && font.widthOfTextAtSize(value, size) <= width;
}
function continuationReference(field: ReturnType<PDFForm['getTextField']>, font: PDFFont, preferred = 'See appended continuation page.'): string {
  for (const text of [preferred, 'See continuation.', 'See page']) {
    if (fitsSingleLine(field, text, font)) return text;
  }
  throw new Error('The form field cannot fit a readable continuation reference.');
}
