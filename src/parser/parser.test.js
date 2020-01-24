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
  it('field selection', () => {
    expect(parsePredicate('x.y')).toEqual(
      ast.FieldSelection(ast.Identifier('x'), ast.Identifier('y')),
    );
  });

  xit('field selection (nested)', () => {
    expect(parsePredicate('x.y.z')).toEqual(
      ast.FieldSelection(
        ast.FieldSelection(ast.Identifier('x'), ast.Identifier('y')),
        ast.Identifier('z'),
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
