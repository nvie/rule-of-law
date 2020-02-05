// @flow strict

import type { Schema } from './index';
import invariant from 'invariant';
import { typeFromJSON, typeToString } from '../checker';

export function dumpSchema(schema: Schema): string {
  const pairs = [];
  for (const key of Object.keys(schema)) {
    const record = schema[key];
    pairs.push([key, typeToString(record)]);
  }
  return `{${pairs.map(([k, v]) => `${k}: ${v}`).join(',')}}`;
}

export function readSchema(schemaString: string): Schema {
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
