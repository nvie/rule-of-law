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

export type ArithmeticOperator = '+' | '-' | '*' | '/';

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

export type MemberAccessNode = {|
  kind: 'MemberAccess',
  location?: Location,
  target: MemberAccessNode | IdentifierNode,
  field: IdentifierNode,
  level: 10,
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
  | BinaryOpNode
  | ComparisonNode
  | MemberAccessNode
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

export type RuleFlags = {|
  skip: boolean,
|};

export type RuleNode = {|
  kind: 'Rule',
  location?: Location,
  name: string,
  predicate: PredicateNode,
  flags: RuleFlags,
|};

export type ComparisonNode = {|
  kind: 'Comparison',
  location?: Location,
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
  level: 7,
|};

export type BinaryOpNode = {|
  kind: 'BinaryOp',
  location?: Location,
  op: ArithmeticOperator,
  left: ExprNode,
  right: ExprNode,
  level: 8 | 9,
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
    node.kind === 'BinaryOp' ||
    node.kind === 'Comparison' ||
    node.kind === 'MemberAccess' ||
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
  flags: RuleFlags,
  location?: Location,
): RuleNode => ({
  kind: 'Rule',
  location,
  name,
  predicate,
  flags,
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

const BinaryOp = (
  op: ArithmeticOperator,
  left: ExprNode,
  right: ExprNode,
  level: 8 | 9,
  location?: Location,
): BinaryOpNode => ({
  kind: 'BinaryOp',
  op,
  left,
  right,
  level,
  location,
});

const Comparison = (
  op: ComparisonOperator,
  left: ExprNode,
  right: ExprNode,
  location?: Location,
): ComparisonNode => ({
  kind: 'Comparison',
  op,
  left,
  right,
  level: 7,
  location,
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

const MemberAccess = (
  target: MemberAccessNode | IdentifierNode,
  field: IdentifierNode,
  location?: Location,
): MemberAccessNode => ({
  kind: 'MemberAccess',
  location,
  target,
  field,
  level: 10,
});

export default {
  AND,
  BinaryOp,
  BoolLiteral,
  Comparison,
  Document,
  Equivalence,
  Exists,
  ForAll,
  Identifier,
  Implication,
  MemberAccess,
  NOT,
  NullLiteral,
  NumberLiteral,
  OR,
  Rule,
  StringLiteral,
};
