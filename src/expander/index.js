// @flow strict

import type { DocumentNode } from '../ast';
import type { Schema } from '../types';

/**
 * In the expansion phase, complex expressions (an AST tree) are rewritten to
 * their "expanded form" (also an AST tree).  Examples are:
 *
 *   forall orders order:
 *     order.user.is_enabled and order.user.name = "Eric"
 *
 *   forall orders order:
 *     (order.status = "COMPLETE" => (
 *       ... <--
 *       ((order.user).is_enabled)))
 *
 * Which may get rewritten to:
 *
 *   forall orders order:
 *     forall users _x1:
 *       order.user_id = _x1.id =>
 *         _x1.is_enabled
 *
 * This all happens before the "simplification" phase, which will rewrite all
 * the boolean operations to their smallest representation.
 *
 *
 * Step 1:
 * - Search the document deeply for a FieldSelection node, and see if the type
 *   of the field is a Relation type. (Relation has srcField, dst, dstField)
 *   (so NOT a primitive type like String, Int)
 *
 *   Store: { expr = order, field = user }
 *
 * Step 2:
 * - Look up the type of dst in the schema
 *   Store: { srcField = user_id, dst = users, dstField = id }
 *
 * - Compute the new name
 *   Store: { generated_name = _x1 }
 *
 * Step 3:
 * - Find the nearest parent that is a Predicate node (but not an ExprNode)
 *   Store: { root = ((order.user).is_enabled) }
 *
 * Step 4:
 * - Create a new AST node:
 *
 *   { newRoot =
 *       forall $dst $generated_name:
 *         $expr.$srcField = $generated_name.$dstField =>
 *           $root
 *   }
 *
 */

export function expand(doc: DocumentNode, schema: Schema): DocumentNode {
  return doc;
}
