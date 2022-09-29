// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { createWriteStream, WriteStream } from "./streams.ts";
import { assertEquals } from "../../../testing/asserts.ts";
import { Buffer } from "../../buffer.ts";

// Need to wait for file processing to complete within each test to prevent false negatives.
async function waiter(writable: WriteStream, interval = 100, maxCount = 50) {
  for (let i = maxCount; i > 0; i--) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    if (writable.destroyed) return true;
  }
  return false;
}

Deno.test({
  name: "[node/fs.WriteStream] Write data using 'WriteStream()'",
  async fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = WriteStream(tempFile);

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });

    assertEquals(await waiter(writable), true);
  },
});

Deno.test({
  name: "[node/fs.WriteStream] Write data using 'new WriteStream()'",
  async fn() {
    const tempFile: string = Deno.makeTempFileSync();
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const writable = new WriteStream(tempFile);

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });

    assertEquals(await waiter(writable), true);
  },
});

Deno.test({
  name:
    "[node/fs.createWriteStream] Write data using 'new createWriteStream()'",
  async fn() {
    const tempFile: string = Deno.makeTempFileSync();
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const writable = new createWriteStream(tempFile);

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });

    assertEquals(await waiter(writable), true);
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Specify the path as a Buffer",
  async fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(Buffer.from(tempFile));

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });

    assertEquals(await waiter(writable), true);
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Destroy the stream with an error",
  async fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile);

    writable.write("hello world");
    writable.destroy(Error("destroy has been called.")),
      writable.on("close", () => {
        const data = Deno.readFileSync(tempFile);
        Deno.removeSync(tempFile);
        assertEquals(new TextDecoder("utf-8").decode(data), "");
      });

    writable.on("error", (err: Error) => {
      assertEquals(err.name, "Error");
      assertEquals(err.message, "destroy has been called.");
    });

    assertEquals(await waiter(writable), true);
  },
});
