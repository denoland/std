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

/** A constructor that accepts any args and returns any value */
export type AnyConstructor = new (...args: any[]) => any;

export type Tester = (a: any, b: any, customTesters: Tester[]) => void;

/** converts all the methods in an interface to be async functions */
export type Async<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => unknown
    ? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
    : T[K];
};

/**
 * The Expected interface defines the available assertion methods.
 */
export interface Expected<IsAsync = false> {
  /**
   * Asserts that the function was called with the specified arguments.
   * @param expected The expected arguments.
   */
  lastCalledWith(...expected: unknown[]): void;

  /**
   * Asserts that the function returned the specified value.
   * @param expected The expected return value.
   */
  lastReturnedWith(expected: unknown): void;

  /**
   * Asserts that the function was called with the specified arguments at the specified call index.
   * @param nth The call index.
   * @param expected The expected arguments.
   */
  nthCalledWith(nth: number, ...expected: unknown[]): void;

  /**
   * Asserts that the function returned the specified value at the specified call index.
   * @param nth The call index.
   * @param expected The expected return value.
   */
  nthReturnedWith(nth: number, expected: unknown): void;

  /**
   * Asserts that the function was called at least once.
   */
  toBeCalled(): void;

  /**
   * Asserts that the function was called the specified number of times.
   * @param expected The expected number of times.
   */
  toBeCalledTimes(expected: number): void;

  /**
   * Asserts that the function was called with the specified arguments.
   * @param expected The expected arguments.
   */
  toBeCalledWith(...expected: unknown[]): void;

  /**
   * Asserts that the value is close to the specified number within a tolerance.
   * @param candidate The candidate number.
   * @param tolerance The tolerance value (optional).
   */
  toBeCloseTo(candidate: number, tolerance?: number): void;

  /**
   * Asserts that the value is defined.
   */
  toBeDefined(): void;

  /**
   * Asserts that the value is falsy.
   */
  toBeFalsy(): void;

  /**
   * Asserts that the value is greater than the specified number.
   * @param expected The expected number.
   */
  toBeGreaterThan(expected: number): void;

  /**
   * Asserts that the value is greater than or equal to the specified number.
   * @param expected The expected number.
   */
  toBeGreaterThanOrEqual(expected: number): void;

  /**
   * Asserts that the value is an instance of the specified constructor.
   * @param expected The expected constructor.
   */
  toBeInstanceOf<T extends AnyConstructor>(expected: T): void;

  /**
   * Asserts that the value is less than the specified number.
   * @param expected The expected number.
   */
  toBeLessThan(expected: number): void;

  /**
   * Asserts that the value is less than or equal to the specified number.
   * @param expected The expected number.
   */
  toBeLessThanOrEqual(expected: number): void;

  /**
   * Asserts that the value is NaN.
   */
  toBeNaN(): void;

  /**
   * Asserts that the value is null.
   */
  toBeNull(): void;

  /**
   * Asserts that the value is truthy.
   */
  toBeTruthy(): void;

  /**
   * Asserts that the value is undefined.
   */
  toBeUndefined(): void;

  /**
   * Asserts that the value is equal to the specified value.
   * @param expected The expected value.
   */
  toBe(expected: unknown): void;

  /**
   * Asserts that the value contains the specified value (deep equality).
   * @param expected The expected value.
   */
  toContainEqual(expected: unknown): void;

  /**
   * Asserts that the value contains the specified value (shallow equality).
   * @param expected The expected value.
   */
  toContain(expected: unknown): void;

  /**
   * Asserts that the value is equal to the specified value (deep equality).
   * @param expected The expected value.
   */
  toEqual(expected: unknown): void;

  /**
   * Asserts that the function was called the specified number of times.
   * @param expected The expected number of times.
   */
  toHaveBeenCalledTimes(expected: number): void;

  /**
   * Asserts that the function was called with the specified arguments.
   * @param expected The expected arguments.
   */
  toHaveBeenCalledWith(...expected: unknown[]): void;

  /**
   * Asserts that the function was called at least once.
   */
  toHaveBeenCalled(): void;

  /**
   * Asserts that the function was last called with the specified arguments.
   * @param expected The expected arguments.
   */
  toHaveBeenLastCalledWith(...expected: unknown[]): void;

  /**
   * Asserts that the function was called with the specified arguments at the specified call index.
   * @param nth The call index.
   * @param expected The expected arguments.
   */
  toHaveBeenNthCalledWith(nth: number, ...expected: unknown[]): void;

  /**
   * Asserts that the value has the specified length.
   * @param expected The expected length.
   */
  toHaveLength(expected: number): void;

  /**
   * Asserts that the function last returned the specified value.
   * @param expected The expected return value.
   */
  toHaveLastReturnedWith(expected: unknown): void;

  /**
   * Asserts that the function returned the specified value at the specified call index.
   * @param nth The call index.
   * @param expected The expected return value.
   */
  toHaveNthReturnedWith(nth: number, expected: unknown): void;

  /**
   * Asserts that the value has the specified property with an optional value.
   * @param propName The property name or an array of property names.
   * @param value The expected value (optional).
   */
  toHaveProperty(propName: string | string[], value?: unknown): void;

  /**
   * Asserts that the function returned the specified number of times.
   * @param expected The expected number of times.
   */
  toHaveReturnedTimes(expected: number): void;

  /**
   * Asserts that the function returned the specified value.
   * @param expected The expected return value.
   */
  toHaveReturnedWith(expected: unknown): void;

  /**
   * Asserts that the function returned a value.
   */
  toHaveReturned(): void;

  /**
   * Asserts that the value matches the specified regular expression.
   * @param expected The expected regular expression.
   */
  toMatch(expected: RegExp): void;

  /**
   * Asserts that the value matches the specified object (deep equality).
   * @param expected The expected object or array of objects.
   */
  toMatchObject(
    expected: Record<PropertyKey, unknown> | Record<PropertyKey, unknown>[],
  ): void;

  /**
   * Asserts that the function returns a value.
   */
  toReturn(): void;

  /**
   * Asserts that the function returns the specified number of times.
   * @param expected The expected number of times.
   */
  toReturnTimes(expected: number): void;

  /**
   * Asserts that the function returns the specified value.
   * @param expected The expected return value.
   */
  toReturnWith(expected: unknown): void;

  /**
   * Asserts that the value is strictly equal to the specified value.
   * @param candidate The candidate value.
   */
  toStrictEqual(candidate: unknown): void;

  /**
   * Asserts that the function throws an error.
   * @param expected The expected error message, regular expression, or error constructor.
   */
  toThrow<E extends Error = Error>(
    expected?: string | RegExp | E | (new (...args: any[]) => E),
  ): void;

  /**
   * The negation object that allows chaining negated assertions.
   */
  not: IsAsync extends true ? Async<Expected<true>> : Expected<false>;

  /**
   * The object that allows chaining assertions with async functions that are expected to resolve to a value.
   */
  resolves: Async<Expected<true>>;

  /**
   * The object that allows chaining assertions with async functions that are expected to throw an error.
   */
  rejects: Async<Expected<true>>;

  /**
   * Additional custom assertion methods can be added here.
   */
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

export interface Colors {
  comment: { close: string; open: string };
  content: { close: string; open: string };
  prop: { close: string; open: string };
  tag: { close: string; open: string };
  value: { close: string; open: string };
}
type Indent = (arg0: string) => string;
type Print = (arg0: unknown) => string;

export type Refs = Array<unknown>;

export type CompareKeys = ((a: string, b: string) => number) | null | undefined;

export interface Config {
  callToJSON: boolean;
  compareKeys: CompareKeys;
  colors: Colors;
  escapeRegex: boolean;
  escapeString: boolean;
  indent: string;
  maxDepth: number;
  maxWidth: number;
  min: boolean;
  printBasicPrototype: boolean;
  printFunctionName: boolean;
  spacingInner: string;
  spacingOuter: string;
}

export type Printer = (
  val: unknown,
  config: Config,
  indentation: string,
  depth: number,
  refs: Refs,
  hasCalledToJSON?: boolean,
) => string;

interface PluginOptions {
  edgeSpacing: string;
  min: boolean;
  spacing: string;
}

type Test = (arg0: any) => boolean;

export interface NewSnapshotPlugin {
  serialize: (
    val: any,
    config: Config,
    indentation: string,
    depth: number,
    refs: Refs,
    printer: Printer,
  ) => string;
  test: Test;
}

export interface OldSnapshotPlugin {
  print: (
    val: unknown,
    print: Print,
    indent: Indent,
    options: PluginOptions,
    colors: Colors,
  ) => string;
  test: Test;
}
