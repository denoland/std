// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { CallbackWithError } from "./_fs_common.ts";
import { fromFileURL } from "../path.ts";

type SymlinkType = "file" | "dir";

export function symlink(
  target: string | URL,
  path: string | URL,
  typeOrCallback: SymlinkType | CallbackWithError,
  maybeCallback?: CallbackWithError,
) {
  target = target instanceof URL ? fromFileURL(target) : target;
  path = path instanceof URL ? fromFileURL(path) : path;

  const type: SymlinkType = typeof typeOrCallback === "string"
    ? typeOrCallback
    : "file";

  const callback: CallbackWithError = typeof typeOrCallback === "function"
    ? typeOrCallback
    : (maybeCallback as CallbackWithError);

  if (!callback) throw new Error("No callback function supplied");

  Deno.symlink(target, path, { type }).then(() => callback(null), callback);
}

export function symlinkSync(
  target: string | URL,
  path: string | URL,
  type?: SymlinkType,
) {
  target = target instanceof URL ? fromFileURL(target) : target;
  path = path instanceof URL ? fromFileURL(path) : path;
  type = type || "file";

  Deno.symlinkSync(target, path, { type });
}
