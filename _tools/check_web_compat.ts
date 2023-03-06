import { walk } from "../fs/walk.ts";

const ROOT = new URL("../", import.meta.url);
const SKIP = [/(test|bench)/, /\/_/];

function isWebCompat(filePath: string): boolean {
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

function hasWebCompatDecl(filePath: string): boolean {
  const output = Deno.readTextFileSync(filePath);
  return output.includes("This module is browser compatible.");
}

for await (const { path } of walk(ROOT, { exts: [".ts"], skip: SKIP })) {
  const isWebCompatResult = isWebCompat(path);
  const hasWebCompatDeclResult = hasWebCompatDecl(path);

  if (isWebCompatResult && !hasWebCompatDeclResult) {
    console.log(`${path}: missed`);
    continue;
  }

  if (!isWebCompatResult && hasWebCompatDeclResult) {
    console.log(`${path}: incorrect`);
    continue;
  }
}
