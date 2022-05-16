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

export function setTests(
  getServer: () => TestServer,
): void {
  let client!: Redis;
  beforeAll(async () => {
    const server = getServer();
    client = await newClient({ hostname: "127.0.0.1", port: server.port });
  });

  afterAll(() => client.close());

  beforeEach(async () => {
    await client.flushdb();
  });

  it("sadd", async () => {
    assertEquals(await client.sadd("key", "1", "2", "1"), 2);
  });

  it("scard", async () => {
    await client.sadd("key", "1", "2");
    assertEquals(await client.scard("key"), 2);
  });

  it("sdiff", async () => {
    await client.sadd("key", "1", "2");
    await client.sadd("key2", "1", "3");
    assertArrayIncludes(await client.sdiff("key", "key2"), ["2"]);
  });

  it("sdiffstore", async () => {
    await client.sadd("key", "1", "2");
    await client.sadd("key2", "1", "3");
    assertEquals(await client.sdiffstore("dest", "key", "key2"), 1);
  });

  it("sinter", async () => {
    await client.sadd("key", "1", "2");
    await client.sadd("key2", "1", "3");
    assertArrayIncludes(await client.sinter("key", "key2"), ["1"]);
  });

  it("sinterstore", async () => {
    await client.sadd("key", "1", "2");
    await client.sadd("key2", "1", "3");
    assertEquals(await client.sinterstore("dest", "key", "key2"), 1);
  });

  it("sismember", async () => {
    await client.sadd("key", "1", "2");
    assertEquals(await client.sismember("key", "1"), 1);
  });

  it("smembers", async () => {
    await client.sadd("key", "1", "2");
    assertArrayIncludes(await client.smembers("key"), ["1", "2"]);
  });

  it("smove", async () => {
    await client.sadd("key", "1", "2");
    assertEquals(await client.smove("key", "dest", "1"), 1);
  });

  it("spop", async () => {
    await client.sadd("key", "a");
    const v = await client.spop("key");
    assertEquals(v, "a");
  });

  it("spop with count", async () => {
    await client.sadd("key", "a", "b");
    const v = await client.spop("key", 2);
    assertArrayIncludes(v, ["a", "b"]);
  });

  it("srandmember", async () => {
    await client.sadd("key", "a", "b");
    const v = await client.srandmember("key");
    assertArrayIncludes(["a", "b"], [v]);
  });

  it("srandmember with count", async () => {
    await client.sadd("key", "a", "b");
    const v = await client.srandmember("key", 3);
    assertArrayIncludes(["a", "b", undefined], v);
  });

  it("srem", async () => {
    await client.sadd("key", "a", "b");
    assertEquals(await client.srem("key", "a"), 1);
  });

  it("sunion", async () => {
    await client.sadd("key", "a", "b");
    await client.sadd("key2", "b", "c");
    const v = await client.sunion("key", "key2");
    assertArrayIncludes(v, ["a", "b", "c"]);
  });

  it("sunionstore", async () => {
    await client.sadd("key", "a", "b");
    await client.sadd("key2", "b", "c");
    const v = await client.sunionstore("dest", "key", "key2");
    assertEquals(v, 3);
  });

  it("sscan", async () => {
    await client.sadd("key", "a", "b");
    const v = await client.sscan("key", 0);
    assert(Array.isArray(v));
  });
}
