// @flow

import invariant from 'invariant';
import { parsePredicate as p } from '../parser';
import simplify from './index';

describe('simplifier', () => {
  it('not not x ~> x', () => {
    expect(simplify(p('not (not x)'))).toEqual(p('x'));
  });

  it('not (x and y) ~> (not x) or (not y)', () => {
    expect(simplify(p('not (x and y)'))).toEqual(p('not x or not y'));
  });

  it('not (x OR y) ~> (not x) and (not y)', () => {
    expect(simplify(p('not (x or y)'))).toEqual(p('not x and not y'));
  });

  it('not forall: x ~> exists: not(x)', () => {
    expect(simplify(p('not (forall Foo foo: foo.isEnabled)'))).toEqual(
      p('exists Foo foo: not foo.isEnabled'),
    );

    // not exists(x) will NOT get simplified!
    expect(simplify(p('not (exists Foo foo: foo.isEnabled)'))).toEqual(
      p('not (exists Foo foo: foo.isEnabled)'),
    );
  });

  xit('tautologies', () => {
    expect(simplify(p('1 = 1.0'))).toEqual(p('true'));
    expect(simplify(p('1 >= 1'))).toEqual(p('true'));
    expect(simplify(p('1 > 1'))).toEqual(p('false'));
    expect(simplify(p('"hey" != "hi"'))).toEqual(p('true'));
    expect(simplify(p('"hey" = "hi"'))).toEqual(p('false'));
  });
});
