// deno-lint-ignore no-explicit-any
type AnyFunction = (...args: any[]) => any;

type Curried1Function<T, P1> = {
  (p1: P1): T;
};
type Curried2Function<T, P1, P2> = {
  (p1: P1): Curried1Function<T, P2>;
  (p1: P1, p2: P2): T;
};
type Curried3Function<T, P1, P2, P3> = {
  (p1: P1): Curried2Function<P2, P3, T>;
  (p1: P1, p2: P2): Curried1Function<T, P3>;
  (p1: P1, p2: P2, p3: P3): T;
};
type Curried4Function<T, P1, P2, P3, P4> = {
  (p1: P1): Curried3Function<P2, P3, P4, T>;
  (p1: P1, p2: P2): Curried2Function<T, P3, P2>;
  (p1: P1, p2: P2, p3: P3): Curried1Function<T, P4>;
  (p1: P1, p2: P2, p3: P3, p4: P4): T;
};

/**
 * A function that returns a curried version of a given function
 *
 * @param {(p1: P1, p2: P2, … pn: Pn) => T} fn - The function to be curried.
 * @returns - A function which can be provided with only some of the arguments of the given function at each invocation, once all arguments have been provided the given function is called.
 * @example Usage
 * function add(a: number, b: number, c: number) {
 *  return a + b + c + d;
 * }
 *
 * const curriedAdd = curry(add);
 * console.log(curriedAdd(1)(2)(3)); // 6
 * console.log(curriedAdd(1, 2)(3)); // 6
 * console.log(curriedAdd(1, 2, 3)); // 6
 */

export function curry<T>(
  fn: () => T,
): () => T;
export function curry<T, P1>(
  fn: (p1: P1) => T,
): (p1: P1) => T;
export function curry<T, P1, P2>(
  fn: (p1: P1, p2: P2) => T,
): Curried2Function<T, P1, P2>;
export function curry<T, P1, P2, P3>(
  fn: (p1: P1, p2: P2, p3: P3) => T,
): Curried3Function<T, P1, P2, P3>;
export function curry<T, P1, P2, P3, P4>(
  fn: (p1: P1, p2: P2, p3: P3, p4: P4) => T,
): Curried4Function<T, P1, P2, P3, P4>;
export function curry(fn: AnyFunction) {
  return function curried(...args: any[]): any {
    if (args.length >= fn.length) {
      return fn(...args);
    } else {
      return (...moreArgs: any[]) => curried(...args, ...moreArgs);
    }
  };
}

function add(a: number, b: number, c: number, d: number) {
  return a + b + c + d;
}

const curriedAdd = curry(add);

if (import.meta.main) {
  const fnn = curriedAdd(1, 2);
  console.log(curriedAdd(1)(2)(3)(4));
  console.log(curriedAdd(1, 2)(3)(4));
  console.log(curriedAdd(1, 2, 3)(4));
  console.log(curriedAdd(1, 2, 3, 4));
  console.log(curriedAdd(1, 2, 3, 4));
}
