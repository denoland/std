// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert } from "@std/assert";
import { createTextureWithData } from "./texture_with_data.ts";
import { ignore } from "./_test_utils.ts";

Deno.test({
  ignore,
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
