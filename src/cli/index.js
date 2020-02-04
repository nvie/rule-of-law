// @flow

import fs from 'fs';
import ast from '../ast';
import check, { TypeCheckError, typeFromJSON } from '../checker';
import commander from 'commander';
import colors from 'colors';
import simplify from '../simplifier';
import formatter from '../formatter';
import executeRules from '../engine';
import readSchema from '../types/schema';
import invariant from 'invariant';
import { parseDocument, printFriendlyError } from '../parser';
import type { DocumentNode } from '../ast';
import type { Schema } from '../types';

type Options = {|
  schemaFile: string,
  verbose: boolean,
|};

function runWithOptions(options: Options, args: Array<string>) {
  const schema = readSchema(fs.readFileSync(options.schemaFile, 'utf-8'));

  const [inputFile] = args;
  const inputString = fs.readFileSync(inputFile, 'utf-8');

  const doc = parseDocument(inputString);
  check(doc, schema, inputString);

  const rules = executeRules(doc, 3);
  for (const rule of rules) {
    console.log('');
    console.log('');
    console.log(colors.magenta(rule.rule));
    console.log(colors.gray(rule.sql));
  }
}

async function main() {
  const program = commander
    .name('rule-of-law')
    .version('0.0.1')
    .usage('[options] <path> [<path> ...]')
    .description('TODO')
    .option('-v, --verbose', 'Be verbose')
    .option(
      '-s, --schema <file>',
      'Path to the schema definition JSON config file',
    )
    .parse(process.argv);

  if (program.args.length < 1) {
    program.help();
  } else {
    const { verbose, schema } = program;
    const options = { verbose, schemaFile: schema };
    runWithOptions(options, program.args);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => console.error(e) || process.exit(1));
