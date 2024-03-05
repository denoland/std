// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { EqualOptions, EqualOptionUtil } from "./_types.ts";
import type { Tester } from "./_types.ts";
import { equal } from "./_equal.ts";

export function buildEqualOptions(options: EqualOptionUtil): EqualOptions {
  const { customMessage, customTesters = [], strictCheck } = options || {};
  return {
    customTesters,
    msg: customMessage,
    strictCheck,
  };
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (value == null) {
    return false;
  } else {
    return typeof ((value as Record<string, unknown>).then) === "function";
  }
}

// Check of these sentinel values are supported in jest (expect-utils)
// See https://github.com/jestjs/jest/blob/442c7f692e3a92f14a2fb56c1737b26fc663a0ef/packages/expect-utils/src/immutableUtils.ts#L29
// SENTINEL constants are from https://github.com/facebook/immutable-js
const IS_KEYED_SENTINEL = "@@__IMMUTABLE_KEYED__@@";
const IS_SET_SENTINEL = "@@__IMMUTABLE_SET__@@";
const IS_LIST_SENTINEL = "@@__IMMUTABLE_LIST__@@";
const IS_ORDERED_SENTINEL = "@@__IMMUTABLE_ORDERED__@@";
const IS_RECORD_SYMBOL = "@@__IMMUTABLE_RECORD__@@";

function isObjectLiteral(source: unknown): source is Record<string, unknown> {
  return source != null && typeof source === "object" && !Array.isArray(source);
}

export function isImmutableUnorderedKeyed(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_KEYED_SENTINEL] &&
      !source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableUnorderedSet(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_SET_SENTINEL] &&
      !source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableList(source: unknown): boolean {
  return Boolean(source && isObjectLiteral(source) && source[IS_LIST_SENTINEL]);
}

export function isImmutableOrderedKeyed(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_KEYED_SENTINEL] &&
      source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableOrderedSet(source: unknown): boolean {
  return Boolean(
    source &&
      isObjectLiteral(source) &&
      source[IS_SET_SENTINEL] &&
      source[IS_ORDERED_SENTINEL],
  );
}

export function isImmutableRecord(source: unknown): boolean {
  return Boolean(source && isObjectLiteral(source) && source[IS_RECORD_SYMBOL]);
}

// deno-lint-ignore no-explicit-any
export function hasIterator(object: any) {
  return !!(object != null && object[Symbol.iterator]);
}

export function isA<T>(typeName: string, value: unknown): value is T {
  return Object.prototype.toString.apply(value) === `[object ${typeName}]`;
}

function isObject(a: unknown) {
  return a !== null && typeof a === "object";
}

// deno-lint-ignore no-explicit-any
export function entries(obj: any) {
  if (!isObject(obj)) return [];

  const symbolProperties = Object.getOwnPropertySymbols(obj)
    .filter((key) => key !== Symbol.iterator)
    .map((key) => [key, obj[key]]);

  return [...symbolProperties, ...Object.entries(obj)];
}

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
