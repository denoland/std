import { assertEquals } from "../../../../testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  beforeEach,
  it,
} from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import type { Redis } from "../../mod.ts";

export function hashTests(
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

  it("hdel", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hdel("key", "f1", "f2", "f3"), 2);
  });

  it("hexists", async () => {
    await client.hset("key", "f1", "1");
    assertEquals(await client.hexists("key", "f1"), 1);
    assertEquals(await client.hexists("key", "f2"), 0);
  });

  it("hget", async () => {
    await client.hset("key", "f1", "1");
    assertEquals(await client.hget("key", "f1"), "1");
    assertEquals(await client.hget("key", "f2"), undefined);
  });

  it("hgetall", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hgetall("key"), ["f1", "1", "f2", "2"]);
  });

  it("hincrby", async () => {
    await client.hset("key", "f1", "1");
    assertEquals(await client.hincrby("key", "f1", 4), 5);
  });

  it("hincybyfloat", async () => {
    await client.hset("key", "f1", "1");
    assertEquals(await client.hincrbyfloat("key", "f1", 4.33), "5.33");
  });

  it("hkeys", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hkeys("key"), ["f1", "f2"]);
  });

  it("hlen", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hlen("key"), 2);
  });

  it("hmget", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hmget("key", "f1", "f2", "f3"), [
      "1",
      "2",
      undefined,
    ]);
  });

  it("hmset", async () => {
    assertEquals(await client.hmset("key", "f1", "1"), "OK");
    assertEquals(await client.hmset("key", { f1: "1", f2: "2" }), "OK");
    assertEquals(await client.hmset("key", ["f4", "4"], ["f5", "5"]), "OK");
  });

  it("hset", async () => {
    assertEquals(await client.hset("key", "f1", "1"), 1);
    assertEquals(await client.hset("key", { f2: "2", f3: "3" }), 2);
    assertEquals(await client.hset("key", ["f4", "4"], ["f5", "5"]), 2);
  });

  it("hsetnx", async () => {
    await client.hset("key", "f1", "1");
    assertEquals(await client.hsetnx("key", "f1", "1"), 0);
    assertEquals(await client.hsetnx("key", "f2", "2"), 1);
  });

  it("hstrlen", async () => {
    await client.hset("key", "f1", "abc");
    assertEquals(await client.hstrlen("key", "f1"), 3);
  });

  it("hvals", async () => {
    await client.hset("key", "f1", "1");
    await client.hset("key", "f2", "2");
    assertEquals(await client.hvals("key"), ["1", "2"]);
  });

  it("hscan", async () => {
    assertEquals(Array.isArray(await client.hscan("key", 0)), true);
  });
}
