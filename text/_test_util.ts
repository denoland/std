// Copyright 2018-2025 the Deno authors. MIT license.
import { stub } from "@std/testing/mock";

export function generateRandomString(min: number, max: number): string {
  return Array.from({ length: Math.floor(Math.random() * (max - min) + min) })
    .map(() => String.fromCharCode(Math.floor(Math.random() * 26) + 97))
    .join("");
}

export function stubIntlFunctions(defaultLocale: string) {
  const fnNames = ["toLocaleLowerCase", "toLocaleUpperCase"] as const;
  const stubs: { [Symbol.dispose](): void }[] = fnNames.map((fnName) => {
    const fn = String.prototype[fnName];
    const stubbed: typeof fn = function (this: string, locale) {
      return fn.call(this, locale ?? defaultLocale);
    };
    return stub(String.prototype, fnName, stubbed);
  });
  stubs.push(
    stubProperty(navigator, "language", defaultLocale),
  );

  return {
    [Symbol.dispose]() {
      for (const stub of stubs) {
        stub[Symbol.dispose]();
      }
    },
  };
}

function stubProperty<O, P extends keyof O>(
  obj: O,
  prop: P,
  value: O[P],
) {
  const originalValue = obj[prop];
  const descriptor = {
    ...Object.getOwnPropertyDescriptor(obj, prop),
    configurable: true,
  };
  Object.defineProperty(obj, prop, {
    ...descriptor,
    get() {
      return value;
    },
  });
  return {
    [Symbol.dispose]() {
      Object.defineProperty(obj, prop, {
        ...descriptor,
        get() {
          return originalValue;
        },
      });
    },
  };
}
