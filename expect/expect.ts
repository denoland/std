// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.
// Copyright (c) Meta Platforms, Inc. and affiliates.
// The documentation is extracted from https://github.com/jestjs/jest/blob/main/website/versioned_docs/version-29.7/ExpectAPI.md
// and updated for the Deno ecosystem.

import type {
  Expected,
  ExtendMatchResult,
  Matcher,
  MatcherContext,
  MatcherKey,
  Matchers,
} from "./_types.ts";
import { AssertionError } from "@std/assert/assertion-error";
import {
  addCustomEqualityTesters,
  getCustomEqualityTesters,
} from "./_custom_equality_tester.ts";
import { equal } from "./_equal.ts";
import { getExtendMatchers, setExtendMatchers } from "./_extend.ts";
import {
  toBe,
  toBeCloseTo,
  toBeDefined,
  toBeFalsy,
  toBeGreaterThan,
  toBeGreaterThanOrEqual,
  toBeInstanceOf,
  toBeLessThan,
  toBeLessThanOrEqual,
  toBeNaN,
  toBeNull,
  toBeTruthy,
  toBeUndefined,
  toContain,
  toContainEqual,
  toEqual,
  toHaveBeenCalled,
  toHaveBeenCalledTimes,
  toHaveBeenCalledWith,
  toHaveBeenLastCalledWith,
  toHaveBeenNthCalledWith,
  toHaveLastReturnedWith,
  toHaveLength,
  toHaveNthReturnedWith,
  toHaveProperty,
  toHaveReturned,
  toHaveReturnedTimes,
  toHaveReturnedWith,
  toMatch,
  toMatchObject,
  toStrictEqual,
  toThrow,
} from "./_matchers.ts";
import { isPromiseLike } from "./_utils.ts";
import * as asymmetricMatchers from "./_asymmetric_matchers.ts";
import type { Tester } from "./_types.ts";

export type { AnyConstructor, Async, Expected } from "./_types.ts";

const matchers: Record<MatcherKey, Matcher> = {
  lastCalledWith: toHaveBeenLastCalledWith,
  lastReturnedWith: toHaveLastReturnedWith,
  nthCalledWith: toHaveBeenNthCalledWith,
  nthReturnedWith: toHaveNthReturnedWith,
  toBeCalled: toHaveBeenCalled,
  toBeCalledTimes: toHaveBeenCalledTimes,
  toBeCalledWith: toHaveBeenCalledWith,
  toBeCloseTo,
  toBeDefined,
  toBeFalsy,
  toBeGreaterThanOrEqual,
  toBeGreaterThan,
  toBeInstanceOf,
  toBeLessThanOrEqual,
  toBeLessThan,
  toBeNaN,
  toBeNull,
  toBeTruthy,
  toBeUndefined,
  toBe,
  toContainEqual,
  toContain,
  toEqual,
  toHaveBeenCalledTimes,
  toHaveBeenCalledWith,
  toHaveBeenCalled,
  toHaveBeenLastCalledWith,
  toHaveBeenNthCalledWith,
  toHaveLength,
  toHaveLastReturnedWith,
  toHaveNthReturnedWith,
  toHaveProperty,
  toHaveReturnedTimes,
  toHaveReturnedWith,
  toHaveReturned,
  toMatchObject,
  toMatch,
  toReturn: toHaveReturned,
  toReturnTimes: toHaveReturnedTimes,
  toReturnWith: toHaveReturnedWith,
  toStrictEqual,
  toThrow,
};

/**
 * **Note:** the documentation for this module is taken from [Jest](https://github.com/jestjs/jest/blob/main/website/versioned_docs/version-29.7/ExpectAPI.md)
 * and the examples are updated for Deno.
 *
 * The `expect` function is used to test a value. You will use `expect` along with a
 * "matcher" function to assert something about a value.
 *
 * @example Usage
 * ```ts no-assert
 * import { expect } from "@std/expect";
 *
 * function bestLaCroixFlavor(): string {
 *  return "grapefruit";
 * }
 *
 * Deno.test("the best flavor is grapefruit", () => {
 *  expect(bestLaCroixFlavor()).toBe("grapefruit");
 * });
 * ```
 *
 * In this case, `toBe` is the matcher function. There are a lot of different
 * matcher functions, documented in the main module description.
 *
 * The argument to `expect` should be the value that your code produces, and any
 * argument to the matcher should be the correct value. If you mix them up, your
 * tests will still work, but the error messages on failing tests will look
 * strange.
 *
 * @param value - The value to perform assertions on.
 * @param customMessage - An optional custom message to include in the assertion error.
 * @returns An expected object that can be used to chain matchers.
 *
 * @module
 */
export function expect(value: unknown, customMessage?: string): Expected {
  let isNot = false;
  let isPromised = false;
  const self: Expected = new Proxy<Expected>(<Expected> {}, {
    get(_, name) {
      if (name === "not") {
        isNot = !isNot;
        return self;
      }

      if (name === "resolves") {
        if (!isPromiseLike(value)) {
          throw new AssertionError("expected value must be Promiselike");
        }

        isPromised = true;
        return self;
      }

      if (name === "rejects") {
        if (!isPromiseLike(value)) {
          throw new AssertionError("expected value must be a PromiseLike");
        }

        value = value.then(
          (value) => {
            throw new AssertionError(
              `Promise did not reject. resolved to ${value}`,
            );
          },
          (err) => err,
        );
        isPromised = true;
        return self;
      }

      const extendMatchers: Matchers = getExtendMatchers();
      const allMatchers = {
        ...extendMatchers,
        ...matchers,
      };
      const matcher = allMatchers[name as MatcherKey] as Matcher;
      if (!matcher) {
        throw new TypeError(
          typeof name === "string"
            ? `matcher not found: ${name}`
            : "matcher not found",
        );
      }

      return (...args: unknown[]) => {
        function applyMatcher(value: unknown, args: unknown[]) {
          const context: MatcherContext = {
            value,
            equal,
            isNot: false,
            customMessage,
            customTesters: getCustomEqualityTesters(),
          };
          if (isNot) {
            context.isNot = true;
          }
          if (name in extendMatchers) {
            const result = matcher(context, ...args) as ExtendMatchResult;
            if (context.isNot) {
              if (result.pass) {
                throw new AssertionError(result.message());
              }
            } else if (!result.pass) {
              throw new AssertionError(result.message());
            }
          } else {
            matcher(context, ...args);
          }
        }

        return isPromised
          ? (value as Promise<unknown>).then((value: unknown) =>
            applyMatcher(value, args)
          )
          : applyMatcher(value, args);
      };
    },
  });

  return self;
}

/**
 * You can use `expect.addEqualityTesters` to add your own methods to test if two
 * objects are equal. For example, let's say you have a class in your code that
 * represents volume and can determine if two volumes using different units are
 * equal. You may want `toEqual` (and other equality matchers) to use this custom
 * equality method when comparing to Volume classes. You can add a custom equality
 * tester to have `toEqual` detect and apply custom logic when comparing Volume
 * classes:
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * class Volume {
 *   amount: number;
 *   unit: "L" | "mL";
 *
 *   constructor(amount: number, unit: "L" | "mL") {
 *     this.amount = amount;
 *     this.unit = unit;
 *   }
 *
 *   toString() {
 *     return `[Volume ${this.amount}${this.unit}]`;
 *   }
 *
 *   equals(other: Volume) {
 *     if (this.unit === other.unit) {
 *       return this.amount === other.amount;
 *     } else if (this.unit === "L" && other.unit === "mL") {
 *       return this.amount * 1000 === other.amount;
 *     } else {
 *       return this.amount === other.amount * 1000;
 *     }
 *   }
 * }
 *
 * function areVolumesEqual(a: Volume, b: Volume) {
 *   const isAVolume = a instanceof Volume;
 *   const isBVolume = b instanceof Volume;
 *   if (isAVolume && isBVolume) {
 *     return a.equals(b);
 *   } else if (isAVolume === isBVolume) {
 *     return undefined;
 *   } else {
 *     return false;
 *   }
 * }
 *
 * expect.addEqualityTesters([areVolumesEqual]);
 *
 * Deno.test("are equal with different units", () => {
 *   expect(new Volume(1, "L")).toEqual(new Volume(1000, "mL"));
 * });
 * ```
 */
expect.addEqualityTesters = addCustomEqualityTesters as (
  newTesters: Tester[],
) => void;
/**
 * TODO: export appropriate types to define custom matchers.
 */
expect.extend = setExtendMatchers as (newExtendMatchers: Matchers) => void;
/**
 * `expect.anything()` matches anything but `null` or `undefined`. You can use it
 * inside `toEqual` or `toHaveBeenCalledWith` instead of a literal value.
 *
 * @example
 * ```js
 * import { expect, fn } from "@std/expect";
 *
 * Deno.test("map calls its argument with a non-null argument", () => {
 *   const mock = jest.fn();
 *   [1].map((x) => mock(x));
 *   expect(mock).toHaveBeenCalledWith(expect.anything());
 * });
```
 */
expect.anything = asymmetricMatchers.anything as () => ReturnType<
  typeof asymmetricMatchers.anything
>;
/**
 * `expect.any(constructor)` matches anything that was created with the given
 * constructor or if it's a primitive that is of the passed type. You can use it
 * inside `toEqual` or `toHaveBeenCalledWith` instead of a literal value.
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * class Cat {}
 * Deno.test("expect.any()", () => {
 *   expect(new Cat()).toEqual(expect.any(Cat));
 *   expect("Hello").toEqual(expect.any(String));
 *   expect(1).toEqual(expect.any(Number));
 *   expect(() => {}).toEqual(expect.any(Function));
 *   expect(false).toEqual(expect.any(Boolean));
 *   expect(BigInt(1)).toEqual(expect.any(BigInt));
 *   expect(Symbol("sym")).toEqual(expect.any(Symbol));
 * });
 * ```
 */
expect.any = asymmetricMatchers.any as (
  c: unknown,
) => ReturnType<typeof asymmetricMatchers.any>;
/**
 * `expect.arrayContaining(array)` matches a received array which contains all of
 * the elements in the expected array. That is, the expected array is a **subset**
 * of the received array. Therefore, it matches a received array which contains
 * elements that are **not** in the expected array.
 *
 * You can use it instead of a literal value:
 *
 * - in `toEqual` or `toHaveBeenCalledWith`
 * - to match a property in `objectContaining` or `toMatchObject`
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * Deno.test("expect.arrayContaining() with array of numbers", () => {
 *   const arr = [1, 2, 3];
 *   expect([1, 2, 3, 4]).toEqual(expect.arrayContaining(arr));
 *   expect([4, 5, 6]).not.toEqual(expect.arrayContaining(arr));
 *   expect([1, 2, 3]).toEqual(expect.arrayContaining(arr));
 * });
 * ```
 */
expect.arrayContaining = asymmetricMatchers.arrayContaining as (
  // deno-lint-ignore no-explicit-any
  c: any[],
) => ReturnType<typeof asymmetricMatchers.arrayContaining>;
/**
 * `expect.closeTo(number, numDigits?)` is useful when comparing floating point
 * numbers in object properties or array item. If you need to compare a number,
 * please use `.toBeCloseTo` instead.
 *
 * The optional `numDigits` argument limits the number of digits to check **after**
 * the decimal point. For the default value `2`, the test criterion is
 * `Math.abs(expected - received) < 0.005 (that is, 10 ** -2 / 2)`.
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * Deno.test("compare float in object properties", () => {
 *   expect({
 *     title: "0.1 + 0.2",
 *     sum: 0.1 + 0.2,
 *   }).toEqual({
 *     title: "0.1 + 0.2",
 *     sum: expect.closeTo(0.3, 5),
 *   });
 * });
 * ```
 */
expect.closeTo = asymmetricMatchers.closeTo as (
  num: number,
  numDigits?: number,
) => ReturnType<typeof asymmetricMatchers.closeTo>;
/**
 * `expect.stringContaining(string)` matches the received value if it is a string
 * that contains the exact expected string.
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * Deno.test("expect.stringContaining() with strings", () => {
 *   expect("https://deno.com/").toEqual(expect.stringContaining("deno"));
 *   expect("function").toEqual(expect.stringContaining("func"));
 *
 *   expect("Hello, World").not.toEqual(expect.stringContaining("hello"));
 *   expect("foobar").not.toEqual(expect.stringContaining("bazz"));
 * });
 * ```
 */
expect.stringContaining = asymmetricMatchers.stringContaining as (
  str: string,
) => ReturnType<typeof asymmetricMatchers.stringContaining>;
/**
 * `expect.stringMatching(string | regexp)` matches the received value if it is a
 * string that matches the expected string or regular expression.
 *
 * You can use it instead of a literal value:
 *
 * - in `toEqual` or `toHaveBeenCalledWith`
 * - to match an element in `arrayContaining`
 * - to match a property in `objectContaining` (not available yet) or `toMatchObject`
 *
 * @example
 * ```ts
 * import { expect } from "@std/expect";
 *
 * Deno.test("example", () => {
 *   expect("deno_std").toEqual(expect.stringMatching(/std/));
 *   expect("0123456789").toEqual(expect.stringMatching(/\d+/));
 *   expect("e").not.toEqual(expect.stringMatching(/\s/));
 *   expect("queue").not.toEqual(expect.stringMatching(/en/));
 * });
 * ```
 */
expect.stringMatching = asymmetricMatchers.stringMatching as (
  pattern: string | RegExp,
) => ReturnType<typeof asymmetricMatchers.stringMatching>;
