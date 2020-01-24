// @flow

import ast from '../ast';
import invariant from 'invariant';
import type { RuleNode } from '../ast';
import { parseDocument, parseRule, parsePredicate } from './index';

describe('empty document', () => {
  it('empty module', () => {
    expect(parseDocument('')).toEqual(ast.Document([]));
  });
});

describe('predicates', () => {
  it('identifier', () => {
    expect(parsePredicate('x')).toEqual(ast.Identifier('x'));
  });

  it('and', () => {
    expect(parsePredicate('x and y')).toEqual(
      ast.AND([ast.Identifier('x'), ast.Identifier('y')]),
    );
    expect(parsePredicate('x and y and z')).toEqual(
      ast.AND([ast.Identifier('x'), ast.Identifier('y'), ast.Identifier('z')]),
    );
  });

  it('or', () => {
    expect(parsePredicate('x or y')).toEqual(
      ast.OR([ast.Identifier('x'), ast.Identifier('y')]),
    );
    expect(parsePredicate('x or y or z')).toEqual(
      ast.OR([ast.Identifier('x'), ast.Identifier('y'), ast.Identifier('z')]),
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
      ast.ForAllQuantifier(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.Identifier('foo'),
      ),
    );
  });

  it('exists', () => {
    expect(parsePredicate('exists foos foo: foo')).toEqual(
      ast.ExistsQuantifier(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.Identifier('foo'),
      ),
    );
  });

  it('multiple', () => {
    expect(parsePredicate('forall foos foo: exists bars bar: qux')).toEqual(
      ast.ForAllQuantifier(
        ast.Identifier('foos'),
        ast.Identifier('foo'),
        ast.ExistsQuantifier(
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
});

describe('simple rule', () => {
  it('rule', () => {
    expect(
      parseRule(`
        rule "Eric is cool"
          forall Order o:
            p
      `),
    ).toEqual(
      ast.Rule(
        'Eric is cool',
        ast.ForAllQuantifier(
          ast.Identifier('Order'),
          ast.Identifier('o'),
          ast.Identifier('p'),
        ),
      ),
    );
  });
});
