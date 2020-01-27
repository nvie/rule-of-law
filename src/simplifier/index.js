// @flow strict

import ast from '../ast';
import invariant from 'invariant';
import type {
  ComparisonOperator,
  Node,
  DocumentNode,
  RuleNode,
  PredicateNode,
} from '../ast';

function negateOp(op: ComparisonOperator): ComparisonOperator {
  switch (op) {
    case '=':
      return '!=';
    case '!=':
      return '=';
    case '<':
      return '>=';
    case '<=':
      return '>';
    case '>':
      return '<=';
    case '>=':
      return '<';
    default:
      throw new Error('Unknown operator: ' + op);
  }
}

function simplifyPredicate(node: PredicateNode): PredicateNode {
  switch (node.kind) {
    case 'FieldSelection':
    case 'RelationSelection':
    case 'NumberLiteral':
    case 'BoolLiteral':
    case 'NullLiteral':
    case 'StringLiteral':
      return node;

    case 'Equivalence': {
      return ast.AND([
        simplifyPredicate(ast.Implication(node.left, node.right)),
        simplifyPredicate(ast.Implication(node.right, node.left)),
      ]);
    }

    case 'Implication':
      return simplifyPredicate(
        ast.OR([
          simplifyPredicate(ast.NOT(node.left)),
          simplifyPredicate(node.right),
        ]),
      );

    case 'NOT': {
      const child = node.predicate;
      if (child.kind === 'BoolLiteral') {
        return ast.BoolLiteral(!child.value);
      } else if (child.kind === 'NOT') {
        return simplifyPredicate(child.predicate);
      } else if (child.kind === 'AND') {
        return simplifyPredicate(ast.OR(child.args.map(arg => ast.NOT(arg))));
      } else if (child.kind === 'OR') {
        return simplifyPredicate(ast.AND(child.args.map(arg => ast.NOT(arg))));
      } else if (child.kind === 'ForAll') {
        return ast.Exists(
          child.set,
          child.variable,
          ast.NOT(simplifyPredicate(child.predicate)),
        );
      } else if (child.kind === 'Exists') {
        // NOTE: Contrary to intuition, we'll keep `not exists(x)` expressions
        // around and not simplify them by DeMorgan'ing them into a `forall:
        // not(x)`.  Not exists have a natural SQL equivalent (also named `NOT
        // EXISTS`).
        return ast.NOT(simplifyPredicate(child));
      } else if (child.kind === 'Comparison') {
        return ast.Comparison(negateOp(child.op), child.left, child.right);
      } else if (child.kind === 'Implication') {
        return simplifyPredicate(ast.NOT(simplifyPredicate(child)));
      } else {
        return ast.NOT(simplifyPredicate(child));
      }
    }

    case 'AND': {
      const args = [];
      for (const arg_ of node.args) {
        const arg = simplifyPredicate(arg_);
        if (arg.kind === 'BoolLiteral') {
          if (arg.value === true) {
            // Ignore the true
          } else {
            // Break immediately if one of the args is a known `false`
            return arg;
          }
        } else {
          args.push(arg);
        }
      }

      return args.length > 1
        ? ast.AND(args)
        : args.length > 0
        ? args[0]
        : ast.BoolLiteral(true);
    }

    case 'OR': {
      const args = [];
      for (const arg_ of node.args) {
        const arg = simplifyPredicate(arg_);
        if (arg.kind === 'BoolLiteral') {
          if (arg.value === false) {
            // Ignore the true
          } else {
            // Break immediately if one of the args is a known `true`
            return arg;
          }
        } else {
          args.push(arg);
        }
      }

      return args.length > 1
        ? ast.OR(args)
        : args.length > 0
        ? args[0]
        : ast.BoolLiteral(false);
    }

    case 'ForAll':
      return ast.ForAll(
        node.set,
        node.variable,
        simplifyPredicate(node.predicate),
      );

    case 'Exists':
      return ast.Exists(
        node.set,
        node.variable,
        simplifyPredicate(node.predicate),
      );

    case 'Comparison':
    case 'Identifier':
      return node;

    default:
      throw new Error(
        `Don't know how to simplify predicate nodes of kind ${node.kind}`,
      );
  }
}

function simplifyDocument(node: DocumentNode): DocumentNode {
  return ast.Document(node.rules.map(rule => simplifyRule(rule)));
}

function simplifyRule(node: RuleNode): RuleNode {
  return ast.Rule(node.name, simplifyPredicate(node.predicate));
}

export default function simplify(node: Node): Node {
  switch (node.kind) {
    case 'Equivalence':
    case 'Implication':
    case 'NOT':
    case 'AND':
    case 'OR':
    case 'ForAll':
    case 'Exists':
    case 'Comparison':
    case 'Identifier':
      return simplifyPredicate(node);

    case 'Document':
      return simplifyDocument(node);

    case 'Rule':
      return simplifyRule(node);

    default:
      throw new Error(`Don't know how to simplify nodes of kind ${node.kind}`);
  }
}
