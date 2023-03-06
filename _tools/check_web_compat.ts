import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench|\/_)/, new RegExp(import.meta.url)];

function isWebCompatible(filePath: string): boolean {
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

function hasWebIncompatibleComment(path: string): boolean {
  const output = Deno.readTextFileSync(path);
  return output.includes("// This module is not browser compatible.");
}

const needsWebIncompatibleCommentRemovedList: string[] = [];
const needsWebIncompatibleCommentList: string[] = [];

for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  const result = {
    isWebCompatible: isWebCompatible(path),
    hasWebIncompatibleComment: hasWebIncompatibleComment(path),
  };

  if (result.isWebCompatible && result.hasWebIncompatibleComment) {
    needsWebIncompatibleCommentRemovedList.push(path);
    continue;
  }

  if (!result.isWebCompatible && !result.hasWebIncompatibleComment) {
    needsWebIncompatibleCommentList.push(path);
    continue;
  }
}

let failed = false;

if (needsWebIncompatibleCommentRemovedList.length > 0) {
  failed = true;
  console.error(
    'The following files must have their "This module is not browser compatible." comment removed:',
  );
  needsWebIncompatibleCommentRemovedList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (needsWebIncompatibleCommentList.length > 0) {
  failed = true;
  console.error(
    'The following files must have their "This module is not browser compatible." comment added:',
  );
  needsWebIncompatibleCommentList.forEach((path, index) =>
    console.log(`${index + 1}. ${path}`)
  );
}

if (failed) {
  Deno.exit(1);
}
