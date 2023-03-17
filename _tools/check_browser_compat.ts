// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench|\/_|\\_|testdata)/];
const DECLARATION = "// This module is browser compatible.";

function isBrowserCompatible(filePath: string): boolean {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "check",
      "--config",
      "browser-compat.tsconfig.json",
      filePath,
    ],
  });
  const { success } = command.outputSync();
  return success;
}

function hasBrowserCompatibleComment(path: string): boolean {
  const output = Deno.readTextFileSync(path);
  return output.includes(DECLARATION);
}

const needsBrowserCompatibleCommentAddedList: string[] = [];
const needsBrowserCompatibleCommentRemovedList: string[] = [];

for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  const result = {
    isBrowserCompatible: isBrowserCompatible(path),
    hasBrowserCompatibleComment: hasBrowserCompatibleComment(path),
  };

  if (!result.isBrowserCompatible && result.hasBrowserCompatibleComment) {
    needsBrowserCompatibleCommentRemovedList.push(path);
    continue;
  }

  if (result.isBrowserCompatible && !result.hasBrowserCompatibleComment) {
    needsBrowserCompatibleCommentAddedList.push(path);
    continue;
  }
}

let failed = false;

if (needsBrowserCompatibleCommentRemovedList.length > 0) {
  failed = true;
  console.error(
    `The following files must have their "${DECLARATION}" comment removed:`,
  );
  needsBrowserCompatibleCommentRemovedList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (needsBrowserCompatibleCommentAddedList.length > 0) {
  failed = true;
  console.error(
    `The following files must have their "${DECLARATION}" comment added:`,
  );
  needsBrowserCompatibleCommentAddedList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (failed) {
  Deno.exit(1);
}
