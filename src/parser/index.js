// @flow strict

import fs from 'fs';
import parser from './sanelang'; // The PEGjs generated parser
import type { DocumentNode, RuleNode, PredicateNode } from '../ast';

export function parseDocument(input: string): DocumentNode {
  return parser.parse(input, { startRule: 'Document' });
}

export function parseRule(input: string): RuleNode {
  return parser.parse(input, { startRule: 'Rule' });
}

export function parsePredicate(input: string): PredicateNode {
  return parser.parse(input, { startRule: 'Predicate' });
}

export function parseFile(path: string): DocumentNode {
  return parseDocument(fs.readFileSync(path, 'utf-8'));
}
