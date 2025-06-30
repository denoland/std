// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** An inspect function conforming to the shape of `Deno.inspect` and `node:util`'s `inspect` */
export type InspectFn = (
  v: unknown,
  options: {
    depth: number;
    sorted: boolean;
    trailingComma: boolean;
    compact: boolean;
    iterableLimit: number;
    getters: boolean;
    strAbbreviateSize: number;
  },
) => string;

/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky.
 *
 * @param v Value to be formatted
 *
 * @returns The formatted string
 *
 * @example Usage
 * ```ts
 * import { format } from "@std/internal/format";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(format({ a: 1, b: 2 }), "{\n  a: 1,\n  b: 2,\n}");
 * assertEquals(format(new Set([1, 2])), "Set(2) {\n  1,\n  2,\n}");
 * assertEquals(format(new Map([[1, 2]])), "Map(1) {\n  1 => 2,\n}");
 * ```
 */
export function format(v: unknown): string {
  // deno-lint-ignore no-explicit-any
  const { Deno, process } = globalThis as any;

  const inspect: InspectFn | undefined = Deno?.inspect ??
    process?.getBuiltinModule?.("node:util")?.inspect;

  return typeof inspect === "function"
    ? inspect(v, {
      depth: Infinity,
      sorted: true,
      trailingComma: true,
      compact: false,
      iterableLimit: Infinity,
      // getters should be true in assertEquals.
      getters: true,
      strAbbreviateSize: Infinity,
    })
    : basicInspect(v);
}

const formatters: ((v: unknown) => string | undefined)[] = [
  (v) => {
    if (typeof v === "undefined") return "undefined";
    if (typeof v === "bigint") return `${v}n`;

    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null ||
      Array.isArray(v) ||
      [null, Object.prototype].includes(Object.getPrototypeOf(v))
    ) {
      return JSON.stringify(v, null, 2);
    }
  },
  (v) => String(v),
  (v) => Object.prototype.toString.call(v),
];

// for environments lacking both `Deno.inspect` and `process.inspect`
function basicInspect(v: unknown): string {
  for (const fmt of formatters) {
    try {
      const result = fmt(v);
      if (typeof result === "string") return result;
    } catch { /* try the next one */ }
  }

  return "[[Unable to format value]]";
}
