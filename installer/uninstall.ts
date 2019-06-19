#!/usr/bin/env deno --allow-all
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
const { remove } = Deno;
import * as path from "../fs/path.ts";
import { exists } from "../fs/exists.ts";
import { getInstallerDir } from "./util.ts";

const isWindows = Deno.platform.os === "win";

export async function uninstall(moduleName: string): Promise<void> {
  const installerDir = getInstallerDir();
  const filePath = path.join(installerDir, moduleName);

  if (!(await exists(filePath))) {
    throw new Error(`ℹ️  ${moduleName} not found`);
  }

  await remove(filePath);
  if (isWindows) {
    await remove(filePath + ".cmd");
  }
  console.log(`ℹ️  Uninstalled ${moduleName}`);
}
