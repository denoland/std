// Copyright 2018-2026 the Deno authors. MIT license.

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
