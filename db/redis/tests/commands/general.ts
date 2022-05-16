import { createLazyClient, ErrorReplyError } from "../../mod.ts";
import type { Redis } from "../../mod.ts";
import {
  assert,
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "../../../../testing/asserts.ts";
import { afterAll, beforeAll, it } from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";

export function generalTests(
  getServer: () => TestServer,
): void {
  const getOpts = () => ({
    hostname: "127.0.0.1",
    port: getServer().port,
  });
  let client!: Redis;
  beforeAll(async () => {
    client = await newClient(getOpts());
  });

  afterAll(() => client.close());

  it("conccurent", async () => {
    let promises: Promise<string | undefined>[] = [];
    for (const key of ["a", "b", "c"]) {
      promises.push(client.set(key, key));
    }
    await Promise.all(promises);
    promises = [];
    for (const key of ["a", "b", "c"]) {
      promises.push(client.get(key));
    }
    const [a, b, c] = await Promise.all(promises);
    assertEquals(a, "a");
    assertEquals(b, "b");
    assertEquals(c, "c");
  });

  it("db0", async () => {
    const opts = getOpts();
    const key = "exists";
    const client1 = await newClient({ ...opts, db: 0 });
    await client1.set(key, "aaa");
    const exists1 = await client1.exists(key);
    assertEquals(exists1, 1);
    const client2 = await newClient({ ...opts, db: 0 });
    const exists2 = await client2.exists(key);
    assertEquals(exists2, 1);
    client1.close();
    client2.close();
  });

  it("connect with wrong password", async () => {
    const { port } = getOpts();
    await assertRejects(async () => {
      await newClient({
        hostname: "127.0.0.1",
        port,
        password: "wrong_password",
      });
    }, ErrorReplyError);
  });

  it("connect with empty password", async () => {
    const { port } = getOpts();
    // In Redis, authentication with an empty password will always fail.
    await assertRejects(async () => {
      await newClient({
        hostname: "127.0.0.1",
        port,
        password: "",
      });
    }, ErrorReplyError);
  });

  it("exists", async () => {
    const opts = getOpts();
    const key = "exists";
    const client1 = await newClient({ ...opts, db: 0 });
    await client1.set(key, "aaa");
    const exists1 = await client1.exists(key);
    assertEquals(exists1, 1);
    const client2 = await newClient({ ...opts, db: 1 });
    const exists2 = await client2.exists(key);
    assertEquals(exists2, 0);
    client1.close();
    client2.close();
  });

  for (const v of [Infinity, NaN, "", "port"]) {
    it(`invalid port: ${v}`, async () => {
      await assertRejects(
        async () => {
          await newClient({ hostname: "127.0.0.1", port: v });
        },
        Error,
        "invalid",
      );
    });
  }

  it("sendCommand - simple types", async () => {
    // simple string
    {
      const reply = await client.sendCommand("SET", "key", "a");
      assertEquals(reply.value(), "OK");
    }

    // bulk string
    {
      const reply = await client.sendCommand("GET", "key");
      assertEquals(reply.value(), "a");
    }

    // integer
    {
      const reply = await client.sendCommand("EXISTS", "key");
      assertEquals(reply.value(), 1);
    }
  });

  it("sendCommand - get the raw data as Uint8Array", async () => {
    const encoder = new TextEncoder();
    await client.set("key", encoder.encode("hello"));
    const reply = await client.sendCommand("GET", "key");
    assertEquals(reply.buffer(), encoder.encode("hello"));
  });

  it("lazy client", async () => {
    const opts = getOpts();
    const resources = Deno.resources();
    const client = createLazyClient(opts);
    assert(!client.isConnected);
    assertEquals(resources, Deno.resources());
    try {
      await client.get("foo");
      assert(client.isConnected);
      assertNotEquals(resources, Deno.resources());
    } finally {
      client.close();
    }
  });
}
