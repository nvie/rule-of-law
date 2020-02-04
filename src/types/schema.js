// @flow strict

import type { Schema } from './index';
import invariant from 'invariant';
import { typeFromJSON } from '../checker';

export default function readSchema(schemaString: string): Schema {
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
