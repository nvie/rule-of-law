// @flow strict

import check from './checker';
import executeRules from './engine';
import fs from 'fs';
import { parseSchema } from './schema';
import util from 'util';
import { parseDocument } from './parser';
import type { RuleOutput } from './engine';

export type RuleInfo = {|
  ...RuleOutput,
  filename: string,
|};

export { indent } from './lib';
export { parseSchema, dumpSchema } from './schema';

const readFile = util.promisify(fs.readFile);

export default async function* iterAll(
  files: Array<string>,
  schemaFile: string,
  limit: number | null,
): AsyncGenerator<RuleInfo, void, void> {
  const schemaContentsPromise = readFile(schemaFile, 'utf-8');
  const openFiles = files.map((f) => [f, readFile(f, 'utf-8')]);

  const schema = parseSchema(await schemaContentsPromise);
  for (const [filename, openFilePromise] of openFiles) {
    const inputString = await openFilePromise;

    const doc = parseDocument(inputString);
    check(doc, schema, inputString);

    for (const rule of executeRules(doc, limit)) {
      yield {
        ...rule,
        filename,
      };
    }
  }
}
