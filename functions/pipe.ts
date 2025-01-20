// Copyright 2018-2025 the Deno authors. MIT license.

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
 *  import { assertEquals } from "@std/assert";
 *  import { pipe } from "@std/functions";
 *
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
export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
): (...args: Parameters<Fn1>) => ReturnType<Fn2>;

export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
  Fn3 extends (arg: ReturnType<Fn2>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
  function3: Fn3,
): (...args: Parameters<Fn1>) => ReturnType<Fn3>;

export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
  Fn3 extends (arg: ReturnType<Fn2>) => any,
  Fn4 extends (arg: ReturnType<Fn3>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
  function3: Fn3,
  function4: Fn4,
): (...args: Parameters<Fn1>) => ReturnType<Fn4>;

export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
  Fn3 extends (arg: ReturnType<Fn2>) => any,
  Fn4 extends (arg: ReturnType<Fn3>) => any,
  Fn5 extends (arg: ReturnType<Fn4>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
  function3: Fn3,
  function4: Fn4,
  function5: Fn5,
): (...args: Parameters<Fn1>) => ReturnType<Fn5>;

export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
  Fn3 extends (arg: ReturnType<Fn2>) => any,
  Fn4 extends (arg: ReturnType<Fn3>) => any,
  Fn5 extends (arg: ReturnType<Fn4>) => any,
  Fn6 extends (arg: ReturnType<Fn5>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
  function3: Fn3,
  function4: Fn4,
  function5: Fn5,
  function6: Fn6,
): (...args: Parameters<Fn1>) => ReturnType<Fn6>;

export function pipe<
  Fn1 extends AnyFunc,
  Fn2 extends (arg: ReturnType<Fn1>) => any,
  Fn3 extends (arg: ReturnType<Fn2>) => any,
  Fn4 extends (arg: ReturnType<Fn3>) => any,
  Fn5 extends (arg: ReturnType<Fn4>) => any,
  Fn6 extends (arg: ReturnType<Fn5>) => any,
  Fn7 extends (arg: ReturnType<Fn6>) => any,
>(
  firstFunction: Fn1,
  function2: Fn2,
  function3: Fn3,
  function4: Fn4,
  function5: Fn5,
  function6: Fn6,
  function7: Fn7,
): (...args: Parameters<Fn1>) => ReturnType<Fn7>;

export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  firstFunction: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): (arg: Parameters<FirstFn>[0]) => LastFnReturnType<F, ReturnType<FirstFn>>;

export function pipe<FirstFn extends AnyFunc, F extends AnyFunc[]>(
  firstFunction?: FirstFn,
  ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): any {
  if (!firstFunction) {
    return <T>(arg: T) => arg;
  }

  return (...arg: Parameters<FirstFn>) => {
    return (fns as AnyFunc[]).reduce(
      (acc, fn) => fn(acc),
      firstFunction(...arg),
    );
  };
}
