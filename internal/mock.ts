// Copyright 2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2024 Anton Mikhailov. All rights reserved. MIT License.

export const MOCK_SYMBOL = Symbol.for("@MOCK");

export type MockCall<Args extends unknown[] = never, Return = unknown> = {
  /** Arguments passed to a function when called. */
  args: Args;
  /** Call result status. */
  result: "returned" | "thrown";
  /** The value that was returned by a function. */
  returned?: Return;
  /** The error value that was thrown by a function. */
  error?: unknown;
};

export type MockInternals<Args extends unknown[] = never, Return = unknown> = {
  calls: MockCall<Args, Return>[];
};
export type Mock<Args extends unknown[] = never, Return = unknown> = {
  [MOCK_SYMBOL]: MockInternals<Args, Return>;
};

export function isMockFunction<Fn extends (...args: never) => unknown>(
  func: Fn
): func is Fn & Mock<Parameters<Fn>, ReturnType<Fn>>;
export function isMockFunction<Args extends unknown[], Return>(
  func: (...args: Args) => Return
): func is ((...args: Args) => Return) & Mock<Args, Return>;
export function isMockFunction(func: (...args: unknown[]) => unknown) {
  return MOCK_SYMBOL in func && func[MOCK_SYMBOL] != null;
}
