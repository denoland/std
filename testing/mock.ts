// Copyright 2018-2026 the Deno authors. MIT license.

/** A mocking and spying library.
 *
 * Test spies are function stand-ins that are used to assert if a function's
 * internal behavior matches expectations. Test spies on methods keep the original
 * behavior but allow you to test how the method is called and what it returns.
 * Test stubs are an extension of test spies that also replaces the original
 * methods behavior.
 *
 * ## Spying
 *
 * Say we have two functions, `square` and `multiply`, if we want to assert that
 * the `multiply` function is called during execution of the `square` function we
 * need a way to spy on the `multiply` function. There are a few ways to achieve
 * this with Spies, one is to have the `square` function take the `multiply`
 * multiply as a parameter.
 *
 * This way, we can call `square(multiply, value)` in the application code or wrap
 * a spy function around the `multiply` function and call
 * `square(multiplySpy, value)` in the testing code.
 *
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * function multiply(a: number, b: number): number {
 *   return a * b;
 * }
 *
 * function square(
 *   multiplyFn: (a: number, b: number) => number,
 *   value: number,
 * ): number {
 *   return multiplyFn(value, value);
 * }
 *
 * Deno.test("square calls multiply and returns results", () => {
 *   const multiplySpy = spy(multiply);
 *
 *   assertEquals(square(multiplySpy, 5), 25);
 *
 *   // asserts that multiplySpy was called at least once and details about the first call.
 *   assertSpyCall(multiplySpy, 0, {
 *     args: [5, 5],
 *     returned: 25,
 *   });
 *
 *   // asserts that multiplySpy was only called once.
 *   assertSpyCalls(multiplySpy, 1);
 * });
 * ```
 *
 * If you prefer not adding additional parameters for testing purposes only, you
 * can use spy to wrap a method on an object instead. In the following example, the
 * exported `_internals` object has the `multiply` function we want to call as a
 * method and the `square` function calls `_internals.multiply` instead of
 * `multiply`.
 *
 * This way, we can call `square(value)` in both the application code and testing
 * code. Then spy on the `multiply` method on the `_internals` object in the
 * testing code to be able to spy on how the `square` function calls the `multiply`
 * function.
 *
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * function multiply(a: number, b: number): number {
 *   return a * b;
 * }
 *
 * function square(value: number): number {
 *   return _internals.multiply(value, value);
 * }
 *
 * const _internals = { multiply };
 *
 * Deno.test("square calls multiply and returns results", () => {
 *   const multiplySpy = spy(_internals, "multiply");
 *
 *   try {
 *     assertEquals(square(5), 25);
 *   } finally {
 *     // unwraps the multiply method on the _internals object
 *     multiplySpy.restore();
 *   }
 *
 *   // asserts that multiplySpy was called at least once and details about the first call.
 *   assertSpyCall(multiplySpy, 0, {
 *     args: [5, 5],
 *     returned: 25,
 *   });
 *
 *   // asserts that multiplySpy was only called once.
 *   assertSpyCalls(multiplySpy, 1);
 * });
 * ```
 *
 * One difference you may have noticed between these two examples is that in the
 * second we call the `restore` method on `multiplySpy` function. That is needed to
 * remove the spy wrapper from the `_internals` object's `multiply` method. The
 * `restore` method is called in a finally block to ensure that it is restored
 * whether or not the assertion in the try block is successful. The `restore`
 * method didn't need to be called in the first example because the `multiply`
 * function was not modified in any way like the `_internals` object was in the
 * second example.
 *
 * Method spys are disposable, meaning that you can have them automatically restore
 * themselves with the `using` keyword. Using this approach is cleaner because you
 * do not need to wrap your assertions in a try statement to ensure you restore the
 * methods before the tests finish.
 *
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * function multiply(a: number, b: number): number {
 *   return a * b;
 * }
 *
 * function square(value: number): number {
 *   return _internals.multiply(value, value);
 * }
 *
 * const _internals = { multiply };
 *
 * Deno.test("square calls multiply and returns results", () => {
 *   using multiplySpy = spy(_internals, "multiply");
 *
 *   assertEquals(square(5), 25);
 *
 *   // asserts that multiplySpy was called at least once and details about the first call.
 *   assertSpyCall(multiplySpy, 0, {
 *     args: [5, 5],
 *     returned: 25,
 *   });
 *
 *   // asserts that multiplySpy was only called once.
 *   assertSpyCalls(multiplySpy, 1);
 * });
 * ```
 *
 * ## Stubbing
 *
 * Say we have two functions, `randomMultiple` and `randomInt`, if we want to
 * assert that `randomInt` is called during execution of `randomMultiple` we need a
 * way to spy on the `randomInt` function. That could be done with either of the
 * spying techniques previously mentioned. To be able to verify that the
 * `randomMultiple` function returns the value we expect it to for what `randomInt`
 * returns, the easiest way would be to replace the `randomInt` function's behavior
 * with more predictable behavior.
 *
 * You could use the first spying technique to do that but that would require
 * adding a `randomInt` parameter to the `randomMultiple` function.
 *
 * You could also use the second spying technique to do that, but your assertions
 * would not be as predictable due to the `randomInt` function returning random
 * values.
 *
 * Say we want to verify it returns correct values for both negative and positive
 * random integers. We could easily do that with stubbing. The below example is
 * similar to the second spying technique example but instead of passing the call
 * through to the original `randomInt` function, we are going to replace
 * `randomInt` with a function that returns pre-defined values.
 *
 * The mock module includes some helper functions to make creating common stubs
 * easy. The `returnsNext` function takes an array of values we want it to return
 * on consecutive calls.
 *
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   returnsNext,
 *   stub,
 * } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * function randomInt(lowerBound: number, upperBound: number): number {
 *   return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
 * }
 *
 * function randomMultiple(value: number): number {
 *   return value * _internals.randomInt(-10, 10);
 * }
 *
 * const _internals = { randomInt };
 *
 * Deno.test("randomMultiple uses randomInt to generate random multiples between -10 and 10 times the value", () => {
 *   const randomIntStub = stub(_internals, "randomInt", returnsNext([-3, 3]));
 *
 *   try {
 *     assertEquals(randomMultiple(5), -15);
 *     assertEquals(randomMultiple(5), 15);
 *   } finally {
 *     // unwraps the randomInt method on the _internals object
 *     randomIntStub.restore();
 *   }
 *
 *   // asserts that randomIntStub was called at least once and details about the first call.
 *   assertSpyCall(randomIntStub, 0, {
 *     args: [-10, 10],
 *     returned: -3,
 *   });
 *   // asserts that randomIntStub was called at least twice and details about the second call.
 *   assertSpyCall(randomIntStub, 1, {
 *     args: [-10, 10],
 *     returned: 3,
 *   });
 *
 *   // asserts that randomIntStub was only called twice.
 *   assertSpyCalls(randomIntStub, 2);
 * });
 * ```
 *
 * Like method spys, stubs are disposable, meaning that you can have them automatically
 * restore themselves with the `using` keyword. Using this approach is cleaner because
 * you do not need to wrap your assertions in a try statement to ensure you restore the
 * methods before the tests finish.
 *
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   returnsNext,
 *   stub,
 * } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * function randomInt(lowerBound: number, upperBound: number): number {
 *   return lowerBound + Math.floor(Math.random() * (upperBound - lowerBound));
 * }
 *
 * function randomMultiple(value: number): number {
 *   return value * _internals.randomInt(-10, 10);
 * }
 *
 * const _internals = { randomInt };
 *
 * Deno.test("randomMultiple uses randomInt to generate random multiples between -10 and 10 times the value", () => {
 *   using randomIntStub = stub(_internals, "randomInt", returnsNext([-3, 3]));
 *
 *   assertEquals(randomMultiple(5), -15);
 *   assertEquals(randomMultiple(5), 15);
 *
 *   // asserts that randomIntStub was called at least once and details about the first call.
 *   assertSpyCall(randomIntStub, 0, {
 *     args: [-10, 10],
 *     returned: -3,
 *   });
 *   // asserts that randomIntStub was called at least twice and details about the second call.
 *   assertSpyCall(randomIntStub, 1, {
 *     args: [-10, 10],
 *     returned: 3,
 *   });
 *
 *   // asserts that randomIntStub was only called twice.
 *   assertSpyCalls(randomIntStub, 2);
 * });
 * ```
 *
 * ## Faking time
 *
 * Say we have a function that has time based behavior that we would like to test.
 * With real time, that could cause tests to take much longer than they should. If
 * you fake time, you could simulate how your function would behave over time
 * starting from any point in time. Below is an example where we want to test that
 * the callback is called every second.
 *
 * With `FakeTime` we can do that. When the `FakeTime` instance is created, it
 * splits from real time. The `Date`, `setTimeout`, `clearTimeout`, `setInterval`
 * and `clearInterval` globals are replaced with versions that use the fake time
 * until real time is restored. You can control how time ticks forward with the
 * `tick` method on the `FakeTime` instance.
 *
 * ```ts
 * import {
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 * import { FakeTime } from "@std/testing/time";
 *
 * function secondInterval(cb: () => void): number {
 *   return setInterval(cb, 1000);
 * }
 *
 * Deno.test("secondInterval calls callback every second and stops after being cleared", () => {
 *   using time = new FakeTime();
 *
 *   const cb = spy();
 *   const intervalId = secondInterval(cb);
 *   assertSpyCalls(cb, 0);
 *   time.tick(500);
 *   assertSpyCalls(cb, 0);
 *   time.tick(500);
 *   assertSpyCalls(cb, 1);
 *   time.tick(3500);
 *   assertSpyCalls(cb, 4);
 *
 *   clearInterval(intervalId);
 *   time.tick(1000);
 *   assertSpyCalls(cb, 4);
 * });
 * ```
 *
 * @module
 */

import { assertEquals } from "@std/assert/equals";
import { assertIsError } from "@std/assert/is-error";
import { assertRejects } from "@std/assert/rejects";
import { AssertionError } from "@std/assert/assertion-error";
import {
  isSpy,
  registerMock,
  sessions,
  unregisterMock,
} from "./_mock_utils.ts";

/**
 * An error related to spying on a function or instance method.
 *
 * @example Usage
 * ```ts
 * import { MockError, spy } from "@std/testing/mock";
 * import { assertThrows } from "@std/assert";
 *
 * assertThrows(() => {
 *   spy({} as any, "no-such-method");
 * }, MockError);
 * ```
 */
export class MockError extends Error {
  /**
   * Construct MockError
   *
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = "MockError";
  }
}

/** Call information recorded by a spy. */
export interface SpyCall<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> {
  /** Arguments passed to a function when called. */
  args: Args;
  /** The value that was returned by a function. */
  returned?: Return;
  /** The error value that was thrown by a function. */
  error?: Error;
  /** The instance that a method was called on. */
  self?: Self;
}

/** A function or instance method wrapper that records all calls made to it. */
export interface Spy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> {
  (this: Self, ...args: Args): Return;
  /** The function that is being spied on. */
  original: (this: Self, ...args: Args) => Return;
  /** Information about calls made to the function or instance method. */
  calls: SpyCall<Self, Args, Return>[];
  /** Whether or not the original instance method has been restored. */
  restored: boolean;
  /** If spying on an instance method, this restores the original instance method. */
  restore(): void;
}

/** An instance method wrapper that records all calls made to it. */
export interface MethodSpy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> extends Spy<Self, Args, Return>, Disposable {}

/** Wraps a function with a Spy. */
function functionSpy<
  Self,
  Args extends unknown[],
  Return,
>(func?: (this: Self, ...args: Args) => Return): Spy<Self, Args, Return> {
  const original = func ?? (() => {}) as (this: Self, ...args: Args) => Return;
  const calls: SpyCall<Self, Args, Return>[] = [];
  const spy = function (this: Self, ...args: Args): Return {
    const call: SpyCall<Self, Args, Return> = { args };
    if (this) call.self = this;
    try {
      call.returned = original.apply(this, args);
    } catch (error) {
      call.error = error as Error;
      calls.push(call);
      throw error;
    }
    calls.push(call);
    return call.returned;
  } as Spy<Self, Args, Return>;
  Object.defineProperties(spy, {
    original: {
      enumerable: true,
      value: original,
    },
    calls: {
      enumerable: true,
      value: calls,
    },
    restored: {
      enumerable: true,
      get: () => false,
    },
    restore: {
      enumerable: true,
      value: () => {
        throw new MockError(
          "Cannot restore: function cannot be restored",
        );
      },
    },
  });
  return spy;
}

/**
 * Creates a session that tracks all mocks created before it's restored.
 * If a callback is provided, it restores all mocks created within it.
 *
 * @example Usage
 * ```ts
 * import { mockSession, restore, stub } from "@std/testing/mock";
 * import { assertEquals, assertNotEquals } from "@std/assert";
 *
 * const setTimeout = globalThis.setTimeout;
 * const id = mockSession();
 *
 * stub(globalThis, "setTimeout");
 *
 * assertNotEquals(globalThis.setTimeout, setTimeout);
 *
 * restore(id);
 *
 * assertEquals(globalThis.setTimeout, setTimeout);
 * ```
 *
 * @returns The id of the created session.
 */
export function mockSession(): number;
/**
 * Creates a session that tracks all mocks created before it's restored.
 * If a callback is provided, it restores all mocks created within it.
 *
 * @example Usage
 * ```ts
 * import { mockSession, restore, stub } from "@std/testing/mock";
 * import { assertEquals, assertNotEquals } from "@std/assert";
 *
 * const setTimeout = globalThis.setTimeout;
 * const session = mockSession(() => {
 *   stub(globalThis, "setTimeout");
 *   assertNotEquals(globalThis.setTimeout, setTimeout);
 * });
 *
 * session();
 *
 * assertEquals(globalThis.setTimeout, setTimeout); // stub is restored
 * ```
 *
 * @typeParam Self The self type of the function.
 * @typeParam Args The arguments type of the function.
 * @typeParam Return The return type of the function.
 * @param func The function to be used for the created session.
 * @returns The function to execute the session.
 */
export function mockSession<
  Self,
  Args extends unknown[],
  Return,
>(
  func: (this: Self, ...args: Args) => Return,
): (this: Self, ...args: Args) => Return;
export function mockSession<
  Self,
  Args extends unknown[],
  Return,
>(
  func?: (this: Self, ...args: Args) => Return,
): number | ((this: Self, ...args: Args) => Return) {
  if (func) {
    return function (this: Self, ...args: Args): Return {
      const id = sessions.length;
      sessions.push(new Set());
      try {
        return func.apply(this, args);
      } finally {
        restore(id);
      }
    };
  } else {
    sessions.push(new Set());
    return sessions.length - 1;
  }
}

/**
 * Creates an async session that tracks all mocks created before the promise resolves.
 *
 * @example Usage
 * ```ts
 * import { mockSessionAsync, restore, stub } from "@std/testing/mock";
 * import { assertEquals, assertNotEquals } from "@std/assert";
 *
 * const setTimeout = globalThis.setTimeout;
 * const session = mockSessionAsync(async () => {
 *   stub(globalThis, "setTimeout");
 *   assertNotEquals(globalThis.setTimeout, setTimeout);
 * });
 *
 * await session();
 *
 * assertEquals(globalThis.setTimeout, setTimeout); // stub is restored
 * ```
 * @typeParam Self The self type of the function.
 * @typeParam Args The arguments type of the function.
 * @typeParam Return The return type of the function.
 * @param func The function.
 * @returns The return value of the function.
 */
export function mockSessionAsync<
  Self,
  Args extends unknown[],
  Return,
>(
  func: (this: Self, ...args: Args) => Promise<Return>,
): (this: Self, ...args: Args) => Promise<Return> {
  return async function (this: Self, ...args: Args): Promise<Return> {
    const id = sessions.length;
    sessions.push(new Set());
    try {
      return await func.apply(this, args);
    } finally {
      restore(id);
    }
  };
}

/**
 * Restores all mocks registered in the current session that have not already been restored.
 * If an id is provided, it will restore all mocks registered in the session associed with that id that have not already been restored.
 *
 * @example Usage
 * ```ts
 * import { mockSession, restore, stub } from "@std/testing/mock";
 * import { assertEquals, assertNotEquals } from "@std/assert";
 *
 * const setTimeout = globalThis.setTimeout;
 *
 * stub(globalThis, "setTimeout");
 *
 * assertNotEquals(globalThis.setTimeout, setTimeout);
 *
 * restore();
 *
 * assertEquals(globalThis.setTimeout, setTimeout);
 * ```
 *
 * @param id The id of the session to restore. If not provided, all mocks registered in the current session are restored.
 */
export function restore(id?: number) {
  id ??= (sessions.length || 1) - 1;
  while (id < sessions.length) {
    const session = sessions.pop();
    if (session) {
      for (const value of session) {
        value.restore();
      }
    }
  }
}

/** Wraps an instance method with a Spy. */
function methodSpy<
  Self,
  Args extends unknown[],
  Return,
>(self: Self, property: keyof Self): MethodSpy<Self, Args, Return> {
  if (typeof self[property] !== "function") {
    throw new MockError(
      "Cannot spy: property is not an instance method",
    );
  }
  if (isSpy(self[property])) {
    throw new MockError(
      "Cannot spy: already spying on instance method",
    );
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(self, property);
  if (propertyDescriptor && !propertyDescriptor.configurable) {
    throw new MockError(
      "Cannot spy: non-configurable instance method",
    );
  }

  const original = self[property] as unknown as (
    this: Self,
    ...args: Args
  ) => Return;
  const calls: SpyCall<Self, Args, Return>[] = [];
  let restored = false;
  const spy = function (this: Self, ...args: Args): Return {
    const call: SpyCall<Self, Args, Return> = { args };
    if (this) call.self = this;
    try {
      call.returned = original.apply(this, args);
    } catch (error) {
      call.error = error as Error;
      calls.push(call);
      throw error;
    }
    calls.push(call);
    return call.returned;
  } as MethodSpy<Self, Args, Return>;
  Object.defineProperties(spy, {
    original: {
      enumerable: true,
      value: original,
    },
    calls: {
      enumerable: true,
      value: calls,
    },
    restored: {
      enumerable: true,
      get: () => restored,
    },
    restore: {
      enumerable: true,
      value: () => {
        if (restored) {
          throw new MockError(
            "Cannot restore: instance method already restored",
          );
        }
        if (propertyDescriptor) {
          Object.defineProperty(self, property, propertyDescriptor);
        } else {
          delete self[property];
        }
        restored = true;
        unregisterMock(spy);
      },
    },
    [Symbol.dispose]: {
      value: () => {
        spy.restore();
      },
    },
  });

  Object.defineProperty(self, property, {
    configurable: true,
    enumerable: propertyDescriptor?.enumerable ?? false,
    writable: propertyDescriptor?.writable ?? false,
    value: spy,
  });

  registerMock(spy);
  return spy;
}

/** A constructor wrapper that records all calls made to it. */
export interface ConstructorSpy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
> {
  /** Construct an instance. */
  new (...args: Args): Self;
  /** The function that is being spied on. */
  original: new (...args: Args) => Self;
  /** Information about calls made to the function or instance method. */
  calls: SpyCall<Self, Args, Self>[];
  /** Whether or not the original instance method has been restored. */
  restored: boolean;
  /** If spying on an instance method, this restores the original instance method. */
  restore(): void;
}

/** Wraps a constructor with a Spy. */
function constructorSpy<
  Self,
  Args extends unknown[],
>(
  constructor: new (...args: Args) => Self,
): ConstructorSpy<Self, Args> {
  const original = constructor;
  const calls: SpyCall<Self, Args, Self>[] = [];
  // @ts-ignore TS2509: Can't know the type of `original` statically.
  const spy = class extends original {
    // deno-lint-ignore constructor-super
    constructor(...args: Args) {
      const call: SpyCall<Self, Args, Self> = { args };
      try {
        super(...args);
        call.returned = this as unknown as Self;
      } catch (error) {
        call.error = error as Error;
        calls.push(call);
        throw error;
      }
      calls.push(call);
    }
    static readonly name = original.name;
    static readonly original = original;
    static readonly calls = calls;
    static readonly restored = false;
    static restore() {
      throw new MockError(
        "Cannot restore: constructor cannot be restored",
      );
    }
  } as ConstructorSpy<Self, Args>;
  return spy;
}

/**
 * Utility for extracting the arguments type from a property
 *
 * @internal
 */
export type GetParametersFromProp<
  Self,
  Prop extends keyof Self,
> = Self[Prop] extends (...args: infer Args) => unknown ? Args
  : unknown[];

/**
 * Utility for extracting the return type from a property
 *
 * @internal
 */
export type GetReturnFromProp<
  Self,
  Prop extends keyof Self,
> // deno-lint-ignore no-explicit-any
 = Self[Prop] extends (...args: any[]) => infer Return ? Return
  : unknown;

/** SpyLink object type. */
export type SpyLike<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> = Spy<Self, Args, Return> | ConstructorSpy<Self, Args>;

/** Creates a spy function.
 *
 * @example Usage
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 *
 * const func = spy();
 *
 * func();
 * func(1);
 * func(2, 3);
 *
 * assertSpyCalls(func, 3);
 *
 * // asserts each call made to the spy function.
 * assertSpyCall(func, 0, { args: [] });
 * assertSpyCall(func, 1, { args: [1] });
 * assertSpyCall(func, 2, { args: [2, 3] });
 * ```
 *
 * @typeParam Self The self type of the function.
 * @typeParam Args The arguments type of the function.
 * @typeParam Return The return type of the function.
 * @returns The spy function.
 */
export function spy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  Return = undefined,
>(): Spy<Self, Args, Return>;
/**
 * Create a spy function with the given implementation.
 *
 * @example Usage
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 *
 * const func = spy((a: number, b: number) => a + b);
 *
 * func(3, 4);
 * func(5, 6);
 *
 * assertSpyCalls(func, 2);
 *
 * // asserts each call made to the spy function.
 * assertSpyCall(func, 0, { args: [3, 4], returned: 7 });
 * assertSpyCall(func, 1, { args: [5, 6], returned: 11 });
 * ```
 *
 * @typeParam Self The self type of the function to wrap
 * @typeParam Args The arguments type of the function to wrap
 * @typeParam Return The return type of the function to wrap
 * @param func The function to wrap
 * @returns The wrapped function.
 */
export function spy<
  Self,
  Args extends unknown[],
  Return,
>(func: (this: Self, ...args: Args) => Return): Spy<Self, Args, Return>;
/**
 * Create a spy constructor.
 *
 * @example Usage
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 *
 * class Foo {
 *   constructor(value: string) {}
 * };
 *
 * const Constructor = spy(Foo);
 *
 * new Constructor("foo");
 * new Constructor("bar");
 *
 * assertSpyCalls(Constructor, 2);
 *
 * // asserts each call made to the spy function.
 * assertSpyCall(Constructor, 0, { args: ["foo"] });
 * assertSpyCall(Constructor, 1, { args: ["bar"] });
 * ```
 *
 * @typeParam Self The type of the instance of the class.
 * @typeParam Args The arguments type of the constructor
 * @param constructor The constructor to spy.
 * @returns The wrapped constructor.
 */
export function spy<
  Self,
  Args extends unknown[],
>(
  constructor: new (...args: Args) => Self,
): ConstructorSpy<Self, Args>;
/**
 * Wraps a instance method with a Spy.
 *
 * @example Usage
 * ```ts
 * import {
 *   assertSpyCall,
 *   assertSpyCalls,
 *   spy,
 * } from "@std/testing/mock";
 *
 * const obj = {
 *   method(a: number, b: number): number {
 *     return a + b;
 *   },
 * };
 *
 * const methodSpy = spy(obj, "method");
 *
 * obj.method(1, 2);
 * obj.method(3, 4);
 *
 * assertSpyCalls(methodSpy, 2);
 *
 * // asserts each call made to the spy function.
 * assertSpyCall(methodSpy, 0, { args: [1, 2], returned: 3 });
 * assertSpyCall(methodSpy, 1, { args: [3, 4], returned: 7 });
 * ```
 *
 * @typeParam Self The type of the instance to spy the method of.
 * @typeParam Prop The property to spy.
 * @param self The instance to spy.
 * @param property The property of the method to spy.
 * @returns The spy function.
 */
export function spy<
  Self,
  Prop extends keyof Self,
>(
  self: Self,
  property: Prop,
): MethodSpy<
  Self,
  GetParametersFromProp<Self, Prop>,
  GetReturnFromProp<Self, Prop>
>;
export function spy<
  Self,
  Args extends unknown[],
  Return,
>(
  funcOrConstOrSelf?:
    | ((this: Self, ...args: Args) => Return)
    | (new (...args: Args) => Self)
    | Self,
  property?: keyof Self,
): SpyLike<Self, Args, Return> {
  if (!funcOrConstOrSelf) {
    return functionSpy<Self, Args, Return>();
  } else if (property !== undefined) {
    return methodSpy<Self, Args, Return>(funcOrConstOrSelf as Self, property);
  } else if (funcOrConstOrSelf.toString().startsWith("class")) {
    return constructorSpy<Self, Args>(
      funcOrConstOrSelf as new (...args: Args) => Self,
    );
  } else {
    return functionSpy<Self, Args, Return>(
      funcOrConstOrSelf as (this: Self, ...args: Args) => Return,
    );
  }
}

/** An instance method replacement that records all calls made to it. */
export interface Stub<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> extends MethodSpy<Self, Args, Return> {
  /** The function that is used instead of the original. */
  fake: (this: Self, ...args: Args) => Return;
}

/**
 * Replaces an instance method with a Stub with empty implementation.
 *
 * @example Usage
 * ```ts
 * import { stub, assertSpyCalls } from "@std/testing/mock";
 *
 * const obj = {
 *   method() {
 *     // some inconventient feature for testing
 *   },
 * };
 *
 * const methodStub = stub(obj, "method");
 *
 * for (const _ of Array(5)) {
 *   obj.method();
 * }
 *
 * assertSpyCalls(methodStub, 5);
 * ```

 *
 * @typeParam Self The self type of the instance to replace a method of.
 * @typeParam Prop The property of the instance to replace.
 * @param self The instance to replace a method of.
 * @param property The property of the instance to replace.
 * @returns The stub function which replaced the original.
 */
export function stub<
  Self,
  Prop extends keyof Self,
>(
  self: Self,
  property: Prop,
): Stub<Self, GetParametersFromProp<Self, Prop>, GetReturnFromProp<Self, Prop>>;
/**
 * Replaces an instance method with a Stub with the given implementation.
 *
 * @example Usage
 * ```ts
 * import { stub } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * const obj = {
 *   method(): number {
 *     return Math.random();
 *   },
 * };
 *
 * const methodStub = stub(obj, "method", () => 0.5);
 *
 * assertEquals(obj.method(), 0.5);
 * ```
 *
 * @typeParam Self The self type of the instance to replace a method of.
 * @typeParam Prop The property of the instance to replace.
 * @param self The instance to replace a method of.
 * @param property The property of the instance to replace.
 * @param func The fake implementation of the function.
 * @returns The stub function which replaced the original.
 */
export function stub<
  Self,
  Prop extends keyof Self,
>(
  self: Self,
  property: Prop,
  func: (
    this: Self,
    ...args: GetParametersFromProp<Self, Prop>
  ) => GetReturnFromProp<Self, Prop>,
): Stub<Self, GetParametersFromProp<Self, Prop>, GetReturnFromProp<Self, Prop>>;
export function stub<
  Self,
  Args extends unknown[],
  Return,
>(
  self: Self,
  property: keyof Self,
  func?: (this: Self, ...args: Args) => Return,
): Stub<Self, Args, Return> {
  if (self[property] !== undefined && typeof self[property] !== "function") {
    throw new MockError(
      "Cannot stub: property is not an instance method",
    );
  }
  if (isSpy(self[property])) {
    throw new MockError(
      "Cannot stub: already spying on instance method",
    );
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(self, property);
  if (propertyDescriptor && !propertyDescriptor.configurable) {
    throw new MockError("Cannot stub: non-configurable instance method");
  }

  const fake = func ?? (() => {}) as (this: Self, ...args: Args) => Return;

  const original = self[property] as unknown as (
    this: Self,
    ...args: Args
  ) => Return;
  const calls: SpyCall<Self, Args, Return>[] = [];
  let restored = false;
  const stub = function (this: Self, ...args: Args): Return {
    const call: SpyCall<Self, Args, Return> = { args };
    if (this) call.self = this;
    try {
      call.returned = fake.apply(this, args);
    } catch (error) {
      call.error = error as Error;
      calls.push(call);
      throw error;
    }
    calls.push(call);
    return call.returned;
  } as Stub<Self, Args, Return>;
  Object.defineProperties(stub, {
    original: {
      enumerable: true,
      value: original,
    },
    fake: {
      enumerable: true,
      value: fake,
    },
    calls: {
      enumerable: true,
      value: calls,
    },
    restored: {
      enumerable: true,
      get: () => restored,
    },
    restore: {
      enumerable: true,
      value: () => {
        if (restored) {
          throw new MockError(
            "Cannot restore: instance method already restored",
          );
        }
        if (propertyDescriptor) {
          Object.defineProperty(self, property, propertyDescriptor);
        } else {
          delete self[property];
        }
        restored = true;
        unregisterMock(stub);
      },
    },
    [Symbol.dispose]: {
      value: () => {
        stub.restore();
      },
    },
  });

  Object.defineProperty(self, property, {
    configurable: true,
    enumerable: propertyDescriptor?.enumerable ?? false,
    writable: propertyDescriptor?.writable ?? false,
    value: stub,
  });

  registerMock(stub);
  return stub;
}

/**
 * Asserts that a spy is called as much as expected and no more.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCalls, spy } from "@std/testing/mock";
 *
 * const func = spy();
 *
 * func();
 * func();
 *
 * assertSpyCalls(func, 2);
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @param spy The spy to check
 * @param expectedCalls The number of the expected calls.
 */
export function assertSpyCalls<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: SpyLike<Self, Args, Return>,
  expectedCalls: number,
) {
  try {
    assertEquals(spy.calls.length, expectedCalls);
  } catch (e) {
    assertIsError(e);
    let message = spy.calls.length < expectedCalls
      ? "Spy not called as much as expected:\n"
      : "Spy called more than expected:\n";
    message += e.message.split("\n").slice(1).join("\n");
    throw new AssertionError(message);
  }
}

/** Call information recorded by a spy. */
export interface ExpectedSpyCall<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> {
  /** Arguments passed to a function when called. */
  args?: [...Args, ...unknown[]];
  /** The instance that a method was called on. */
  self?: Self;
  /**
   * The value that was returned by a function.
   * If you expect a promise to reject, expect error instead.
   */
  returned?: Return;
  /** The expected thrown error. */
  error?: {
    /** The class for the error that was thrown by a function. */
    // deno-lint-ignore no-explicit-any
    Class?: new (...args: any[]) => Error;
    /** Part of the message for the error that was thrown by a function. */
    msgIncludes?: string;
  };
}

function getSpyCall<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
): SpyCall {
  if (spy.calls.length < (callIndex + 1)) {
    throw new AssertionError("Spy not called as much as expected");
  }
  return spy.calls[callIndex]!;
}
/**
 * Asserts that a spy is called as expected.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCall, spy } from "@std/testing/mock";
 *
 * const func = spy((a: number, b: number) => a + b);
 *
 * func(3, 4);
 * func(5, 6);
 *
 * // asserts each call made to the spy function.
 * assertSpyCall(func, 0, { args: [3, 4], returned: 7 });
 * assertSpyCall(func, 1, { args: [5, 6], returned: 11 });
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @param spy The spy to check
 * @param callIndex The index of the call to check
 * @param expected The expected spy call.
 */
export function assertSpyCall<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  expected?: ExpectedSpyCall<Self, Args, Return>,
) {
  const call = getSpyCall(spy, callIndex);
  if (expected) {
    if (expected.args) {
      try {
        assertEquals(call.args, expected.args);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "Spy not called with expected args:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("self" in expected) {
      try {
        assertEquals(call.self, expected.self);
      } catch (e) {
        assertIsError(e);
        let message = expected.self
          ? "Spy not called as method on expected self:\n"
          : "Spy not expected to be called as method on object:\n";
        message += e.message.split("\n").slice(1).join("\n");
        throw new AssertionError(message);
      }
    }

    if ("returned" in expected) {
      if ("error" in expected) {
        throw new TypeError(
          "Do not expect error and return, only one should be expected",
        );
      }
      if (call.error) {
        throw new AssertionError(
          "Spy call did not return expected value, an error was thrown.",
        );
      }
      try {
        assertEquals(call.returned, expected.returned);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "Spy call did not return expected value:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("error" in expected) {
      if ("returned" in call) {
        throw new AssertionError(
          "Spy call did not throw an error, a value was returned.",
        );
      }
      assertIsError(
        call.error,
        expected.error?.Class,
        expected.error?.msgIncludes,
      );
    }
  }
}

/**
 * Asserts that an async spy is called as expected.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCallAsync, spy } from "@std/testing/mock";
 *
 * const func = spy((a: number, b: number) => new Promise((resolve) => {
 *   setTimeout(() => resolve(a + b), 100)
 * }));
 *
 * await func(3, 4);
 * await func(5, 6);
 *
 * // asserts each call made to the spy function.
 * await assertSpyCallAsync(func, 0, { args: [3, 4], returned: 7 });
 * await assertSpyCallAsync(func, 1, { args: [5, 6], returned: 11 });
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @param spy The spy to check
 * @param callIndex The index of the call to check
 * @param expected The expected spy call.
 */
export async function assertSpyCallAsync<
  Self,
  Args extends unknown[],
  Return,
>(
  spy: SpyLike<Self, Args, Promise<Return>>,
  callIndex: number,
  expected?: ExpectedSpyCall<Self, Args, Promise<Return> | Return>,
) {
  const expectedSync = expected && { ...expected };
  if (expectedSync) {
    delete expectedSync.returned;
    delete expectedSync.error;
  }
  assertSpyCall(spy, callIndex, expectedSync);
  const call = getSpyCall(spy, callIndex);

  if (call.error) {
    throw new AssertionError(
      "Spy call did not return a promise, an error was thrown.",
    );
  }
  if (call.returned !== Promise.resolve(call.returned)) {
    throw new AssertionError(
      "Spy call did not return a promise, a value was returned.",
    );
  }

  if (expected) {
    if ("returned" in expected) {
      if ("error" in expected) {
        throw new TypeError(
          "Do not expect error and return, only one should be expected",
        );
      }
      let expectedResolved;
      try {
        expectedResolved = await expected.returned;
      } catch {
        throw new TypeError(
          "Do not expect rejected promise, expect error instead",
        );
      }

      let resolved;
      try {
        resolved = await call.returned;
      } catch {
        throw new AssertionError("Spy call returned promise was rejected");
      }

      try {
        assertEquals(resolved, expectedResolved);
      } catch (e) {
        assertIsError(e);
        throw new AssertionError(
          "Spy call did not resolve to expected value:\n" +
            e.message.split("\n").slice(1).join("\n"),
        );
      }
    }

    if ("error" in expected) {
      await assertRejects(
        () => Promise.resolve(call.returned),
        expected.error?.Class ?? Error,
        expected.error?.msgIncludes ?? "",
      );
    }
  }
}

/**
 * Asserts that a spy is called with a specific arg as expected.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCallArg, spy } from "@std/testing/mock";
 *
 * const func = spy((a: number, b: number) => a + b);
 *
 * func(3, 4);
 * func(5, 6);
 *
 * // asserts each call made to the spy function.
 * assertSpyCallArg(func, 0, 0, 3);
 * assertSpyCallArg(func, 0, 1, 4);
 * assertSpyCallArg(func, 1, 0, 5);
 * assertSpyCallArg(func, 1, 1, 6);
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @typeParam ExpectedArg The expected type of the argument for the spy to be called.
 * @param spy The spy to check.
 * @param callIndex The index of the call to check.
 * @param argIndex The index of the arguments to check.
 * @param expected The expected argument.
 * @returns The actual argument.
 */
export function assertSpyCallArg<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArg,
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  argIndex: number,
  expected: ExpectedArg,
): ExpectedArg {
  const call = getSpyCall(spy, callIndex);
  const arg = call?.args[argIndex];
  assertEquals(arg, expected);
  return arg as ExpectedArg;
}

/**
 * Asserts that an spy is called with a specific range of args as expected.
 * If a start and end index is not provided, the expected will be compared against all args.
 * If a start is provided without an end index, the expected will be compared against all args from the start index to the end.
 * The end index is not included in the range of args that are compared.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCallArgs, spy } from "@std/testing/mock";
 *
 * const func = spy((a: number, b: number) => a + b);
 *
 * func(3, 4);
 * func(5, 6);
 *
 * // asserts each call made to the spy function.
 * assertSpyCallArgs(func, 0, [3, 4]);
 * assertSpyCallArgs(func, 1, [5, 6]);
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @typeParam ExpectedArgs The expected type of the arguments for the spy to be called.
 * @param spy The spy to check.
 * @param callIndex The index of the call to check.
 * @param expected The expected arguments.
 * @returns The actual arguments.
 */
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  expected: ExpectedArgs,
): ExpectedArgs;
/**
 * Asserts that an spy is called with a specific range of args as expected.
 * If a start and end index is not provided, the expected will be compared against all args.
 * If a start is provided without an end index, the expected will be compared against all args from the start index to the end.
 * The end index is not included in the range of args that are compared.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCallArgs, spy } from "@std/testing/mock";
 *
 * const func = spy((...args) => {});
 *
 * func(0, 1, 2, 3, 4, 5);
 *
 * assertSpyCallArgs(func, 0, 3, [3, 4, 5]);
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @typeParam ExpectedArgs The expected type of the arguments for the spy to be called.
 * @param spy The spy to check.
 * @param callIndex The index of the call to check.
 * @param argsStart The start index of the arguments to check. If not specified, it checks the arguments from the beignning.
 * @param expected The expected arguments.
 * @returns The actual arguments.
 */
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  argsStart: number,
  expected: ExpectedArgs,
): ExpectedArgs;
/**
 * Asserts that an spy is called with a specific range of args as expected.
 * If a start and end index is not provided, the expected will be compared against all args.
 * If a start is provided without an end index, the expected will be compared against all args from the start index to the end.
 * The end index is not included in the range of args that are compared.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCallArgs, spy } from "@std/testing/mock";
 *
 * const func = spy((...args) => {});
 *
 * func(0, 1, 2, 3, 4, 5);
 *
 * assertSpyCallArgs(func, 0, 3, 4, [3]);
 * ```
 *
 * @typeParam Self The self type of the spy function.
 * @typeParam Args The arguments type of the spy function.
 * @typeParam Return The return type of the spy function.
 * @typeParam ExpectedArgs The expected type of the arguments for the spy to be called.
 * @param spy The spy to check
 * @param callIndex The index of the call to check
 * @param argsStart The start index of the arguments to check. If not specified, it checks the arguments from the beignning.
 * @param argsEnd The end index of the arguments to check. If not specified, it checks the arguments until the end.
 * @param expected The expected arguments.
 * @returns The actual arguments
 */
export function assertSpyCallArgs<
  Self,
  Args extends unknown[],
  Return,
  ExpectedArgs extends unknown[],
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  argsStart: number,
  argsEnd: number,
  expected: ExpectedArgs,
): ExpectedArgs;
export function assertSpyCallArgs<
  ExpectedArgs extends unknown[],
  Args extends unknown[],
  Return,
  Self,
>(
  spy: SpyLike<Self, Args, Return>,
  callIndex: number,
  argsStart?: number | ExpectedArgs,
  argsEnd?: number | ExpectedArgs,
  expected?: ExpectedArgs,
): ExpectedArgs {
  const call = getSpyCall(spy, callIndex);
  if (!expected) {
    expected = argsEnd as ExpectedArgs;
    argsEnd = undefined;
  }
  if (!expected) {
    expected = argsStart as ExpectedArgs;
    argsStart = undefined;
  }
  const args = typeof argsEnd === "number"
    ? call.args.slice(argsStart as number, argsEnd)
    : typeof argsStart === "number"
    ? call.args.slice(argsStart)
    : call.args;
  assertEquals(args, expected);
  return args as ExpectedArgs;
}

/**
 * Creates a function that returns the instance the method was called on.
 *
 * @example Usage
 * ```ts
 * import { returnsThis } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * const func = returnsThis();
 * const obj = { func };
 * assertEquals(obj.func(), obj);
 * ```
 *
 * @typeParam Self The self type of the returned function.
 * @typeParam Args The arguments type of the returned function.
 * @returns A function that returns the instance the method was called on.
 */
export function returnsThis<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
>(): (this: Self, ...args: Args) => Self {
  return function (this: Self): Self {
    return this;
  };
}

/**
 * Creates a function that returns one of its arguments.
 *
 * @example Usage
 * ```ts
 * import { returnsArg } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * const func = returnsArg(1);
 * assertEquals(func(1, 2, 3), 2);
 * ```
 *
 * @typeParam Arg The type of returned argument.
 * @typeParam Self The self type of the returned function.
 * @param idx The index of the arguments to use.
 * @returns A function that returns one of its arguments.
 */
export function returnsArg<
  Arg,
  // deno-lint-ignore no-explicit-any
  Self = any,
>(
  idx: number,
): (this: Self, ...args: Arg[]) => Arg | undefined {
  return function (...args: Arg[]): Arg | undefined {
    return args[idx];
  };
}

/**
 * Creates a function that returns its arguments or a subset of them. If end is specified, it will return arguments up to but not including the end.
 *
 * @example Usage
 * ```ts
 * import { returnsArgs } from "@std/testing/mock";
 * import { assertEquals } from "@std/assert";
 *
 * const func = returnsArgs();
 * assertEquals(func(1, 2, 3), [1, 2, 3]);
 * ```
 *
 * @typeParam Args The arguments type of the returned function
 * @typeParam Self The self type of the returned function
 * @param start The start index of the arguments to return. Default is 0.
 * @param end The end index of the arguments to return.
 * @returns A function that returns its arguments or a subset of them.
 */
export function returnsArgs<
  Args extends unknown[],
  // deno-lint-ignore no-explicit-any
  Self = any,
>(
  start = 0,
  end?: number,
): (this: Self, ...args: Args) => Args {
  return function (this: Self, ...args: Args): Args {
    return args.slice(start, end) as Args;
  };
}

/**
 * Creates a function that returns the iterable values. Any iterable values that are errors will be thrown.
 *
 * @example Usage
 * ```ts
 * import { returnsNext } from "@std/testing/mock";
 * import { assertEquals, assertThrows } from "@std/assert";
 *
 * const func = returnsNext([1, 2, new Error("foo"), 3]);
 * assertEquals(func(), 1);
 * assertEquals(func(), 2);
 * assertThrows(() => func(), Error, "foo");
 * assertEquals(func(), 3);
 * ```
 *
 * @typeParam Return The type of each item of the iterable
 * @typeParam Self The self type of the returned function
 * @typeParam Args The arguments type of the returned function
 * @param values The iterable values
 * @return A function that returns the iterable values
 */
export function returnsNext<
  Return,
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
>(
  values: Iterable<Return | Error>,
): (this: Self, ...args: Args) => Return {
  const gen = (function* returnsValue() {
    yield* values;
  })();
  let calls = 0;
  return function () {
    const next = gen.next();
    if (next.done) {
      throw new MockError(
        `Not expected to be called more than ${calls} time(s)`,
      );
    }
    calls++;
    const { value } = next;
    if (value instanceof Error) throw value;
    return value;
  };
}

/**
 * Creates a function that resolves the awaited iterable values. Any awaited iterable values that are errors will be thrown.
 *
 * @example Usage
 * ```ts
 * import { resolvesNext } from "@std/testing/mock";
 * import { assertEquals, assertRejects } from "@std/assert";
 *
 * const func = resolvesNext([1, 2, new Error("foo"), 3]);
 * assertEquals(await func(), 1);
 * assertEquals(await func(), 2);
 * assertRejects(() => func(), Error, "foo");
 * assertEquals(await func(), 3);
 * ```
 *
 * @typeParam Return The type of each item of the iterable
 * @typeParam Self The self type of the returned function
 * @typeParam Args The type of arguments of the returned function
 * @param iterable The iterable to use
 * @returns A function that resolves the awaited iterable values
 */
export function resolvesNext<
  Return,
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
>(
  iterable:
    | Iterable<Return | Error | Promise<Return | Error>>
    | AsyncIterable<Return | Error | Promise<Return | Error>>,
): (this: Self, ...args: Args) => Promise<Return> {
  const gen = (async function* returnsValue() {
    yield* iterable;
  })();
  let calls = 0;
  return async function () {
    const next = await gen.next();
    if (next.done) {
      throw new MockError(
        `Not expected to be called more than ${calls} time(s)`,
      );
    }
    calls++;
    const { value } = next;
    if (value instanceof Error) throw value;
    return value;
  };
}
