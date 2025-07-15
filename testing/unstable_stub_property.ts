// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Stubs a property on an object, retaining the attributes of the original property descriptor as far as possible.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @typeParam Self The type of the object to stub a property of.
 * @typeParam Prop The property of the instance to stub.
 * @param self The object to stub the property on.
 * @param property The property to stub.
 * @param value The value to stub the property with.
 * @returns A disposable that restores the original property when disposed.
 *
 * @example Usage
 * ```ts
 * import { stubProperty } from "@std/testing/unstable-stub-property";
 * import { assertEquals } from "@std/assert";
 *
 * const obj = { foo: "bar" };
 * {
 *  using stub = stubProperty(obj, "foo", "baz");
 *  assertEquals(obj.foo, "baz");
 * }
 * // After disposing, the property returns to its original value.
 * assertEquals(obj.foo, "bar");
 * ```
 */
export function stubProperty<Self, Prop extends keyof Self>(
  self: Self,
  property: Prop,
  value: Self[Prop],
): Disposable {
  const descriptor = Object.getOwnPropertyDescriptor(self, property);

  if (descriptor == null) {
    Object.defineProperty(self, property, { value, configurable: true });
    return {
      [Symbol.dispose]() {
        delete self[property];
      },
    };
  }

  if (!descriptor.configurable && !descriptor.writable) {
    throw new TypeError(
      `Cannot stub property "${
        String(property)
      }" because it is not configurable or writable.`,
    );
  }

  Object.defineProperty(self, property, {
    ...descriptor,
    ...(isAccessorDescriptor(descriptor) ? { get: () => value } : { value }),
  });

  return {
    [Symbol.dispose]() {
      Object.defineProperty(self, property, descriptor);
    },
  };
}

function isAccessorDescriptor(descriptor: PropertyDescriptor) {
  return Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set");
}
