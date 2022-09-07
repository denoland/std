// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { createWriteStream, WriteStream } from "./streams.ts";
import { assertEquals } from "../../../testing/asserts.ts";

Deno.test({
  name: "[node/fs.WriteStream] Write data using 'WriteStream()'",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    const writable = WriteStream(tempFile);

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });
  },
});

Deno.test({
  name: "[node/fs.WriteStream] Write data using 'new WriteStream()'",
  sanitizeOps: false,
  fn() {
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
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Write data using 'createWriteStream()'",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile);

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "hello world\n");
    });
  },
});

Deno.test({
  name:
    "[node/fs.createWriteStream] Write data using 'new createWriteStream()'",
  sanitizeOps: false,
  fn() {
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
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Write data with options",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile, { encoding: "utf16le" });

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-16le").decode(data), "hello world\n");
    });
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Call parent function",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile);
    writable.setDefaultEncoding("utf16le");

    writable.write("hello world");
    writable.end("\n");

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-16le").decode(data), "hello world\n");
    });
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Access parent property",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile);

    writable.end("");

    writable.on("close", () => {
      Deno.removeSync(tempFile);
      assertEquals(writable.writableEnded, true);
    });
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Destroy the stream",
  sanitizeOps: false,
  fn() {
    const tempFile: string = Deno.makeTempFileSync();
    const writable = createWriteStream(tempFile);

    writable.write("hello world");
    writable.destroy();

    writable.on("close", () => {
      const data = Deno.readFileSync(tempFile);
      Deno.removeSync(tempFile);
      assertEquals(new TextDecoder("utf-8").decode(data), "");
    });
  },
});

Deno.test({
  name: "[node/fs.createWriteStream] Destroy the stream with an error",
  sanitizeOps: false,
  fn() {
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
  },
});
