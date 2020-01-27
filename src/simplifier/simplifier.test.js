// @flow

import invariant from 'invariant';
import { parsePredicate as p } from '../parser';
import simplify from './index';

describe('simplifier', () => {
  it('NOT NOT x ~> x', () => {
    expect(simplify(p('not (not x)'))).toEqual(p('x'));
  });

  it('NOT (x AND y) ~> (NOT x) OR (NOT y)', () => {
    expect(simplify(p('not (x and y)'))).toEqual(p('not x or not y'));
  });

  it('NOT (x OR y) ~> (NOT x) AND (NOT y)', () => {
    expect(simplify(p('not (x or y)'))).toEqual(p('not x and not y'));
  });

  it('NOT (forall Foo foo: foo.isEnabled) ~> exists Foo foo: NOT foo.isEnabled', () => {
    expect(simplify(p('not (forall Foo foo: foo.isEnabled)'))).toEqual(
      p('exists Foo foo: not foo.isEnabled'),
    );
  });

  it('NOT (exists Foo foo: foo.isEnabled) ~> forall Foo foo: NOT foo.isEnabled', () => {
    expect(simplify(p('not (forall Foo foo: foo.isEnabled)'))).toEqual(
      p('exists Foo foo: not foo.isEnabled'),
    );
  });
});
