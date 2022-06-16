// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { parse } from "../encoding/jsonc.ts";
import * as path from "../path/mod.ts";

export function resolveConfigFilePath(entryPoint: string | URL) {
  const cwd = Deno.cwd();
  if (entryPoint instanceof URL) {
    entryPoint = path.fromFileUrl(entryPoint);
  } else {
    entryPoint = path.resolve(Deno.cwd(), entryPoint);
  }

  if (entryPoint.startsWith(cwd)) {
    while (entryPoint.length) {
      for (const dirEntry of Deno.readDirSync(entryPoint)) {
        if (dirEntry.name === "deno.json" || dirEntry.name === "deno.jsonc") {
          return path.join(entryPoint, dirEntry.name);
        }
      }
      entryPoint = path.dirname(entryPoint);
    }
  }
  return null;
}

function parseConfigFile(filePath: string, source: string) {
  if (filePath.endsWith(".jsonc")) {
    return parse(source);
  }
  return JSON.parse(source);
}

export async function readConfigFile(filePath: string) {
  const source = await Deno.readTextFile(filePath);
  return parseConfigFile(filePath, source);
}
export function readConfigFileSync(filePath: string) {
  const source = Deno.readTextFileSync(filePath);
  return parseConfigFile(filePath, source);
}
