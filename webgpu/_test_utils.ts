// Copyright 2018-2026 the Deno authors. MIT license.

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

export const ignore = isWsl || isLinuxOrMacCI;
