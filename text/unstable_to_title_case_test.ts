// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertGreater } from "@std/assert";
import { toTitleCase } from "./unstable_to_title_case.ts";
import type {
  ExcludeWordConfig,
  ExcludeWordFilter,
} from "./unstable_to_title_case.ts";
import { stubIntlFunctions } from "./_test_util.ts";

Deno.test("toTitleCase() converts a string to title case", async (t) => {
  const input = "hello world";
  assertEquals(toTitleCase(input), "Hello World");

  await t.step("context sensitivity", () => {
    assertEquals(toTitleCase("ΩΣ"), "Ως");
    assertEquals(toTitleCase("ΩΣΣ"), "Ωσς");
  });
});

Deno.test("toTitleCase() respects special title-case mappings", async (t) => {
  await t.step("ligatures", () => {
    const input = "ﬆrange ﬂoating aﬃrmation";
    const expected = "Strange Floating Aﬃrmation";
    assertEquals(toTitleCase(input), expected);
  });

  // https://gist.github.com/srl295/1d9603ecfbcae55a08b04e9cd925d349
  await t.step("Georgian", () => {
    const amdeni = "ამდენი";
    assertEquals(toTitleCase(amdeni), amdeni); // unchanged
  });
});

Deno.test("toTitleCase() works with punctuation", () => {
  const input = "“hello, world!”";
  assertEquals(toTitleCase(input), "“Hello, World!”");
});

Deno.test("toTitleCase() works with non-BMP code points", () => {
  const input = "𐓷𐓘𐓻𐓘𐓻𐓟 𐓣𐓟";
  assertGreater(input.codePointAt(0)!, 0xffff);
  assertEquals(toTitleCase(input), "𐓏𐓘𐓻𐓘𐓻𐓟 𐒻𐓟");
});

Deno.test("toTitleCase() can be customized with options", async (t) => {
  await t.step("`trailingCase`", async (t) => {
    const input = "HELLO wOrLd";

    await t.step('defaults to "lower"', () => {
      assertEquals(toTitleCase(input), "Hello World");
    });

    await t.step('explicitly passing "lower"', () => {
      assertEquals(
        toTitleCase(input, { trailingCase: "lower" }),
        "Hello World",
      );
    });

    await t.step('enabled by passing "unchanged"', () => {
      assertEquals(
        toTitleCase(input, { trailingCase: "unchanged" }),
        "HELLO WOrLd",
      );
    });
  });

  await t.step("`locale`", async (t) => {
    const input = "irrIgation";

    await t.step('defaults to `false`, using locale-agnostic "und"', () => {
      using _ = stubIntlFunctions("tr-TR");
      assertEquals(toTitleCase(input), "Irrigation");
    });

    await t.step("`true` uses system-default locale", () => {
      using _ = stubIntlFunctions("tr-TR");
      assertEquals(toTitleCase(input, { locale: true }), "İrrıgation");
    });

    await t.step("supports passing a specific locale", () => {
      using _ = stubIntlFunctions("en-US");
      assertEquals(toTitleCase(input, { locale: "tr-TR" }), "İrrıgation");
    });
  });

  await t.step("`exclude`", async (t) => {
    await t.step("with array of stop words", () => {
      const exclude = ["this", "is", "the", "for"];
      const input = "this is what the title case function is for";
      // first and last words are always capitalized
      const expected = "This is What the Title Case Function is For";

      assertEquals(toTitleCase(input, { exclude }), expected);
    });

    await t.step("with custom filter function", () => {
      const exclude: ExcludeWordFilter = ({ segment }) => segment.length <= 3;
      const input = "here are some words that are longer than three letters";
      const expected = "Here are Some Words That are Longer Than Three Letters";

      assertEquals(toTitleCase(input, { exclude }), expected);
    });

    await t.step("with multiple filters", () => {
      const exclude: ExcludeWordConfig = [
        ({ segment }) => /[\p{Lu}\p{Lt}]/u.test(segment),
        ["this", "and"],
      ];

      const input =
        "this title contains camelCase, PascalCase, and UPPERCASE words";
      const expected =
        "This Title Contains camelCase, PascalCase, and UPPERCASE Words";

      assertEquals(
        toTitleCase(input, { exclude, trailingCase: "unchanged" }),
        expected,
      );
    });
  });
});
