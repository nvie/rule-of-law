// @flow strict

export function indent(n: number, text: string): string {
  return text
    .split('\n')
    .map(line => ' '.repeat(n) + line)
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
