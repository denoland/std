// Copyright 2018-2026 the Deno authors. MIT license.
import { isSpy, registerMock, unregisterMock } from "./_mock_utils.ts";
import {
  type GetParametersFromProp,
  type GetReturnFromProp,
  type MethodSpy,
  MockError,
  type Spy,
  spy,
  type SpyCall,
} from "./mock.ts";

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
 * import { assertSpyCalls } from "@std/testing/mock";
 * import { stub } from "@std/testing/unstable-stub";
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
 * import { stub } from "@std/testing/unstable-stub";
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
/**
 * Replaces an instance property setter or getter with a Stub with the given implementation.
 *
 * @example Usage
 * ```ts
 * import { assertSpyCalls } from "@std/testing/mock";
 * import { stub } from "@std/testing/unstable-stub";
 * import { assertEquals } from "@std/assert";
 *
 * const obj = {
 *  prop: "foo",
 * };
 *
 * const getterStub = stub(obj, "prop", {
 *  get: function () {
 *    return "bar";
 *  },
 * });
 *
 * assertEquals(obj.prop, "bar");
 * assertSpyCalls(getterStub.get, 1);
 * ```
 *
 * @typeParam Self The self type of the instance to replace a method of.
 * @typeParam Prop The property of the instance to replace.
 * @param self The instance to replace a method of.
 * @param property The property of the instance to replace.
 * @param descriptor The javascript property descriptor with fake implementation of the getter and setter.
 * @returns The stub with get and set properties which are spys of the setter and getter.
 */
export function stub<Self, Prop extends keyof Self>(
  self: Self,
  property: Prop,
  descriptor: Omit<PropertyDescriptor, "configurable">,
):
  & Stub<
    Self,
    GetParametersFromProp<Self, Prop>,
    GetReturnFromProp<Self, Prop>
  >
  & {
    get: Spy<
      Self,
      GetParametersFromProp<Self, Prop>,
      GetReturnFromProp<Self, Prop>
    >;
    set: Spy<
      Self,
      GetParametersFromProp<Self, Prop>,
      GetReturnFromProp<Self, Prop>
    >;
  };
export function stub<Self, Args extends unknown[], Return>(
  self: Self,
  property: keyof Self,
  descriptorOrFunction?:
    | ((this: Self, ...args: Args) => Return)
    | Omit<PropertyDescriptor, "configurable">,
): Stub<Self, Args, Return> {
  if (
    self[property] !== undefined &&
    typeof self[property] !== "function" &&
    (descriptorOrFunction === undefined ||
      typeof descriptorOrFunction === "function")
  ) {
    throw new MockError("Cannot stub: property is not an instance method");
  }
  if (isSpy(self[property])) {
    throw new MockError("Cannot stub: already spying on instance method");
  }
  if (
    descriptorOrFunction !== undefined &&
    typeof descriptorOrFunction !== "function" &&
    descriptorOrFunction.get === undefined &&
    descriptorOrFunction.set === undefined
  ) {
    throw new MockError(
      "Cannot stub: neither setter nor getter is defined",
    );
  }

  const propertyDescriptor = Object.getOwnPropertyDescriptor(self, property);
  if (propertyDescriptor && !propertyDescriptor.configurable) {
    throw new MockError("Cannot stub: non-configurable instance method");
  }
  const fake =
    descriptorOrFunction && typeof descriptorOrFunction === "function"
      ? descriptorOrFunction
      : ((() => {}) as (this: Self, ...args: Args) => Return);

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

  if (descriptorOrFunction && typeof descriptorOrFunction !== "function") {
    const getterSpy = descriptorOrFunction.get
      ? spy(descriptorOrFunction.get)
      : undefined;
    const setterSpy = descriptorOrFunction.set
      ? spy(descriptorOrFunction.set)
      : undefined;

    Object.defineProperty(self, property, {
      configurable: true,
      enumerable: propertyDescriptor?.enumerable ?? false,
      get: getterSpy!,
      set: setterSpy!,
    });
    Object.defineProperty(stub, "get", {
      value: getterSpy,
      enumerable: true,
    });
    Object.defineProperty(stub, "set", {
      value: setterSpy,
      enumerable: true,
    });
  } else {
    Object.defineProperty(self, property, {
      configurable: true,
      enumerable: propertyDescriptor?.enumerable ?? false,
      writable: propertyDescriptor?.writable ?? false,
      value: stub,
    });
  }

  registerMock(stub);
  return stub;
}
