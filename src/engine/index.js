// @flow strict

import ast, { isLiteralNode, isExprNode } from '../ast';
import type {
  Node,
  DocumentNode,
  RuleNode,
  PredicateNode,
  ExprNode,
} from '../ast';
import { lines } from '../lib';
import { simplifyPredicate } from '../simplifier';

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

function exprToSQL(node: ExprNode): string {
  if (isLiteralNode(node)) {
    if (node.kind === 'NullLiteral') {
      return 'NULL';
    } else {
      return JSON.stringify(node.value);
    }
  }

  switch (node.kind) {
    case 'Identifier':
      return node.name;

    case 'Comparison':
      return `(${exprToSQL(node.left)}) ${node.op} (${exprToSQL(node.right)})`;

    case 'FieldSelection':
      return `${exprToSQL(node.expr)}.${exprToSQL(node.field)}`;

    default:
      throw new Error(
        `Don't know how to simplify expr nodes of kind ${node.kind}`,
      );
  }
}

function predToSQLParts(node: PredicateNode): SQLParts {
  if (isExprNode(node)) {
    return {
      fields: [],
      tables: [],
      condition: exprToSQL(node),
    };
  }

  switch (node.kind) {
    case 'FieldSelection': {
      const expr = `${exprToSQL(node.expr)}.${exprToSQL(node.field)}`;
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
      return {
        ...result,
        condition: `NOT (${result.condition})`,
      };
    }

    // case 'ForAll':
    //   return `SELECT * FROM ${predToSQLParts(node.set)} ${predToSQLParts(
    //     node.variable,
    //   )} WHERE ${predToSQLParts(node.predicate)}`;

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

function sqlToString(sql: SQLParts, limit: number): string {
  return lines([
    'SELECT',
    indent(
      2,
      uniq(sql.fields)
        .map(f => `${f} AS \`${f}\``)
        .join(',\n'),
    ),
    'FROM',
    indent(
      2,
      uniq(sql.tables.map(alias => `${alias.name} ${alias.alias}`)).join(',\n'),
    ),
    'WHERE',
    indent(2, sql.condition),
    `LIMIT ${limit}`,
  ]);
}

export function executeRule(rule: RuleNode): string {
  let counterExampleMode = rule.predicate.kind === 'ForAll';

  const execNode = simplifyPredicate(
    counterExampleMode ? ast.NOT(rule.predicate) : rule.predicate,
  );

  return lines([
    `-- ${counterExampleMode ? `[counter example] ${rule.name}` : rule.name}`,
    sqlToString(predToSQLParts(execNode), counterExampleMode ? 10 + 1 : 1),
  ]);
}

export default function executeDocument(document: DocumentNode): string {
  return document.rules.map(rule => executeRule(rule)).join('\n\n');
}
