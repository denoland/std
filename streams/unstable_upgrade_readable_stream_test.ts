// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { upgradeReadable } from "./unstable_upgrade_readable_stream";

Deno.test("upgradeReadable()", async () => {
  const reader = upgradeReadable(ReadableStream.from([new Uint8Array(100)]))
    .getReader({ mode: "byob" });
  await reader.cancel();
});
