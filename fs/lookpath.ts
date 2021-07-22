// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// based on [Golang's `LookPath`][1] function.
// [1] https://pkg.go.dev/os/exec#example-LookPath
import { isWindows } from "../_util/os.ts";
import { lookPath as unix } from "./_lp_unix.ts";
import { lookPath as win32 } from "./_lp_windows.ts";

export async function lookPath(bin: string): Promise<string | undefined> {
  return await (isWindows ? win32(bin) : unix(bin));
}
