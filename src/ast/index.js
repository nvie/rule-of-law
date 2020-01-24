// @flow strict

export type DocumentNode = {|
  type: 'Document',
  rules: Array<RuleNode>,
|};

export type ExistsQuantifierNode = {|
  type: 'ExistsQuantifier',
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
|};

export type ImplicationNode = {|
  type: 'Implication',
  left: PredicateNode,
  right: PredicateNode,
|};

export type EquivalenceNode = {|
  type: 'Equivalence',
  left: PredicateNode,
  right: PredicateNode,
|};

export type AndNode = {|
  type: 'AND',
  args: Array<PredicateNode>,
|};

export type OrNode = {| type: 'OR', args: Array<PredicateNode> |};

export type NotNode = {|
  type: 'NOT',
  predicate: PredicateNode,
|};

export type PredicateNode =
  | QuantifierNode
  | AndNode
  | OrNode
  | NotNode
  | ImplicationNode
  | EquivalenceNode
  | IdentifierNode;

export type QuantifierNode = ForAllQuantifierNode | ExistsQuantifierNode;

export type ForAllQuantifierNode = {|
  type: 'ForAllQuantifier',
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
|};

export type IdentifierNode = {| type: 'Identifier', name: string |};

export type RuleNode = {|
  type: 'Rule',
  name: string,
  quantifier: QuantifierNode,
|};

export type StringLiteralNode = {| type: 'StringLiteral', value: string |};

const Rule = (name: string, quantifier: QuantifierNode): RuleNode => ({
  type: 'Rule',
  name,
  quantifier,
});

const Identifier = (name: string): IdentifierNode => ({
  type: 'Identifier',
  name,
});

const ExistsQuantifier = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ExistsQuantifierNode => ({
  type: 'ExistsQuantifier',
  set,
  variable,
  predicate,
});

const ForAllQuantifier = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ForAllQuantifierNode => ({
  type: 'ForAllQuantifier',
  set,
  variable,
  predicate,
});

const StringLiteral = (value: string): StringLiteralNode => ({
  type: 'StringLiteral',
  value,
});

const Implication = (
  left: PredicateNode,
  right: PredicateNode,
): ImplicationNode => ({ type: 'Implication', left, right });

const Equivalence = (
  left: PredicateNode,
  right: PredicateNode,
): EquivalenceNode => ({ type: 'Equivalence', left, right });

const NOT = (predicate: PredicateNode): NotNode => ({ type: 'NOT', predicate });

const AND = (args: Array<PredicateNode>): AndNode => ({ type: 'AND', args });

const OR = (args: Array<PredicateNode>): OrNode => ({ type: 'OR', args });

const Document = (rules: Array<RuleNode>): DocumentNode => ({
  type: 'Document',
  rules,
});

export default {
  AND,
  Equivalence,
  ExistsQuantifier,
  ForAllQuantifier,
  Identifier,
  Implication,
  NOT,
  OR,
  Rule,
  StringLiteral,
  Document,
};
