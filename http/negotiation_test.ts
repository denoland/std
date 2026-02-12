// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { accepts, acceptsEncodings, acceptsLanguages } from "./negotiation.ts";
import { stub } from "@std/testing/mock";

Deno.test({
  name: "accepts() handles no args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: {
        "accept":
          "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8",
      },
    });
    assertEquals(accepts(req), [
      "text/html",
      "application/xhtml+xml",
      "image/webp",
      "application/xml",
      "*/*",
    ]);
  },
});

Deno.test({
  name: "accepts() handles args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: {
        "accept":
          "text/html, application/xhtml+xml, application/xml;q=0.9, image/webp, */*;q=0.8",
      },
    });
    assertEquals(accepts(req, "text/html", "image/webp"), "text/html");
  },
});

Deno.test({
  name: "accepts() handles no match",
  fn() {
    const req = new Request("https://example.com/", {
      headers: {
        "accept": "text/html, application/xhtml+xml, application/xml",
      },
    });
    assertEquals(accepts(req, "application/json"), undefined);
  },
});

Deno.test({
  name: "accepts() handles args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(accepts(req, "text/html", "image/webp"), "text/html");
  },
});

Deno.test({
  name: "accepts() handles no args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(accepts(req), ["*/*"]);
  },
});

Deno.test({
  name: "acceptsEncodings() handles no args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: { "accept-encoding": "deflate, gzip;q=1.0, *;q=0.5" },
    });
    assertEquals(acceptsEncodings(req), ["deflate", "gzip", "*"]);
  },
});

Deno.test({
  name: "acceptsEncodings() handles args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: { "accept-encoding": "deflate, gzip;q=1.0, *;q=0.5" },
    });
    assertEquals(acceptsEncodings(req, "gzip", "identity"), "gzip");
  },
});

Deno.test({
  name: "acceptsEncodings() handles no match",
  fn() {
    const req = new Request("https://example.com/", {
      headers: { "accept-encoding": "deflate, gzip" },
    });
    assertEquals(acceptsEncodings(req, "brotli"), undefined);
  },
});

Deno.test({
  name: "acceptsEncodings() handles args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(acceptsEncodings(req, "gzip", "identity"), "gzip");
  },
});

Deno.test({
  name: "acceptsEncodings() handles no args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(acceptsEncodings(req), ["*"]);
  },
});

Deno.test({
  name: "acceptsEncodings() is locale independent",
  fn() {
    const req = new Request("https://example.com/", {
      headers: { "accept-encoding": "GZIP" },
    });
    const encoding = "gzip";

    assertEquals(acceptsEncodings(req, encoding), encoding);

    {
      /**
       * Use of locale-sensitive methods with undefined locale may cause
       * environment-sensitive bugs -
       * [issue](https://github.com/denoland/std/issues/6016)
       */
      const toLocaleLowerCase = String.prototype.toLocaleLowerCase;
      using _ = stub(
        String.prototype,
        "toLocaleLowerCase",
        function (locale) {
          return toLocaleLowerCase.call(this, locale ?? "tr-TR");
        },
      );

      assertEquals(acceptsEncodings(req, encoding), encoding);
    }
  },
});

Deno.test({
  name: "acceptsLanguages() handles no args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: {
        "accept-language": "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
      },
    });
    assertEquals(acceptsLanguages(req), ["fr-CH", "fr", "en", "de", "*"]);
  },
});

Deno.test({
  name: "acceptsLanguages() handles args",
  fn() {
    const req = new Request("https://example.com/", {
      headers: {
        "accept-language": "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5",
      },
    });
    assertEquals(acceptsLanguages(req, "en-gb", "en-us", "en"), "en");
  },
});

Deno.test({
  name: "acceptsLanguages() handles no match",
  fn() {
    const req = new Request("https://example.com/", {
      headers: { "accept-language": "fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7" },
    });
    assertEquals(acceptsLanguages(req, "zh"), undefined);
  },
});

Deno.test({
  name: "acceptsLanguages() handles args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(acceptsLanguages(req, "en-gb", "en-us", "en"), "en-gb");
  },
});

Deno.test({
  name: "acceptsLanguages() handles no args and no header",
  fn() {
    const req = new Request("https://example.com/");
    assertEquals(acceptsLanguages(req), ["*"]);
  },
});
