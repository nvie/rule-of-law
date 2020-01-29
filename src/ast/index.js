// @flow strict

export type Node = DocumentNode | RuleNode | PredicateNode;

export type ComparisonOperator = '=' | '!=' | '<' | '>' | '<=' | '>=';

export type DocumentNode = {|
  kind: 'Document',
  rules: Array<RuleNode>,
|};

export type NullLiteralNode = {|
  kind: 'NullLiteral',
|};

export type BoolLiteralNode = {|
  kind: 'BoolLiteral',
  value: boolean,
|};

export type NumberLiteralNode = {|
  kind: 'NumberLiteral',
  value: number,
|};

export type StringLiteralNode = {|
  kind: 'StringLiteral',
  value: string,
|};

export type ExistsNode = {|
  kind: 'Exists',
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  level: 1,
|};

export type FieldSelectionNode = {|
  kind: 'FieldSelection',
  expr: ExprNode,
  field: IdentifierNode,
  level: 8,
|};

export type RelationSelectionNode = {|
  kind: 'RelationSelection',
  expr: ExprNode,
  field: IdentifierNode,
  level: 8,
|};

export type ImplicationNode = {|
  kind: 'Implication',
  left: PredicateNode,
  right: PredicateNode,
  level: 3,
|};

export type EquivalenceNode = {|
  kind: 'Equivalence',
  left: PredicateNode,
  right: PredicateNode,
  level: 2,
|};

export type AndNode = {|
  kind: 'AND',
  args: Array<PredicateNode>,
  level: 5,
|};

export type OrNode = {| kind: 'OR', args: Array<PredicateNode>, level: 4 |};

export type NotNode = {|
  kind: 'NOT',
  predicate: PredicateNode,
  level: 6,
|};

export type PredicateNode =
  | ForAllNode
  | ExistsNode
  | AndNode
  | OrNode
  | NotNode
  | ImplicationNode
  | EquivalenceNode
  | ExprNode;

export type ExprNode =
  | ComparisonNode
  | FieldSelectionNode
  | RelationSelectionNode
  | LiteralNode
  | IdentifierNode;

export type LiteralNode =
  | NullLiteralNode
  | BoolLiteralNode
  | NumberLiteralNode
  | StringLiteralNode;

export type ForAllNode = {|
  kind: 'ForAll',
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  level: 1,
|};

export type IdentifierNode = {| kind: 'Identifier', name: string |};

export type RuleNode = {|
  kind: 'Rule',
  name: string,
  predicate: PredicateNode,
|};

export type ComparisonNode = {|
  kind: 'Comparison',
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
  level: 7,
|};

const Rule = (name: string, predicate: PredicateNode): RuleNode => ({
  kind: 'Rule',
  name,
  predicate,
});

const Identifier = (name: string): IdentifierNode => ({
  kind: 'Identifier',
  name,
});

const Exists = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ExistsNode => ({
  kind: 'Exists',
  set,
  variable,
  predicate,
  level: 1,
});

const ForAll = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
): ForAllNode => ({
  kind: 'ForAll',
  set,
  variable,
  predicate,
  level: 1,
});

const Implication = (
  left: PredicateNode,
  right: PredicateNode,
): ImplicationNode => ({ kind: 'Implication', left, right, level: 3 });

const Equivalence = (
  left: PredicateNode,
  right: PredicateNode,
): EquivalenceNode => ({ kind: 'Equivalence', left, right, level: 2 });

const NOT = (predicate: PredicateNode): NotNode => ({
  kind: 'NOT',
  predicate,
  level: 6,
});

const AND = (args: Array<PredicateNode>): AndNode => ({
  kind: 'AND',
  args,
  level: 5,
});

const OR = (args: Array<PredicateNode>): OrNode => ({
  kind: 'OR',
  args,
  level: 4,
});

const Document = (rules: Array<RuleNode>): DocumentNode => ({
  kind: 'Document',
  rules,
});

const Comparison = (
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
): ComparisonNode => ({
  kind: 'Comparison',
  op,
  left,
  right,
  level: 7,
});

const NullLiteral = (): NullLiteralNode => ({ kind: 'NullLiteral' });

const BoolLiteral = (value: boolean): BoolLiteralNode => ({
  kind: 'BoolLiteral',
  value,
});

const NumberLiteral = (value: number): NumberLiteralNode => ({
  kind: 'NumberLiteral',
  value,
});

const StringLiteral = (value: string): StringLiteralNode => ({
  kind: 'StringLiteral',
  value,
});

const FieldSelection = (
  expr: ExprNode,
  field: IdentifierNode,
): FieldSelectionNode => ({
  kind: 'FieldSelection',
  expr,
  field,
  level: 8,
});

const RelationSelection = (
  expr: ExprNode,
  field: IdentifierNode,
): RelationSelectionNode => ({
  kind: 'RelationSelection',
  expr,
  field,
  level: 8,
});

export default {
  AND,
  BoolLiteral,
  Comparison,
  Document,
  Equivalence,
  Exists,
  FieldSelection,
  ForAll,
  Identifier,
  Implication,
  NOT,
  NullLiteral,
  NumberLiteral,
  RelationSelection,
  OR,
  Rule,
  StringLiteral,
};
