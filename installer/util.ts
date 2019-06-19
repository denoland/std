#!/usr/bin/env deno --allow-all
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { env } = Deno;
import * as path from "../fs/path.ts";

export function getInstallerDir(): string {
  // In Windows's Powershell $HOME environmental variable maybe null
  // if so use $HOMEPATH instead.
  let { HOME, HOMEPATH } = env();

  const HOME_PATH = HOME || HOMEPATH;

  if (!HOME_PATH) {
    throw new Error("$HOME is not defined.");
  }

  return path.join(HOME_PATH, ".deno", "bin");
}
