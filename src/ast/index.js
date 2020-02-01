// @flow strict

export type Position = {|
  offset: number,
  line: number,
  column: number,
|};

export type Location = {|
  start: Position,
  end: Position,
|};

export type Node = DocumentNode | RuleNode | PredicateNode;

export type ComparisonOperator = '=' | '!=' | '<' | '>' | '<=' | '>=';

export type DocumentNode = {|
  kind: 'Document',
  rules: Array<RuleNode>,
  location?: Location,
|};

export type NullLiteralNode = {|
  kind: 'NullLiteral',
  location?: Location,
|};

export type BoolLiteralNode = {|
  kind: 'BoolLiteral',
  location?: Location,
  value: boolean,
|};

export type NumberLiteralNode = {|
  kind: 'NumberLiteral',
  location?: Location,
  value: number,
|};

export type StringLiteralNode = {|
  kind: 'StringLiteral',
  location?: Location,
  value: string,
|};

export type ExistsNode = {|
  kind: 'Exists',
  location?: Location,
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  level: 1,
|};

export type FieldSelectionNode = {|
  kind: 'FieldSelection',
  location?: Location,
  expr: ExprNode,
  field: IdentifierNode,
  level: 8,
|};

export type RelationSelectionNode = {|
  kind: 'RelationSelection',
  location?: Location,
  expr: ExprNode,
  field: IdentifierNode,
  level: 8,
|};

export type ImplicationNode = {|
  kind: 'Implication',
  location?: Location,
  left: PredicateNode,
  right: PredicateNode,
  level: 3,
|};

export type EquivalenceNode = {|
  kind: 'Equivalence',
  location?: Location,
  left: PredicateNode,
  right: PredicateNode,
  level: 2,
|};

export type AndNode = {|
  kind: 'AND',
  location?: Location,
  args: Array<PredicateNode>,
  level: 5,
|};

export type OrNode = {|
  kind: 'OR',
  location?: Location,
  args: Array<PredicateNode>,
  level: 4,
|};

export type NotNode = {|
  kind: 'NOT',
  location?: Location,
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
  location?: Location,
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  level: 1,
|};

export type IdentifierNode = {|
  kind: 'Identifier',
  location?: Location,
  name: string,
|};

export type RuleNode = {|
  kind: 'Rule',
  location?: Location,
  name: string,
  predicate: PredicateNode,
|};

export type ComparisonNode = {|
  kind: 'Comparison',
  location?: Location,
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
  level: 7,
|};

export function isPredicateNode(node: Node): boolean %checks {
  return (
    node.kind === 'ForAll' ||
    node.kind === 'Exists' ||
    node.kind === 'AND' ||
    node.kind === 'OR' ||
    node.kind === 'NOT' ||
    node.kind === 'Implication' ||
    node.kind === 'Equivalence' ||
    isExprNode(node)
  );
}

export function isExprNode(node: Node): boolean %checks {
  return (
    node.kind === 'Comparison' ||
    node.kind === 'FieldSelection' ||
    node.kind === 'RelationSelection' ||
    node.kind === 'Identifier' ||
    isLiteralNode(node)
  );
}

export function isLiteralNode(node: Node): boolean %checks {
  return (
    node.kind === 'NullLiteral' ||
    node.kind === 'BoolLiteral' ||
    node.kind === 'NumberLiteral' ||
    node.kind === 'StringLiteral'
  );
}

const Rule = (
  name: string,
  predicate: PredicateNode,
  location?: Location,
): RuleNode => ({
  kind: 'Rule',
  location,
  name,
  predicate,
});

const Identifier = (name: string, location?: Location): IdentifierNode => ({
  kind: 'Identifier',
  location,
  name,
});

const Exists = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  location?: Location,
): ExistsNode => ({
  kind: 'Exists',
  location,
  set,
  variable,
  predicate,
  level: 1,
});

const ForAll = (
  set: IdentifierNode,
  variable: IdentifierNode,
  predicate: PredicateNode,
  location?: Location,
): ForAllNode => ({
  kind: 'ForAll',
  location,
  set,
  variable,
  predicate,
  level: 1,
});

const Implication = (
  left: PredicateNode,
  right: PredicateNode,
  location?: Location,
): ImplicationNode => ({
  kind: 'Implication',
  location,
  left,
  right,
  level: 3,
});

const Equivalence = (
  left: PredicateNode,
  right: PredicateNode,
  location?: Location,
): EquivalenceNode => ({
  kind: 'Equivalence',
  location,
  left,
  right,
  level: 2,
});

const NOT = (predicate: PredicateNode, location?: Location): NotNode => ({
  kind: 'NOT',
  location,
  predicate,
  level: 6,
});

const AND = (args: Array<PredicateNode>, location?: Location): AndNode => ({
  kind: 'AND',
  location,
  args,
  level: 5,
});

const OR = (args: Array<PredicateNode>, location?: Location): OrNode => ({
  kind: 'OR',
  location,
  args,
  level: 4,
});

const Document = (
  rules: Array<RuleNode>,
  location?: Location,
): DocumentNode => ({
  kind: 'Document',
  rules,
  location,
});

const Comparison = (
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
  location?: Location,
): ComparisonNode => ({
  kind: 'Comparison',
  location,
  op,
  left,
  right,
  level: 7,
});

const NullLiteral = (location?: Location): NullLiteralNode => ({
  kind: 'NullLiteral',
  location,
});

const BoolLiteral = (value: boolean, location?: Location): BoolLiteralNode => ({
  kind: 'BoolLiteral',
  location,
  value,
});

const NumberLiteral = (
  value: number,
  location?: Location,
): NumberLiteralNode => ({
  kind: 'NumberLiteral',
  location,
  value,
});

const StringLiteral = (
  value: string,
  location?: Location,
): StringLiteralNode => ({
  kind: 'StringLiteral',
  location,
  value,
});

const FieldSelection = (
  expr: ExprNode,
  field: IdentifierNode,
  location?: Location,
): FieldSelectionNode => ({
  kind: 'FieldSelection',
  location,
  expr,
  field,
  level: 8,
});

const RelationSelection = (
  expr: ExprNode,
  field: IdentifierNode,
  location?: Location,
): RelationSelectionNode => ({
  kind: 'RelationSelection',
  location,
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
