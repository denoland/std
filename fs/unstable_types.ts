// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export interface FileInfo {
  /** True if this is info for a regular file. Mutually exclusive to
   * `FileInfo.isDirectory` and `FileInfo.isSymlink`. */
  isFile: boolean;
  /** True if this is info for a regular directory. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isSymlink`. */
  isDirectory: boolean;
  /** True if this is info for a symlink. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isDirectory`. */
  isSymlink: boolean;
  /** The size of the file, in bytes. */
  size: number;
  /** The last modification time of the file. This corresponds to the `mtime`
   * field from `stat` on Linux/Mac OS and `ftLastWriteTime` on Windows. This
   * may not be available on all platforms. */
  mtime: Date | null;
  /** The last access time of the file. This corresponds to the `atime`
   * field from `stat` on Unix and `ftLastAccessTime` on Windows. This may not
   * be available on all platforms. */
  atime: Date | null;
  /** The creation time of the file. This corresponds to the `birthtime`
   * field from `stat` on Mac/BSD and `ftCreationTime` on Windows. This may
   * not be available on all platforms. */
  birthtime: Date | null;
  /** The last change time of the file. This corresponds to the `ctime`
   * field from `stat` on Mac/BSD and `ChangeTime` on Windows. This may
   * not be available on all platforms. */
  // TODO(kt3k): uncomment this when we drop support for Deno 1.x
  // ctime: Date | null;
  /** ID of the device containing the file. */
  dev: number;
  /** Inode number.
   *
   * _Linux/Mac OS only._ */
  ino: number | null;
  /** The underlying raw `st_mode` bits that contain the standard Unix
   * permissions for this file/directory.
   */
  mode: number | null;
  /** Number of hard links pointing to this file.
   *
   * _Linux/Mac OS only._ */
  nlink: number | null;
  /** User ID of the owner of this file.
   *
   * _Linux/Mac OS only._ */
  uid: number | null;
  /** Group ID of the owner of this file.
   *
   * _Linux/Mac OS only._ */
  gid: number | null;
  /** Device ID of this file.
   *
   * _Linux/Mac OS only._ */
  rdev: number | null;
  /** Blocksize for filesystem I/O.
   *
   * _Linux/Mac OS only._ */
  blksize: number | null;
  /** Number of blocks allocated to the file, in 512-byte units.
   *
   * _Linux/Mac OS only._ */
  blocks: number | null;
  /**  True if this is info for a block device.
   *
   * _Linux/Mac OS only._ */
  isBlockDevice: boolean | null;
  /**  True if this is info for a char device.
   *
   * _Linux/Mac OS only._ */
  isCharDevice: boolean | null;
  /**  True if this is info for a fifo.
   *
   * _Linux/Mac OS only._ */
  isFifo: boolean | null;
  /**  True if this is info for a socket.
   *
   * _Linux/Mac OS only._ */
  isSocket: boolean | null;
}
