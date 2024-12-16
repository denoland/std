// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import type { FileInfo } from "./unstable_types.ts";
import { isWindows } from "./_utils.ts";

export function toFileInfo(s: import("node:fs").Stats): FileInfo {
  return {
    atime: s.atime,
    // TODO(kt3k): uncomment this when we drop support for Deno 1.x
    // ctime: s.ctime,
    birthtime: s.birthtime,
    blksize: isWindows ? null : s.blksize,
    blocks: isWindows ? null : s.blocks,
    dev: s.dev,
    gid: isWindows ? null : s.gid,
    ino: isWindows ? null : s.ino,
    isDirectory: s.isDirectory(),
    isFile: s.isFile(),
    isSymlink: s.isSymbolicLink(),
    isBlockDevice: isWindows ? null : s.isBlockDevice(),
    isCharDevice: isWindows ? null : s.isCharacterDevice(),
    isFifo: isWindows ? null : s.isFIFO(),
    isSocket: isWindows ? null : s.isSocket(),
    mode: isWindows ? null : s.mode,
    mtime: s.mtime,
    nlink: isWindows ? null : s.nlink,
    rdev: isWindows ? null : s.rdev,
    size: s.size,
    uid: isWindows ? null : s.uid,
  };
}
