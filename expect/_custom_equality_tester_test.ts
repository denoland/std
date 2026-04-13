// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";

class Duration {
  time: number;
  unit: "H" | "M" | "S";

  constructor(time: number, unit: "H" | "M" | "S") {
    this.time = time;
    this.unit = unit;
  }

  toString(): string {
    return `[Duration: ${this.time.toString()}${this.unit}]`;
  }

  equals(other: Duration): boolean {
    if (this.unit === other.unit) {
      return this.time === other.time;
    }

    if (
      (this.unit === "H" && other.unit === "M") ||
      (this.unit === "M" && other.unit === "S")
    ) {
      return (this.time * 60) === other.time;
    }

    if (
      (other.unit === "H" && this.unit === "M") ||
      (other.unit === "M" && this.unit === "S")
    ) {
      return (other.time * 60) === this.time;
    }

    return (this.time * 60 * 60) === other.time;
  }
}

function isDurationMatch(a: Duration, b: Duration) {
  const isDurationA = a instanceof Duration;
  const isDurationB = b instanceof Duration;

  if (isDurationA && isDurationB) return a.equals(b);
  if (isDurationA === isDurationB) return undefined;
  return false;
}

const duration1 = new Duration(1, "S");
const duration2 = new Duration(2, "M");
const duration3 = new Duration(120, "S");

expect.addEqualityTesters([isDurationMatch]);

function* toIterator<T>(array: Array<T>): Iterator<T> {
  for (const obj of array) {
    yield obj;
  }
}

Deno.test("Basic custom equality test", () => {
  expect(duration1).toEqual(duration1);
  expect(duration1).not.toEqual(duration3);
  expect(duration1).not.toEqual(duration2);
  expect(duration2).not.toBe(duration1);
  expect(toIterator([duration1, duration2])).not.toEqual(
    toIterator([duration2, duration1]),
  );
  expect({ a: duration2, b: undefined }).toStrictEqual({
    a: duration3,
    b: undefined,
  });
});

Deno.test("Basic custom equality test may contain different Duration Object", () => {
  expect([duration1]).not.toContain(duration2);
  expect([duration1]).toContain(duration1);
  expect([duration2]).toContainEqual(duration3);
  expect({ a: duration2 }).toHaveProperty("a", duration3);
  expect(new Map([["key", duration2]])).toEqual(new Map([["key", duration3]]));
  expect(new Set([duration3])).toEqual(new Set([duration2]));
  expect([duration3, duration2]).toEqual([duration2, duration3]);
  expect(toIterator([duration3, duration2])).toEqual(
    toIterator([duration2, duration3]),
  );
});
