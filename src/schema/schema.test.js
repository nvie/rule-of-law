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

  it('relationships', () => {
    const schema = `
      {
        "orders": {
          "id": "Int",
          "user_id": "Int?",
          "status": "String",
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
});
