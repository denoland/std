// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { join, toFileUrl } from "../path/mod.ts";
import { delay } from "../async/delay.ts";
import { assertEquals } from "../testing/asserts.ts";

import { downloadFile } from "./download_file.ts";

Deno.test("[node/_tools/setup] downloadFile", async () => {
  const tmpdir = await Deno.makeTempDir();
  try {
    const dummyFile = join(tmpdir, "dummy.txt");
    // Writes 10 * 10,000 chars = 100KB
    await Deno.writeTextFile(dummyFile, "123456789\n".repeat(10_000));
    const p = Deno.run({
      cmd: [
        Deno.execPath(),
        "run",
        "-A",
        "./http/file_server.ts",
        tmpdir,
      ],
    });
    await delay(1000);

    const downloadedFile = join(tmpdir, "downloaded.txt");
    await downloadFile(
      "http://localhost:4507/dummy.txt",
      toFileUrl(downloadedFile),
    );
    assertEquals((await Deno.readTextFile(downloadedFile)).length, 100_000);
    p.close();
  } finally {
    await Deno.remove(tmpdir, { recursive: true });
  }
});
