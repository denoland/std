/** This module is browser compatible. */

import { MockError } from "./_asserts.ts";

export * from "./_asserts.ts";
export * from "./_callbacks.ts";

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

/** Wraps a function with a Spy. */
function functionSpy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  Return = undefined,
>(): Spy<Self, Args, Return>;
function functionSpy<
  Self,
  Args extends unknown[],
  Return,
>(func: (this: Self, ...args: Args) => Return): Spy<Self, Args, Return>;
function functionSpy<
  Self,
  Args extends unknown[],
  Return,
>(func?: (this: Self, ...args: Args) => Return): Spy<Self, Args, Return> {
  const original = func ?? (() => {}) as (this: Self, ...args: Args) => Return,
    calls: SpyCall<Self, Args, Return>[] = [];
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
        throw new MockError("function cannot be restored");
      },
    },
  });
  return spy;
}

/** Checks if a function is a spy. */
function isSpy<Self, Args extends unknown[], Return>(
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
const sessions: Set<Spy<any, any[], any>>[] = [];
// deno-lint-ignore no-explicit-any
function getSession(): Set<Spy<any, any[], any>> {
  if (sessions.length === 0) sessions.push(new Set());
  return sessions[sessions.length - 1];
}
// deno-lint-ignore no-explicit-any
function registerMock(spy: Spy<any, any[], any>): void {
  const session = getSession();
  session.add(spy);
}
// deno-lint-ignore no-explicit-any
function unregisterMock(spy: Spy<any, any[], any>): void {
  const session = getSession();
  session.delete(spy);
}

/**
 * Creates a session that tracks all mocks created before it's restored.
 * If a callback is provided, it restores all mocks created within it.
 */
export function mockSession(): number;
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

/** Creates an async session that tracks all mocks created before the promise resolves. */
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
 */
export function restore(id?: number): void {
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
>(self: Self, property: keyof Self): Spy<Self, Args, Return> {
  if (typeof self[property] !== "function") {
    throw new MockError("property is not an instance method");
  }
  if (isSpy(self[property])) {
    throw new MockError("already spying on instance method");
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(self, property);
  if (propertyDescriptor && !propertyDescriptor.configurable) {
    throw new MockError("cannot spy on non configurable instance method");
  }

  const original = self[property] as unknown as (
      this: Self,
      ...args: Args
    ) => Return,
    calls: SpyCall<Self, Args, Return>[] = [];
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
      get: () => restored,
    },
    restore: {
      enumerable: true,
      value: () => {
        if (restored) {
          throw new MockError("instance method already restored");
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
  });

  Object.defineProperty(self, property, {
    configurable: true,
    enumerable: propertyDescriptor?.enumerable,
    writable: propertyDescriptor?.writable,
    value: spy,
  });

  registerMock(spy);
  return spy;
}

/** Wraps a function or instance method with a Spy. */
export function spy<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  Return = undefined,
>(): Spy<Self, Args, Return>;
export function spy<
  Self,
  Args extends unknown[],
  Return,
>(func: (this: Self, ...args: Args) => Return): Spy<Self, Args, Return>;
export function spy<
  Self,
  Args extends unknown[],
  Return,
>(self: Self, property: keyof Self): Spy<Self, Args, Return>;
export function spy<
  Self,
  Args extends unknown[],
  Return,
>(
  funcOrSelf?: ((this: Self, ...args: Args) => Return) | Self,
  property?: keyof Self,
): Spy<Self, Args, Return> {
  const spy = typeof property !== "undefined"
    ? methodSpy<Self, Args, Return>(funcOrSelf as Self, property)
    : typeof funcOrSelf === "function"
    ? functionSpy<Self, Args, Return>(
      funcOrSelf as (this: Self, ...args: Args) => Return,
    )
    : functionSpy<Self, Args, Return>();
  return spy;
}

/** An instance method replacement that records all calls made to it. */
export interface Stub<
  // deno-lint-ignore no-explicit-any
  Self = any,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  // deno-lint-ignore no-explicit-any
  Return = any,
> extends Spy<Self, Args, Return> {
  /** The function that is used instead of the original. */
  fake: (this: Self, ...args: Args) => Return;
}

/** Replaces an instance method with a Stub. */
export function stub<
  Self,
  // deno-lint-ignore no-explicit-any
  Args extends unknown[] = any[],
  Return = undefined,
>(self: Self, property: keyof Self): Stub<Self, Args, Return>;
export function stub<
  Self,
  Args extends unknown[],
  Return,
>(
  self: Self,
  property: keyof Self,
  func: (this: Self, ...args: Args) => Return,
): Stub<Self, Args, Return>;
export function stub<
  Self,
  Args extends unknown[],
  Return,
>(
  self: Self,
  property: keyof Self,
  func?: (this: Self, ...args: Args) => Return,
): Stub<Self, Args, Return> {
  if (typeof self[property] !== "function") {
    throw new MockError("property is not an instance method");
  }
  if (isSpy(self[property])) {
    throw new MockError("already spying on instance method");
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(self, property);
  if (propertyDescriptor && !propertyDescriptor.configurable) {
    throw new MockError("cannot spy on non configurable instance method");
  }

  const fake = func ?? (() => {}) as (this: Self, ...args: Args) => Return;

  const original = self[property] as unknown as (
      this: Self,
      ...args: Args
    ) => Return,
    calls: SpyCall<Self, Args, Return>[] = [];
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
          throw new MockError("instance method already restored");
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
  });

  Object.defineProperty(self, property, {
    configurable: true,
    enumerable: propertyDescriptor?.enumerable,
    writable: propertyDescriptor?.writable,
    value: stub,
  });

  registerMock(stub);
  return stub;
}
