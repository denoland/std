/**
 * Tar test
 *
 * **test summary**
 * create a tar archive in memory containing output.txt and dir/tar.ts.
 *
 * **to run this test**
 * deno run --allow-read archive/tar_test.ts
 */
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";

import { Tar } from "./tar.ts";
import { resolve } from "../fs/path/mod.ts";

const filePath = resolve("archive", "testdata", "example.txt");

test (async function createTarArchive(): Promise<void> {
  // initialize
  const tar = new Tar();

  // put data on memory
  const content = new TextEncoder().encode("hello tar world!");
  await tar
    .append("output.txt", {
      reader: new Deno.Buffer(content),
      contentSize: content.byteLength
    });

  // put a file
  await tar.append("dir/tar.ts", { filePath });

  // write tar data to a buffer
  const writer = new Deno.Buffer(),
    wrote = await Deno.copy(writer, tar.getReader());

  // 3072 = 512 (header) + 512 (content) + 512 (header) + 512 (content) + 1024 (footer)
  assertEquals(wrote, 3072);
});

runIfMain(import.meta);
