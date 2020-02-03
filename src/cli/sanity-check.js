// @flow

import fs from 'fs';
import ast from '../ast';
import check_, { TypeCheckError, typeFromJSON } from '../checker';
import commander from 'commander';
import simplify from '../simplifier';
import formatter from '../formatter';
import execute from '../engine';
import invariant from 'invariant';
import { parseDocument, printFriendlyError } from '../parser';
import type { DocumentNode } from '../ast';
import type { Schema } from '../checker';

type Options = {|
  schemaFile: string,
  verbose: boolean,
|};

function readSchema(schemaString: string): Schema {
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

function check(doc: DocumentNode, schema: Schema, inputString: string): void {
  try {
    check_(doc, schema);
  } catch (e) {
    /**
     * If this is a type check error, report this in a visually pleasing
     * manner in the console.
     */
    if (e instanceof TypeCheckError) {
      printFriendlyError(e, inputString, 'Type error');
      process.exit(2);
    } else {
      throw e;
    }
  }
}

function runWithOptions(options: Options, args: Array<string>) {
  const schema = readSchema(fs.readFileSync(options.schemaFile, 'utf-8'));

  const [inputFile] = args;
  const inputString = fs.readFileSync(inputFile, 'utf-8');

  const doc = parseDocument(inputString);
  check(doc, schema, inputString);

  const sql = execute(doc);
  console.log(sql);
}

async function main() {
  const program = commander
    .name('sanity-check')
    .version('0.0.1')
    .usage('[options] <path> [<path> ...]')
    .description('TODO')
    .option('-v, --verbose', 'Be verbose')
    .option(
      '-s, --schema <file>',
      'Path to the schema definition JSON config file',
    )
    .parse(process.argv);

  // $FlowFixMe - options monkey-patched on program are invisible to Flow
  if (program.args.length < 1) {
    program.help();
  } else {
    // $FlowFixMe - options monkey-patched on program are invisible to Flow
    const { verbose, schema } = program;
    const options = { verbose, schemaFile: schema };
    runWithOptions(options, program.args);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => console.error(e) || process.exit(1));
