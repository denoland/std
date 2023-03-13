// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench|\/_|\\_)/, new RegExp(import.meta.url)];
const DECLARATION = "// This module is not browser compatible.";

function isBrowserCompatible(filePath: string): boolean {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "check",
      "--config",
      "browser-compat.tsconfig.json",
      filePath,
    ],
  });
  const { code } = command.outputSync();
  return code === 0;
}

function hasBrowserIncompatibleComment(path: string): boolean {
  const output = Deno.readTextFileSync(path);
  return output.includes(DECLARATION);
}

const needsBrowserIncompatibleCommentRemovedList: string[] = [];
const needsBrowserIncompatibleCommentList: string[] = [];

for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  console.log(path);

  const result = {
    isBrowserCompatible: isBrowserCompatible(path),
    hasBrowserIncompatibleComment: hasBrowserIncompatibleComment(path),
  };

  if (result.isBrowserCompatible && result.hasBrowserIncompatibleComment) {
    needsBrowserIncompatibleCommentRemovedList.push(path);
    continue;
  }

  if (!result.isBrowserCompatible && !result.hasBrowserIncompatibleComment) {
    needsBrowserIncompatibleCommentList.push(path);
    continue;
  }
}

let failed = false;

if (needsBrowserIncompatibleCommentRemovedList.length > 0) {
  failed = true;
  console.error(
    `The following files must have their "${DECLARATION}" comment removed:`,
  );
  needsBrowserIncompatibleCommentRemovedList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (needsBrowserIncompatibleCommentList.length > 0) {
  failed = true;
  console.error(
    `The following files must have their "${DECLARATION}" comment added:`,
  );
  needsBrowserIncompatibleCommentList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (failed) {
  Deno.exit(1);
}
