// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { fromFileURL } from "../path.ts";

export function rename(
  oldPath: string | URL,
  newPath: string | URL,
  callback: (err?: Error) => void,
) {
  oldPath = oldPath instanceof URL ? fromFileURL(oldPath) : oldPath;
  newPath = newPath instanceof URL ? fromFileURL(newPath) : newPath;

  if (!callback) throw new Error("No callback function supplied");

  Deno.rename(oldPath, newPath).then((_) => callback(), callback);
}

export function renameSync(oldPath: string | URL, newPath: string | URL) {
  oldPath = oldPath instanceof URL ? fromFileURL(oldPath) : oldPath;
  newPath = newPath instanceof URL ? fromFileURL(newPath) : newPath;

  Deno.renameSync(oldPath, newPath);
}
