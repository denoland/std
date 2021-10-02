// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import * as url from "./url.ts";
import { isWindows } from "../_util/os.ts";

Deno.test({
  name: "[url] URL",
  fn() {
    assertEquals(url.URL, URL);
  },
});

// todo(wafuwafu13) Add Windows and invalid case

Deno.test({
  ignore: isWindows,
  name: "fileURLToPath",
  fn() {
    // Lowercase ascii alpha
    assertEquals(url.fileURLToPath("file:///foo"), "/foo");
    // Uppercase ascii alpha
    assertEquals(url.fileURLToPath("file:///Foo"), "/Foo");
    // dir
    assertEquals(url.fileURLToPath("file:///dir/foo"), "/dir/foo");
    // trailing separator
    assertEquals(url.fileURLToPath("file:///dir/"), "/dir/");
    // dot
    assertEquals(url.fileURLToPath("file:///foo.mjs"), "/foo.mjs");
    // space
    assertEquals(url.fileURLToPath("file:///foo%20bar"), "/foo bar");
    // question mark
    assertEquals(url.fileURLToPath("file:///foo%3Fbar"), "/foo?bar");
    // number sign
    assertEquals(url.fileURLToPath("file:///foo%23bar"), "/foo#bar");
    // ampersand
    assertEquals(url.fileURLToPath("file:///foo&bar"), "/foo&bar");
    // equals
    assertEquals(url.fileURLToPath("file:///foo=bar"), "/foo=bar");
    // colon
    assertEquals(url.fileURLToPath("file:///foo:bar"), "/foo:bar");
    // semicolon
    assertEquals(url.fileURLToPath("file:///foo;bar"), "/foo;bar");
    // percent
    assertEquals(url.fileURLToPath("file:///foo%25bar"), "/foo%bar");
    // backslash
    assertEquals(url.fileURLToPath("file:///foo%5Cbar"), "/foo\\bar");
    // backspace
    assertEquals(url.fileURLToPath("file:///foo%08bar"), "/foo\bbar");
    // tab
    assertEquals(url.fileURLToPath("file:///foo%09bar"), "/foo\tbar");
    // newline
    assertEquals(url.fileURLToPath("file:///foo%0Abar"), "/foo\nbar");
    // carriage return
    assertEquals(url.fileURLToPath("file:///foo%0Dbar"), "/foo\rbar");
    // latin1
    assertEquals(url.fileURLToPath("file:///f%C3%B3%C3%B3b%C3%A0r"), "/fóóbàr");
    // Euro sign (BMP code point)
    assertEquals(url.fileURLToPath("file:///%E2%82%AC"), "/€");
    // Deno emoji (non-BMP code point)
    assertEquals(url.fileURLToPath("file:///%F0%9F%A6%95"), "/🦕");
  },
});

Deno.test({
  ignore: isWindows,
  name: "pathToFileURL",
  fn() {
    // Lowercase ascii alpha
    assertEquals(url.pathToFileURL("/foo").href, "file:///foo");
    // Uppercase ascii alpha
    assertEquals(url.pathToFileURL("/Foo").href, "file:///Foo");
    // dir
    assertEquals(url.pathToFileURL("/dir/foo").href, "file:///dir/foo");
    // trailing separator
    assertEquals(url.pathToFileURL("/dir/").href, "file:///dir/");
    // dot
    assertEquals(url.pathToFileURL("/foo.mjs").href, "file:///foo.mjs");
    // space
    assertEquals(url.pathToFileURL("/foo bar").href, "file:///foo%20bar");
    // question mark
    assertEquals(url.pathToFileURL("/foo?bar").href, "file:///foo%3Fbar");
    // // number sign
    assertEquals(url.pathToFileURL("/foo#bar").href, "file:///foo%23bar");
    // ampersand
    assertEquals(url.pathToFileURL("/foo&bar").href, "file:///foo&bar");
    // equals
    assertEquals(url.pathToFileURL("/foo=bar").href, "file:///foo=bar");
    // colon
    assertEquals(url.pathToFileURL("/foo:bar").href, "file:///foo:bar");
    // semicolon
    assertEquals(url.pathToFileURL("/foo;bar").href, "file:///foo;bar");
    // percent
    assertEquals(url.pathToFileURL("/foo%bar").href, "file:///foo%25bar");
    // backslash
    assertEquals(url.pathToFileURL("/foo\\bar").href, "file:///foo%5Cbar");
    // backspace
    assertEquals(url.pathToFileURL("/foo\bbar").href, "file:///foo%08bar");
    // tab
    assertEquals(url.pathToFileURL("/foo\tbar").href, "file:///foo%09bar");
    // newline
    assertEquals(url.pathToFileURL("/foo\nbar").href, "file:///foo%0Abar");
    // carriage return
    assertEquals(url.pathToFileURL("/foo\rbar").href, "file:///foo%0Dbar");
    // latin1
    assertEquals(
      url.pathToFileURL("/fóóbàr").href,
      "file:///f%C3%B3%C3%B3b%C3%A0r",
    );
    // Euro sign (BMP code point)
    assertEquals(url.pathToFileURL("/€").href, "file:///%E2%82%AC");
    // Deno emoji (non-BMP code point)
    assertEquals(url.pathToFileURL("/🦕").href, "file:///%F0%9F%A6%95");
  },
});
