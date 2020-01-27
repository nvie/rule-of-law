// @flow

import invariant from 'invariant';
import { parsePredicate } from '../parser';
import check from './index';
import t from '../types';
import type { TypeInfo } from '../types';

function typeChecks(expr: string, expectedType: TypeInfo): void {
  const parsed = parsePredicate(expr);
  const [checked, checked_t] = check(parsed);
  expect(checked).toEqual(parsed); // type-checking does not change the parse tree
  expect(checked_t).toEqual(expectedType); // but derives the correct type
}

function doesNotTypeCheck(expr: string, msg?: string): void {
  expect(() => check(parsePredicate(expr))).toThrow(msg);
}

describe('checker', () => {
  it('literals', () => {
    typeChecks('1', t.Int());
    typeChecks('"hey"', t.String());
    typeChecks('NULL', t.Null());
  });

  it('comparisons', () => {
    typeChecks('1=2', t.Bool());
    typeChecks('"hey" < "abc"', t.Bool());
    typeChecks('NULL != NULL', t.Bool());

    doesNotTypeCheck('1 != NULL');
    doesNotTypeCheck('1 != "hey"');
    doesNotTypeCheck('NULL != "hey"');
  });

  it('logic', () => {
    typeChecks('forall Test t: t.id != 3', t.Bool());
  });

  it('nested scope definitions', () => {
    typeChecks(
      'forall Foo f: forall Bar b: f.isEnabled => b.isEnabled',
      t.Bool(),
    );
  });

  it('double definitions are not allowed', () => {
    doesNotTypeCheck(
      'forall Foo f: exists Foo f: f',
      'Variable `f` already defined',
    );
  });

  it('scopes work', () => {
    typeChecks(
      '(forall Foo f: f.isEnabled) and (forall Foo f: f.isEnabled)',
      t.Bool(),
    );

    doesNotTypeCheck(
      '(forall Foo f: f.isEnabled) and f and (forall Foo f: f.isEnabled)',
      'Unknown variable `f`',
    );
  });
});

xdescribe('linter', () => {
  it('throws on unused variable', () => {
    doesNotTypeCheck('forall Order o: 1', 'Variable `o` not used');
  });
});
