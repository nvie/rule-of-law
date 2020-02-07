// @flow strict

import type { TypeInfo, Schema } from '../types';
import invariant from 'invariant';
import { isCompatible, typeFromJSON, typeToString } from '../checker';

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

/**
 * Type checks the schema to see if all relationships are valid declarations.
 */
function checkSchema(schema: Schema) {
  // Check all declared types
  for (const key of Object.keys(schema)) {
    const typeDef = schema[key];
    const record = typeDef.record;

    // Check each field within each type
    for (const field of Object.keys(record)) {
      const fieldType = record[field];
      if (fieldType.type === 'Relation') {
        const { srcField, dst, dstField } = fieldType;

        // Check the source field exists
        const srcFieldType = record[srcField];
        if (srcFieldType === undefined) {
          throw new Error(
            `Unknown field \`${srcField}\` (in \`${key}.${field}\` relation)`,
          );
        }

        // Check the destination type exists
        const dstType = schema[dst] ? schema[dst].record : undefined;
        if (dstType === undefined) {
          throw new Error(
            `Unknown type \`${dst}\` (in \`${key}.${field}\` relation)`,
          );
        }

        // Check the destination field exists
        const dstFieldType = dstType[dstField];
        if (dstFieldType === undefined) {
          throw new Error(
            `Unknown field \`${dst}:${dstField}\` (in \`${key}.${field}\` relation)`,
          );
        }

        // Check the source field and destination field types match
        if (!isCompatible(srcFieldType, dstFieldType)) {
          throw new Error(
            `Type error: \`${srcField}\` (${typeToString(
              srcFieldType,
            )}) incompatible with \`${dst}:${dstField}\` (${typeToString(
              dstFieldType,
            )})`,
          );
        }
      }
    }
  }
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

  checkSchema(rv);

  return rv;
}
