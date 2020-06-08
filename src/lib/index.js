// @flow strict

export function indent(n: number, text: string): string {
  return text
    .split('\n')
    .map((line) => ' '.repeat(n) + line)
    .join('\n');
}

export function indentIfMultiLine(
  n: number,
  text: string,
  pre1: string = '',
  suf1: string = '',
  pren: string = '',
  sufn: string = '',
): string {
  return text.includes('\n')
    ? `${pren}${indent(n, text)}${sufn}`
    : `${pre1}${text}${suf1}`;
}

export function sumBy<T>(arr: Array<T>, keyFn: (T) => number): number {
  return arr.reduce((total, cur) => total + keyFn(cur), 0);
}

export function lines(lines: Array<?string>): string {
  return lines.filter((x) => (x != null ? true : false)).join('\n');
}

export function uniq(items: Array<string>): Array<string> {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}
