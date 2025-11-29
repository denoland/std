// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { assertType, type IsExact } from "@std/testing/types";

import { eTag, ifMatch, ifNoneMatch } from "./etag.ts";

const encoder = new TextEncoder();

Deno.test({
  name: "eTag() handles empty string",
  async fn() {
    const actual = await eTag("");
    assertEquals(actual, `"0-47DEQpj8HBSa+/TImW+5JCeuQeR"`);
  },
});

Deno.test({
  name: "eTag() handles string",
  async fn() {
    const actual = await eTag("hello deno");
    assertEquals(actual, `"a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`);
  },
});

Deno.test({
  name: "eTag() handles empty Uint8Array",
  async fn() {
    const actual = await eTag(new Uint8Array());
    assertEquals(actual, `"0-47DEQpj8HBSa+/TImW+5JCeuQeR"`);
  },
});

Deno.test({
  name: "eTag() handles Uint8Array",
  async fn() {
    const actual = await eTag(encoder.encode("hello deno"));
    assertEquals(actual, `"a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`);
  },
});

Deno.test({
  name: "eTag() handles Deno.FileInfo",
  async fn() {
    const fixture = {
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      size: 1024,
      mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
      atime: null,
      ctime: null,
      birthtime: null,
      dev: 0,
      ino: null,
      mode: null,
      nlink: null,
      uid: null,
      gid: null,
      rdev: null,
      blksize: null,
      blocks: null,
      isBlockDevice: null,
      isCharDevice: null,
      isFifo: null,
      isSocket: null,
    };
    const actual = await eTag(fixture);
    assertEquals(actual, `W/"400-H0YzXysQPV20qNisAZMuvAEVuHV"`);
  },
});

Deno.test({
  name: "ifMatch()",
  async fn() {
    assert(!ifMatch(`"abcdefg"`, await eTag("hello deno")));
    assert(
      ifMatch(`"a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`, await eTag("hello deno")),
    );
    assert(
      ifMatch(
        `"abcdefg", "a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`,
        await eTag("hello deno"),
      ),
    );
    assert(ifMatch("*", await eTag("hello deno")));
    assert(
      !ifMatch(
        "*",
        await eTag({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
  },
});

Deno.test({
  name: "ifNoneMatch()",
  async fn() {
    assert(ifNoneMatch(`"abcdefg"`, await eTag("hello deno")));
    assert(
      !ifNoneMatch(
        `"a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`,
        await eTag("hello deno"),
      ),
    );
    assert(
      !ifNoneMatch(
        `"abcdefg", "a-YdfmHmj2RiwOVqJupcf3PLK9PuJ"`,
        await eTag("hello deno"),
      ),
    );
    assert(!ifNoneMatch("*", await eTag("hello deno")));
    assert(
      !ifNoneMatch(
        `W/"400-H0YzXysQPV20qNisAZMuvAEVuHV"`,
        await eTag({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
    assert(
      !ifNoneMatch(
        `"400-H0YzXysQPV20qNisAZMuvAEVuHV"`,
        await eTag({
          size: 1024,
          mtime: new Date(Date.UTC(96, 1, 2, 3, 4, 5, 6)),
        }),
      ),
    );
  },
});

Deno.test({
  name: "eTag() returns string type for string and Uint8Array",
  async fn() {
    {
      const result = await eTag("hello deno");
      assertType<IsExact<typeof result, string>>(true);
    }
    {
      const result = await eTag(new Uint8Array());
      assertType<IsExact<typeof result, string>>(true);
    }
  },
});

Deno.test({
  name: "eTag() returns undefined when calcFileInfo returns undefined",
  async fn() {
    {
      const result = await eTag({
        mtime: null,
        size: 1024,
      });

      assert(result === undefined);
    }
  },
});
