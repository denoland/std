// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

export interface MatcherContext {
  value: unknown;
  isNot: boolean;
  customMessage: string | undefined;
}

export type Matcher = (
  context: MatcherContext,
  // deno-lint-ignore no-explicit-any
  ...args: any[]
) => MatchResult;

export type Matchers = {
  [key: string]: Matcher;
};
export type MatchResult = void | Promise<void> | boolean;
// deno-lint-ignore no-explicit-any
export type AnyConstructor = new (...args: any[]) => any;
