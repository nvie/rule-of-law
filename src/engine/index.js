// @flow strict

import ast, { isLiteralNode, isExprNode } from '../ast';
import invariant from 'invariant';
import { lines, indent, uniq } from '../lib';
import { simplifyPredicate } from '../simplifier';
import format from '../formatter';
import type {
  DocumentNode,
  ExprNode,
  LiteralNode,
  Node,
  PredicateNode,
  RuleNode,
  Location,
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

export type ExecutionMode = 'FIND_EXAMPLE' | 'FIND_COUNTER_EXAMPLE' | 'SKIP';

export type RuleOutput = {|
  rule: string,
  body: string,
  mode: ExecutionMode,
  sql: string,
  location: Location,
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

/**
 * Generates SQL for the given rule, but leaves execution of the SQL up to the
 * caller (since there can be many DBs, or execution preferences).
 *
 * The `limit` argument dictates how many counter examples will be produced
 * maximally.  Setting limit = null means explicitly no limit.
 */
export function executeRule(rule: RuleNode, limit: number | null): RuleOutput {
  let mode =
    rule.predicate.kind === 'ForAll' ? 'FIND_COUNTER_EXAMPLE' : 'FIND_EXAMPLE';

  const execNode = simplifyPredicate(
    mode === 'FIND_COUNTER_EXAMPLE' ? ast.NOT(rule.predicate) : rule.predicate,
  );

  const sql = sqlToString(
    predToSQLParts(execNode),
    mode === 'FIND_COUNTER_EXAMPLE' ? limit ?? undefined : 1,
  );

  const location = rule.location;
  invariant(location, 'Expected a location');
  return {
    rule: rule.name,
    body: format(rule.predicate),
    mode: rule.flags.skip ? 'SKIP' : mode,
    sql,
    location,
  };
}

export default function executeDocument(
  document: DocumentNode,
  limit: number | null,
): Array<RuleOutput> {
  return document.rules.map(rule => executeRule(rule, limit));
}
