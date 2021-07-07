// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
 * Returns all distinct elements that appear in either of the given arrays
 *
 * Example:
 *
 * ```typescript
 * const soupIngredients = [ 'Pepper', 'Carrots', 'Leek' ]
 * const saladIngredients = [ 'Carrots', 'Radicchio', 'Pepper' ]
 * const shoppingList = union(soupIngredients, saladIngredients)
 *
 * console.assert(shoppingList === [ 'Pepper', 'Carrots', 'Leek', 'Radicchio' ])
 * ```
 */
export function union<T>(a: Array<T>, b: Array<T>): Array<T> {
  // TODO(wperron) implement this
  return [];
}
