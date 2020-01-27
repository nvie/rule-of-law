// @flow strict

import invariant from 'invariant';

export type TypeInfo =
  | {| type: 'Empty', alias?: string |}
  | {| type: 'String', alias?: string |}
  | {| type: 'Int', alias?: string |}
  | {| type: 'Bool', alias?: string |}
  | {| type: 'Null', alias?: string |}
  | {|
      type: 'Record',
      alias?: string,
      record: { [string]: TypeInfo }, // e.g. Order, Prescription, etc.
    |}
  | {| type: 'Nullable', alias?: string, ofType: TypeInfo |};

const Empty = (): TypeInfo => ({ type: 'Empty' });

const Int = (): TypeInfo => ({ type: 'Int' });

const String = (): TypeInfo => ({ type: 'String' });

const Bool = (): TypeInfo => ({ type: 'Bool' });

const Null = (): TypeInfo => ({ type: 'Null' });

const Record = (record: { [string]: TypeInfo }, alias: string): TypeInfo => ({
  type: 'Record',
  alias,
  record,
});

const Nullable = (ofType: TypeInfo, alias?: string): TypeInfo => {
  return { type: 'Nullable', alias, ofType };
};

export default {
  Empty,
  Int,
  String,
  Bool,
  Null,
  Record,
  Nullable,
};
