// @flow strict

import type { TypeInfo, Schema } from '../types';
import invariant from 'invariant';
import { typeFromJSON } from '../checker';

function dumpTypeInfo(info: TypeInfo): mixed {
  switch (info.type) {
    case 'Record': {
      const pairs = {};
      for (const key of Object.keys(info.record)) {
        pairs[key] = dumpTypeInfo(info.record[key]);
      }
      return pairs;
    }

    case 'Nullable': {
      const value = dumpTypeInfo(info.ofType);
      invariant(typeof value === 'string', 'Expected a string');
      return value + '?';
    }

    case 'Date':
      return 'Date';

    case 'Int':
      return 'Int';

    case 'String':
      return 'String';

    case 'Bool':
      return 'Bool';

    case 'Relation':
      return `${info.srcField} -> ${info.dst}:${info.dstField}`;

    default:
      throw new Error(`Don't know how to dump type info for ${info.type}`);
  }
}

export function dumpSchema(schema: Schema): string {
  const pairs = {};
  for (const key of Object.keys(schema)) {
    const record = schema[key];
    pairs[key] = dumpTypeInfo(record);
  }
  return JSON.stringify(pairs, null, 2);
}

export function parseSchema(schemaString: string): Schema {
  const blob = JSON.parse(schemaString);
  invariant(
    typeof blob === 'object' && blob != null,
    'Schema must define an object',
  );

  const rv: Schema = {};
  for (const key of Object.keys(blob)) {
    const type = typeFromJSON(blob[key], key);
    invariant(
      type.type === 'Record',
      'Expected only Record types at the top level of the schema',
    );
    rv[key] = type;
  }
  return rv;
}
