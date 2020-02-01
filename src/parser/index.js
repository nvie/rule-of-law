// @flow strict

import invariant from 'invariant';
import parser from './generated-parser';
import colors from 'colors';
import { indent } from '../lib';
import type { Node, DocumentNode, RuleNode, PredicateNode } from '../ast';

export function printFriendlyError(e, input, errorTitle) {
  const lines = input.split('\n');
  const { start, end } = e.location;

  console.log('');
  console.log(
    colors.cyan(`  ${errorTitle} ` + '-'.repeat(73 - errorTitle.length)),
  );
  console.log('');

  for (
    let lineno = Math.max(1, start.line - 3 + 1);
    lineno <= Math.min(end.line + 3, lines.length - 1);
    lineno++
  ) {
    const line = lines[lineno - 1];
    console.log(`${colors.gray(lineno.toString().padStart(5, ' '))}  ${line}`);
    if (lineno >= start.line && lineno <= end.line) {
      // Don't print anything if this is just a whitespace line
      if (line.trim().length > 0) {
        // Four options:
        // - start/end are on the same line
        // - this is the start line
        // - this is an "in between" line
        // - this is the end line
        if (start.line === end.line) {
          console.log(
            indent(
              6 + start.column,
              colors.red('^'.repeat(end.column - start.column - 1)),
            ),
          );
        } else if (lineno === start.line) {
          console.log(
            indent(
              6 + start.column,
              colors.red('^'.repeat(line.length - start.column + 1)),
            ),
          );
        } else if (lineno === end.line) {
          if (end.column > 1) {
            console.log(indent(7, colors.red('^'.repeat(end.column - 1))));
          }
        } else {
          if (line.length > 0) {
            console.log(indent(7, colors.red('^'.repeat(line.length))));
          }
        }
      }
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
      printFriendlyError(e, input, 'Parse error');
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
