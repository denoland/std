// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "../testing/asserts.ts";

import { calculate, ifMatch, ifNoneMatch } from "./etag.ts";

const encoder = new TextEncoder();

Deno.test({
  name: "etag - calculate - string - empty",
  async fn() {
    const actual = await calculate("");
    assertEquals(actual, `"811c9dc5"`);
  },
});

Deno.test({
  name: "etag - calculate - string",
  async fn() {
    const actual = await calculate("hello deno");
    assertEquals(actual, `"a196f44d"`);
  },
});

Deno.test({
  name: "etag - calculate - Uint8Array - empty",
  async fn() {
    const actual = await calculate(new Uint8Array());
    assertEquals(actual, `"811c9dc5"`);
  },
});

Deno.test({
  name: "etag - calculate - Uint8Array",
  async fn() {
    const actual = await calculate(encoder.encode("hello deno"));
    assertEquals(actual, `"a196f44d"`);
  },
});

Deno.test({
  name: "etag - calculate - Deno.FileInfo",
  async fn() {
    const fixture: Deno.FileInfo = {
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      size: 1024,
      mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
      atime: null,
      birthtime: null,
      dev: null,
      ino: null,
      mode: null,
      nlink: null,
      uid: null,
      gid: null,
      rdev: null,
      blksize: null,
      blocks: null,
    };
    const actual = await calculate(fixture);
    assertEquals(actual, `W/"673fdf71"`);
  },
});

Deno.test({
  name: "etag - ifMatch",
  async fn() {
    assert(!ifMatch(`"abcdefg"`, await calculate("hello deno")));
    assert(ifMatch(`"a196f44d"`, await calculate("hello deno")));
    assert(
      ifMatch(`"abcdefg", "a196f44d"`, await calculate("hello deno")),
    );
    assert(ifMatch("*", await calculate("hello deno")));
    assert(
      !ifMatch(
        "*",
        await calculate({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
  },
});

Deno.test({
  name: "etag - ifNoneMatch",
  async fn() {
    assert(ifNoneMatch(`"abcdefg"`, await calculate("hello deno")));
    assert(!ifNoneMatch(`"a196f44d"`, await calculate("hello deno")));
    assert(
      !ifNoneMatch(
        `"abcdefg", "a196f44d"`,
        await calculate("hello deno"),
      ),
    );
    assert(!ifNoneMatch("*", await calculate("hello deno")));
    assert(
      !ifNoneMatch(
        `W/"673fdf71"`,
        await calculate({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
    assert(
      !ifNoneMatch(
        `"673fdf71"`,
        await calculate({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
  },
});
