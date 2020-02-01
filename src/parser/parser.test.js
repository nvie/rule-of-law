// @flow

import ast from '../ast';
import invariant from 'invariant';
import type { DocumentNode, RuleNode, PredicateNode } from '../ast';
import {
  parseDocument as parseDocument_,
  parseRule as parseRule_,
  parsePredicate as parsePredicate_,
} from './index';

function parseDocument(input: string): DocumentNode {
  return parseDocument_(input, { noLocation: true });
}

function parseRule(input: string): RuleNode {
  return parseRule_(input, { noLocation: true });
}

function parsePredicate(input: string): PredicateNode {
  return parsePredicate_(input, { noLocation: true });
}

describe('empty document', () => {
  it('empty module', () => {
    expect(parseDocument('')).toEqual(ast.Document([]));
  });
});

describe('predicates', () => {
  it('identifier', () => {
    expect(parsePredicate('x')).toEqual(ast.Identifier('x'));

    expect(parsePredicate('foo')).toEqual(ast.Identifier('foo'));
  });

  xit('identifier (quoted)', () => {
    expect(parsePredicate('`x`')).toEqual(ast.Identifier('x'));

    expect(parsePredicate('`can contains spaces`')).toEqual(
      ast.Identifier('can contain spaces'),
    );

    expect(parsePredicate('`x -> y`')).toEqual(ast.Identifier('x -> y'));
  });

  it('and', () => {
    expect(parsePredicate('x and y')).toEqual(
      ast.AND([ast.Identifier('x'), ast.Identifier('y')]),
    );

    expect(parsePredicate('x and y and z')).toEqual(
      ast.AND([ast.Identifier('x'), ast.Identifier('y'), ast.Identifier('z')]),
    );

    expect(parsePredicate('x and (y and z)')).toEqual(
      ast.AND([
        ast.Identifier('x'),
        ast.AND([ast.Identifier('y'), ast.Identifier('z')]),
      ]),
    );

    expect(parsePredicate('(x and y) and z')).toEqual(
      ast.AND([
        ast.AND([ast.Identifier('x'), ast.Identifier('y')]),
        ast.Identifier('z'),
      ]),
    );
  });

  it('or', () => {
    expect(parsePredicate('x or y')).toEqual(
      ast.OR([ast.Identifier('x'), ast.Identifier('y')]),
    );

    expect(parsePredicate('x or y or z')).toEqual(
      ast.OR([ast.Identifier('x'), ast.Identifier('y'), ast.Identifier('z')]),
    );

    expect(parsePredicate('x or (y or z)')).toEqual(
      ast.OR([
        ast.Identifier('x'),
        ast.OR([ast.Identifier('y'), ast.Identifier('z')]),
      ]),
    );

    expect(parsePredicate('(x or y) or z')).toEqual(
      ast.OR([
        ast.OR([ast.Identifier('x'), ast.Identifier('y')]),
        ast.Identifier('z'),
      ]),
    );
  });

  it('not', () => {
    expect(parsePredicate('not x')).toEqual(ast.NOT(ast.Identifier('x')));
  });

  it('implies', () => {
    expect(parsePredicate('x => y')).toEqual(
      ast.Implication(ast.Identifier('x'), ast.Identifier('y')),
    );

    expect(parsePredicate('x => y => z')).toEqual(
      ast.Implication(
        ast.Identifier('x'),
        ast.Implication(ast.Identifier('y'), ast.Identifier('z')),
      ),
    );
  });

  it('equivalence', () => {
    expect(parsePredicate('x <=> y')).toEqual(
      ast.Equivalence(ast.Identifier('x'), ast.Identifier('y')),
    );

    expect(parsePredicate('x <=> y <=> z')).toEqual(
      ast.Equivalence(
        ast.Identifier('x'),
        ast.Equivalence(ast.Identifier('y'), ast.Identifier('z')),
      ),
    );
  });

  it('precedence', () => {
    expect(parsePredicate('x and y => p and q or not r and s')).toEqual(
      ast.Implication(
        ast.AND([ast.Identifier('x'), ast.Identifier('y')]),
        ast.OR([
          ast.AND([ast.Identifier('p'), ast.Identifier('q')]),
          ast.AND([ast.NOT(ast.Identifier('r')), ast.Identifier('s')]),
        ]),
      ),
    );
  });
});

describe('quantifiers', () => {
  it('forall', () => {
    expect(parsePredicate('forall foos foo: foo')).toEqual(
      ast.ForAll(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.Identifier('foo'),
      ),
    );
  });

  it('exists', () => {
    expect(parsePredicate('exists foos foo: foo')).toEqual(
      ast.Exists(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.Identifier('foo'),
      ),
    );
  });

  it('multiple', () => {
    expect(parsePredicate('forall foos foo: exists bars bar: qux')).toEqual(
      ast.ForAll(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.Exists(
          ast.Identifier('bars'),
          ast.Identifier('bar'),
          ast.Identifier('qux'),
        ),
      ),
    );
  });
});

describe('comparison operators', () => {
  it('=', () => {
    expect(parsePredicate('x = y')).toEqual(
      ast.Comparison('=', ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('!=', () => {
    expect(parsePredicate('x != y')).toEqual(
      ast.Comparison('!=', ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('<', () => {
    expect(parsePredicate('x < y')).toEqual(
      ast.Comparison('<', ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('>', () => {
    expect(parsePredicate('x > y')).toEqual(
      ast.Comparison('>', ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('>=', () => {
    expect(parsePredicate('x >= y')).toEqual(
      ast.Comparison('>=', ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('>=', () => {
    expect(parsePredicate('x >= y')).toEqual(
      ast.Comparison('>=', ast.Identifier('x'), ast.Identifier('y')),
    );
  });
});

describe('expressions', () => {
  it('null literal', () => {
    expect(parsePredicate('null')).toEqual(ast.NullLiteral());

    expect(parsePredicate('NULL')).toEqual(ast.NullLiteral());
  });

  it('boolean literals', () => {
    expect(parsePredicate('true')).toEqual(ast.BoolLiteral(true));
    expect(parsePredicate('false')).toEqual(ast.BoolLiteral(false));
  });

  it('number literals', () => {
    expect(parsePredicate('0')).toEqual(ast.NumberLiteral(0));

    expect(parsePredicate('1')).toEqual(ast.NumberLiteral(1));

    expect(parsePredicate('232132693127')).toEqual(
      ast.NumberLiteral(232132693127),
    );

    expect(parsePredicate('3.141592')).toEqual(ast.NumberLiteral(3.141592));

    expect(parsePredicate('0.0001')).toEqual(ast.NumberLiteral(0.0001));

    expect(parsePredicate('-0.0001')).toEqual(ast.NumberLiteral(-0.0001));

    expect(parsePredicate('-3.141592')).toEqual(ast.NumberLiteral(-3.141592));
  });

  it('string literals', () => {
    expect(parsePredicate('"hello"')).toEqual(ast.StringLiteral('hello'));

    expect(parsePredicate('"strings are double-quoted"')).toEqual(
      ast.StringLiteral('strings are double-quoted'),
    );

    expect(parsePredicate('"escaping \\"with quotes\\""')).toEqual(
      ast.StringLiteral('escaping "with quotes"'),
    );
  });

  it('field selection', () => {
    expect(parsePredicate('x.y')).toEqual(
      ast.FieldSelection(ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('field selection (nested)', () => {
    expect(parsePredicate('p.q.r.s')).toEqual(
      ast.FieldSelection(
        ast.FieldSelection(
          ast.FieldSelection(ast.Identifier('p'), ast.Identifier('q')),
          ast.Identifier('r'),
        ),
        ast.Identifier('s'),
      ),
    );
  });

  it('relation following', () => {
    expect(parsePredicate('x->y')).toEqual(
      ast.RelationSelection(ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  it('relation following (nested)', () => {
    expect(parsePredicate('p->q->r->s')).toEqual(
      ast.RelationSelection(
        ast.RelationSelection(
          ast.RelationSelection(ast.Identifier('p'), ast.Identifier('q')),
          ast.Identifier('r'),
        ),
        ast.Identifier('s'),
      ),
    );
  });

  it('equal precedence', () => {
    expect(parsePredicate('p->q.r->s.t')).toEqual(
      ast.FieldSelection(
        ast.RelationSelection(
          ast.FieldSelection(
            ast.RelationSelection(ast.Identifier('p'), ast.Identifier('q')),
            ast.Identifier('r'),
          ),
          ast.Identifier('s'),
        ),
        ast.Identifier('t'),
      ),
    );
  });
});

describe('simple rule', () => {
  it('rule', () => {
    expect(
      parseRule(`
        rule "description goes here"
          forall Order o:
            p
      `),
    ).toEqual(
      ast.Rule(
        'description goes here',
        ast.ForAll(
          ast.Identifier('Order'),
          ast.Identifier('o'),
          ast.Identifier('p'),
        ),
      ),
    );
  });
});
