// @flow

import invariant from 'invariant';
import { parsePredicate } from '../parser';
import check from './index';
import t from '../types';
import type { TypeInfo, RecordTypeInfo } from '../types';

const schema = {
  Foo: {
    type: 'Record',
    alias: 'Foo',
    record: {
      createdAt: { type: 'Date' },
      isEnabled: { type: 'Bool' },
    },
  },
  Bar: {
    type: 'Record',
    alias: 'Bar',
    record: {
      isEnabled: { type: 'Bool' },
    },
  },
  Test: {
    type: 'Record',
    alias: 'Test',
    record: {
      id: { type: 'Int' },
      isEnabled: { type: 'Bool' },
    },
  },
};

function typeChecks(expr: string, expectedType: TypeInfo): void {
  const parsed = parsePredicate(expr);
  expect(check(parsed, schema, '')).toEqual(expectedType); // but derives the correct type
}

function doesNotTypeCheck(expr: string, msg?: string): void {
  expect(() => check(parsePredicate(expr), schema, '')).toThrow(msg);
}

describe('checker', () => {
  it('literals', () => {
    typeChecks('false', t.Bool());
    typeChecks('true', t.Bool());
    typeChecks('1', t.Int());
    typeChecks('"hey"', t.String());
    typeChecks('null', t.Null());
    typeChecks('NULL', t.Null());
  });

  it('comparisons', () => {
    typeChecks('1=2', t.Bool());
    typeChecks('"hey" < "abc"', t.Bool());
    typeChecks('NULL != NULL', t.Bool());
    typeChecks('"hey" < "abc"', t.Bool());

    doesNotTypeCheck('1 != NULL');
    doesNotTypeCheck('1 != "hey"');
    doesNotTypeCheck('NULL != "hey"');
  });

  it('math expressions', () => {
    typeChecks('1 + 2', t.Int());
    typeChecks('1 - 2', t.Int());
    typeChecks('1 * 2', t.Int());
    typeChecks('1 / 2', t.Int());
    typeChecks('1 / 2 + 3 * 4 - 5', t.Int());
    doesNotTypeCheck('1 + "hey"');
    doesNotTypeCheck('"foo" + "bar"');
  });

  it('compare dates (with strings)', () => {
    typeChecks('forall Foo f: f.createdAt != f.createdAt', t.Bool());
    typeChecks('forall Foo f: f.createdAt >= "2020-01-01"', t.Bool());
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
