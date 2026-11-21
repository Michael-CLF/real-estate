const PROPERTIES = new Set(('color background background-color border border-color border-style border-width border-radius border-top border-bottom border-left border-right border-collapse border-spacing box-shadow padding padding-top padding-right padding-bottom padding-left margin margin-top margin-right margin-bottom margin-left width max-width min-width height max-height min-height display grid-template-columns grid-template-rows grid-column grid-row gap row-gap column-gap align-items justify-content flex flex-direction flex-wrap flex-grow flex-shrink font-family font-size font-weight font-style line-height letter-spacing text-align text-decoration text-transform vertical-align white-space overflow overflow-x overflow-y overflow-wrap word-break object-fit opacity').split(' '));
const PREFIX = '.navstreet-custom-article';
export function scopeArticleCss(input: string): string {
  if (typeof input !== 'string' || input.length > 20000) throw new Error('Custom CSS must be at most 20,000 characters.');
  if (!input.trim()) return '';
  if (/[\\<>]/.test(input) || /\/\*|\*\/|@import|@font-face|@keyframes|url\s*\(|expression\s*\(|var\s*\(|!important|behavior\s*:|--[\w-]+/i.test(input)) throw new Error('Custom CSS contains an unsupported or unsafe construct.');
  function parse(source: string): string {
    let output = '', cursor = 0;
    while (cursor < source.length) {
      while (/\s/.test(source[cursor] ?? '') && cursor < source.length) cursor++;
      if (cursor >= source.length) break;
      const open = source.indexOf('{', cursor);
      if (open < 0) throw new Error('CSS rule is missing an opening brace.');
      const selector = source.slice(cursor, open).trim();
      let depth = 1, end = open + 1;
      while (end < source.length && depth) { if (source[end] === '{') depth++; if (source[end] === '}') depth--; end++; }
      if (depth) throw new Error('CSS rule is missing a closing brace.');
      const body = source.slice(open + 1, end - 1);
      if (selector.startsWith('@')) {
        if (!/^@media\s*\(\s*(?:max|min)-width\s*:\s*\d{2,4}px\s*\)$/i.test(selector)) throw new Error('Only simple responsive @media width rules are supported.');
        output += `${selector}{${parse(body)}}`;
      } else {
        if (body.includes('{') || body.includes('}')) throw new Error('Nested CSS rules are not supported.');
        const scoped = selector.split(',').map(s => {
          s = s.trim();
          if (!s || s.length > 160 || /[:#\[\]@*+~|]/.test(s) || /(?:^|\s)(?:html|body|head|:root|app-root)(?:\s|$)/i.test(s) || !/^[a-zA-Z0-9_.\s>-]+$/.test(s)) throw new Error(`Unsupported CSS selector: ${s}`);
          return `${PREFIX} ${s}`;
        }).join(', ');
        const declarations = body.split(';').map(part => part.trim()).filter(Boolean).map(part => {
          const colon = part.indexOf(':');
          if (colon < 1) throw new Error('Invalid CSS declaration.');
          const name = part.slice(0, colon).trim().toLowerCase(), value = part.slice(colon + 1).trim();
          if (!PROPERTIES.has(name) || !value || value.length > 300 || /[{};<>\\@]/.test(value) || /(?:url|expression|var|calc|attr|image-set)\s*\(/i.test(value) || /!/.test(value)) throw new Error(`Unsupported CSS property or value: ${name}`);
          return `${name}:${value}`;
        });
        if (!declarations.length) throw new Error('CSS rule has no declarations.');
        output += `${scoped}{${declarations.join(';')}}`;
      }
      cursor = end;
    }
    return output;
  }
  return parse(input);
}
