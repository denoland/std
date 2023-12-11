// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "../assert/mod.ts";
import { cleanUp, ignore } from "./_test_util.ts";
import { createCapture } from "./create_capture.ts";

Deno.test({
  ignore,
  name: "createCapture()",
  fn: async () => {
    const adapter = await navigator.gpu.requestAdapter();
    assert(adapter);
    const device = await adapter.requestDevice();
    assert(device);

    const { texture, outputBuffer } = createCapture(device, 2, 2);

    assertEquals(texture.width, 2);
    assertEquals(texture.height, 2);
    assertEquals(texture.depthOrArrayLayers, 1);
    assertEquals(texture.dimension, "2d");
    assertEquals(
      texture.usage,
      GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    );

    assertEquals(outputBuffer.size, 512);
    assertEquals(
      outputBuffer.usage,
      GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    );

    cleanUp(device);
  },
});
