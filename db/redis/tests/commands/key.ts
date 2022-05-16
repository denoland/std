import {
  assert,
  assertArrayIncludes,
  assertEquals,
} from "../../../../testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  it,
} from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import type { Redis } from "../../mod.ts";

export function keyTests(
  getServer: () => TestServer,
): void {
  let client!: Redis;
  beforeAll(async () => {
    const { port } = getServer();
    client = await newClient({ hostname: "127.0.0.1", port });
  });
  afterAll(() => client.close());

  beforeEach(async () => {
    await client.flushdb();
  });

  it("del", async () => {
    let s = await client.set("key1", "fuga");
    assertEquals(s, "OK");
    s = await client.set("key2", "fugaaa");
    assertEquals(s, "OK");
    const deleted = await client.del("key1", "key2");
    assertEquals(deleted, 2);
  });

  it("dump and restore", async () => {
    await client.set("key", "hello");
    const v = await client.dump("key");
    await client.del("key");
    await client.restore("key", 2000, v!);
    assertEquals(await client.get("key"), "hello");
  });

  it("exists", async () => {
    const none = await client.exists("none", "none2");
    assertEquals(none, 0);
    await client.set("exists", "aaa");
    const exists = await client.exists("exists", "none");
    assertEquals(exists, 1);
  });

  it("expire", async () => {
    await client.set("key", "foo");
    const v = await client.expire("key", 1);
    assertEquals(v, 1);
  });

  it("expireat", async () => {
    await client.set("key", "bar");
    const timestamp = String(new Date(8640000000000000).getTime() / 1000);
    const v = await client.expireat("key", timestamp);
    assertEquals(v, 1);
  });

  it("keys", async () => {
    await client.set("key1", "foo");
    await client.set("key2", "bar");
    const v = await client.keys("key*");
    assertEquals(v.sort(), ["key1", "key2"]);
  });

  it("migrate", async () => {
    const { port } = getServer();
    const v = await client.migrate("127.0.0.1", port, "nosuchkey", "0", 0);
    assertEquals(v, "NOKEY");
  });

  it("move", async () => {
    const v = await client.move("nosuchkey", "1");
    assertEquals(v, 0);
  });

  it("object refcount", async () => {
    await client.set("key", "hello");
    const v = await client.objectRefCount("key");
    assertEquals(v, 1);
  });

  it("object encoding", async () => {
    await client.set("key", "foobar");
    const v = await client.objectEncoding("key");
    assertEquals(typeof v, "string");
  });

  it("object idletime", async () => {
    await client.set("key", "baz");
    const v = await client.objectIdletime("key");
    assertEquals(v, 0);
  });

  it("object freq", async () => {
    const v = await client.objectFreq("nosuchkey");
    assertEquals(v, undefined);
  });

  it("object help", async () => {
    const v = await client.objectHelp();
    assert(Array.isArray(v));
  });

  it("persist", async () => {
    const v = await client.persist("nosuckey");
    assertEquals(v, 0);
  });

  it("pexpire", async () => {
    await client.set("key", "hello");
    const v = await client.pexpire("key", 500);
    assertEquals(v, 1);
  });

  it("pexpireat", async () => {
    await client.set("key", "bar");
    const timestamp = new Date(8640000000000000).getTime();
    const v = await client.pexpireat("key", timestamp);
    assertEquals(v, 1);
  });

  it("pttl", async () => {
    await client.set("key", "foo");
    const v = await client.pttl("key");
    assertEquals(v, -1);
  });

  it("randomkey", async () => {
    await client.set("key", "hello");
    const v = await client.randomkey();
    assertEquals(typeof v, "string");
  });

  it("rename", async () => {
    await client.set("key", "foo");
    const v = await client.rename("key", "newkey");
    assertEquals(v, "OK");
  });

  it("renamenx", async () => {
    await client.set("key", "bar");
    const v = await client.renamenx("key", "newkey");
    assertEquals(v, 1);
  });

  it("sort", async () => {
    await client.rpush("key", "3", "10", "5", "1");
    const v = await client.sort("key");
    assertEquals(v, ["1", "3", "5", "10"]);
  });

  it("touch", async () => {
    await client.set("key1", "baz");
    await client.set("key2", "qux");
    const v = await client.touch("key1", "key2");
    assertEquals(v, 2);
  });

  it("ttl", async () => {
    await client.set("key", "foo");
    const v = await client.ttl("key");
    assertEquals(v, -1);
  });

  it("type", async () => {
    await client.set("key", "foobar");
    const v = await client.type("key");
    assertEquals(v, "string");
  });

  it("unlink", async () => {
    await client.set("key1", "hello");
    await client.set("key2", "world");
    const v = await client.unlink("key1", "key2", "nosuchkey");
    assertEquals(v, 2);
  });

  it("wait", async () => {
    await client.set("key", "hello");
    const v = await client.wait(0, 1000);
    assertEquals(v, 0);
  });

  it("scan", async () => {
    await client.set("key1", "foo");
    await client.set("key2", "bar");
    const v = await client.scan(0);
    assertEquals(v.length, 2);
    assertEquals(v[0], "0");
    assertEquals(v[1].length, 2);
    assertArrayIncludes(v[1], ["key1", "key2"]);
  });

  it("scan with pattern", async () => {
    await client.set("foo", "f");
    await client.set("bar", "b");
    const v = await client.scan(0, { pattern: "f*" });
    assertEquals(v, ["0", ["foo"]]);
  });
}
