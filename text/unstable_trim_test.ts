// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { trimBy, trimEndBy, trimStartBy } from "./unstable_trim_by.ts";

Deno.test("trim()", async (t) => {
  await t.step("empty patterns - no-op", () => {
    assertEquals(trimStartBy("abc", ""), "abc");
    assertEquals(trimStartBy("abc", []), "abc");
    assertEquals(trimStartBy("abc", [""]), "abc");
    assertEquals(trimStartBy("abc", new Set()), "abc");
    assertEquals(trimStartBy("abc", /(?:)/), "abc");
  });

  await t.step("trims both prefixes and suffixes", () => {
    assertEquals(trimBy("/pathname/", "/"), "pathname");
    assertEquals(trimBy("/pathname/", ["/"]), "pathname");
  });

  await t.step("trims both prefixes and suffixes by regex pattern", () => {
    assertEquals(trimBy("abc", /[abc]/), "");
    assertEquals(trimBy("xbx", /[abc]/), "xbx");

    assertEquals(
      trimBy("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "Seguro que no",
    );
  });
});

Deno.test("trimStart()", async (t) => {
  await t.step("trims a prefix", () => {
    assertEquals(trimStartBy("/pathname/", "/"), "pathname/");
    assertEquals(trimStartBy("/pathname/", ["/"]), "pathname/");
  });

  await t.step("prefix is based on iterated members of input", async (t) => {
    await t.step("chars of string", () => {
      assertEquals(
        trimStartBy("https://sth.example.com", new Set("https://")),
        ".example.com",
      );
    });
    await t.step("scalar string", () => {
      assertEquals(
        trimStartBy("https://sth.example.com", "https://"),
        "sth.example.com",
      );
    });
    await t.step("strings of string[]", () => {
      assertEquals(
        trimStartBy("https://sth.example.com", ["https://"]),
        "sth.example.com",
      );
    });
  });

  await t.step("trims prefixes by regex pattern", () => {
    assertEquals(trimStartBy("abc", /[ab]/), "c");
    assertEquals(trimStartBy("xbc", /[ab]/), "xbc");

    assertEquals(
      trimStartBy("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "Seguro que no?!",
    );
  });
});

Deno.test("trimEnd()", async (t) => {
  await t.step("trims a suffix", () => {
    assertEquals(trimEndBy("/pathname/", "/"), "/pathname");
    assertEquals(trimEndBy("/pathname/", ["/"]), "/pathname");
  });

  await t.step("trims suffixes by regex pattern", () => {
    assertEquals(trimEndBy("abc", /[bc]/), "a");
    assertEquals(trimEndBy("abx", /[bc]/), "abx");

    assertEquals(
      trimEndBy("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u),
      "¡¿Seguro que no",
    );
  });
});
