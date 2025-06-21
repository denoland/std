// Copyright 2018-2025 the Deno authors. MIT license.
import { longestCommonPrefix } from "./unstable_longest_common_prefix.ts";
import { assertEquals, assertGreater } from "@std/assert";

Deno.test(longestCommonPrefix.name, async (t) => {
  await t.step("0 strings", () => {
    assertEquals(longestCommonPrefix([]), "");
  });
  await t.step("1 string", () => {
    assertEquals(longestCommonPrefix([""]), "");
    assertEquals(longestCommonPrefix(["abc"]), "abc");
  });

  await t.step("2 strings", () => {
    assertEquals(longestCommonPrefix(["a", "b"]), "");
    assertEquals(longestCommonPrefix(["flower", "flow"]), "flow");
  });

  await t.step("> 2 strings", () => {
    assertEquals(longestCommonPrefix(["flower", "flow", "flight"]), "fl");
    assertEquals(longestCommonPrefix(["flower", "glow", "flight"]), "");
  });

  await t.step("surrogate pairs", async (t) => {
    const poop = "💩";
    const dizzy = "💫";
    assertGreater(poop.codePointAt(0)!, 0xffff);
    assertEquals(poop[0]!, dizzy[0]!);

    await t.step("well-formed", () => {
      assertEquals(longestCommonPrefix([poop, dizzy]), "");
      assertEquals(longestCommonPrefix([poop, ""]), "");
      assertEquals(longestCommonPrefix([`a${poop}`, `a${dizzy}`]), "a");
    });

    await t.step("lone surrogates", () => {
      const surr = poop[0]!;

      assertEquals(longestCommonPrefix([poop, surr]), "");
      assertEquals(longestCommonPrefix([`a${poop}`, `a${surr}`]), "a");

      assertEquals(longestCommonPrefix([surr, surr]), surr);
      assertEquals(longestCommonPrefix([surr, ""]), "");
      assertEquals(longestCommonPrefix([`a${surr}`, `a${surr}`]), `a${surr}`);
      assertEquals(longestCommonPrefix([`a${surr}b`, `a${surr}c`]), `a${surr}`);
    });
  });
});
