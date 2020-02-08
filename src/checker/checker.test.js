// @flow

import invariant from 'invariant';
import { parsePredicate } from '../parser';
import { parseSchema } from '../schema';
import check from './index';
import t from '../types';
import type { TypeInfo, RecordTypeInfo } from '../types';

const schema = parseSchema(`
  {
    "Foo": {
      "created_at": "Date",
      "is_enabled": "Bool",
      "bar_id": "Int",
      "bar": "bar_id -> Bar:id"
    },
    "Bar": {
      "id": "Int",
      "is_enabled": "Bool"
    },
    "Test": {
      "id": "Int",
      "is_enabled": "Bool"
    }
  }
`);

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
    typeChecks('forall Foo f: f.created_at != f.created_at', t.Bool());
    typeChecks('forall Foo f: f.created_at >= "2020-01-01"', t.Bool());
    typeChecks('forall Foo f: "2020-01-01" = f.created_at', t.Bool());
  });

  it('logic', () => {
    typeChecks('forall Test t: t.id != 3', t.Bool());
  });

  it('nested scope definitions', () => {
    typeChecks(
      'forall Foo f: forall Bar b: f.is_enabled => b.is_enabled',
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
      '(forall Foo f: f.is_enabled) and (forall Foo f: f.is_enabled)',
      t.Bool(),
    );

    doesNotTypeCheck(
      '(forall Foo f: f.is_enabled) and f and (forall Foo f: f.is_enabled)',
      'Unknown variable `f`',
    );
  });

  it('checks fields', () => {
    typeChecks('forall Foo f: f.bar_id = 1', t.Bool());
    typeChecks('forall Foo f: f.is_enabled', t.Bool());
    doesNotTypeCheck('forall Foo f: f.baz', 'Foo type has no field `baz`');
  });

  it('relations following', () => {
    typeChecks('forall Foo f: f.bar.is_enabled', t.Bool());
    doesNotTypeCheck(
      'forall Foo f: f.baz.is_enabled',
      'Foo type has no field `baz`',
    );
    doesNotTypeCheck('forall Foo f: f.bar.baz', 'Bar type has no field `baz`');
  });
});

xdescribe('linter', () => {
  it('throws on unused variable', () => {
    doesNotTypeCheck('forall Order o: 1', 'Variable `o` not used');
  });
});
