// @flow

import invariant from 'invariant';
import { parsePredicate } from '../parser';
import check from './index';

describe('checker', () => {
  it('literals', () => {
    expect(() => check(parsePredicate('1'))).not.toThrow();
    expect(() => check(parsePredicate('"hey"'))).not.toThrow();
    expect(() => check(parsePredicate('NULL'))).not.toThrow();
  });

  it('nested scope definitions', () => {
    const doc = parsePredicate(
      'forall Foo f: forall Bar b: f.isEnabled => b.isEnabled',
    );
    expect(() => check(doc)).not.toThrow('xxx');
  });

  it('double definitions are not allowed', () => {
    const doc = parsePredicate('forall Foo f: exists Foo f: f');
    expect(() => check(doc)).toThrow('Variable `f` already defined');
  });

  it('scopes work', () => {
    expect(() =>
      check(
        parsePredicate(
          '(forall Foo f: f.isEnabled) and (forall Foo f: f.isEnabled)',
        ),
      ),
    ).not.toThrow();

    expect(() =>
      check(parsePredicate('(forall Foo f: f) and f and (forall Foo f: f)')),
    ).toThrow('Unknown variable `f`');
  });
});

xdescribe('linter', () => {
  it('throws on unused variable', () => {
    const doc = parsePredicate('forall Order o: 1');
    expect(() => check(doc)).toThrow('Variable `o` not used');
  });
});
