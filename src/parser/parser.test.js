// @flow

import ast from '../ast';
import invariant from 'invariant';
import type { RuleNode } from '../ast';
import { parseString as parse } from './index';

function parseRule(src): RuleNode {
  const rules = parse(src).rules;
  invariant(
    rules.length === 1,
    `Expected to find a single rule, but found ${rules.length}`,
  );
  return rules[0];
}

describe('empty document', () => {
  it('empty module', () => {
    expect(parse('')).toEqual(ast.Document([]));
  });
});

describe('simple rule', () => {
  it('rule', () => {
    expect(
      parseRule(`
        rule "Eric is cool"
          forall Order o:
            p
      `),
    ).toEqual(
      ast.Rule(
        'Eric is cool',
        ast.ForAllQuantifier(
          ast.Identifier('Order'),
          ast.Identifier('o'),
          ast.Identifier('p'),
        ),
      ),
    );
  });
});
