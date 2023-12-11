// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert } from "../testing/asserts.ts";
import { createTextureWithData } from "./texture_with_data.ts";

async function checkIsWsl() {
  return Deno.build.os === "linux" && await hasMicrosoftProcVersion();

  async function hasMicrosoftProcVersion() {
    // https://github.com/microsoft/WSL/issues/423#issuecomment-221627364
    try {
      const procVersion = await Deno.readTextFile("/proc/version");
      return /microsoft/i.test(procVersion);
    } catch {
      return false;
    }
  }
}

let isCI: boolean;
try {
  isCI = (Deno.env.get("CI")?.length ?? 0) > 0;
} catch {
  isCI = true;
}

// Skip these tests on linux CI, because the vulkan emulator is not good enough
// yet, and skip on macOS CI because these do not have virtual GPUs.
const isLinuxOrMacCI =
  (Deno.build.os === "linux" || Deno.build.os === "darwin") && isCI;
// Skip these tests in WSL because it doesn't have good GPU support.
const isWsl = await checkIsWsl();

Deno.test({
  ignore: isWsl || isLinuxOrMacCI,
  name: "[WebGPU] createTextureWithData",
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
  },
});
