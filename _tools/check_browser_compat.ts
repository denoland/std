// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * This script adds a browser-compatible declaration to files that are
 * browser-compatible but do not have the declaration.
 *
 * Run using: deno run --allow-read --allow-run _tools/check_browser_compat.ts
 */
import LICENSE_JSON from "../.licenserc.json" with { type: "json" };
import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench|\/_|\\_|testdata|version.ts)/];
const DECLARATION = "// This module is browser compatible.";
const COPYRIGHT = `// ${LICENSE_JSON["**/*.{mjs,js,ts,rs}"]}`;

async function isBrowserCompatible(filePath: string): Promise<boolean> {
  return (await new Deno.Command(Deno.execPath(), {
    args: [
      "check",
      "--no-lock",
      "--config",
      "browser-compat.tsconfig.json",
      filePath,
    ],
  }).output()).success;
}
for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  const source = await Deno.readTextFile(path);
  if (!source.includes(DECLARATION) && await isBrowserCompatible(path)) {
    const index = source.indexOf(COPYRIGHT);
    await Deno.writeTextFile(
      path,
      source.slice(0, index + COPYRIGHT.length) + "\n" + DECLARATION +
        source.slice(index + COPYRIGHT.length),
    );
  }
}
