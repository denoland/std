// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Provides information about a file and is returned by
 * {@linkcode stat}, {@linkcode lstat}, {@linkcode statSync},
 * and {@linkcode lstatSync} or from calling `stat()` and `statSync()`
 * on an {@linkcode FsFile} instance.
 *
 * @category File System
 */
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

/**
 * Information about a directory entry returned from {@linkcode readDir}
 * and {@linkcode readDirSync}.
 */
export interface DirEntry {
  /** The file name of the entry. It is just the entity name and does not
   * include the full path. */
  name: string;
  /** True if this is info for a regular file. Mutually exclusive to
   * `FileInfo.isDirectory` and `FileInfo.isSymlink`. */
  isFile: boolean;
  /** True if this is info for a regular directory. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isSymlink`. */
  isDirectory: boolean;
  /** True if this is info for a symlink. Mutually exclusive to
   * `FileInfo.isFile` and `FileInfo.isDirectory`. */
  isSymlink: boolean;
}

/**
 * Options that can be used with {@linkcode symlink} and
 * {@linkcode symlinkSync}.
 */
export interface SymlinkOptions {
  /** Specify the symbolic link type as file, directory or NTFS junction. This
   * option only applies to Windows and is ignored on other operating systems. */
  type: "file" | "dir" | "junction";
}

/**
 * Options which can be set when using {@linkcode readFile} or
 * {@linkcode readTextFile}.
 */
export interface ReadFileOptions {
  /** An abort signal to allow cancellation of the file read operation. If the
   * signal becomes aborted the readFile operation will be stopped and the
   * promise returned will be rejected with an AbortError. */
  signal?: AbortSignal;
}

/**
 * Options which can be set when using {@linkcode makeTempDir},
 * {@linkcode makeTempDirSync}, {@linkcode makeTempFile}, and
 * {@linkcode makeTempFileSync}.
 */
export interface MakeTempOptions {
  /**
   * Directory where the temporary directory should be created (defaults to the
   * env variable `TMPDIR`, or the system's default, usually `/tmp`).
   *
   * Note that if the passed `dir` is relative, the path returned by
   * `makeTempFile()` and `makeTempDir()` will also be relative. Be mindful of
   * this when changing working directory.
   */
  dir?: string;
  /**
   * String that should precede the random portion of the temporary directory's
   * name.
   */
  prefix?: string;
  /**
   * String that should follow the random portion of the temporary directory's
   * name.
   */
  suffix?: string;
}

/**
 * Options that can be used with {@linkcode remove} and
 * {@linkcode removeSync}.
 */
export interface RemoveOptions {
  /**
   * If set to true, path will be removed even if it's a non-empty directory.
   */
  recursive?: boolean;
}
