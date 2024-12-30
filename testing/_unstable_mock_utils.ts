// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { defineMockInternals } from "@std/internal/unstable_mock";
import type { Spy, SpyCall } from "./unstable_mock.ts";

export {
  MOCK_SYMBOL,
  type Mock,
  type MockCall,
  type MockInternals,
} from "@std/internal/unstable_mock";

export interface SpyInternals<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
  Original = (this: Self, ...args: Args) => Return
> {
  readonly calls: SpyCall<Self, Args, Return>[];
  /** The function that is being spied on. */
  readonly original: Original;
}

export function defineSpyInternals<
  Fn extends (this: unknown, ...args: never) => unknown
>(
  func: Fn,
  internals?: Partial<
    SpyInternals<ThisParameterType<Fn>, Parameters<Fn>, ReturnType<Fn>>
  >
): Fn & Spy<ThisParameterType<Fn>, Parameters<Fn>, ReturnType<Fn>>;
export function defineSpyInternals<Self, Args extends unknown[], Return>(
  func: (this: Self, ...args: Args) => Return,
  internals?: Partial<SpyInternals<Self, Args, Return>>
): ((this: Self, ...args: Args) => Return) & Spy<Self, Args, Return>;
export function defineSpyInternals(
  func: (...args: unknown[]) => unknown,
  internals?: Partial<SpyInternals<unknown, unknown[], unknown>>
) {
  return defineMockInternals(func, {
    original: undefined,
    ...internals,
  } as SpyInternals<unknown, unknown[], unknown>);
}

/**
 * Checks if a function is a spy.
 *
 * @typeParam Self The self type of the function.
 * @typeParam Args The arguments type of the function.
 * @typeParam Return The return type of the function.
 * @param func The function to check
 * @return `true` if the function is a spy, `false` otherwise.
 */
export function isSpy<Self, Args extends unknown[], Return>(
  func: ((this: Self, ...args: Args) => Return) | unknown
): func is Spy<Self, Args, Return> {
  const spy = func as Spy<Self, Args, Return>;
  return (
    typeof spy === "function" &&
    typeof spy.original === "function" &&
    typeof spy.restored === "boolean" &&
    typeof spy.restore === "function" &&
    Array.isArray(spy.calls)
  );
}

// deno-lint-ignore no-explicit-any
export const sessions: Set<Spy<any, any[], any>>[] = [];

// deno-lint-ignore no-explicit-any
function getSession(): Set<Spy<any, any[], any>> {
  if (sessions.length === 0) sessions.push(new Set());
  return sessions.at(-1)!;
}

// deno-lint-ignore no-explicit-any
export function registerMock(spy: Spy<any, any[], any>) {
  const session = getSession();
  session.add(spy);
}

// deno-lint-ignore no-explicit-any
export function unregisterMock(spy: Spy<any, any[], any>) {
  const session = getSession();
  session.delete(spy);
}
