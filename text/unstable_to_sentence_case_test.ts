// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { toSentenceCase } from "./unstable_to_sentence_case.ts";
import { stubLocaleCaseFunctions } from "./_test_util.ts";

Deno.test("toSentenceCase() converts a string to title case", () => {
  const input = "hello world";
  assertEquals(toSentenceCase(input), "Hello world");
});

Deno.test("toSentenceCase() respects special title-case mappings", () => {
  const input = "ﬆrange ﬂoating aﬃrmation";
  const expected = "Strange ﬂoating aﬃrmation";
  assertEquals(toSentenceCase(input), expected);
});

Deno.test("toSentenceCase() works with wrapping punctuation", () => {
  const input = "“hello world”";
  assertEquals(toSentenceCase(input), "“Hello world”");
});

Deno.test("toSentenceCase() can be customized with options", async (t) => {
  await t.step("`force`", async (t) => {
    const input = "HELLO wOrLd";

    await t.step("defaults to `true`", () => {
      assertEquals(toSentenceCase(input), "Hello world");
    });

    await t.step("explicitly passing `true`", () => {
      assertEquals(toSentenceCase(input, { force: true }), "Hello world");
    });

    await t.step("disabled by passing `false`", () => {
      assertEquals(toSentenceCase(input, { force: false }), "HELLO wOrLd");
    });
  });

  await t.step("`locale`", async (t) => {
    const input = "irrIgation";

    await t.step('defaults to `false`, using locale-agnostic "und"', () => {
      using _ = stubLocaleCaseFunctions("tr-TR");
      assertEquals(toSentenceCase(input), "Irrigation");
    });

    await t.step("`true` uses system-default locale", () => {
      using _ = stubLocaleCaseFunctions("tr-TR");
      assertEquals(toSentenceCase(input, { locale: true }), "İrrıgation");
    });

    await t.step("supports passing a specific locale", () => {
      using _ = stubLocaleCaseFunctions("en-US");
      assertEquals(toSentenceCase(input, { locale: "tr-TR" }), "İrrıgation");
    });
  });
});

Deno.test("toSentenceCase() leaves later words lower-case even if the first word is case-agnostic", () => {
  const input = "文字 word";
  assertEquals(toSentenceCase(input), input);
});
