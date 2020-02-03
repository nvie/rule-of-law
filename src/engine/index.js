// @flow strict

import ast, { isLiteralNode, isExprNode } from '../ast';
import invariant from 'invariant';
import { lines } from '../lib';
import { simplifyPredicate } from '../simplifier';
import type {
  DocumentNode,
  ExprNode,
  LiteralNode,
  Node,
  PredicateNode,
  RuleNode,
} from '../ast';

type Alias = {|
  name: string,
  alias: string,
|};

type SQLParts = {|
  fields: Array<string>,
  tables: Array<Alias>,
  condition: string,
|};

function wrap(s: string): string {
  return `(${s})`;
}

function wrapS(s: SQLParts): SQLParts {
  return { ...s, condition: wrap(s.condition) };
}

function simpleNodeToSQL(node: PredicateNode): string | null {
  if (node.kind === 'NullLiteral') {
    return 'NULL';
  } else if (isLiteralNode(node)) {
    return JSON.stringify(node.value);
  } else if (node.kind === 'Identifier') {
    return node.name;
  }

  return null;
}

function predToSQLParts(node: PredicateNode): SQLParts {
  const simple = simpleNodeToSQL(node);
  if (simple !== null) {
    return {
      fields: [],
      tables: [],
      condition: simple,
    };
  }

  switch (node.kind) {
    case 'FieldSelection': {
      const expr1 = simpleNodeToSQL(node.expr);
      const expr2 = simpleNodeToSQL(node.field);

      invariant(
        expr1 !== null && expr2 !== null,
        'Expected both to be non-null',
      );
      const expr = `${expr1}.${expr2}`;
      return {
        fields: [expr],
        tables: [],
        condition: expr,
      };
    }

    case 'Comparison': {
      let op = node.op;

      // Special-case handling for NULLs in SQL
      if (node.right.kind === 'NullLiteral') {
        switch (op) {
          case '=':
            op = 'IS';
            break;
          case '!=':
            op = 'IS NOT';
            break;
          default:
            throw new Error('Operator incompatible with NULL right hand side');
        }
      }

      const left = predToSQLParts(node.left);
      const right = predToSQLParts(node.right);
      return {
        fields: [...left.fields, ...right.fields],
        tables: [...left.tables, ...right.tables],
        condition: `${left.condition} ${op} ${right.condition}`,
      };
    }

    case 'AND': {
      const legs = node.args.map(arg => wrapS(predToSQLParts(arg)));
      return legs.reduce((result, leg) => ({
        fields: [...result.fields, ...leg.fields],
        tables: [...result.tables, ...leg.tables],
        condition: `${result.condition} AND ${leg.condition}`,
      }));
    }

    case 'OR': {
      const legs = node.args.map(arg => wrapS(predToSQLParts(arg)));
      return legs.reduce((result, leg) => ({
        fields: [...result.fields, ...leg.fields],
        tables: [...result.tables, ...leg.tables],
        condition: `${result.condition} OR ${leg.condition}`,
      }));
    }

    case 'NOT': {
      const result = predToSQLParts(node.predicate);

      if (node.predicate.kind === 'Exists') {
        // Here, a big trick needs to happen!
        // We'll generate a `NOT EXISTS (...)` subquery here.  We'll do this by
        // first evaluating the sub-expression to a full-blown query (with all
        // the query parts), but then removing any field selection and NOT'ing
        // the entire result.

        const subquery = sqlToString({
          ...result,
          fields: [], // Leads to "SELECT NULL FROM ..." in the subquery
        });
        return {
          fields: [],
          tables: [],
          condition: lines(['NOT EXISTS (', indent(2, subquery), ')']),
        };
      } else {
        return {
          ...result,
          condition: `NOT (${result.condition})`,
        };
      }
    }

    case 'Exists':
      const result = predToSQLParts(node.predicate);
      return {
        fields: [
          // Add PKs here
          // TODO: Don't hard-code `id` eventually, but for now this is fine
          node.variable.name + '.id',
          ...result.fields,
        ],
        tables: [
          { name: node.set.name, alias: node.variable.name },
          ...result.tables,
        ],
        condition: result.condition,
      };

    default:
      throw new Error(
        `Don't know how to convert nodes of ${node.kind} to SQL yet`,
      );
  }
}

// TODO: DRY THIS UP
function indent(n: number, text: string): string {
  return text
    .split('\n')
    .map(line => ' '.repeat(n) + line)
    .join('\n');
}

function uniq(items: Array<string>): Array<string> {
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

function sqlToString(sql: SQLParts, limit?: number): string {
  return lines([
    'SELECT',
    indent(
      2,
      uniq(sql.fields)
        .map(f => `${f} AS \`${f}\``)
        .join(',\n') || 'null',
    ),
    'FROM',
    indent(
      2,
      uniq(sql.tables.map(alias => `${alias.name} ${alias.alias}`)).join(',\n'),
    ),
    'WHERE',
    indent(2, sql.condition),
    limit ? `LIMIT ${limit}` : null,
  ]);
}

export function executeRule(rule: RuleNode): string {
  let counterExampleMode = rule.predicate.kind === 'ForAll';

  const execNode = simplifyPredicate(
    counterExampleMode ? ast.NOT(rule.predicate) : rule.predicate,
  );

  return lines([
    `-- ${rule.name}`,
    counterExampleMode
      ? `-- The following query will select all COUNTER EXAMPLES`
      : null,
    sqlToString(predToSQLParts(execNode), counterExampleMode ? undefined : 1),
  ]);
}

export default function executeDocument(document: DocumentNode): string {
  return document.rules.map(rule => executeRule(rule)).join('\n\n');
}
