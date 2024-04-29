// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { join } from "../path/join.ts";

const workspaces = JSON.parse(await Deno.readTextFile("deno.json"))
  .workspaces as string[];
// deno-lint-ignore no-explicit-any
const denoConfig = {} as Record<string, any>;
for (const workspace of workspaces) {
  const config = JSON.parse(
    await Deno.readTextFile(join(workspace, "deno.json")),
  );
  denoConfig[config.name.replace("@std/", "")] = config;
}

export function resolveWorkspaceSpecifiers(
  specifier: string,
  referrer: string,
) {
  if (specifier.startsWith("../") || specifier.startsWith("./")) {
    return new URL(specifier, referrer).href;
  } else if (specifier.startsWith("@std/")) {
    let [_std, pkg, exp] = specifier.split("/");
    if (exp === undefined) {
      exp = ".";
    } else {
      exp = "./" + exp;
    }
    const pkgPath = "../" + pkg!.replaceAll("-", "_") + "/";
    const config = denoConfig[pkg!];
    if (typeof config.exports === "string") {
      return new URL(pkgPath + config.exports, import.meta.url).href;
    }
    return new URL(pkgPath + config.exports[exp], import.meta.url).href;
  } else {
    return new URL(specifier).href;
  }
}
