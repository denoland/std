// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";
import {
  type CacheControl,
  formatCacheControl,
  parseCacheControl,
  type RequestCacheControl,
  type ResponseCacheControl,
} from "./unstable_cache_control.ts";

Deno.test("parseCacheControl() returns empty object for null", () => {
  assertEquals(parseCacheControl(null), {});
});

Deno.test("parseCacheControl() returns empty object for empty string", () => {
  assertEquals(parseCacheControl(""), {});
  assertEquals(parseCacheControl("   "), {});
});

Deno.test("parseCacheControl() parses single boolean directive", () => {
  assertEquals(parseCacheControl("no-store"), { noStore: true });
  assertEquals(parseCacheControl("no-cache"), { noCache: true });
  assertEquals(parseCacheControl("public"), { public: true });
  assertEquals(parseCacheControl("immutable"), { immutable: true });
});

Deno.test("parseCacheControl() parses single valued directive", () => {
  assertEquals(parseCacheControl("max-age=3600"), { maxAge: 3600 });
  assertEquals(parseCacheControl("s-maxage=0"), { sMaxage: 0 });
  assertEquals(parseCacheControl("stale-while-revalidate=60"), {
    staleWhileRevalidate: 60,
  });
});

Deno.test("parseCacheControl() parses multiple directives", () => {
  assertEquals(
    parseCacheControl("max-age=300, private, must-revalidate"),
    { maxAge: 300, private: true, mustRevalidate: true },
  );
});

Deno.test("parseCacheControl() parses no-cache with field names", () => {
  assertEquals(parseCacheControl('no-cache="foo"'), { noCache: ["foo"] });
  assertEquals(parseCacheControl('no-cache="foo, bar"'), {
    noCache: ["foo", "bar"],
  });
});

Deno.test("parseCacheControl() parses private with field names", () => {
  assertEquals(parseCacheControl('private="x-custom"'), {
    private: ["x-custom"],
  });
});

Deno.test("parseCacheControl() parses max-stale with and without value", () => {
  assertEquals(parseCacheControl("max-stale"), { maxStale: true });
  assertEquals(parseCacheControl("max-stale=120"), { maxStale: 120 });
});

Deno.test("parseCacheControl() is case insensitive", () => {
  assertEquals(parseCacheControl("NO-STORE"), { noStore: true });
  assertEquals(parseCacheControl("Max-Age=100"), { maxAge: 100 });
});

Deno.test("parseCacheControl() ignores unknown directives", () => {
  assertEquals(parseCacheControl("no-store, unknown=1, no-cache"), {
    noStore: true,
    noCache: true,
  });
});

Deno.test("parseCacheControl() throws on malformed numeric value", () => {
  assertThrows(
    () => parseCacheControl("max-age=abc"),
    SyntaxError,
    "invalid value",
  );
  assertThrows(
    () => parseCacheControl("max-age=-1"),
    SyntaxError,
    "invalid value",
  );
  assertThrows(
    () => parseCacheControl("s-maxage=1.5"),
    SyntaxError,
    "invalid value",
  );
});

Deno.test("parseCacheControl() throws when valued directive has no value", () => {
  assertThrows(
    () => parseCacheControl("max-age"),
    SyntaxError,
    "requires an integer value",
  );
  assertThrows(
    () => parseCacheControl("stale-while-revalidate"),
    SyntaxError,
    "requires an integer value",
  );
});

Deno.test("formatCacheControl() returns empty string for empty object", () => {
  assertEquals(formatCacheControl({}), "");
});

Deno.test("formatCacheControl() serializes boolean directives", () => {
  assertEquals(formatCacheControl({ noStore: true }), "no-store");
  assertEquals(
    formatCacheControl({ noStore: true, noTransform: true }),
    "no-store, no-transform",
  );
});

Deno.test("formatCacheControl() serializes valued directives", () => {
  assertEquals(formatCacheControl({ maxAge: 3600 }), "max-age=3600");
  assertEquals(
    formatCacheControl({ maxAge: 0, sMaxage: 100 }),
    "max-age=0, s-maxage=100",
  );
});

Deno.test("formatCacheControl() serializes no-cache and private with field names", () => {
  assertEquals(
    formatCacheControl({ noCache: ["foo", "bar"] }),
    'no-cache="foo, bar"',
  );
  assertEquals(
    formatCacheControl({ private: ["x-custom"] }),
    'private="x-custom"',
  );
});

Deno.test("formatCacheControl() round-trip", () => {
  const value =
    "max-age=300, private, must-revalidate, stale-while-revalidate=60";
  const parsed = parseCacheControl(value);
  const formatted = formatCacheControl(parsed);
  const reparsed = parseCacheControl(formatted);
  assertEquals(parsed, reparsed);
  assertEquals(
    formatted,
    "max-age=300, private, must-revalidate, stale-while-revalidate=60",
  );
});

Deno.test("formatCacheControl() throws on negative number", () => {
  assertThrows(
    () => formatCacheControl({ maxAge: -1 }),
    RangeError,
    "non-negative integer",
  );
});

Deno.test("formatCacheControl() throws on NaN", () => {
  assertThrows(
    () => formatCacheControl({ maxAge: NaN }),
    RangeError,
    "non-negative integer",
  );
});

Deno.test("parseCacheControl() parses min-fresh", () => {
  assertEquals(parseCacheControl("min-fresh=30"), { minFresh: 30 });
});

Deno.test("parseCacheControl() throws when min-fresh has no value", () => {
  assertThrows(
    () => parseCacheControl("min-fresh"),
    SyntaxError,
    "requires an integer value",
  );
});

Deno.test("parseCacheControl() parses stale-if-error", () => {
  assertEquals(parseCacheControl("stale-if-error=300"), {
    staleIfError: 300,
  });
});

Deno.test("parseCacheControl() throws when stale-if-error has no value", () => {
  assertThrows(
    () => parseCacheControl("stale-if-error"),
    SyntaxError,
    "requires an integer value",
  );
});

Deno.test("parseCacheControl() throws when s-maxage has no value", () => {
  assertThrows(
    () => parseCacheControl("s-maxage"),
    SyntaxError,
    "requires an integer value",
  );
});

Deno.test("parseCacheControl() parses no-transform", () => {
  assertEquals(parseCacheControl("no-transform"), { noTransform: true });
});

Deno.test("parseCacheControl() parses only-if-cached", () => {
  assertEquals(parseCacheControl("only-if-cached"), { onlyIfCached: true });
});

Deno.test("parseCacheControl() parses must-understand", () => {
  assertEquals(parseCacheControl("must-understand"), {
    mustUnderstand: true,
  });
});

Deno.test("parseCacheControl() parses proxy-revalidate", () => {
  assertEquals(parseCacheControl("proxy-revalidate"), {
    proxyRevalidate: true,
  });
});

Deno.test("parseCacheControl() uses first occurrence for duplicate directives", () => {
  assertEquals(parseCacheControl("max-age=100, max-age=200"), { maxAge: 100 });
});

Deno.test("parseCacheControl() clamps values above 2^31 to 2147483648", () => {
  assertEquals(parseCacheControl("max-age=9999999999"), {
    maxAge: 2_147_483_648,
  });
});

Deno.test("formatCacheControl() clamps values above 2^31 to 2147483648", () => {
  assertEquals(
    formatCacheControl({ maxAge: 9_999_999_999 }),
    "max-age=2147483648",
  );
});

Deno.test("formatCacheControl() serializes empty array as bare directive", () => {
  assertEquals(formatCacheControl({ noCache: [] }), "no-cache");
  assertEquals(formatCacheControl({ private: [] }), "private");
});

Deno.test("formatCacheControl() serializes max-stale boolean", () => {
  assertEquals(formatCacheControl({ maxStale: true }), "max-stale");
});

Deno.test("formatCacheControl() serializes max-stale with value", () => {
  assertEquals(formatCacheControl({ maxStale: 120 }), "max-stale=120");
});

Deno.test("formatCacheControl() serializes all response directives", () => {
  assertEquals(
    formatCacheControl({
      maxAge: 300,
      noCache: true,
      noStore: true,
      noTransform: true,
      sMaxage: 600,
      private: true,
      public: true,
      mustRevalidate: true,
      proxyRevalidate: true,
      mustUnderstand: true,
      immutable: true,
      staleWhileRevalidate: 60,
      staleIfError: 300,
    }),
    "max-age=300, no-cache, no-store, no-transform, s-maxage=600, private, public, must-revalidate, proxy-revalidate, must-understand, immutable, stale-while-revalidate=60, stale-if-error=300",
  );
});

Deno.test("parseCacheControl() splits correctly when quotes contain commas", () => {
  assertEquals(
    parseCacheControl('no-cache="foo, bar", max-age=60'),
    { noCache: ["foo", "bar"], maxAge: 60 },
  );
});

Deno.test("parseCacheControl() parses private with unquoted value", () => {
  assertEquals(parseCacheControl("private=foo"), { private: ["foo"] });
});

Deno.test("parseCacheControl() handles trailing and leading commas", () => {
  assertEquals(parseCacheControl(",no-store,"), { noStore: true });
});

Deno.test("parseCacheControl() return type is CacheControl", () => {
  const cc = parseCacheControl("no-store");
  assertType<IsExact<typeof cc, CacheControl>>(true);
});

Deno.test("formatCacheControl() accepts RequestCacheControl and ResponseCacheControl", () => {
  const req: RequestCacheControl = { maxStale: true, noStore: true };
  const res: ResponseCacheControl = { maxAge: 3600, public: true };
  formatCacheControl(req);
  formatCacheControl(res);
  assertType<
    IsExact<
      Parameters<typeof formatCacheControl>[0],
      RequestCacheControl | ResponseCacheControl
    >
  >(true);
});
