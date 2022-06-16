// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { parse } from "../encoding/jsonc.ts";
import * as path from "../path/mod.ts";

export function resolveConfigFilePath(dir: string | URL) {
  const cwd = Deno.cwd();
  if (dir instanceof URL) {
    dir = path.fromFileUrl(dir);
  } else {
    dir = path.resolve(Deno.cwd(), dir);
  }
  if (dir.startsWith(cwd)) {
    while (dir !== cwd) {
      for (const dirEntry of Deno.readDirSync(dir)) {
        if (dirEntry.name === "deno.json" || dirEntry.name === "deno.jsonc") {
          return path.join(dir, dirEntry.name);
        }
      }
      dir = path.dirname(dir);
    }
  }
  return null;
}
export async function readConfigFile(filePath: string) {
  const source = await Deno.readTextFile(filePath);
  if (filePath.endsWith(".jsonc")) {
    return parse(source);
  }
  return JSON.parse(source);
}
export function readConfigFileSync(filePath: string) {
  const source = Deno.readTextFileSync(filePath);
  if (filePath.endsWith(".jsonc")) {
    return parse(source);
  }
  return JSON.parse(source);
}
