// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { toTitleCase, type WordFilter } from "./unstable_to_title_case.ts";
import { stubLocaleCaseFunctions } from "./_test_util.ts";

Deno.test("toTitleCase() converts a string to title case", () => {
  const input = "hello world";
  assertEquals(toTitleCase(input), "Hello World");
});

Deno.test("toTitleCase() respects special title-case mappings", () => {
  const input = "ﬆrange ﬂoating aﬃrmation";
  const expected = "Strange Floating Aﬃrmation";
  assertEquals(toTitleCase(input), expected);
});

Deno.test("toTitleCase() works with wrapping punctuation", () => {
  const input = "“hello world”";
  assertEquals(toTitleCase(input), "“Hello World”");
});

Deno.test("toTitleCase() can be customized with options", async (t) => {
  await t.step("`force`", async (t) => {
    const input = "HELLO wOrLd";

    await t.step("defaults to `true`", () => {
      assertEquals(toTitleCase(input), "Hello World");
    });

    await t.step("explicitly passing `true`", () => {
      assertEquals(toTitleCase(input, { force: true }), "Hello World");
    });

    await t.step("disabled by passing `false`", () => {
      assertEquals(toTitleCase(input, { force: false }), "HELLO WOrLd");
    });
  });

  await t.step("`locale`", async (t) => {
    const input = "irrIgation";

    await t.step('defaults to `false`, using locale-agnostic "und"', () => {
      using _ = stubLocaleCaseFunctions("tr-TR");
      assertEquals(toTitleCase(input), "Irrigation");
    });

    await t.step("`true` uses system-default locale", () => {
      using _ = stubLocaleCaseFunctions("tr-TR");
      assertEquals(toTitleCase(input, { locale: true }), "İrrıgation");
    });

    await t.step("supports passing a specific locale", () => {
      using _ = stubLocaleCaseFunctions("en-US");
      assertEquals(toTitleCase(input, { locale: "tr-TR" }), "İrrıgation");
    });
  });

  await t.step("`filter`", async (t) => {
    await t.step("with array of stop words", () => {
      const filter = ["this", "is", "the", "for"];
      const input = "this is what the title case function is for";
      // first and last words are always capitalized
      const expected = "This is What the Title Case Function is For";

      assertEquals(toTitleCase(input, { filter }), expected);
    });

    await t.step("with custom filter function", () => {
      const filter: WordFilter = ({ segment }) => segment.length > 3;
      const input = "here are some words that are longer than three letters";
      const expected = "Here are Some Words That are Longer Than Three Letters";

      assertEquals(toTitleCase(input, { filter }), expected);
    });
  });
});
