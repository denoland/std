// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { defineMockInternals } from "@std/internal/unstable_mock";
import type {
  ExpectMockCall,
  ExpectMockInstance,
} from "./_unstable_mock_utils.ts";

function defineMethod<Value extends object, Key extends keyof Value>(
  value: Value,
  key: Key,
  method: Value[Key] extends (
    this: Value,
    ...args: infer Args extends unknown[]
  ) => infer Return ? (this: Value, ...args: Args) => Return
    : never,
) {
  Object.defineProperty(value, key, {
    value: method,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

export type Functor<Args extends unknown[], Return> = (...args: Args) => Return;
export type StubState<Args extends unknown[], Return> = {
  current: Functor<Args, Return> | undefined;
  once: Functor<Args, Return>[];
};

export function createMockInstance<
  Args extends unknown[],
  Return,
  Fn extends Functor<Args, Return>,
>(
  original: Fn | undefined,
  initialStubs: Functor<Args, Return>[],
  functor: (call: Functor<Args, Return | undefined>, context: {
    implementation(): Functor<Args, Return> | undefined;
    calls: ExpectMockCall<Args, Return>[];
    state: StubState<Args, Return>;
  }) => Functor<Args, Return | undefined>,
): Fn & ExpectMockInstance<Args, Return> {
  const originalStub: Functor<Args, Return> | undefined = original
    ? (...args) => original(...args)
    : undefined;
  const stubState: StubState<Args, Return> = {
    current: originalStub,
    once: initialStubs,
  };
  const calls: ExpectMockCall<Args, Return>[] = [];
  const instance: ExpectMockInstance<Args, Return> = defineMockInternals(
    functor((...args) => {
      const stub = stubState.once.pop() ?? stubState.current;
      try {
        const returned = stub?.(...args);
        calls.push({
          args,
          timestamp: Date.now(),
          result: "returned",
          returned,
        });
        return returned;
      } catch (error) {
        calls.push({ args, timestamp: Date.now(), result: "thrown", error });
        throw error;
      }
    }, {
      state: stubState,
      implementation() {
        return stubState.once.pop() ?? stubState.current;
      },
      calls,
    }),
    { calls },
  ) as never;
  defineMethod(instance, "mockImplementation", (stub) => {
    stubState.current = stub;
    return instance;
  });
  defineMethod(instance, "mockImplementationOnce", (stub) => {
    stubState.once.push(stub);
    return instance;
  });
  defineMethod(
    instance,
    "mockReturnValue",
    (value) => instance.mockImplementation(() => value),
  );
  defineMethod(
    instance,
    "mockReturnValueOnce",
    (value) => instance.mockImplementationOnce(() => value),
  );
  defineMethod(
    instance,
    "mockResolvedValue",
    (value) =>
      instance.mockImplementation(() => Promise.resolve(value) as never),
  );
  defineMethod(
    instance,
    "mockResolvedValueOnce",
    (value) =>
      instance.mockImplementationOnce(() => Promise.resolve(value) as never),
  );
  defineMethod(
    instance,
    "mockRejectedValue",
    (reason) =>
      instance.mockImplementation(() => Promise.reject(reason) as never),
  );
  defineMethod(
    instance,
    "mockRejectedValueOnce",
    (reason) =>
      instance.mockImplementationOnce(() => Promise.reject(reason) as never),
  );
  defineMethod(instance, "mockRestore", () => {
    stubState.current = originalStub;
    stubState.once = [];
    return instance;
  });
  defineMethod(
    instance,
    "withImplementation",
    <ScopeResult>(stub: Functor<Args, Return>, scope?: () => ScopeResult) => {
      const prevState = { ...stubState };
      stubState.current = stub;
      stubState.once = [];
      const resource: Disposable = {
        [Symbol.dispose]() {
          stubState.current = prevState.current;
          stubState.once = prevState.once;
        },
      };
      if (!scope) return resource;
      try {
        const result = scope();
        if (result instanceof Promise) {
          return result.finally(() => resource[Symbol.dispose]());
        }
        resource[Symbol.dispose]();
        return result;
      } catch (error) {
        resource[Symbol.dispose]();
        throw error;
      }
    },
  );

  return instance as never;
}
