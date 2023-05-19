// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { decode, encode } from "./entities.ts";
import { assertEquals } from "../testing/asserts.ts";
import entityList from "./named_entity_list.json" assert {
  type: "json",
};

Deno.test("encode", async (t) => {
  await t.step("handles &<>'\"", () => {
    assertEquals(encode("&<>'\""), "&amp;&lt;&gt;&#39;&quot;");
  });
  await t.step("leaves characters that don't need to be encoded alone", () => {
    assertEquals(encode("þð"), "þð");
  });
});

Deno.test("decode", async (t) => {
  await t.step("default options", async (t) => {
    await t.step("handles &<>'\"", () => {
      assertEquals(decode("&amp;&lt;&gt;&#39;&quot;"), "&<>'\"");
    });
    await t.step("handles &apos; as alias for ' &#39;", () => {
      assertEquals(decode("&amp;&lt;&gt;&apos;&quot;"), "&<>'\"");
    });
    await t.step("handles hex", () => {
      assertEquals(decode("&#x41;"), "A");
    });
    await t.step("handles dec", () => {
      assertEquals(decode("&#65;"), "A");
    });
    await t.step("handles max hex codepoint", () => {
      assertEquals(decode("&#x10ffff;"), "\u{10ffff}");
    });
    await t.step("handles max dec codepoint", () => {
      assertEquals(decode("&#1114111;"), "\u{10ffff}");
    });
    await t.step("handles invalid hex codepoint", () => {
      assertEquals(decode("&#x110000;"), "�");
    });
    await t.step("handles invalid dec codepoint", () => {
      assertEquals(decode("&#1114112;"), "�");
    });
    await t.step("leaves other named entities untouched", () => {
      assertEquals(decode("&thorn;&eth;"), "&thorn;&eth;");
    });
  });
  await t.step("imported full entity list", async (t) => {
    await t.step("handles named entities", () => {
      assertEquals(decode("&thorn;&eth;", { entityList }), "þð");
    });
    await t.step("handles malformed (truncated) named entities", () => {
      assertEquals(decode("&amp", { entityList }), "&");
    });
    await t.step(
      "consumes full named entities even when an alternative truncated version is specified",
      () => {
        assertEquals(decode("&amp;", { entityList }), "&");
      },
    );
  });
});
