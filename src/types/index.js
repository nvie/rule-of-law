// @flow strict

import invariant from 'invariant';

export type Schema = { [string]: RecordTypeInfo };

export type RecordTypeInfo = {|
  type: 'Record',
  alias?: string,
  record: { [string]: TypeInfo }, // e.g. Order, Prescription, etc.
|};

export type RelationTypeInfo = {|
  type: 'Relation',
  srcField: string,
  dst: string,
  dstField: string,
|};

export type TypeInfo =
  | {| type: 'Empty', alias?: string |}
  | {| type: 'String', alias?: string |}
  | {| type: 'Int', alias?: string |}
  | {| type: 'Date', alias?: string |}
  | {| type: 'Bool', alias?: string |}
  | {| type: 'Null', alias?: string |}
  | {| type: 'Nullable', alias?: string, ofType: TypeInfo |}
  | RecordTypeInfo
  | RelationTypeInfo;

const Empty = (): TypeInfo => ({ type: 'Empty' });

const Int = (): TypeInfo => ({ type: 'Int' });

const String = (): TypeInfo => ({ type: 'String' });

const Date = (): TypeInfo => ({ type: 'Date' });

const Bool = (): TypeInfo => ({ type: 'Bool' });

const Null = (): TypeInfo => ({ type: 'Null' });

const Record = (
  record: { [string]: TypeInfo },
  alias: string,
): RecordTypeInfo => ({
  type: 'Record',
  alias,
  record,
});

const Nullable = (ofType: TypeInfo, alias?: string): TypeInfo => {
  return { type: 'Nullable', alias, ofType };
};

export default {
  Bool,
  Empty,
  Int,
  Date,
  Null,
  Nullable,
  Record,
  String,
};
