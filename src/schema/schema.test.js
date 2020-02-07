// @flow strict

import t from '../types';
import { parseSchema, dumpSchema } from './index';

describe('schema', () => {
  it('parsing', () => {
    expect(parseSchema('{"things": {"id": "Int"}}')).toEqual({
      things: t.Record({ id: t.Int() }, 'things'),
    });

    expect(parseSchema('{"things": {"id": "Int?"}}')).toEqual({
      things: t.Record({ id: t.Nullable(t.Int()) }, 'things'),
    });
  });

  it('dumping', () => {
    const schema = `
      {
        "things": {
          "id": "Int?",
          "name": "String",
          "date_created": "Date",
          "date_closed": "Date?",
          "is_enabled": "Bool",
          "status": "String?"
        },
        "other_things": {
          "id": "Int",
          "thing_id": "Int?"
        }
      }
    `;
    expect(JSON.parse(dumpSchema(parseSchema(schema)))).toEqual(
      JSON.parse(schema),
    );
  });
});

describe('relations', () => {
  it('normal case', () => {
    const schema = `
      {
        "orders": {
          "id": "Int",
          "user_id": "Int",
          "user": "user_id -> users:id"
        },
        "users": {
          "id": "Int",
          "name": "String"
        }
      }
    `;
    expect(JSON.parse(dumpSchema(parseSchema(schema)))).toEqual(
      JSON.parse(schema),
    );
  });

  it('relations (unknown src field)', () => {
    const schema = `{
      "orders": {
        "user": "user_id -> users:id"
      }
    }`;
    expect(() => parseSchema(schema)).toThrow(
      'Unknown field `user_id` (in `orders.user` relation)',
    );
  });

  it('relations (unknown dst type)', () => {
    const schema = `{
      "orders": {
        "user_id": "Int",
        "user": "user_id -> users:id"
      }
    }`;
    expect(() => parseSchema(schema)).toThrow(
      'Unknown type `users` (in `orders.user` relation)',
    );
  });

  it('relations (unknown dst field)', () => {
    const schema = `{
      "orders": {
        "user_id": "Int",
        "user": "user_id -> users:id"
      },
      "users": {
        "name": "String"
      }
    }`;
    expect(() => parseSchema(schema)).toThrow(
      'Unknown field `users:id` (in `orders.user` relation)',
    );
  });

  it('relations (type mismatch)', () => {
    const schema = `{
      "orders": {
        "user_id": "Int",
        "user": "user_id -> users:id"
      },
      "users": {
        "id": "String"
      }
    }`;
    expect(() => parseSchema(schema)).toThrow(
      'Type error: `user_id` (Int) incompatible with `users:id` (String)',
    );
  });

  it('relations (self references)', () => {
    const schema = `{
      "users": {
        "id": "Int",
        "parent_id": "Int",
        "parent": "parent_id -> users:id"
      }
    }`;

    expect(JSON.parse(dumpSchema(parseSchema(schema)))).toEqual(
      JSON.parse(schema),
    );
  });
});
