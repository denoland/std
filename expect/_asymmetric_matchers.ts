// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any

import { equal } from "./_equal.ts";

export abstract class AsymmetricMatcher<T> {
  constructor(
    protected value: T,
  ) {}
  abstract equals(other: unknown): boolean;
}

export class Anything extends AsymmetricMatcher<void> {
  equals(other: unknown): boolean {
    return other !== null && other !== undefined;
  }
}

export function anything(): Anything {
  return new Anything();
}

export class Any extends AsymmetricMatcher<any> {
  constructor(value: unknown) {
    if (value === undefined) {
      throw new TypeError("Expected a constructor function");
    }
    super(value);
  }

  equals(other: unknown): boolean {
    if (typeof other === "object") {
      return other instanceof this.value;
    } else {
      if (this.value === Number) {
        return typeof other === "number";
      }

      if (this.value === String) {
        return typeof other === "string";
      }

      if (this.value === Number) {
        return typeof other === "number";
      }

      if (this.value === Function) {
        return typeof other === "function";
      }

      if (this.value === Boolean) {
        return typeof other === "boolean";
      }

      if (this.value === BigInt) {
        return typeof other === "bigint";
      }

      if (this.value === Symbol) {
        return typeof other === "symbol";
      }
    }
    return false;
  }
}

export function any(c: unknown): Any {
  return new Any(c);
}

export class ArrayContaining extends AsymmetricMatcher<any[]> {
  constructor(arr: any[]) {
    super(arr);
  }

  equals(other: any[]): boolean {
    return Array.isArray(other) && this.value.every((e) => other.includes(e));
  }
}

export function arrayContaining(c: any[]): ArrayContaining {
  return new ArrayContaining(c);
}

export class CloseTo extends AsymmetricMatcher<number> {
  readonly #precision: number;

  constructor(num: number, precision: number = 2) {
    super(num);
    this.#precision = precision;
  }

  equals(other: number): boolean {
    if (typeof other !== "number") {
      return false;
    }

    if (
      (this.value === Number.POSITIVE_INFINITY &&
        other === Number.POSITIVE_INFINITY) ||
      (this.value === Number.NEGATIVE_INFINITY &&
        other === Number.NEGATIVE_INFINITY)
    ) {
      return true;
    }

    return Math.abs(this.value - other) < Math.pow(10, -this.#precision) / 2;
  }
}

export function closeTo(num: number, numDigits?: number): CloseTo {
  return new CloseTo(num, numDigits);
}

export class StringContaining extends AsymmetricMatcher<string> {
  constructor(str: string) {
    super(str);
  }

  equals(other: string): boolean {
    if (typeof other !== "string") {
      return false;
    }

    return other.includes(this.value);
  }
}

export function stringContaining(str: string): StringContaining {
  return new StringContaining(str);
}

export class StringMatching extends AsymmetricMatcher<RegExp> {
  constructor(pattern: string | RegExp) {
    super(new RegExp(pattern));
  }

  equals(other: string): boolean {
    if (typeof other !== "string") {
      return false;
    }

    return this.value.test(other);
  }
}

export function stringMatching(pattern: string | RegExp): StringMatching {
  return new StringMatching(pattern);
}

export class ObjectContaining
  extends AsymmetricMatcher<Record<string, unknown>> {
  constructor(obj: Record<string, unknown>) {
    super(obj);
  }

  equals(other: Record<string, unknown>): boolean {
    const keys = Object.keys(this.value);

    for (const key of keys) {
      if (
        !Object.hasOwn(other, key) ||
        !equal(this.value[key], other[key])
      ) {
        return false;
      }
    }

    return true;
  }
}

export function objectContaining(
  obj: Record<string, unknown>,
): ObjectContaining {
  return new ObjectContaining(obj);
}
