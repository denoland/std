// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any

export interface MatcherContext {
  value: unknown;
  isNot: boolean;
  equal: (a: unknown, b: unknown, options?: EqualOptions) => boolean;
  customTesters: Tester[];
  customMessage: string | undefined;
}

export type Matcher = (
  context: MatcherContext,
  ...args: any[]
) => MatchResult | ExtendMatchResult;

export type Matchers = {
  [key: string]: Matcher;
};
export type MatchResult = void | Promise<void> | boolean;
export type ExtendMatchResult = {
  message: () => string;
  pass: boolean;
};
export type AnyConstructor = new (...args: any[]) => any;

export type Tester = (
  a: any,
  b: any,
  customTesters: Tester[],
) => void;

// a helper type to match any function. Used so that we only convert functions
// to return a promise and not properties.
type Fn = (...args: any[]) => unknown;

// converts all the methods in an interface to be async functions
export type Async<T> = {
  [K in keyof T]: T[K] extends Fn
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K];
};

export interface Expected {
  lastCalledWith(...expected: unknown[]): void;
  lastReturnedWith(expected: unknown): void;
  nthCalledWith(nth: number, ...expected: unknown[]): void;
  nthReturnedWith(nth: number, expected: unknown): void;
  toBeCalled(): void;
  toBeCalledTimes(expected: number): void;
  toBeCalledWith(...expected: unknown[]): void;
  toBeCloseTo(candidate: number, tolerance?: number): void;
  toBeDefined(): void;
  toBeFalsy(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeInstanceOf<T extends AnyConstructor>(expected: T): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeNaN(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeUndefined(): void;
  toBe(expected: unknown): void;
  toContainEqual(expected: unknown): void;
  toContain(expected: unknown): void;
  toEqual(expected: unknown): void;
  toHaveBeenCalledTimes(expected: number): void;
  toHaveBeenCalledWith(...expected: unknown[]): void;
  toHaveBeenCalled(): void;
  toHaveBeenLastCalledWith(...expected: unknown[]): void;
  toHaveBeenNthCalledWith(nth: number, ...expected: unknown[]): void;
  toHaveLength(expected: number): void;
  toHaveLastReturnedWith(expected: unknown): void;
  toHaveNthReturnedWith(nth: number, expected: unknown): void;
  toHaveProperty(propName: string | string[], value?: unknown): void;
  toHaveReturnedTimes(expected: number): void;
  toHaveReturnedWith(expected: unknown): void;
  toHaveReturned(): void;
  toMatch(expected: RegExp): void;
  toMatchObject(
    expected:
      | Record<PropertyKey, unknown>
      | Record<PropertyKey, unknown>[],
  ): void;
  toReturn(): void;
  toReturnTimes(expected: number): void;
  toReturnWith(expected: unknown): void;
  toStrictEqual(candidate: unknown): void;
  toThrow<E extends Error = Error>(
    expected?: string | RegExp | E | (new (...args: any[]) => E),
  ): void;
  not: Expected;
  resolves: Async<Expected>;
  rejects: Async<Expected>;
  // This declaration prepares for the `expect.extend` and just only let
  // compiler pass, the more concrete type definition is defined by user
  [name: string]: unknown;
}

export type MatcherKey = keyof Omit<Expected, "not" | "resolves" | "rejects">;

export type EqualOptions = {
  customTesters?: Tester[];
  msg?: string;
  formatter?: (value: unknown) => string;
  strictCheck?: boolean;
};

export interface EqualOptionUtil extends MatcherContext {
  strictCheck?: boolean;
}
