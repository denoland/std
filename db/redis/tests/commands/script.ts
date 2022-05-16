import { assert, assertEquals } from "../../../../testing/asserts.ts";
import { afterAll, afterEach, beforeAll, it } from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import type { Redis } from "../../mod.ts";

export function scriptTests(
  getServer: () => TestServer,
): void {
  let client!: Redis;
  beforeAll(async () => {
    const server = getServer();
    client = await newClient({ hostname: "127.0.0.1", port: server.port });
  });
  afterAll(() => client.close());

  afterEach(async () => {
    await client.flushdb();
  });

  it("eval", async () => {
    const raw = await client.eval(
      "return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}",
      ["1", "2"],
      ["3", "4"],
    );
    assert(Array.isArray(raw));
    assertEquals(raw, ["1", "2", "3", "4"]);
  });

  it("evalsha", async () => {
    const hash = await client.scriptLoad(
      `return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}`,
    );
    try {
      assertEquals(
        await client.scriptExists(hash),
        [1],
      );

      const result = await client.evalsha(hash, ["a", "b"], ["1", "2"]);
      assert(Array.isArray(result));
      assertEquals(result, ["a", "b", "1", "2"]);
    } finally {
      await client.scriptFlush();
    }
  });
}
