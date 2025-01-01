// Copyright 2018-2025 the Deno authors. MIT license.
import { green, red, stripAnsiCode } from "./styles.ts";
import { assertEquals, assertThrows } from "@std/assert";
import { format } from "./format.ts";

Deno.test("format() generates correct diffs for strings", () => {
  assertThrows(
    () => {
      assertEquals([..."abcd"].join("\n"), [..."abxde"].join("\n"));
    },
    Error,
    `
    a\\n
    b\\n
${green("+   x")}\\n
${green("+   d")}\\n
${green("+   e")}
${red("-   c")}\\n
${red("-   d")}
`,
  );
});

// Check that the diff formatter overrides some default behaviours of
// `Deno.inspect()` which are problematic for diffing.
Deno.test("format() overrides default behaviours of Deno.inspect", async (t) => {
  // Wraps objects into multiple lines even when they are small. Prints trailing
  // commas.
  await t.step(
    "fromat() always wraps objects into multiple lines and prints trailing commas",
    () =>
      assertEquals(
        stripAnsiCode(format({ a: 1, b: 2 })),
        `{
  a: 1,
  b: 2,
}`,
      ),
  );

  await t.step("format() wraps Object with getters", () =>
    assertEquals(
      format(Object.defineProperty({}, "a", {
        enumerable: true,
        get() {
          return 1;
        },
      })),
      `{
  a: [Getter: 1],
}`,
    ));

  await t.step("format() wraps nested small objects", () =>
    assertEquals(
      stripAnsiCode(format([{ x: { a: 1, b: 2 }, y: ["a", "b"] }])),
      `[
  {
    x: {
      a: 1,
      b: 2,
    },
    y: [
      "a",
      "b",
    ],
  },
]`,
    ));

  // Grouping is disabled.
  await t.step("format() disables grouping", () =>
    assertEquals(
      stripAnsiCode(format(["i", "i", "i", "i", "i", "i", "i"])),
      `[
  "i",
  "i",
  "i",
  "i",
  "i",
  "i",
  "i",
]`,
    ));
});

Deno.test("format() doesn't truncate long strings in object", () => {
  const str = format({
    foo:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  });
  assertEquals(
    str,
    `{
  foo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
}`,
  );
});

Deno.test("format() has fallback to String if Deno.inspect is not available", () => {
  // Simulates the environment where Deno.inspect is not available
  const inspect = Deno.inspect;
  // deno-lint-ignore no-explicit-any
  delete (Deno as any).inspect;
  try {
    assertEquals(format([..."abcd"]), `"a,b,c,d"`);
    assertEquals(format({ a: 1, b: 2 }), `"[object Object]"`);
  } finally {
    Deno.inspect = inspect;
  }
});
