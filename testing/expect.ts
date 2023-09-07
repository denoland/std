// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright 2019 Allain Lalonde. All rights reserved. ISC License.

import * as builtInMatchers from "./_matchers/mod.ts";
import type { Matcher, MatcherContext, Matchers } from "./_types.ts";
import { AssertionError } from "../assert/assertion_error.ts";
import { AnyConstructor } from '../assert/assert_instance_of.ts';

export interface Expected {
  /* Similar to assertEqual */
  toEqual(candidate: unknown): void;
  toStrictEqual(candidate: unknown): void;
  toBe(candidate: unknown): void;
  toBeCloseTo(candidate: number, tolerance?: number): void;
  toBeDefined(): void;
  toBeFalsy(): void;
  toBeGreater(expected: number): void;
  toBeGreaterOrEqual(expected: number): void;
  toBeInstanceOf<T extends AnyConstructor>(expected: T): void;
  toBeLess(expected: number): void;
  toBeLessOrEqual(expected: number): void;
  toBeNan(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeUndefined(): void;
  toMatch(expected: RegExp): void;
  toMatchObject(expected: Record<PropertyKey, unknown>): void;
  toThrow<E extends Error = Error>(expected: new (...args: any[]) => E,): void;
  not: Expected;
  resolves: Async<Expected>;
  rejects: Async<Expected>;
}

const matchers: Record<string | symbol, Matcher> = {
  ...builtInMatchers,
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

        const matcher: Matcher = matchers[name as string];
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

// a helper type to match any function. Used so that we only convert functions
// to return a promise and not properties.
type Fn = (...args: unknown[]) => unknown;

// converts all the methods in an interface to be async functions
export type Async<T> = {
  [K in keyof T]: T[K] extends Fn
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K];
};

export function addMatchers(newMatchers: Matchers): void {
  Object.assign(matchers, newMatchers);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (value == null) {
    return false;
  } else {
    return typeof ((value as Record<string, unknown>).then) === "function";
  }
}
