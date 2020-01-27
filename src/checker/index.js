// @flow strict

import fs from 'fs';
import type { Node, IdentifierNode } from '../ast';
import invariant from 'invariant';

type TypeInfo =
  | {| type: 'String', alias?: string |}
  | {| type: 'Int', alias?: string |}
  | {| type: 'Bool', alias?: string |}
  | {| type: 'Null', alias?: string |}
  | {| type: 'TODO', alias?: string |}
  | {|
      type: 'Record',
      alias?: string,
      record: { [string]: TypeInfo }, // e.g. Order, Prescription, etc.
    |};

const Int = (): TypeInfo => ({ type: 'Int' });
const String = (): TypeInfo => ({ type: 'String' });
const Bool = (): TypeInfo => ({ type: 'Bool' });
const Null = (): TypeInfo => ({ type: 'Null' });
const TODO = (): TypeInfo => ({ type: 'TODO' });
const Record = (alias: string, record: { [string]: TypeInfo }): TypeInfo => ({
  type: 'Record',
  alias,
  record,
});

// Some hacks to fake that we already have an external oracle for telling us
// named types
// TODO: Obviously replace this with the real thing later
const OrderType = () =>
  Record('Order', {
    id: Int(),
    orderNo: String(),
    status: String(),
    isEnabled: Bool(),
  });

type Scope = {|
  // All variables defined in this scope
  [string]: TypeInfo,
|};

class Stack {
  _frames: Array<Scope>;

  constructor() {
    this._frames = [];
  }

  push() {
    const emptyScope: Scope = { ...null };
    this._frames.push(emptyScope);
  }

  pop() {
    this._frames.pop();
  }

  getTypeOrNull(name: string): TypeInfo | null {
    for (let i = this._frames.length - 1; i >= 0; i--) {
      const frame = this._frames[i];
      const value = frame[name];
      if (value !== undefined) {
        return value;
      }
    }
    return null;
  }

  getType(name: string): TypeInfo {
    const value = this.getTypeOrNull(name);
    if (value === null) {
      throw new Error(`Unknown variable \`${name}\``);
    }
    return value;
  }

  setType(name: string, value: TypeInfo) {
    const existingValue = this.getTypeOrNull(name);
    if (existingValue !== null) {
      throw new Error(`Variable \`${name}\` already defined.`);
    }
    const currFrame = this._frames[this._frames.length - 1];
    currFrame[name] = value;
  }
}

function check(node: Node, stack: Stack): [Node, TypeInfo] {
  switch (node.kind) {
    case 'Document':
      node.rules.map(node => check(node, stack));
      return node;

    case 'Rule':
      // TODO: Check that node.quantifier is boolean!
      return check(node.quantifier, stack);

    case 'ForAll':
    case 'Exists':
      stack.push();

      const fakeType = OrderType(); // TODO: Replace with a dynamic value
      stack.setType(node.variable.name, fakeType);

      // TODO: Check that node.predicate is boolean!
      const result = check(node.predicate, stack);

      stack.pop();

      return result;

    case 'AND':
    case 'OR':
      for (const [arg, arg_t] of node.args.map(n => check(n, stack))) {
        invariant(arg_t.type === 'Bool', 'Expected a bool argument');
      }
      return [node, Bool()];

    case 'Equivalence':
    case 'Implication': {
      const [left, left_t] = check(node.left, stack);
      const [right, right_t] = check(node.right, stack);
      invariant(
        left_t.type === 'Bool',
        'Expected left side to be boolean expression',
      );
      invariant(
        right_t.type === 'Bool',
        'Expected left side to be boolean expression',
      );
      return [node, Bool()];
    }

    case 'Comparison': {
      const [, left_t] = check(node.left, stack);
      const [, right_t] = check(node.right, stack);
      invariant(
        left_t.type === right_t.type,
        'Expected left/right to be the same type',
      );
      return [node, Bool()];
    }

    case 'Identifier':
      // Check the variable exists
      const type = stack.getType(node.name);
      return [node, type];

    case 'NumberLiteral':
      return [node, Int()];

    case 'StringLiteral':
      return [node, String()];

    case 'NullLiteral':
      return [node, Null()];

    case 'RelationSelection':
    case 'FieldSelection': {
      const [, expr_t] = check(node.expr, stack);
      if (expr_t.type === 'Record') {
        const type = expr_t.record[node.field.name];
        if (type !== undefined) {
          return [node, type];
        }
      }

      throw new Error(
        `${expr_t.alias ?? expr_t.type} has no field \`${node.field.name}\``,
      );
    }

    default:
      throw new Error(
        `Checker not yet implemented for node type "${node.kind}". Please add a case!`,
      );
  }
}

export default function(node: Node): [Node, TypeInfo] {
  return check(node, new Stack());
}
