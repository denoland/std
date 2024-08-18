// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { fnv32, fnv32a } from "./fnv32.ts";
import { fnv64, fnv64a } from "./fnv64.ts";

export function fnv(
  name: "FNV32" | "FNV64" | "FNV32A" | "FNV64A",
  data: Uint8Array,
): ArrayBuffer {
  switch (name) {
    case "FNV32":
      return fnv32(data);
    case "FNV64":
      return fnv64(data);
    case "FNV32A":
      return fnv32a(data);
    case "FNV64A":
      return fnv64a(data);
    default:
      throw new TypeError(`unsupported fnv digest: ${name}`);
  }
}
