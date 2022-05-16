import { ErrorReplyError, Raw } from "../../mod.ts";
import { assert, assertEquals } from "../../../../testing/asserts.ts";
import { it } from "../../../../testing/bdd.ts";
import { newClient } from "../test_util.ts";
import type { TestServer } from "../test_util.ts";

export function pipelineTests(
  getServer: () => TestServer,
): void {
  const getOpts = () => ({
    hostname: "127.0.0.1",
    port: getServer().port,
  });

  it("testPipeline", async () => {
    const opts = getOpts();
    const client = await newClient(opts);
    const pl = client.pipeline();
    await Promise.all([
      pl.ping(),
      pl.ping(),
      pl.set("set1", "value1"),
      pl.set("set2", "value2"),
      pl.mget("set1", "set2"),
      pl.del("set1"),
      pl.del("set2"),
    ]);
    const ret = await pl.flush();
    assertEquals(ret, [
      "PONG",
      "PONG",
      "OK",
      "OK",
      ["value1", "value2"],
      1,
      1,
    ]);
    client.close();
  });

  it("testTx", async () => {
    const opts = getOpts();
    const client = await newClient(opts);
    const tx1 = client.tx();
    const tx2 = client.tx();
    const tx3 = client.tx();
    await client.del("key");
    await Promise.all<unknown>([
      tx1.get("key"),
      tx1.incr("key"),
      tx1.incr("key"),
      tx1.incr("key"),
      tx1.get("key"),
      //
      tx2.get("key"),
      tx2.incr("key"),
      tx2.incr("key"),
      tx2.incr("key"),
      tx2.get("key"),
      //
      tx3.get("key"),
      tx3.incr("key"),
      tx3.incr("key"),
      tx3.incr("key"),
      tx3.get("key"),
    ]);
    const rep1 = await tx1.flush() as Array<Raw>;
    const rep2 = await tx2.flush() as Array<Raw>;
    const rep3 = await tx3.flush() as Array<Raw>;
    assertEquals(
      parseInt(rep1[4] as string),
      parseInt(rep1[0] as string) + 3,
    );
    assertEquals(
      parseInt(rep2[4] as string),
      parseInt(rep2[0] as string) + 3,
    );
    assertEquals(
      parseInt(rep3[4] as string),
      parseInt(rep3[0] as string) + 3,
    );
    client.close();
  });

  it("pipeline in concurrent", async () => {
    {
      const opts = getOpts();
      const client = await newClient(opts);
      const tx = client.pipeline();
      const promises: Promise<unknown>[] = [];
      await client.del("a", "b", "c");
      for (const key of ["a", "b", "c"]) {
        promises.push(tx.set(key, key));
      }
      promises.push(tx.flush());
      for (const key of ["a", "b", "c"]) {
        promises.push(tx.get(key));
      }
      promises.push(tx.flush());
      const res = await Promise.all(promises);

      assertEquals(res, [
        "OK", // set(a)
        "OK", // set(b)
        "OK", // set(c)
        ["OK", "OK", "OK"], // flush()
        "OK", // get(a)
        "OK", // get(b)
        "OK", // get(c)
        ["a", "b", "c"], // flush()
      ]);

      client.close();
    }
  });

  it("error while pipeline", async () => {
    const opts = getOpts();
    const client = await newClient(opts);
    const tx = client.pipeline();
    tx.set("a", "a");
    tx.eval("var", ["k"], ["v"]);
    tx.get("a");
    const resp = await tx.flush() as Array<Raw>;
    assertEquals(resp.length, 3);
    assertEquals(resp[0], "OK");
    assert(resp[1] instanceof ErrorReplyError);
    assertEquals(resp[2], "a");
    client.close();
  });
}
