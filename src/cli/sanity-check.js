// @flow

import fs from 'fs';
import ast from '../ast';
import check_, { TypeCheckError } from '../checker';
import commander from 'commander';
import simplify from '../simplifier';
import formatter from '../formatter';
import execute from '../engine';
import { parseDocument, printFriendlyError } from '../parser';
import type { DocumentNode } from '../ast';

type Options = {|
  verbose: boolean,
|};

function check(doc: DocumentNode, inputString: string): void {
  try {
    check_(doc);
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
  const [inputFile] = args;
  const inputString = fs.readFileSync(inputFile, 'utf-8');

  const doc = parseDocument(inputString);
  check(doc, inputString);

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
    .parse(process.argv);

  // $FlowFixMe - options monkey-patched on program are invisible to Flow
  if (program.args.length < 1) {
    program.help();
  } else {
    // $FlowFixMe - options monkey-patched on program are invisible to Flow
    const { verbose } = program;
    const options = { verbose };
    runWithOptions(options, program.args);
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => console.error(e) || process.exit(1));
