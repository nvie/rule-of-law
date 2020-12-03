// @flow

import invariant from 'invariant';
import { parsePredicate } from '../parser';
import format from './index';
import type { PredicateNode } from '../ast';

function p(input: string): PredicateNode {
  return parsePredicate(input, { noLocation: true });
}

describe('formatter', () => {
  it('x and y', () => {
    expect(format(p('(((x)) and ((y)))'))).toEqual('x and y');
    expect(
      format(
        p(
          'very_long_names_will_make_this_be_split_onto_multiple_lines and also_pretty_long',
        ),
      ),
    ).toEqual(
      'very_long_names_will_make_this_be_split_onto_multiple_lines\nand\nalso_pretty_long',
    );
  });

  it('precedence', () => {
    expect(format(p('(x >= 0) or (y)'))).toEqual('x >= 0 or y');
    expect(format(p('x >= (0 or y)'))).toEqual('x >= (0 or y)');
  });

  it('math operators', () => {
    expect(format(p('p*(q+r/s)'))).toEqual('p * (q + r / s)');
  });

  it('function calls', () => {
    expect(format(p('p (q and r) >= 0 or s()'))).toEqual(
      'p(q and r) >= 0 or s()',
    );
  });
});
