// @flow strict

import fs from 'fs';
import type { DocumentNode, IdentifierNode, Location, Node } from '../ast';
import type { Schema, TypeInfo, RecordTypeInfo } from '../types';
import t from '../types';
import { printFriendlyError } from '../parser';

export class TypeCheckError extends Error {
  location: Location | void;

  constructor(msg: string, location?: Location) {
    super(msg);
    this.location = location;
  }
}

function typeFromString(value: string): TypeInfo {
  if (value.endsWith('?')) {
    return t.Nullable(typeFromString(value.substring(0, value.length - 1)));
  }

  switch (value) {
    case 'Int':
      return t.Int();
    case 'String':
      return t.String();
    case 'Bool':
      return t.Bool();
    case 'Date':
      return t.Date();
    default:
      throw new Error(`Unknown type \`${value}\``);
  }
}

export function typeFromJSON(value: mixed, alias?: string): TypeInfo {
  if (typeof value === 'string') {
    return typeFromString(value);
  } else if (typeof value === 'object' && value != null) {
    const rv = {};
    for (const key of Object.keys(value)) {
      const type = typeFromJSON(value[key], key);
      rv[key] = type;
    }
    return t.Record(rv, alias ?? '?');
  } else {
    throw new Error(`Invalid schema, did not expect "${typeof value}"`);
  }
}

export function typeToString(type: TypeInfo): string {
  if (type.alias !== undefined) {
    return type.alias;
  }

  switch (type.type) {
    case 'Record': {
      return `{${Object.keys(type.record)
        .map(key => `${key}: ${typeToString(type.record[key])}`)
        .join(', ')}}`;
    }

    case 'Nullable':
      return `${typeToString(type.ofType)}?`;

    default:
      return type.type;
  }
}

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
    type.type === 'Date' ||
    type.type === 'Null'
  );
}

function isCompatible(type1: TypeInfo, type2: TypeInfo): boolean {
  if (isPrimitive(type1) && isPrimitive(type2)) {
    return (
      type1.type === type2.type ||
      //
      // Allow date fields to be compated with strings, to enable syntax like
      // this:
      //
      //   foo.createdAt < "2020-01-01"
      //
      (type1.type === 'Date' && type2.type === 'String') ||
      (type1.type === 'String' && type2.type === 'Date')
    );
  }

  if (
    (type1.type === 'Nullable' && type2.type === 'Null') ||
    (type1.type === 'Null' && type2.type === 'Nullable')
  ) {
    return true;
  }

  if (type1.type === 'Nullable') {
    return isCompatible(type1.ofType, type2);
  } else if (type2.type === 'Nullable') {
    return isCompatible(type1, type2.ofType);
  }

  return false;
}

function check(node: Node, schema: Schema, stack: Stack): TypeInfo {
  switch (node.kind) {
    case 'Document': {
      node.rules.forEach(node => {
        check(node, schema, stack);
      });
      return t.Empty();
    }

    case 'Rule': {
      const pred_t = check(node.predicate, schema, stack);
      if (pred_t.type !== 'Bool') {
        throw new TypeCheckError(
          `Body of a rule must be Bool (but is ${typeToString(pred_t)})`,
          node.predicate.location,
        );
      }
      return t.Bool();
    }

    case 'ForAll':
    case 'Exists': {
      stack.push();

      // Try looking up and registering the type (using the Schema)
      const type = schema[node.set.name];
      if (type === undefined) {
        throw new TypeCheckError(
          `Unknown set "${node.set.name}". Please define it in your schema.`,
          node.set.location,
        );
      }

      try {
        stack.setType(node.variable.name, type);
      } catch (e) {
        throw new TypeCheckError(e.message, node.variable.location);
      }

      const pred_t = check(node.predicate, schema, stack);
      if (pred_t.type !== 'Bool') {
        throw new TypeCheckError(
          `Body of ${node.kind.toLowerCase()} must be Bool (but is ${typeToString(
            pred_t,
          )})`,
          node.predicate.location,
        );
      }

      stack.pop();

      return t.Bool();
    }

    case 'AND':
    case 'OR': {
      for (const argnode of node.args) {
        const arg_t = check(argnode, schema, stack);
        if (arg_t.type !== 'Bool') {
          throw new TypeCheckError(
            `All arguments to ${
              node.kind
            } must be Bool (but found ${typeToString(arg_t)})`,
            argnode.location,
          );
        }
      }
      return t.Bool();
    }

    case 'NOT': {
      const pred_t = check(node.predicate, schema, stack);

      if (pred_t.type !== 'Bool') {
        throw new TypeCheckError(
          `All arguments to NOT must be Bool expression (but found ${typeToString(
            pred_t,
          )})`,
          node.predicate.location,
        );
      }

      return t.Bool();
    }

    case 'Equivalence':
    case 'Implication': {
      const left_t = check(node.left, schema, stack);
      const right_t = check(node.right, schema, stack);
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
      return t.Bool();
    }

    case 'Comparison': {
      const left_t = check(node.left, schema, stack);
      const right_t = check(node.right, schema, stack);
      if (!isCompatible(left_t, right_t)) {
        throw new TypeCheckError(
          `Left and right sides of ${
            node.op
          } must have the same type (${typeToString(left_t)} != ${typeToString(
            right_t,
          )})`,
          node.location,
        );
      }
      return t.Bool();
    }

    case 'BinaryOp': {
      const left_t = check(node.left, schema, stack);
      const right_t = check(node.right, schema, stack);

      if (left_t.type !== 'Int') {
        throw new TypeCheckError(
          `Left argument to math operator must be Int expression (but found ${typeToString(
            left_t,
          )})`,
          node.left.location,
        );
      }

      if (right_t.type !== 'Int') {
        throw new TypeCheckError(
          `Right argument to math operator must be Int expression (but found ${typeToString(
            right_t,
          )})`,
          node.right.location,
        );
      }

      return t.Int();
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
      return type;
    }

    case 'NumberLiteral': {
      return t.Int();
    }

    case 'StringLiteral': {
      return t.String();
    }

    case 'BoolLiteral': {
      return t.Bool();
    }

    case 'NullLiteral': {
      return t.Null();
    }

    case 'MemberAccess': {
      const expr_t = check(node.target, schema, stack);
      if (expr_t.type === 'Record') {
        const type = expr_t.record[node.field.name];
        if (type !== undefined) {
          return type;
        }
      }

      throw new TypeCheckError(
        `${typeToString(expr_t)} type has no field \`${node.field.name}\``,
        node.location,
      );
    }

    default:
      throw new Error(
        `Checker not yet implemented for node type "${node.kind}". Please add a case!`,
      );
  }
}

export default function(
  node: Node,
  schema: Schema,
  inputString: string,
): TypeInfo {
  try {
    return check(node, schema, new Stack());
  } catch (e) {
    /**
     * If this is a type check error, report this in a visually pleasing
     * manner in the console.
     */
    if (e instanceof TypeCheckError) {
      if (process.env.NODE_ENV !== 'test') {
        printFriendlyError(e, inputString, 'Type error');
        process.exit(2);
      }
    }
    throw e;
  }
}
