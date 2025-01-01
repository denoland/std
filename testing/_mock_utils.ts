// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import type { Spy } from "./mock.ts";

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
  func: ((this: Self, ...args: Args) => Return) | unknown,
): func is Spy<Self, Args, Return> {
  const spy = func as Spy<Self, Args, Return>;
  return typeof spy === "function" &&
    typeof spy.original === "function" &&
    typeof spy.restored === "boolean" &&
    typeof spy.restore === "function" &&
    Array.isArray(spy.calls);
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
