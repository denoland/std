// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.

import type {
  Expected,
  ExtendMatchResult,
  Matcher,
  MatcherContext,
  MatcherKey,
  Matchers,
} from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
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
import {
  any,
  anything,
  arrayContaining,
  closeTo,
  stringContaining,
  stringMatching,
} from "./_asymmetric_matchers.ts";

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

export function expect(value: unknown, customMessage?: string): Expected {
  let isNot = false;
  let isPromised = false;
  const self: Expected = new Proxy<Expected>(
    <Expected> {},
    {
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
    },
  );

  return self;
}

expect.addEqualityTesters = addCustomEqualityTesters;
expect.extend = setExtendMatchers;

expect.anything = anything;
expect.any = any;
expect.arrayContaining = arrayContaining;
expect.closeTo = closeTo;
expect.stringContaining = stringContaining;
expect.stringMatching = stringMatching;
