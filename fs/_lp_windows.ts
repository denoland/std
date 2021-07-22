// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { splitList } from "../path/separator.ts";
import { join } from "../path/win32.ts";

async function chkStat(file: string) {
  const s = await Deno.stat(file);
  if (s.isDirectory) {
    throw new Deno.errors.PermissionDenied(file);
  }
  return;
}

function hasExt(file: string): boolean {
  const i = file.lastIndexOf(".");
  if (i < 0) {
    return false;
  }
  return file.lastIndexOf(":") < i &&
    file.lastIndexOf("\\") < i &&
    file.lastIndexOf("/") < i;
}

async function findExecutable(file: string, exts: string[]): Promise<string> {
  if (exts.length === 0) {
    await chkStat(file);
    return file;
  }
  if (hasExt(file)) {
    await chkStat(file);
    return file;
  }
  for (const e of exts) {
    try {
      const f = file + e;
      await chkStat(f);
      return f;
    } catch (_) {
      // swallow the error and let the loop continue with the next extension
    }
  }
  throw new Deno.errors.NotFound(file);
}

export async function lookPath(bin: string): Promise<string | undefined> {
  // Defaults taken from the Go source code.
  const exts = splitList(Deno.env.get("PATHEXT") ?? ".com;.exe;.bat;.cmd")
    .filter((e) => e !== "")
    .map((e) => {
      if (e[0] !== ".") {
        e = "." + e;
      }
      return e;
    });

  if (bin.includes(":") || bin.includes("/") || bin.includes("\\")) {
    return await findExecutable(bin, exts);
  }

  try {
    return await findExecutable(join(".", bin), exts);
  } catch (_) {
    for (const dir in splitList(Deno.env.get("PATH") ?? "")) {
      try {
        return await findExecutable(join(dir, bin), exts);
      } catch (_) {
        // swallow the error and let the loop continue with the next extension
      }
    }
  }
  throw new Deno.errors.NotFound(bin);
}
