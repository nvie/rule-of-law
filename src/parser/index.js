// @flow strict

import fs from 'fs';
import invariant from 'invariant';
import parser from './generated-parser';
import colors from 'colors';
import { indent } from '../lib';
import type { Node, DocumentNode, RuleNode, PredicateNode } from '../ast';

function printFriendlyError(e, input) {
  const lines = input.split('\n');
  const { start, end } = e.location;

  console.log('');
  console.log(colors.cyan(`  Parse error ` + '-'.repeat(62)));
  console.log('');

  for (
    let lineno = Math.max(1, start.line - 3 + 1);
    lineno <= Math.min(end.line + 3, lines.length - 1);
    lineno++
  ) {
    // offset, line, column
    console.log(
      `${colors.gray(lineno.toString().padStart(5, ' '))}  ${
        lines[lineno - 1]
      }`,
    );
    if (lineno === start.line) {
      console.log(indent(6 + start.column, colors.red('^')));
    }
  }

  console.log('');
  console.log(indent(4, colors.red(e.message)));
  console.log('');
}

function parseString(input, options = {}): Node | void {
  try {
    return parser.parse(input, options);
  } catch (e) {
    /**
     * If this is a parse error (due to a syntax error), report this in
     * a visually pleasing manner in the console.
     */
    if (/SyntaxError/.test(e)) {
      printFriendlyError(e, input);
      process.exit(1);
    } else {
      throw e;
    }
  }
}

export function parseDocument(input: string): DocumentNode {
  const node = parseString(input, { startRule: 'Document' });
  invariant(node && node.kind === 'Document', 'Expected a Document');
  return node;
}

export function parseRule(input: string): RuleNode {
  const node = parseString(input, { startRule: 'Rule' });
  invariant(node && node.kind === 'Rule', 'Expected a Rule');
  return node;
}

export function parsePredicate(input: string): PredicateNode {
  const node = parseString(input, { startRule: 'Predicate' });
  invariant(node && node.kind === 'Predicate', 'Expected a Predicate');
  return node;
}

export function parseFile(path: string): DocumentNode {
  return parseDocument(fs.readFileSync(path, 'utf-8'));
}
