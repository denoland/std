// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.

import { basename } from "@std/path/basename";
import { normalize } from "@std/path/normalize";
import { toPathString } from "./_to_path_string.ts";
import { FsResolvers, FsResolversSync } from "./walk.ts";

/**
 * Walk entry for {@linkcode walk}, {@linkcode walkSync},
 * {@linkcode expandGlob} and {@linkcode expandGlobSync}.
 */
export interface WalkEntry extends Deno.DirEntry {
  /** Full path of the entry. */
  path: string;
}

/** Create {@linkcode WalkEntry} for the `path` synchronously. */
export function createWalkEntrySync(
  path: string | URL,
  fsResolvers?: FsResolversSync,
): WalkEntry {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = (fsResolvers?.statSync ?? Deno.statSync)(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink,
  };
}

/** Create {@linkcode WalkEntry} for the `path` asynchronously. */
export async function createWalkEntry(
  path: string | URL,
  fsResolvers?: FsResolvers,
): Promise<WalkEntry> {
  path = toPathString(path);
  path = normalize(path);
  const name = basename(path);
  const info = await (fsResolvers?.stat ?? Deno.stat)(path);
  return {
    path,
    name,
    isFile: info.isFile,
    isDirectory: info.isDirectory,
    isSymlink: info.isSymlink,
  };
}
