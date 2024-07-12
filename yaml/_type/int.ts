// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { Type } from "../_type.ts";
import { isNegativeZero } from "../_utils.ts";

function isCharCodeInRange(c: number, lower: number, upper: number): boolean {
  return lower <= c && c <= upper;
}

function isHexCode(c: number): boolean {
  return (
    isCharCodeInRange(c, 0x30, 0x39) || // 0-9
    isCharCodeInRange(c, 0x41, 0x46) || // A-F
    isCharCodeInRange(c, 0x61, 0x66) // a-f
  );
}

function isOctCode(c: number): boolean {
  return isCharCodeInRange(c, 0x30, 0x37); // 0-7
}

function isDecCode(c: number): boolean {
  return isCharCodeInRange(c, 0x30, 0x39); // 0-9
}

function resolveYamlInteger(data: string): boolean {
  const max = data.length;
  let index = 0;
  let hasDigits = false;

  if (!max) return false;

  let ch = data[index];

  // sign
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }

  if (ch === "0") {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === "b") {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }

    if (ch === "x") {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }

    // base 8
    for (; index < max; index++) {
      ch = data[index];
      if (ch === "_") continue;
      if (!isOctCode(data.charCodeAt(index))) return false;
      hasDigits = true;
    }
    return hasDigits && ch !== "_";
  }

  // base 10 (except 0) or base 60

  // value should not start with `_`;
  if (ch === "_") return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (ch === ":") break;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === "_") return false;

  // if !base60 - done;
  if (ch !== ":") return true;

  // base60 almost not used, no needs to optimize
  return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}

function constructYamlInteger(data: string): number {
  let value = data;
  const digits: number[] = [];

  if (value.includes("_")) {
    value = value.replace(/_/g, "");
  }

  let sign = 1;
  let ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === "0") return 0;

  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value, 16);
    return sign * parseInt(value, 8);
  }

  if (value.includes(":")) {
    value.split(":").forEach((v) => {
      digits.unshift(parseInt(v, 10));
    });

    let valueInt = 0;
    let base = 1;

    digits.forEach((d) => {
      valueInt += d * base;
      base *= 60;
    });

    return sign * valueInt;
  }

  return sign * parseInt(value, 10);
}

function isInteger(object: unknown): boolean {
  return typeof object === "number" && object % 1 === 0 &&
    !isNegativeZero(object);
}

export const int: Type<number> = {
  tag: "tag:yaml.org,2002:int",
  construct: constructYamlInteger,
  defaultStyle: "decimal",
  kind: "scalar",
  predicate: isInteger,
  represent: {
    binary(obj: number): string {
      return obj >= 0
        ? `0b${obj.toString(2)}`
        : `-0b${obj.toString(2).slice(1)}`;
    },
    octal(obj: number): string {
      return obj >= 0 ? `0${obj.toString(8)}` : `-0${obj.toString(8).slice(1)}`;
    },
    decimal(obj: number): string {
      return obj.toString(10);
    },
    hexadecimal(obj: number): string {
      return obj >= 0
        ? `0x${obj.toString(16).toUpperCase()}`
        : `-0x${obj.toString(16).toUpperCase().slice(1)}`;
    },
  },
  resolve: resolveYamlInteger,
};
