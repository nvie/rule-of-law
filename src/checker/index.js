// @flow strict

import fs from 'fs';
import type { Location, Node, IdentifierNode } from '../ast';
import type { TypeInfo } from '../types';
import t from '../types';
import invariant from 'invariant';

export class TypeCheckError extends Error {
  location: Location | void;

  constructor(msg: string, location?: Location) {
    super(msg);
    this.location = location;
  }
}

// Some hacks to fake that we already have an external oracle for telling us
// named types
// TODO: Obviously replace this with the real thing later
const FakeRecordType = (alias: string) =>
  t.Record(
    {
      id: t.Int(),
      str: t.String(),
      dateCompleted: t.Nullable(t.Date()),
      date_completed: t.Nullable(t.Date()),
      preferred_generic_product_id: t.Nullable(t.Int()),
      equivalent_primary_product_id: t.Nullable(t.Int()),
      maybeStr: t.Nullable(t.String()),
      maybeInt: t.Nullable(t.Int()),
      maybeBool: t.Nullable(t.Bool()),
      orderNo: t.String(),
      status: t.String(),
      isEnabled: t.Bool(),
      ndc: t.Int(),
      isForPlaceboSkipping: t.Bool(),
    },
    alias,
  );

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

  setType(name: string, value: TypeInfo) {
    const existingValue = this.getTypeOrNull(name);
    if (existingValue !== null) {
      throw new Error(`Variable \`${name}\` already defined.`);
    }
    const currFrame = this._frames[this._frames.length - 1];
    currFrame[name] = value;
  }
}

function isPrimitive(type: TypeInfo): boolean %checks {
  return (
    type.type === 'Int' ||
    type.type === 'String' ||
    type.type === 'Bool' ||
    type.type === 'Null'
  );
}

function isCompatible(type1: TypeInfo, type2: TypeInfo): boolean {
  if (isPrimitive(type1) && isPrimitive(type2)) {
    return type1.type === type2.type;
  }

  if (
    (type1.type === 'Null' && type2.type === 'Null') ||
    (type1.type === 'Nullable' && type2.type === 'Null') ||
    (type2.type === 'Nullable' && type1.type === 'Null')
  )
    return true;

  if (type1.type === 'Nullable') {
    return isCompatible(type1.ofType, type2);
  } else if (type2.type === 'Nullable') {
    return isCompatible(type1, type2.ofType);
  }

  return false;
}

function check(node: Node, stack: Stack): [Node, TypeInfo] {
  switch (node.kind) {
    case 'Document': {
      node.rules.map(node => check(node, stack));
      return [node, t.Empty()];
    }

    case 'Rule': {
      const [, pred_t] = check(node.predicate, stack);
      if (pred_t.type !== 'Bool') {
        throw new TypeCheckError(
          `A predicate must be a Bool (but found ${pred_t.type})`,
          node.predicate.location,
        );
      }
      return [node, t.Bool()];
    }

    case 'ForAll':
    case 'Exists': {
      stack.push();

      const fakeType = FakeRecordType(node.set.name); // TODO: Replace with a dynamic value
      try {
        stack.setType(node.variable.name, fakeType);
      } catch (e) {
        throw new TypeCheckError(e.message, node.variable.location);
      }

      const [, pred_t] = check(node.predicate, stack);
      if (pred_t.type !== 'Bool') {
        throw new TypeCheckError(
          `A predicate must be a Bool (but found ${pred_t.type})`,
          node.predicate.location,
        );
      }

      stack.pop();

      return [node, t.Bool()];
    }

    case 'AND':
    case 'OR': {
      for (const [arg, arg_t] of node.args.map(n => check(n, stack))) {
        invariant(arg_t.type === 'Bool', 'Expected a bool argument');
      }
      return [node, t.Bool()];
    }

    case 'NOT': {
      const [, pred_t] = check(node.predicate, stack);
      invariant(pred_t.type === 'Bool', 'Expected a bool argument to NOT');
      return [node, t.Bool()];
    }

    case 'Equivalence':
    case 'Implication': {
      const [left, left_t] = check(node.left, stack);
      const [right, right_t] = check(node.right, stack);
      if (left_t.type !== 'Bool') {
        throw new TypeCheckError(
          'Expected left side to be boolean expression',
          node.left.location,
        );
      }
      if (right_t.type !== 'Bool') {
        throw new TypeCheckError(
          'Expected right side to be boolean expression',
          node.right.location,
        );
      }
      return [node, t.Bool()];
    }

    case 'Comparison': {
      const [, left_t] = check(node.left, stack);
      const [, right_t] = check(node.right, stack);
      if (!isCompatible(left_t, right_t)) {
        throw new TypeCheckError(
          `Left and right sides of ${node.op} must have the same type (${left_t.type} != ${right_t.type})`,
          node.location,
        );
      }
      return [node, t.Bool()];
    }

    case 'Identifier': {
      // Check the variable exists
      const type = stack.getTypeOrNull(node.name);
      if (type === null) {
        throw new TypeCheckError(
          `Unknown variable \`${node.name}\``,
          node.location,
        );
      }
      return [node, type];
    }

    case 'NumberLiteral': {
      return [node, t.Int()];
    }

    case 'StringLiteral': {
      return [node, t.String()];
    }

    case 'BoolLiteral': {
      return [node, t.Bool()];
    }

    case 'NullLiteral': {
      return [node, t.Null()];
    }

    case 'RelationSelection':
    case 'FieldSelection': {
      const [, expr_t] = check(node.expr, stack);
      if (expr_t.type === 'Record') {
        const type = expr_t.record[node.field.name];
        if (type !== undefined) {
          return [node, type];
        }
      }

      throw new TypeCheckError(
        `${expr_t.alias ?? expr_t.type} type has no field \`${
          node.field.name
        }\``,
        node.location,
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
