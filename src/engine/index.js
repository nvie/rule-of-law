// @flow strict

import ast from '../ast';
import type {
  Node,
  DocumentNode,
  RuleNode,
  PredicateNode,
  ExprNode,
} from '../ast';
import { simplifyPredicate } from '../simplifier';

type Alias = {|
  name: string,
  alias: string,
|};

type SQLCondition =
  | {| type: 'AND', args: Array<SQLCondition> |}
  | {| type: 'OR', args: Array<SQLCondition> |}
  | {| type: 'Atom', raw: string |};

class QueryBuilder {
  comment: string | void;
  selectFields: Array<Alias>;
  fromTables: Array<Alias>;
  whereConditions: Array<SQLCondition>;

  constructor() {
    this.comment = undefined;
    this.selectFields = [];
    this.fromTables = [];
    this.whereConditions = [];
  }

  addComment(comment: string): this {
    this.comment = comment;
    return this;
  }

  addField(name: string, alias: string): this {
    this.selectFields.push({ name, alias });
    return this;
  }

  addTable(name: string, alias: string): this {
    this.fromTables.push({ name, alias });
    return this;
  }

  addCondition(cond: SQLCondition): this {
    this.whereConditions.push(cond);
    return this;
  }
}

function lines(lines: Array<string>): string {
  return lines.join('\n');
}

function wrap(s: string): string {
  return `(${s})`;
}

function predToSQL(node: PredicateNode): string {
  switch (node.kind) {
    case 'NullLiteral':
      return 'NULL';

    case 'BoolLiteral':
    case 'NumberLiteral':
    case 'StringLiteral':
      return JSON.stringify(node.value);

    case 'Identifier':
      return node.name;

    case 'FieldSelection':
      return `${predToSQL(node.expr)}.${predToSQL(node.field)}`;

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

      return `${predToSQL(node.left)} ${op} ${predToSQL(node.right)}`;
    }

    case 'AND':
      return node.args.map(arg => wrap(predToSQL(arg))).join(' AND ');

    case 'OR':
      return node.args.map(arg => wrap(predToSQL(arg))).join(' OR ');

    case 'NOT':
      return `NOT (${predToSQL(node.predicate)})`;

    // case 'ForAll':
    //   return `SELECT * FROM ${predToSQL(node.set)} ${predToSQL(
    //     node.variable,
    //   )} WHERE ${predToSQL(node.predicate)}`;

    case 'Exists':
      return lines([
        'SELECT',
        '  *',
        'FROM',
        `  ${predToSQL(node.set)} ${predToSQL(node.variable)}`,
        'WHERE',
        `  ${predToSQL(node.predicate)}`,
      ]);

    default:
      throw new Error(
        `Don't know how to convert nodes of ${node.kind} to SQL yet`,
      );
  }
}

export function executeRule(rule: RuleNode): string {
  let findCounterExample = false;

  const execNode = simplifyPredicate(
    rule.predicate.kind === 'ForAll' ? ast.NOT(rule.predicate) : rule.predicate,
  );

  return lines([
    `-- ${findCounterExample ? `[counter example] ${rule.name}` : rule.name}`,
    predToSQL(execNode),
  ]);
}

export default function executeDocument(document: DocumentNode): string {
  return document.rules.map(rule => executeRule(rule)).join('\n\n');
}
