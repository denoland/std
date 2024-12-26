// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
import { replaceBoth, replaceEnd, replaceStart } from "./unstable_replace.ts";

Deno.test("replaceStart()", async (t) => {
  await t.step("strips a prefix", () => {
    assertEquals(
      replaceStart("https://example.com", "https://", ""),
      "example.com",
    );
  });

  await t.step("replaces a prefix", () => {
    assertEquals(
      replaceStart("http://example.com", "http://", "https://"),
      "https://example.com",
    );
  });

  await t.step("no replacement if pattern not found", () => {
    assertEquals(
      replaceStart("file:///a/b/c", "http://", "https://"),
      "file:///a/b/c",
    );
  });

  await t.step("strips prefixes by regex pattern", () => {
    assertEquals(replaceStart("abc", /a|b/, ""), "bc");
    assertEquals(replaceStart("xbc", /a|b/, ""), "xbc");

    assertEquals(
      replaceStart("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]+/u, ""),
      "Seguro que no?!",
    );
  });

  await t.step("complex replacers", () => {
    assertEquals(replaceStart("abca", "a", "$'"), "bcabca");
    assertEquals(replaceStart("xbca", "a", "$'"), "xbca");

    assertEquals(replaceStart("abcxyz", /[a-c]+/, "<$&>"), "<abc>xyz");
    assertEquals(replaceStart("abcxyz", /([a-c]+)/, "<$1>"), "<abc>xyz");
    assertEquals(
      replaceStart("abcxyz", /(?<match>[a-c]+)/, "<$<match>>"),
      "<abc>xyz",
    );

    assertEquals(replaceStart("abcxyz", /[a-c]+/, (m) => `<${m}>`), "<abc>xyz");
    assertEquals(
      replaceStart("abcxyz", /([a-c]+)/, (_, p1) => `<${p1}>`),
      "<abc>xyz",
    );
    assertEquals(
      replaceStart("abcxyz", /(?<match>[a-c]+)/, (...args) =>
        `<${
          (args[
            args.findIndex((x) => typeof x === "number") + 2
          ] as { match: string }).match
        }>`),
      "<abc>xyz",
    );
  });
});

Deno.test("replaceEnd()", async (t) => {
  await t.step("strips a suffix", () => {
    assertEquals(replaceEnd("/pathname/", "/", ""), "/pathname");
  });

  await t.step("replaces a suffix", () => {
    assertEquals(replaceEnd("/pathname/", "/", "/?a=1"), "/pathname/?a=1");
  });

  await t.step("no replacement if pattern not found", () => {
    assertEquals(replaceEnd("/pathname", "/", "/?a=1"), "/pathname");
  });

  await t.step("strips suffixes by regex pattern", () => {
    assertEquals(replaceEnd("abc", /b|c/, ""), "ab");
    assertEquals(replaceEnd("abx", /b|c/, ""), "abx");

    assertEquals(
      replaceEnd("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]+/u, ""),
      "¡¿Seguro que no",
    );
  });

  await t.step("complex replacers", () => {
    assertEquals(replaceEnd("abca", "a", "$`"), "abcabc");
    assertEquals(replaceEnd("abcx", "a", "$`"), "abcx");

    assertEquals(replaceEnd("xyzabc", /[a-c]+/, "<$&>"), "xyz<abc>");
    assertEquals(replaceEnd("xyzabc", /([a-c]+)/, "<$1>"), "xyz<abc>");
    assertEquals(
      replaceEnd("xyzabc", /(?<match>[a-c]+)/, "<$<match>>"),
      "xyz<abc>",
    );

    assertEquals(replaceEnd("xyzabc", /[a-c]+/, (m) => `<${m}>`), "xyz<abc>");
    assertEquals(
      replaceEnd("xyzabc", /([a-c]+)/, (_, p1) => `<${p1}>`),
      "xyz<abc>",
    );
    assertEquals(
      replaceEnd("xyzabc", /(?<match>[a-c]+)/, (...args) =>
        `<${
          (args[
            args.findIndex((x) => typeof x === "number") + 2
          ] as { match: string }).match
        }>`),
      "xyz<abc>",
    );
  });
});

Deno.test("replaceBoth()", async (t) => {
  await t.step("strips both prefixes and suffixes", () => {
    assertEquals(replaceBoth("/pathname/", "/", ""), "pathname");
  });

  await t.step("replaces both prefixes and suffixes", () => {
    assertEquals(replaceBoth("/pathname/", "/", "!"), "!pathname!");
    assertEquals(replaceBoth("//pathname", /\/+/, "/"), "/pathname");
    assertEquals(replaceBoth("//pathname", /\/*/, "/"), "/pathname/");
  });

  await t.step("no replacement if pattern not found", () => {
    assertEquals(replaceBoth("pathname", "/", "!"), "pathname");
  });

  await t.step("strips both prefixes and suffixes by regex pattern", () => {
    assertEquals(replaceBoth("abc", /a|b|c/, ""), "b");
    assertEquals(replaceBoth("xbx", /a|b|c/, ""), "xbx");

    assertEquals(
      replaceBoth("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]+/u, ""),
      "Seguro que no",
    );
  });

  await t.step("complex replacers", () => {
    assertEquals(replaceBoth("abca", "a", "$$"), "$bc$");
    assertEquals(replaceBoth("xbcx", "a", "$$"), "xbcx");

    assertEquals(replaceBoth("abcxyzabc", /[a-c]+/, "<$&>"), "<abc>xyz<abc>");
    assertEquals(replaceBoth("abcxyzabc", /([a-c]+)/, "<$1>"), "<abc>xyz<abc>");
    assertEquals(
      replaceBoth("abcxyzabc", /(?<match>[a-c]+)/, "<$<match>>"),
      "<abc>xyz<abc>",
    );

    assertEquals(
      replaceBoth("abcxyzabc", /[a-c]+/, (m) => `<${m}>`),
      "<abc>xyz<abc>",
    );
    assertEquals(
      replaceBoth("abcxyzabc", /([a-c]+)/, (_, p1) => `<${p1}>`),
      "<abc>xyz<abc>",
    );
    assertEquals(
      replaceBoth("abcxyzabc", /(?<match>[a-c]+)/, (...args) =>
        `<${
          (args[
            args.findIndex((x) => typeof x === "number") + 2
          ] as { match: string }).match
        }>`),
      "<abc>xyz<abc>",
    );
  });
});
