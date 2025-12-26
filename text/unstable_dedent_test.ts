// Copyright 2018-2025 the Deno authors. MIT license.
import { dedent } from "./unstable_dedent.ts";
import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";

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

// Test case for issue #6831
Deno.test("dedent() only strips single trailing newline", () => {
  const result = dedent`
      a

      `;
  assertEquals(result, "a\n");
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

Deno.test("dedent() handles mixed tabs and spaces", async (t) => {
  // @ts-ignore augmenting globalThis so we don't need to resort to bare `eval`
  using _ = stub(globalThis, "dedent", dedent);

  await t.step("with partial common prefix", () => {
    assertEquals(
      globalThis.eval(`dedent\`\n  a\n \tb\n\``),
      " a\n\tb",
    );
  });

  await t.step("with no common prefix", () => {
    assertEquals(
      globalThis.eval(`dedent\`\n\t a\n \tb\n\``),
      "\t a\n \tb",
    );
  });
});

Deno.test("dedent() handles blank lines correctly", async (t) => {
  // @ts-ignore augmenting globalThis so we don't need to resort to bare `eval`
  using _ = stub(globalThis, "dedent", dedent);

  for (const lineEnding of ["\n", "\r\n"]) {
    // CRLF actually doesn't change the output, as literal CRLFs in template literals in JS files are read as `\n`
    // (this behavior is in the JS spec, not library behavior).
    await t.step(
      `${lineEnding === "\n" ? "LF" : "CRLF"} line ending`,
      async (t) => {
        for (const space of [" ", "\t"]) {
          const spaceName = space === " " ? "space" : "tab";
          await t.step(`${spaceName}s`, async (t) => {
            for (const indent of [0, 1, 2]) {
              for (const between of [0, 1, 2]) {
                // these cases won't fully dedent, which is probably (??) fine
                if (indent === 0 && between !== 0) continue;

                const testName =
                  `${indent}-${spaceName} indent with ${between} ${spaceName}s between`;

                await t.step(testName, () => {
                  const source = [
                    "",
                    `${space.repeat(indent)}a`,
                    space.repeat(between),
                    `${space.repeat(indent)}b`,
                    "",
                  ].join(lineEnding);

                  const result = globalThis.eval(`dedent\`${source}\``);
                  assertEquals(result, "a\n\nb");
                });

                // these cases will strip the first-line/last-line indents, which is probably (??) fine
                if (indent === 0) continue;

                await t.step(
                  `${testName} preserves added first-line indent`,
                  () => {
                    const source = [
                      "",
                      `${space.repeat(indent + 1)}a`,
                      space.repeat(between),
                      `${space.repeat(indent)}b`,
                      "",
                    ].join(lineEnding);

                    const result = globalThis.eval(`dedent\`${source}\``);
                    assertEquals(result, `${space}a\n\nb`);
                  },
                );

                await t.step(
                  `${testName} preserves added last-line indent`,
                  () => {
                    const source = [
                      "",
                      `${space.repeat(indent)}a`,
                      space.repeat(between),
                      `${space.repeat(indent + 1)}b`,
                      "",
                    ].join(lineEnding);

                    const result = globalThis.eval(`dedent\`${source}\``);
                    assertEquals(result, `a\n\n${space}b`);
                  },
                );
              }
            }
          });
        }
      },
    );
  }
});
