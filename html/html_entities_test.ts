// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { decodeHtmlEntities, encodeHtmlEntities } from "./html_entities.ts";
import { assertEquals } from "../testing/asserts.ts";
import entityList from "https://html.spec.whatwg.org/entities.json" assert {
  type: "json",
};

Deno.test("encodeHtmlEntities", async (t) => {
  await t.step("handles &<>'\"", () => {
    assertEquals(encodeHtmlEntities("&<>'\""), "&amp;&lt;&gt;&#39;&quot;");
  });
  await t.step("leaves characters that don't need to be encoded alone", () => {
    assertEquals(encodeHtmlEntities("þð"), "þð");
  });
});

Deno.test("decodeHtmlEntities", async (t) => {
  await t.step("default options", async (t) => {
    await t.step("handles &<>'\"", () => {
      assertEquals(decodeHtmlEntities("&amp;&lt;&gt;&#39;&quot;"), "&<>'\"");
    });
    await t.step("handles &apos; as alias for ' &#39;", () => {
      assertEquals(decodeHtmlEntities("&amp;&lt;&gt;&apos;&quot;"), "&<>'\"");
    });
    await t.step("handles hex", () => {
      assertEquals(decodeHtmlEntities("&#x41;"), "A");
    });
    await t.step("handles dec", () => {
      assertEquals(decodeHtmlEntities("&#65;"), "A");
    });
    await t.step("handles max hex codepoint", () => {
      assertEquals(decodeHtmlEntities("&#x10ffff;"), "\u{10ffff}");
    });
    await t.step("handles max dec codepoint", () => {
      assertEquals(decodeHtmlEntities("&#1114111;"), "\u{10ffff}");
    });
    await t.step("handles invalid hex codepoint", () => {
      assertEquals(decodeHtmlEntities("&#x110000;"), "�");
    });
    await t.step("handles invalid dec codepoint", () => {
      assertEquals(decodeHtmlEntities("&#1114112;"), "�");
    });
    await t.step("leaves other named entities untouched", () => {
      assertEquals(decodeHtmlEntities("&thorn;&eth;"), "&thorn;&eth;");
    });
  });
  await t.step("imported full entity list", async (t) => {
    await t.step("handles named entities", () => {
      assertEquals(decodeHtmlEntities("&thorn;&eth;", { entityList }), "þð");
    });
    await t.step("handles malformed (truncated) named entities", () => {
      assertEquals(decodeHtmlEntities("&amp", { entityList }), "&");
    });
    await t.step(
      "consumes full named entities even when an alternative truncated version is specified",
      () => {
        assertEquals(decodeHtmlEntities("&amp;", { entityList }), "&");
      },
    );
  });
});
