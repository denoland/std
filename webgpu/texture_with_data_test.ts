// Copyright 2018-2026 the Deno authors. MIT license.

import { assert } from "@std/assert";
import { createTextureWithData } from "./texture_with_data.ts";
import { ignore } from "./_test_utils.ts";

Deno.test({
  // Temporarily ignore this case on windows as this is too flaky on CI.
  ignore: ignore || Deno.build.os === "windows",
  name: "createTextureWithData()",
  fn: async () => {
    const adapter = await navigator.gpu.requestAdapter();
    assert(adapter);
    const device = await adapter.requestDevice();
    assert(device);

    createTextureWithData(device, {
      format: "bgra8unorm-srgb",
      size: {
        width: 3,
        height: 2,
      },
      usage: GPUTextureUsage.COPY_SRC,
    }, new Uint8Array([1, 1, 1, 1, 1, 1, 1]));

    device.destroy();
  },
});
