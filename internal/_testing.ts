// Copyright 2018-2025 the Deno authors. MIT license.

export function stubProperty<O, P extends keyof O>(
  obj: O,
  prop: P,
  value: O[P],
): Disposable {
  const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

  if (descriptor == null) {
    Object.defineProperty(obj, prop, { value, configurable: true });
    return {
      [Symbol.dispose]() {
        delete obj[prop];
      },
    };
  }

  if (!descriptor.configurable && !descriptor.writable) {
    throw new TypeError(
      `Cannot stub property "${
        String(prop)
      }" because it is not configurable or writable.`,
    );
  }

  Object.defineProperty(obj, prop, {
    ...descriptor,
    ...(Object.hasOwn(descriptor, "get") || Object.hasOwn(descriptor, "set")
      ? {
        get() {
          return value;
        },
      }
      : { value }),
  });

  return {
    [Symbol.dispose]() {
      Object.defineProperty(obj, prop, descriptor);
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
