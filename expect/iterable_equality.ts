// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { equal } from "./_equal.ts";
import { Tester } from "./_types.ts";
import {
  entries,
  hasIterator,
  isA,
  isImmutableUnorderedSet,
  isImmutableUnorderedKeyed,
  isImmutableList,
  isImmutableOrderedKeyed,
  isImmutableOrderedSet,
  isImmutableRecord,
} from "./_utils.ts";

export function iterableEquality(
  // deno-lint-ignore no-explicit-any
  a: any,
  // deno-lint-ignore no-explicit-any
  b: any,
  customTesters: Tester[] = [],
  aStack: unknown[] = [],
  bStack: unknown[] = [],
): boolean | undefined {
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) ||
    Array.isArray(b) ||
    !hasIterator(a) ||
    !hasIterator(b)
  ) {
    return undefined;
  }
  if (a.constructor !== b.constructor) {
    return false;
  }
  let length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    // circular references at same depth are equal
    // circular reference is not equal to non-circular one
    if (aStack[length] === a) {
      return bStack[length] === b;
    }
  }
  aStack.push(a);
  bStack.push(b);

  // deno-lint-ignore no-explicit-any
  const iterableEqualityWithStack = (a: any, b: any) =>
    iterableEquality(
      a,
      b,
      [...filteredCustomTesters],
      [...aStack],
      [...bStack],
    );

  // Replace any instance of iterableEquality with the new
  // iterableEqualityWithStack so we can do circular detection
  const filteredCustomTesters: Tester[] = [
    ...customTesters.filter((t) => t !== iterableEquality),
    iterableEqualityWithStack,
  ];

  if (a.size !== undefined) {
    if (a.size !== b.size) {
      return false;
    } else if (isA<Set<unknown>>("Set", a) || isImmutableUnorderedSet(a)) {
      let allFound = true;
      for (const aValue of a) {
        if (!b.has(aValue)) {
          let has = false;
          for (const bValue of b) {
            const isEqual = equal(aValue, bValue, {
              customTesters: filteredCustomTesters,
            });
            if (isEqual === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    } else if (
      isA<Map<unknown, unknown>>("Map", a) ||
      isImmutableUnorderedKeyed(a)
    ) {
      let allFound = true;
      for (const aEntry of a) {
        if (
          !b.has(aEntry[0]) ||
          !equal(aEntry[1], b.get(aEntry[0]), {
            customTesters: filteredCustomTesters,
          })
        ) {
          let has = false;
          for (const bEntry of b) {
            const matchedKey = equal(
              aEntry[0],
              bEntry[0],
              { customTesters: filteredCustomTesters },
            );

            let matchedValue = false;
            if (matchedKey === true) {
              matchedValue = equal(
                aEntry[1],
                bEntry[1],
                { customTesters: filteredCustomTesters },
              );
            }
            if (matchedValue === true) {
              has = true;
            }
          }

          if (has === false) {
            allFound = false;
            break;
          }
        }
      }
      // Remove the first value from the stack of traversed values.
      aStack.pop();
      bStack.pop();
      return allFound;
    }
  }

  const bIterator = b[Symbol.iterator]();

  for (const aValue of a) {
    const nextB = bIterator.next();
    if (
      nextB.done ||
      !equal(aValue, nextB.value, { customTesters: filteredCustomTesters })
    ) {
      return false;
    }
  }
  if (!bIterator.next().done) {
    return false;
  }

  if (
    !isImmutableList(a) &&
    !isImmutableOrderedKeyed(a) &&
    !isImmutableOrderedSet(a) &&
    !isImmutableRecord(a)
  ) {
    const aEntries = entries(a);
    const bEntries = entries(b);
    if (!equal(aEntries, bEntries)) {
      return false;
    }
  }

  // Remove the first value from the stack of traversed values.
  aStack.pop();
  bStack.pop();
  return true;
}
