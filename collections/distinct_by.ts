/**
 * Returns all elements in the given array that produce a distinct value using the given selector, preserving order by first occurence
 *
 * Example:
 *
 * ```typescript
 * const names = [ 'Anna', 'Kim', 'Arnold', 'Kate' ]
 * const exampleNamesByFirstLetter = distinctBy(names, it => it.charAt(0))
 *
 * console.assert(exampleNamesByFirstLetter === [ 'Anna', 'Kim' ])
 * ```
 */
export function distinctBy<T>(
  array: Array<T>,
  selector: (element: T) => unknown,
): Array<T> {
  // TODO implement me
  return array;
}
