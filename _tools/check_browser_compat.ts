// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Running this script provides a list of suggested files that might be browser-compatible.
 * It skips test code, benchmark code, internal code and `version.ts` at the root.
 *
 * Run using: deno run --allow-read --allow-run _tools/check_browser_compat.ts
 */

import { walk } from "../fs/walk.ts";
import { COPYRIGHT } from "./check_licence.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench|\/_|\\_|testdata|version.ts)/];
const DECLARATION = "// This module is browser compatible.";
const CHECK = Deno.args.includes("--check");

function isBrowserCompatible(filePath: string): boolean {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "check",
      "--no-lock",
      "--config",
      "browser-compat.tsconfig.json",
      filePath,
    ],
  });
  const { success } = command.outputSync();
  return success;
}

function hasBrowserCompatibleComment(source: string): boolean {
  return source.includes(DECLARATION);
}

for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  const source = await Deno.readTextFile(path);
  if (isBrowserCompatible(path) && !hasBrowserCompatibleComment(source)) {
    if (CHECK) {
      console.log(
        `${path} is likely browser-compatible and can have the "${DECLARATION}" comment added.`,
      );
    } else {
      const index = source.indexOf(COPYRIGHT);
      await Deno.writeTextFile(
        path,
        source.slice(0, index + COPYRIGHT.length) + "\n" + DECLARATION +
          source.slice(index + COPYRIGHT.length),
      );
    }
  }
}
