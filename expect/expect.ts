// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.

import type {
  Expected,
  Matcher,
  MatcherContext,
  MatcherKey,
} from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import {
  addCustomEqualityTester,
  getCustomEqualityTester,
} from "./_custom_equality_tester.ts";
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

        const matcher: Matcher = matchers[name as MatcherKey];
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
              isNot: false,
              customMessage,
              customTesters: getCustomEqualityTester(),
            };
            if (isNot) {
              context.isNot = true;
            }
            matcher(context, ...args);
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

expect.addEqualityTester = addCustomEqualityTester;
