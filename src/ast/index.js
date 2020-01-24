// @flow strict

export type ComparisonOperator = '=' | '!=' | '<' | '>' | '<=' | '>=';

export type DocumentNode = {|
  type: 'Document',
  rules: Array<RuleNode>,
|};

export type ExistsNode = {|
  type: 'Exists',
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
|};

export type FieldSelectionNode = {|
  type: 'FieldSelection',
  expr: ExprNode,
  field: IdentifierNode,
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
  | ExprNode;

export type ExprNode = FieldSelectionNode | IdentifierNode;

export type QuantifierNode = ForAllNode | ExistsNode;

export type ForAllNode = {|
  type: 'ForAll',
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

export type ComparisonNode = {|
  type: 'Comparison',
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
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

const Exists = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ExistsNode => ({
  type: 'Exists',
  set,
  variable,
  predicate,
});

const ForAll = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ForAllNode => ({
  type: 'ForAll',
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

const Comparison = (
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
): ComparisonNode => ({
  type: 'Comparison',
  op,
  left,
  right,
});

const FieldSelection = (
  expr: ExprNode,
  field: IdentifierNode,
): FieldSelectionNode => ({
  type: 'FieldSelection',
  expr,
  field,
});

export default {
  AND,
  Comparison,
  Document,
  Equivalence,
  Exists,
  FieldSelection,
  ForAll,
  Identifier,
  Implication,
  NOT,
  OR,
  Rule,
  StringLiteral,
};
