// Copyright 2018-2025 the Deno authors. MIT license.

export function stubProperty<O, P extends keyof O>(
  obj: O,
  prop: P,
  value: O[P],
): Disposable {
  const originalValue = obj[prop];
  const originalDescriptor = Object.getOwnPropertyDescriptor(obj, prop);
  const descriptor = originalDescriptor == null
    ? { configurable: true }
    : originalDescriptor;

  const descriptorWithValue = (value: O[P]) => ({
    ...descriptor,
    ...(originalDescriptor != null && Object.hasOwn(originalDescriptor, "value")
      ? { value }
      : {
        get() {
          return value;
        },
      }),
  });

  Object.defineProperty(obj, prop, descriptorWithValue(value));
  return {
    [Symbol.dispose]() {
      Object.defineProperty(obj, prop, descriptorWithValue(originalValue));
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
