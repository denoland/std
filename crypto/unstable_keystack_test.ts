// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals, assertThrows } from "@std/assert";

import { KeyStack } from "./unstable_keystack.ts";

Deno.test({
  name: "KeyStack() throws on empty keys",
  fn() {
    assertThrows(
      () => new KeyStack([]),
      TypeError,
      "keys must contain at least one value",
    );
  },
});

Deno.test({
  name: "keyStack.sign() handles single key",
  async fn() {
    const keys = ["hello"];
    const keyStack = new KeyStack(keys);
    const actual = await keyStack.sign("world");
    const expected = "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ";
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "keyStack.sign() handles two keys, first key used",
  async fn() {
    const keys = ["hello", "world"];
    const keyStack = new KeyStack(keys);
    const actual = await keyStack.sign("world");
    const expected = "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ";
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "keyStack.verify() handles single key",
  async fn() {
    const keys = ["hello"];
    const keyStack = new KeyStack(keys);
    const digest = await keyStack.sign("world");
    assert(await keyStack.verify("world", digest));
  },
});

Deno.test({
  name: "keyStack.verify() handles single key verify invalid",
  async fn() {
    const keys = ["hello"];
    const keyStack = new KeyStack(keys);
    const digest = await keyStack.sign("world");
    assert(!await keyStack.verify("worlds", digest));
  },
});

Deno.test({
  name: "keyStack.verify() handles two keys",
  async fn() {
    const keys = ["hello", "world"];
    const keyStack = new KeyStack(keys);
    const digest = await keyStack.sign("world");
    assert(await keyStack.verify("world", digest));
  },
});

Deno.test({
  name: "keyStack.verify() handles unshift key",
  async fn() {
    const keys = ["hello"];
    const keyStack = new KeyStack(keys);
    const digest = await keyStack.sign("world");
    keys.unshift("world");
    assertEquals(keys, ["world", "hello"]);
    assert(await keyStack.verify("world", digest));
  },
});

Deno.test({
  name: "keyStack.verify() handles shift key",
  async fn() {
    const keys = ["hello", "world"];
    const keyStack = new KeyStack(keys);
    const digest = await keyStack.sign("world");
    assertEquals(keys.shift(), "hello");
    assertEquals(keys, ["world"]);
    assert(!await keyStack.verify("world", digest));
  },
});

Deno.test({
  name: "keyStack.indexOf() handles single key",
  async fn() {
    const keys = ["hello"];
    const keyStack = new KeyStack(keys);
    assertEquals(
      await keyStack.indexOf(
        "world",
        "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ",
      ),
      0,
    );
  },
});

Deno.test({
  name: "keyStack.indexOf() handles two keys index 0",
  async fn() {
    const keys = ["hello", "world"];
    const keyStack = new KeyStack(keys);
    assertEquals(
      await keyStack.indexOf(
        "world",
        "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ",
      ),
      0,
    );
  },
});

Deno.test({
  name: "keyStack.indexOf() handles two keys index 1",
  async fn() {
    const keys = ["world", "hello"];
    const keyStack = new KeyStack(keys);
    assertEquals(
      await keyStack.indexOf(
        "world",
        "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ",
      ),
      1,
    );
  },
});

Deno.test({
  name: "keyStack.indexOf() handles two keys not found",
  async fn() {
    const keys = ["world", "hello"];
    const keyStack = new KeyStack(keys);
    assertEquals(
      await keyStack.indexOf(
        "hello",
        "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ",
      ),
      -1,
    );
  },
});

Deno.test({
  name: "keyStack.verify() handles number array key",
  async fn() {
    const keys = [[212, 213]];
    const keyStack = new KeyStack(keys);
    assert(await keyStack.verify("hello", await keyStack.sign("hello")));
  },
});

Deno.test({
  name: "keyStack.verify() handles Uint8Array key",
  async fn() {
    const keys = [new Uint8Array([212, 213])];
    const keyStack = new KeyStack(keys);
    assert(await keyStack.verify("hello", await keyStack.sign("hello")));
  },
});

Deno.test({
  name: "verify() handles ArrayBuffer key",
  async fn() {
    const key = new ArrayBuffer(2);
    const dataView = new DataView(key);
    dataView.setInt8(0, 212);
    dataView.setInt8(1, 213);
    const keys = [key];
    const keyStack = new KeyStack(keys);
    assert(await keyStack.verify("hello", await keyStack.sign("hello")));
  },
});

Deno.test({
  name: "verify() handles number array data",
  async fn() {
    const keys = [[212, 213]];
    const keyStack = new KeyStack(keys);
    assert(await keyStack.verify([212, 213], await keyStack.sign([212, 213])));
  },
});

Deno.test({
  name: "verify() handles Uint8Array data",
  async fn() {
    const keys = [[212, 213]];
    const keyStack = new KeyStack(keys);
    assert(
      await keyStack.verify(
        new Uint8Array([212, 213]),
        await keyStack.sign(new Uint8Array([212, 213])),
      ),
    );
  },
});

Deno.test({
  name: "verify() handles ArrayBuffer data",
  async fn() {
    const keys = [[212, 213]];
    const keyStack = new KeyStack(keys);
    const data1 = new ArrayBuffer(2);
    const dataView1 = new DataView(data1);
    dataView1.setInt8(0, 212);
    dataView1.setInt8(1, 213);
    const data2 = new ArrayBuffer(2);
    const dataView2 = new DataView(data2);
    dataView2.setInt8(0, 212);
    dataView2.setInt8(1, 213);
    assert(await keyStack.verify(data2, await keyStack.sign(data1)));
  },
});

Deno.test({
  name: "verify() handles user iterable keys",
  async fn() {
    const keys = new Set(["hello", "world"]);
    const keyStack = new KeyStack(keys);
    const actual = await keyStack.sign("world");
    const expected = "8ayXAutfryPKKRpNxG3t3u4qeMza8KQSvtdxTP_7HMQ";
    assertEquals(actual, expected);
  },
});

Deno.test({
  name: "KeyStack() handles inspection in Deno",
  fn() {
    assertEquals(
      Deno.inspect(new KeyStack(["abcdef"])),
      `KeyStack { length: 1 }`,
    );
  },
});

Deno.test({
  name: "KeyStack() handles inspection in Node",
  async fn() {
    const { inspect } = await import("node:util");

    const keyStack = new KeyStack(["abcdef"]);

    // Needs to overwrite Deno.customInspect symbol to enable Node's inspect
    // deno-lint-ignore no-explicit-any
    (keyStack as any)[Symbol.for("Deno.customInspect")] = undefined;

    assertEquals(
      inspect(keyStack),
      `KeyStack { length: 1 }`,
    );
    // Check the short form
    assertEquals(
      inspect({ stack: [[keyStack]] }),
      `{ stack: [ [ [KeyStack] ] ] }`,
    );
    // Check the case when depth is null
    assertEquals(
      inspect({ stack: [[keyStack]] }, { depth: null }),
      `{ stack: [ [ KeyStack { length: 1 } ] ] }`,
    );
  },
});
