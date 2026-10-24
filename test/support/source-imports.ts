// Textual extraction of import and export specifiers, shared by the architecture and backend import tests.

/**
 * Source text without comments, with every string literal replaced by `'§<index>'` and every
 * template literal by `` `§` ``, so that regular expressions see neither comments nor quoted text.
 */
export type Scanned = { readonly code: string; readonly strings: readonly string[] };

export function scan(source: string): Scanned {
  const strings: string[] = [];
  let code = '';
  let index = 0;
  const lastSignificant = (): string => code.trimEnd().slice(-1);
  while (index < source.length) {
    const char = source[index] ?? '';
    const next = source[index + 1] ?? '';
    if (char === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index++;
    } else if (char === '/' && next === '*') {
      const close = source.indexOf('*/', index + 2);
      index = close < 0 ? source.length : close + 2;
      code += ' ';
    } else if (char === "'" || char === '"' || char === '`') {
      let value = '';
      index++;
      while (index < source.length && source[index] !== char) {
        if (source[index] === '\\') { value += source.slice(index, index + 2); index += 2; } else { value += source[index]; index++; }
      }
      index++;
      if (char === '`') code += '`§`';
      else { code += `'§${strings.length}'`; strings.push(value); }
    } else if (char === '/' && (lastSignificant() === '' || '(,=:[!&|?{};'.includes(lastSignificant()))) {
      // A regular expression literal: skip it so that quotes or slashes inside it are not misread.
      let inClass = false;
      index++;
      while (index < source.length && (inClass || source[index] !== '/')) {
        if (source[index] === '\\') index++;
        else if (source[index] === '[') inClass = true;
        else if (source[index] === ']') inClass = false;
        index++;
      }
      index++;
      while (/[a-z]/.test(source[index] ?? '')) index++;
      code += '/§/';
    } else {
      code += char;
      index++;
    }
  }
  return { code, strings };
}

/** Specifiers of import ... from, export ... from, side-effect imports and literal dynamic imports. */
export function specifiers({ code, strings }: Scanned): string[] {
  const pattern = /\b(?:import|export)\s[^;'`]*?\bfrom\s*'§(\d+)'|\bimport\s*'§(\d+)'|\bimport\s*\(\s*'§(\d+)'\s*\)/g;
  return [...code.matchAll(pattern)].map(match => strings[Number(match[1] ?? match[2] ?? match[3])] ?? '');
}
