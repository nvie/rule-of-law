// @flow strict

import type { Node } from '../ast';
import { indent, lines, sumBy } from '../lib';

const WRAP_WIDTH = 70;

function wrapInParens(text: string): string {
  return text.includes('\n') ? '(\n' + indent(2, text) + '\n)' : `(${text})`;
}

/**
 * Formats the given subnode, and wraps it in parens only if it has
 * a precedence level higher than the current level.  If not, then it won't
 * wrap, for readability reasons.
 */
function wrap(subnode: Node, currnode: Node): string {
  const str = format(subnode);
  return subnode.level && currnode.level && subnode.level < currnode.level
    ? wrapInParens(str)
    : str;
}

export default function format(node: Node): string {
  switch (node.kind) {
    case 'Document':
      return node.rules.map(rule => format(rule)).join('\n\n');

    case 'Rule':
      return lines([
        `rule ${JSON.stringify(node.name)}`,
        indent(2, format(node.predicate)),
      ]);

    case 'ForAll':
      return lines([
        `forall ${node.set.name} ${node.variable.name}:`,
        indent(2, wrap(node.predicate, node)),
      ]);

    case 'Exists':
      return lines([
        `exists ${node.set.name} ${node.variable.name}:`,
        indent(2, wrap(node.predicate, node)),
      ]);

    case 'AND': {
      const legs = node.args.map(arg => `${wrap(arg, node)}`);
      return legs.join(
        legs.some(
          t => t.includes('\n') || sumBy(legs, t => t.length) > WRAP_WIDTH,
        )
          ? '\nand\n'
          : ' and ',
      );
    }

    case 'OR': {
      const legs = node.args.map(arg => `${wrap(arg, node)}`);
      return legs.join(
        legs.some(
          t => t.includes('\n') || sumBy(legs, t => t.length) > WRAP_WIDTH,
        )
          ? '\nor\n'
          : ' or ',
      );
    }

    case 'NOT':
      return `not ${wrap(node.predicate, node)}`;

    case 'Comparison':
      return `${format(node.left)} ${node.op} ${format(node.right)}`;

    case 'FieldSelection':
      return `${format(node.expr)}.${format(node.field)}`;

    case 'Identifier':
      return node.name;

    case 'NullLiteral':
      return 'NULL';

    case 'NumberLiteral':
    case 'StringLiteral':
      return JSON.stringify(node.value);

    default:
      throw new Error("Don't know how to format node of kind: " + node.kind);
  }
}
