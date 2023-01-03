// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { join, toFileUrl } from "../path/mod.ts";
import { delay } from "../async/delay.ts";
import { assertEquals } from "../testing/asserts.ts";
import { serve } from "../http/server.ts";

import { downloadFile } from "./download_file.ts";

Deno.test("[node/_tools/setup] downloadFile", async () => {
  const tmpdir = await Deno.makeTempDir();
  try {
    const controller = new AbortController();
    const serverPromise = serve(
      () => {
        // Responds with 100KB data
        return new Response("0".repeat(100_000));
      },
      { signal: controller.signal, port: 8080 },
    );
    await delay(50);

    const downloadedFile = join(tmpdir, "downloaded.txt");
    await downloadFile(
      "http://localhost:8080/dummy.txt",
      toFileUrl(downloadedFile),
    );
    assertEquals((await Deno.readTextFile(downloadedFile)).length, 100_000);
    controller.abort();
    await serverPromise;
  } finally {
    await Deno.remove(tmpdir, { recursive: true });
  }
});
