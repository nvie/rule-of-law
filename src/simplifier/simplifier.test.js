// @flow

import invariant from 'invariant';
import simplify from './index';
import { parsePredicate as parsePredicate_ } from '../parser';
import type { PredicateNode } from '../ast';

function parsePredicate(input: string): PredicateNode {
  return parsePredicate_(input, { noLocation: true });
}

function expectSimplify(expr, expected) {
  expect(simplify(parsePredicate(expr))).toEqual(parsePredicate(expected));
}

describe('simplifier', () => {
  it('not true ~> false', () => {
    expectSimplify('not true', 'false');
  });

  it('not false ~> true', () => {
    expectSimplify('not false', 'true');
  });

  it('not not x ~> x', () => {
    expectSimplify('not (not x)', 'x');
  });

  it('not (x and y) ~> (not x) or (not y)', () => {
    expectSimplify('not (x and y)', 'not x or not y');
    expectSimplify('not (x and y and z)', 'not x or not y or not z');
  });

  it('not (x OR y) ~> (not x) and (not y)', () => {
    expectSimplify('not (x or y)', 'not x and not y');
    expectSimplify('not (x or y or z)', 'not x and not y and not z');
  });

  it('mixed', () => {
    expectSimplify('not (x or y and z)', 'not x and (not y or not z)');
  });

  it('not forall: x ~> exists: not(x)', () => {
    expectSimplify(
      'not (forall Foo foo: foo.id = 1)',
      'exists Foo foo: foo.id != 1',
    );

    expectSimplify(
      'not (forall Foo foo: forall Bar bar: foo.id = bar.id)',
      'exists Foo foo: exists Bar bar: foo.id != bar.id',
    );

    // not exists(x) will NOT get simplified!
    expectSimplify(
      'not (exists Foo foo: foo.isEnabled)',
      'not (exists Foo foo: foo.isEnabled)',
    );
  });

  it('not x = y ~> x != y (and friends)', () => {
    expectSimplify('not (x = y)', 'x != y');
    expectSimplify('not (x != y)', 'x = y');
    expectSimplify('not (x > y)', 'x <= y');
    expectSimplify('not (x >= y)', 'x < y');
    expectSimplify('not (x < y)', 'x >= y');
    expectSimplify('not (x <= y)', 'x > y');
  });

  it('x and true ~> x', () => {
    expectSimplify('x and true', 'x');
    expectSimplify('x and false', 'false');
    expectSimplify('true and x', 'x');
    expectSimplify('false and x', 'false');

    expectSimplify('x and true and y', 'x and y');
    expectSimplify('x and false and y', 'false');
  });

  it('x or false ~> x', () => {
    expectSimplify('x or true', 'true');
    expectSimplify('x or false', 'x');
    expectSimplify('true or x', 'true');
    expectSimplify('false or x', 'x');

    expectSimplify('x or true or y', 'true');
    expectSimplify('x or false or y', 'x or y');
  });

  it('x => y ~> not x or y', () => {
    expectSimplify('x => y', 'not x or y');
    expectSimplify('not x => y', 'x or y');
    expectSimplify('x = 1 => y', 'x != 1 or y');
    expectSimplify('not (x => y)', 'x and not y');

    expectSimplify('x => false', 'not x');
    expectSimplify('x => true', 'true');
    expectSimplify('true => x', 'x');
    expectSimplify('false => x', 'true');
  });

  it('unnesting (x and (y and z)) ~> (x and y and z)', () => {
    expectSimplify('x and (y and z)', 'x and y and z');
    expectSimplify('(x and y) and z', 'x and y and z');
    expectSimplify('(x and y) and (z1 and z2)', 'x and y and z1 and z2');

    expectSimplify('x or (y or z)', 'x or y or z');
    expectSimplify('(x or y) or z', 'x or y or z');
    expectSimplify('(x or y) or (z1 or z2)', 'x or y or z1 or z2');

    // But not if they're different operands
    expectSimplify('x and (y or z)', 'x and (y or z)');
    expectSimplify('(x or y) and z', '(x or y) and z');
    expectSimplify('x or (y and z)', 'x or (y and z)');
    expectSimplify('(x and y) or z', '(x and y) or z');
  });

  // TODO - would this be actually useful to optimize?
  xit('remove duplicate predicates', () => {
    expectSimplify('x and x and x', 'x');
    expectSimplify('x or x or x', 'x');
    expectSimplify('x or (y or (false or x)) or z', 'x or y or z');
  });

  xit('tautologies', () => {
    // expectSimplify('1 = 1.0',('true'));
    // expectSimplify('1 >= 1',('true'));
    // expectSimplify('1 > 1',('false'));
    // expectSimplify('"hey" != "hi"',('true'));
    // expectSimplify('"hey" = "hi"',('false'));
  });
});
