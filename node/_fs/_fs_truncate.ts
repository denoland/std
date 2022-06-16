// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { CallbackWithError } from "./_fs_common.ts";
import { fromFileURL } from "../path.ts";

export function truncate(
  path: string | URL,
  lenOrCallback: number | CallbackWithError,
  maybeCallback?: CallbackWithError,
) {
  path = path instanceof URL ? fromFileURL(path) : path;
  const len: number | undefined = typeof lenOrCallback === "number"
    ? lenOrCallback
    : undefined;
  const callback: CallbackWithError = typeof lenOrCallback === "function"
    ? lenOrCallback
    : maybeCallback as CallbackWithError;

  if (!callback) throw new Error("No callback function supplied");

  Deno.truncate(path, len).then(() => callback(null), callback);
}

export function truncateSync(path: string | URL, len?: number) {
  path = path instanceof URL ? fromFileURL(path) : path;

  Deno.truncateSync(path, len);
}
