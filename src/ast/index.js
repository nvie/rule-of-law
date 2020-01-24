// @flow strict

type Node = StringLiteralNode

type StringLiteralNode = {|
  type: 'StringLiteral',
  value: string,
|}

export const StringLiteral = (value: string): StringLiteralNode => ({
  type: 'StringLiteral',
  value,
})
