// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Stubs a property on an object, retaining the attributes of the original property descriptor as far as possible.
 *
 * @typeParam Self The type of the object to stub a property of.
 * @typeParam Prop The property of the instance to stub.
 * @param self The object to stub the property on.
 * @param property The property to stub.
 * @param value The value to stub the property with.
 * @returns A disposable that restores the original property when disposed.
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
    ...(Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")
      ? { get: () => value }
      : { value }),
  });

  return {
    [Symbol.dispose]() {
      Object.defineProperty(self, property, descriptor);
    },
  };
}

// partial `DisposableStack` polyfill
// https://github.com/tc39/proposal-explicit-resource-management
export function disposableStack() {
  return {
    disposables: [] as Disposable[],
    defer(fn: () => void) {
      this.disposables.push({ [Symbol.dispose]: fn });
    },
    use(val: Disposable) {
      this.disposables.push(val);
    },
    [Symbol.dispose]() {
      for (let i = this.disposables.length - 1; i >= 0; --i) {
        this.disposables[i]![Symbol.dispose]();
      }
    },
  };
}
