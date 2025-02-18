// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertThrows } from "@std/assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { copyFile, copyFileSync } from "./unstable_copy_file.ts";

Deno.test("copyFile() copies content to an existed file", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "copy_"));
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFile` API";

  await writeFile(source, content);
  await writeFile(target, "");
  await copyFile(source, target);

  const targetContent = await readFile(target, "utf-8");

  assert(content === targetContent);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("copyFile() copies content to a non existed file", async () => {
  const tempDirPath = await mkdtemp(resolve(tmpdir(), "copy_"));
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFile` API";

  await writeFile(source, content);
  await copyFile(source, target);

  const targetContent = await readFile(target, "utf-8");

  assert(content === targetContent);

  await rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("copyFileSync() copies content to an existed file", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "copy_"));
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFileSync` API";

  writeFileSync(source, content);
  writeFileSync(target, "");
  copyFileSync(source, target);

  const targetContent = readFileSync(target, "utf-8");

  assert(content === targetContent);

  rmSync(tempDirPath, { recursive: true, force: true });
});

Deno.test("copyFileSync() copies content to a directory, which will throw an error", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "copy_"));
  const source = join(tempDirPath, "source.txt");

  const content = "This is written by `copyFile` API";

  writeFileSync(source, content);

  assertThrows(() => {
    copyFileSync(source, tmpdir());
  });

  rm(tempDirPath, { recursive: true, force: true });
});

Deno.test("copyFileSync() copies content to a non existed file", () => {
  const tempDirPath = mkdtempSync(resolve(tmpdir(), "copy_"));
  const source = join(tempDirPath, "source.txt");
  const target = join(tempDirPath, "target.txt");

  const content = "This is written by `copyFileSync` API";

  writeFileSync(source, content);
  copyFileSync(source, target);

  const targetContent = readFileSync(target, "utf-8");

  assert(content === targetContent);

  rmSync(tempDirPath, { recursive: true, force: true });
});
