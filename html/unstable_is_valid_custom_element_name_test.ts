// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { isValidCustomElementName } from "./unstable_is_valid_custom_element_name.ts";

const forbiddenCustomElementNames: string[] = [
  "annotation-xml",
  "color-profile",
  "font-face",
  "font-face-src",
  "font-face-uri",
  "font-face-format",
  "font-face-name",
  "missing-glyph",
] as const;

Deno.test("isValidCustomElementName()", async (t) => {
  await t.step("handles forbidden custom names", () => {
    forbiddenCustomElementNames.map((forbiddenName) => {
      assertEquals(isValidCustomElementName(forbiddenName), false);
    });
  });

  await t.step("handles custom names with upper cases", () => {
    assertEquals(isValidCustomElementName("Custom-element"), false);
  });

  await t.step("handles custom names with special chars", () => {
    assertEquals(isValidCustomElementName("custom-element@"), false);
  });

  await t.step("handles custom names with numbers", () => {
    assertEquals(isValidCustomElementName("custom-1-element"), true);
  });

  await t.step("handles custom names with underscores", () => {
    assertEquals(isValidCustomElementName("custom_element"), false);
  });

  await t.step("handles custom names with points", () => {
    assertEquals(isValidCustomElementName("custom.element"), false);
  });

  await t.step("handles valid custom names", () => {
    assertEquals(isValidCustomElementName("custom-element"), true);
  });

  await t.step("handles large variety of names", () => {
    assertEquals(isValidCustomElementName("math-α"), true);
    assertEquals(isValidCustomElementName("emotion-😍"), true);
    assertEquals(isValidCustomElementName("hieroglyph-𓀀"), true);
  });
});
