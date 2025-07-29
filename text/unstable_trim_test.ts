// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { trim, trimEnd, trimStart } from "./unstable_trim.ts";

Deno.test("trim()", async (t) => {
  await t.step("empty patterns - no-op", () => {
    assertEquals(trimStart("abc", ""), "abc");
    assertEquals(trimStart("abc", [""]), "abc");
    assertEquals(trimStart("abc", /(?:)/), "abc");
  });

  await t.step("trims both prefixes and suffixes", () => {
    assertEquals(trim("/pathname/", "/"), "pathname");
  });

  await t.step("trims both prefixes and suffixes by regex pattern", () => {
    assertEquals(trim("abc", /[abc]/), "");
    assertEquals(trim("xbx", /[abc]/), "xbx");

    assertEquals(
      trim("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "Seguro que no",
    );
  });
});

Deno.test("trimStart()", async (t) => {
  await t.step("trims a prefix", () => {
    assertEquals(trimStart("/pathname/", "/"), "pathname/");
  });

  await t.step("prefix is based on iterated members of input", async (t) => {
    await t.step("chars of string", () => {
      assertEquals(
        trimStart("https://sth.example.com", "https://"),
        ".example.com",
      );
    });
    await t.step("strings of string[]", () => {
      assertEquals(
        trimStart("https://sth.example.com", ["https://"]),
        "sth.example.com",
      );
    });
  });

  await t.step("trims prefixes by regex pattern", () => {
    assertEquals(trimStart("abc", /[ab]/), "c");
    assertEquals(trimStart("xbc", /[ab]/), "xbc");

    assertEquals(
      trimStart("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "Seguro que no?!",
    );
  });
});

Deno.test("trimEnd()", async (t) => {
  await t.step("trims a suffix", () => {
    assertEquals(trimEnd("/pathname/", "/"), "/pathname");
  });

  await t.step("trims suffixes by regex pattern", () => {
    assertEquals(trimEnd("abc", /[bc]/), "a");
    assertEquals(trimEnd("abx", /[bc]/), "abx");

    assertEquals(
      trimEnd("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "¡¿Seguro que no",
    );
  });
});
