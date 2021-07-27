// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

/**
  * Transforms the given array into a Record, extracting the key of each element using the given selector.
  * If the selector produces the same key for multiple elements, the latest one will be used (overriding the
  * ones before it).
  *
  * Example:
  *
  * ```typescript
  * const users = [
  *     { id: 'a2e', userName: 'Anna' },
  *     { id: '5f8', userName: 'Arnold' },
  *     { id: 'd2c', userName: 'Kim' },
  * ]
  * const usersById = assocaiteBy(people, it => it.id)
  *
  * console.assert(usersById === {
  *     'a2e': { id: 'a2e', userName: 'Anna' },
  *     '5f8': { id: '5f8', userName: 'Arnold' },
  *     'd2c': { id: 'd2c', userName: 'Kim' },
  * })
  * ```
  */
export function associateBy<T>(
  array: Array<T>,
  selector: (el: T) => string,
): Record<string, T> {
  const ret: Record<string, T> = {};

  for (const element of array) {
    const selectedValue = selector(element);

    ret[selectedValue] = element;
  }

  return ret;
}
