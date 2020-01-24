// @flow string

import fs from 'fs';
import parser from './sanelang';
import type { DocumentNode } from '../ast';

export function parseString(input: string): DocumentNode {
  return parser.parse(input);
}

export function parseFile(path: string) {
  return parseString(fs.readFileSync(path, 'utf-8'));
}
