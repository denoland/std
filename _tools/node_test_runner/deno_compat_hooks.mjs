// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { transform } from "sucrase";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const decoder = new TextDecoder();
const encoder = new TextEncoder();

export async function resolve(specifier, context, nextResolve) {
  const match = specifier.match(/^@std\/([^\/]+)(\/[^\/]+)?$/);
  if (match) {
    const dir = match[1].replaceAll("-", "_");
    const exportName = match[2] ? "." + match[2] : ".";
    const denoJson = await readFile(path.join(dir, "deno.json"), "utf-8");
    const { exports } = JSON.parse(denoJson);
    const submodPath = path.resolve(dir, exports[exportName]);
    return nextResolve(pathToFileURL(submodPath).href, context);
  }

  return await nextResolve(specifier, context);
}

export async function load(specifier, context, nextLoad) {
  const { format, source } = await nextLoad(specifier, context).catch(
    async (error) => {
      if (
        error.code === "ERR_UNKNOWN_FILE_EXTENSION" &&
        specifier.endsWith(".ts")
      ) {
        return await nextLoad(specifier, {
          ...context,
          format: "module",
        });
      } else {
        throw error;
      }
    },
  );

  if (source && specifier.endsWith(".ts")) {
    return {
      format,
      source: encoder.encode(
        transform(decoder.decode(source), { transforms: ["typescript"] }).code,
      ),
    };
  }

  return { format, source };
}
