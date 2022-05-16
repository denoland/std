import { assertEquals } from "../../../../testing/asserts.ts";
import { afterAll, beforeAll, it } from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import type { Redis } from "../../mod.ts";

export function aclTests(
  getServer: () => TestServer,
): void {
  let client!: Redis;
  beforeAll(async () => {
    const server = getServer();
    client = await newClient({ hostname: "127.0.0.1", port: server.port });
  });

  afterAll(() => client.close());

  it("whoami", async () => {
    assertEquals(await client.aclWhoami(), "default");
  });

  it("list", async () => {
    assertEquals(await client.aclList(), [
      "user default on nopass ~* &* +@all",
    ]);
  });

  it("getuser", async () => {
    assertEquals(await client.aclGetUser("default"), [
      "flags",
      ["on", "allkeys", "allchannels", "allcommands", "nopass"],
      "passwords",
      [],
      "commands",
      "+@all",
      "keys",
      ["*"],
      "channels",
      ["*"],
    ]);
  });

  it("cat", async () => {
    assertEquals(
      (await client.aclCat()).sort(),
      [
        "keyspace",
        "read",
        "write",
        "set",
        "sortedset",
        "list",
        "hash",
        "string",
        "bitmap",
        "hyperloglog",
        "geo",
        "stream",
        "pubsub",
        "admin",
        "fast",
        "slow",
        "blocking",
        "dangerous",
        "connection",
        "transaction",
        "scripting",
      ].sort(),
    );
    assertEquals(
      (await client.aclCat("dangerous")).sort(),
      [
        "lastsave",
        "shutdown",
        "module",
        "monitor",
        "role",
        "client",
        "replconf",
        "config",
        "pfselftest",
        "save",
        "replicaof",
        "restore-asking",
        "restore",
        "latency",
        "swapdb",
        "slaveof",
        "bgsave",
        "debug",
        "bgrewriteaof",
        "sync",
        "flushdb",
        "keys",
        "psync",
        "pfdebug",
        "flushall",
        "failover",
        "cluster",
        "info",
        "migrate",
        "acl",
        "sort",
        "slowlog",
      ].sort(),
    );
  });

  it("users", async () => {
    assertEquals(await client.aclUsers(), ["default"]);
  });

  it("acl_setuser", async () => {
    assertEquals(await client.aclSetUser("alan", "+get"), "OK");
    assertEquals(await client.aclDelUser("alan"), 1);
  });

  it("deluser", async () => {
    assertEquals(await client.aclDelUser("alan"), 0);
  });

  it("genpass", async () => {
    assertEquals((await client.aclGenPass()).length, 64);
    const testlen = 32;
    assertEquals((await client.aclGenPass(testlen)).length, testlen / 4);
  });

  it("aclauth", async () => {
    assertEquals(await client.auth("default", ""), "OK");
  });

  it("log", async () => {
    const randString = "balh";
    try {
      await client.auth(randString, randString);
    } catch (_error) {
      // skip invalid username-password pair error
    }
    assertEquals((await client.aclLog(1))[0][9], randString);
    assertEquals(await client.aclLog("RESET"), "OK");
  });

  it("module_list", async () => {
    assertEquals(await client.moduleList(), []);
  });
}
