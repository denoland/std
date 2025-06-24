// Copyright 2018-2025 the Deno authors. MIT license.
import { dedent } from "./unstable_dedent.ts";
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

Deno.test("dedent() handles multiline substitution", () => {
  const outer = dedent`
    1
    ${"2\n3"}
    4
`;
  assertEquals(outer, "1\n2\n3\n4");
});

Deno.test("dedent() handles blank lines correctly", async (t) => {
  const blankLineTests = [
    {
      name: "single-space indent, empty newline",
      source: "\n a\n\n b\n",
    },
    {
      name: "multi-space indent, empty newline",
      source: "\n  a\n\n  b\n",
    },
    {
      name: "single-space indent, single-space newline",
      source: "\n a\n \n b\n",
    },
    {
      name: "multi-space indent, single-space newline",
      source: "\n  a\n \n  b\n",
    },
    {
      name: "single-space indent, multi-space newline",
      source: "\n a\n  \n b\n",
    },
    {
      name: "multi-space indent, multi-space newline",
      source: "\n  a\n  \n  b\n",
    },
  ];

  for (const { name, source } of blankLineTests) {
    await t.step(name, () => {
      const result = eval(`dedent\`${source}\``);
      assertEquals(result, "a\n\nb");
    });

    await t.step(name.replaceAll("space", "tab"), () => {
      const result = eval(`dedent\`${source.replaceAll(" ", "\t")}\``);
      assertEquals(result, "a\n\nb");
    });

    // CRLF actually doesn't change the output, as literal CRLFs in template literals in JS files are read as `\n`
    // (this behavior is in the JS spec, not library behavior).
    await t.step(`${name} (with CRLF)`, () => {
      const result = eval(`dedent\`${source.replaceAll("\n", "\r\n")}\``);
      assertEquals(result, "a\n\nb");
    });

    await t.step(`${name.replaceAll("space", "tab")} (with CRLF)`, () => {
      const result = eval(
        `dedent\`${source.replaceAll(" ", "\t").replaceAll("\n", "\r\n")}\``,
      );
      assertEquals(result, "a\n\nb");
    });
  }
});
