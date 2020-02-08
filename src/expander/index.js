// @flow strict

import type { DocumentNode } from '../ast';
import type { Schema } from '../types';

/**
 * In the expansion phase, complex expressions (an AST tree) are rewritten to
 * their "expanded form" (also an AST tree).  Examples are:
 *
 *   forall foo f:
 *     f.bar.qux.baz
 *
 */

export function expand(doc: DocumentNode, schema: Schema): DocumentNode {
  return doc;
}
