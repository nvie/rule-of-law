// @flow

import invariant from 'invariant';
import { parsePredicate as p } from '../parser';
import format from './index';

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
});
