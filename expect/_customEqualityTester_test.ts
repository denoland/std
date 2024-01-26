// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { Tester } from "./_types.ts";

class Volume {
  public amount: number;
  public unit: "L" | "mL";

  constructor(amount: number, unit: "L" | "mL") {
    this.amount = amount;
    this.unit = unit;
  }

  toString(): string {
    return `[Volume ${this.amount}${this.unit}]`;
  }

  equals(other: Volume): boolean {
    if (this.unit === other.unit) {
      return this.amount === other.amount;
    } else if (this.unit === "L" && other.unit === "mL") {
      return this.amount * 1000 === other.amount;
    } else {
      return this.amount === other.amount * 1000;
    }
  }
}

function createVolume(amount: number, unit: "L" | "mL" = "L") {
  return new Volume(amount, unit);
}

function isVolume(a: unknown): a is Volume {
  return a instanceof Volume;
}

const areVolumesEqual: Tester = (
  a: unknown,
  b: unknown,
): boolean | undefined => {
  const isAVolume = isVolume(a);
  const isBVolume = isVolume(b);

  if (isAVolume && isBVolume) {
    return a.equals(b);
  } else if (isAVolume === isBVolume) {
    return undefined;
  } else {
    return false;
  }
};

const volume1 = createVolume(1, 'L');
const volume2 = createVolume(1000, 'mL');

expect.addEqualityTester([areVolumesEqual]);

Deno.test("basic custom equality test", () => {
  expect(volume1).toEqual(volume2);
});
