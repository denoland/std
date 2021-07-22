// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { splitList } from "../path/separator.ts";
import { join } from "../path/posix.ts";

async function findExecutable(file: string) {
  const s = await Deno.stat(file);
  if (!s.isDirectory && ((s.mode as number) & 0o111) != 0) {
    return;
  }
  throw new Deno.errors.PermissionDenied();
}

export async function lookPath(bin: string): Promise<string | undefined> {
  if (bin.includes("/")) {
    await findExecutable(bin); // throws if file doesn't exist
    return bin;
  }

  let path = Deno.env.get("PATH") ?? "";
  for (let dir of splitList(path)) {
    if (dir === "") {
      // Unix shell semantics: path element "" means "."
      dir = ".";
    }
    path = join(dir, bin);
    try {
      await findExecutable(path);
      // return first path found
      return path;
    } catch (_) {
      // swallow the error and let the loop continue with the next dir in $PATH
    }
  }
  throw new Deno.errors.NotFound(bin);
}
