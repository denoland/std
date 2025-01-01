// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

// deno-lint-ignore-file no-explicit-any
type AnyFunc = (...arg: any) => any;

type LastFnReturnType<F extends Array<AnyFunc>, Else = never> = F extends [
  ...any[],
  (...arg: any) => infer R,
] ? R
  : Else;

// inspired by https://dev.to/ecyrbe/how-to-use-advanced-typescript-to-define-a-pipe-function-381h
type PipeArgs<F extends AnyFunc[], Acc extends AnyFunc[] = []> = F extends [
  (...args: infer A) => infer B,
] ? [...Acc, (...args: A) => B]
  : F extends [(...args: infer A) => any, ...infer Tail]
    ? Tail extends [(arg: infer B) => any, ...any[]]
      ? PipeArgs<Tail, [...Acc, (...args: A) => B]>
    : Acc
  : Acc;

/**
 * Composes functions from left to right, the output of each function is the input for the next.
 *
 * @example Usage
 * ```ts
 *  const myPipe = pipe(
 *    Math.abs,
 *    Math.sqrt,
 *    Math.floor,
 *    (num: number) => `result: ${num}`,
 *  );
 *  assertEquals(myPipe(-2), "result: 1");
 * ```
 *
 * @param input The functions to be composed
 * @returns A function composed of the input functions, from left to right
 */
export function pipe(): <T>(arg: T) => T;
export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  firstFn: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): (arg: Parameters<FirstFn>[0]) => LastFnReturnType<F, ReturnType<FirstFn>>;

export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  firstFn?: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): any {
  if (!firstFn) {
    return <T>(arg: T) => arg;
  }
  return (arg: Parameters<FirstFn>[0]) =>
    (fns as AnyFunc[]).reduce((acc, fn) => fn(acc), firstFn(arg));
}
