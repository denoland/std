import { dedent } from "./dedent.ts";
import { assertEquals } from "@std/assert";

Deno.test("dedent() handles example 1", () => {
  assertEquals(
    dedent(`
      {
        msg: "Hello",
      }
    `),
    `{\n  msg: "Hello",\n}`,
  );
});

Deno.test("dedent() handles example 2", () => {
  assertEquals(
    dedent`line 1
           line 2`,
    "line 1\nline 2",
  );
});

Deno.test("dedent() handles empty lines", () => {
  assertEquals(
    dedent(`
      a
        
        b
        \t\t\t
       c
    `),
    "a\n\n  b\n\n c",
  );
});

Deno.test("dedent() handles tabs", () => {
  assertEquals(
    dedent("\ta\n\t\tb"),
    "a\n\tb",
  );
});

Deno.test("dedent() handles unindented second line", () => {
  assertEquals(
    dedent(`
        a
b
    `),
    "        a\nb",
  );
});

Deno.test("dedent() handles templates", () => {
  assertEquals(
    dedent`
      line 1
      ${"line 2"}
      line ${3}
      line 4
    `,
    "line 1\nline 2\nline 3\nline 4",
  );
});

Deno.test("dedent() handles one line", () => {
  assertEquals(
    dedent`one line`,
    "one line",
  );
});
