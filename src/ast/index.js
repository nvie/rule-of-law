// @flow strict

export type Node = StringLiteralNode;

export type StringLiteralNode = {|
  type: 'StringLiteral',
  value: string,
|};

export const StringLiteral = (value: string): StringLiteralNode => ({
  type: 'StringLiteral',
  value,
});
