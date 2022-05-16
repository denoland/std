import { connect } from "../../mod.ts";
import { assertEquals } from "../../../../testing/asserts.ts";
import { afterAll, beforeAll, it } from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";
import type { Redis } from "../../mod.ts";

export function connectionTests(
  getServer: () => TestServer,
): void {
  let client!: Redis;
  beforeAll(async () => {
    const { port } = getServer();
    client = await newClient({ hostname: "127.0.0.1", port });
  });

  afterAll(() => client.close());

  it("echo", async () => {
    assertEquals(await client.echo("Hello World"), "Hello World");
  });

  it("ping", async () => {
    assertEquals(await client.ping(), "PONG");
    assertEquals(await client.ping("Deno"), "Deno");
  });

  it("quit", async () => {
    const { port } = getServer();
    const tempClient = await connect({ hostname: "127.0.0.1", port });
    assertEquals(tempClient.isConnected, true);
    assertEquals(tempClient.isClosed, false);
    assertEquals(await tempClient.quit(), "OK");
    assertEquals(tempClient.isConnected, false);
    assertEquals(tempClient.isClosed, true);
  });

  it("select", async () => {
    assertEquals(await client.select(1), "OK");
  });

  it("swapdb", async () => {
    assertEquals(await client.swapdb(0, 1), "OK");
  });
}
