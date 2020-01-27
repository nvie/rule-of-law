// @flow strict

import fs from 'fs';
import type { Node, IdentifierNode } from '../ast';

type TypeInfo =
  | {| type: 'String' |}
  | {| type: 'Int' |}
  | {| type: 'Boolean' |}
  | {|
      type: 'UserDefined',
      name: string, // e.g. Order, Prescription, etc.
    |};

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

function check(node: Node, stack: Stack): Node {
  switch (node.type) {
    case 'Document':
      node.rules.map(node => check(node, stack));
      return node;

    case 'Rule':
      // TODO: Check that node.quantifier is boolean!
      return check(node.quantifier, stack);

    case 'ForAll':
    case 'Exists':
      stack.push();
      stack.setType(node.variable.name, {
        type: 'UserDefined',
        name: node.set.name,
      });
      // TODO: Check that node.predicate is boolean!
      const newNode = check(node.predicate, stack);
      stack.pop();
      return newNode;

    case 'AND':
    case 'OR':
      // TODO: Check that all args are boolean!
      node.args.map(node => check(node, stack));
      return node;

    case 'Equivalence':
    case 'Implication':
      // TODO: Check that both sides are boolean!
      check(node.left, stack);
      check(node.right, stack);
      return node;

    case 'Comparison':
      // TODO: Check that both sides are the same type!
      check(node.left, stack);
      check(node.right, stack);
      return node;

    case 'Identifier':
      // Check the variable exists
      stack.getType(node.name);
      return node;

    case 'NumberLiteral':
    case 'StringLiteral':
    case 'NullLiteral':
      // TODO: Return a different type for each here!
      return node;

    case 'FieldSelection':
    case 'RelationSelection':
      // TODO: Check that node.expr is a custom type
      check(node.expr, stack);
      // TODO: Check that node.field is a field that exists in the custom type
      // (do not look it up in the stack, since it's not an open variable!)
      check(node.field, stack);
      return node;

    default:
      throw new Error(
        `Checker not yet implemented for node type "${node.type}". Please add a case!`,
      );
  }
}

export default function(node: Node): Node {
  return check(node, new Stack());
}
