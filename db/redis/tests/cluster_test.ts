import type { Redis } from "../mod.ts";
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "../../../testing/asserts.ts";
import { afterAll, beforeAll, describe, it } from "../../../testing/bdd.ts";
import { newClient, nextPort, startRedis, stopRedis } from "./test_util.ts";
import type { TestServer } from "./test_util.ts";

describe("cluster", () => {
  let port1!: number;
  let port2!: number;
  let s1!: TestServer;
  let s2!: TestServer;
  let client!: Redis;

  beforeAll(async () => {
    port1 = nextPort();
    port2 = nextPort();
    s1 = await startRedis({ port: port1, clusterEnabled: true });
    s2 = await startRedis({ port: port2, clusterEnabled: true });
    client = await newClient({ hostname: "127.0.0.1", port: port2 });
  });

  afterAll(() => {
    stopRedis(s1);
    stopRedis(s2);
    client.close();
  });

  it("addslots", async () => {
    await client.clusterFlushSlots();
    assertEquals(await client.clusterAddSlots(1, 2, 3), "OK");
  });

  it("myid", async () => {
    assert(!!(await client.clusterMyID()));
  });

  it("countfailurereports", async () => {
    const nodeId = await client.clusterMyID();
    assertEquals(await client.clusterCountFailureReports(nodeId), 0);
  });

  it("countkeysinslot", async () => {
    assertEquals(await client.clusterCountKeysInSlot(1), 0);
  });

  it("delslots", async () => {
    assertEquals(await client.clusterDelSlots(1, 2, 3), "OK");
  });

  it("getkeysinslot", async () => {
    assertEquals(await client.clusterGetKeysInSlot(1, 1), []);
  });

  it("flushslots", async () => {
    assertEquals(await client.clusterFlushSlots(), "OK");
  });

  it("info", async () => {
    assertStringIncludes(await client.clusterInfo(), "cluster_state");
  });

  it("keyslot", async () => {
    assertEquals(await client.clusterKeySlot("somekey"), 11058);
  });

  it("meet", async () => {
    assertEquals(await client.clusterMeet("127.0.0.1", port2), "OK");
  });

  it("nodes", async () => {
    const nodeId = await client.clusterMyID();
    const nodes = await client.clusterNodes();
    assertStringIncludes(nodes, nodeId);
  });

  it("replicas", async () => {
    const nodeId = await client.clusterMyID();
    assertEquals(await client.clusterReplicas(nodeId), []);
  });

  it("slaves", async () => {
    const nodeId = await client.clusterMyID();
    assertEquals(await client.clusterSlaves(nodeId), []);
  });

  it("forget", async () => {
    const nodeId = await client.clusterMyID();
    const otherNode = (await client.clusterNodes())
      .split("\n")
      .find((n) => !n.startsWith(nodeId))
      ?.split(" ")[0];
    if (otherNode) {
      assertEquals(await client.clusterForget(otherNode), "OK");
    }
  });

  it("saveconfig", async () => {
    assertEquals(await client.clusterSaveConfig(), "OK");
  });

  it("setslot", async () => {
    const nodeId = await client.clusterMyID();
    assertEquals(await client.clusterSetSlot(1, "NODE", nodeId), "OK");
    assertEquals(await client.clusterSetSlot(1, "MIGRATING", nodeId), "OK");
    assertEquals(await client.clusterSetSlot(1, "STABLE"), "OK");
  });

  it("slots", async () => {
    assert(Array.isArray(await client.clusterSlots()));
  });

  it("replicate", async () => {
    const nodeId = await client.clusterMyID();
    const otherNode = (await client.clusterNodes())
      .split("\n")
      .find((n) => !n.startsWith(nodeId))
      ?.split(" ")[0];
    if (otherNode) {
      assertEquals(await client.clusterReplicate(otherNode), "OK");
    }
  });

  it("failover", async () => {
    const nodeId = await client.clusterMyID();
    const otherNode = (await client.clusterNodes())
      .split("\n")
      .find((n) => !n.startsWith(nodeId))
      ?.split(" ")[0];
    if (otherNode) {
      assertEquals(await client.clusterFailover(), "OK");
    }
  });

  it("reset", async () => {
    assertEquals(await client.clusterReset(), "OK");
  });
});
