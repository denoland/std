// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

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

/** Options for writing to a file. */
export interface WriteFileOptions {
  /**
   * If set to `true`, will append to a file instead of overwriting previous
   * contents.
   *
   * @default {false}
   */
  append?: boolean;
  /**
   * Sets the option to allow creating a new file, if one doesn't already
   * exist at the specified path.
   *
   * @default {true}
   */
  create?: boolean;
  /**
   * If set to `true`, no file, directory, or symlink is allowed to exist at
   * the target location. When createNew is set to `true`, `create` is ignored.
   *
   * @default {false}
   */
  createNew?: boolean;
  /** Permissions always applied to file. */
  mode?: number;
  /**
   * An abort signal to allow cancellation of the file write operation.
   *
   * If the signal becomes aborted the write file operation will be stopped
   * and the promise returned will be rejected with an {@linkcode AbortError}.
   */
  signal?: AbortSignal;
}

/**
 * The abstraction for reading and writing files.
 *
 * This is the most straight forward way of handling files and is recommended
 * over using the discrete functions.
 *
 * @example Usage
 * ```ts ignore
 * import { open } from "@std/fs/unstable-open";
 * using file = await open("/foo/bar.txt", { read: true });
 * const fileInfo = await file.stat();
 * if (fileInfo.isFile) {
 *   const buf = new Uint8Array(100);
 *   const numberOfBytesRead = await file.read(buf); // 11 bytes
 *   const text = new TextDecoder().decode(buf);  // "hello world"
 * }
 * ```
 */
export interface FsFile extends Disposable {
  /**
   * A {@linkcode ReadableStream} instance representing to the byte contents
   * of the file. This makes it easy to interoperate with other web streams
   * based APIs.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("my_file.txt", { read: true });
   * const decoder = new TextDecoder();
   * for await (const chunk of file.readable) {
   *   console.log(decoder.decode(chunk));
   * }
   * ```
   */
  readable: ReadableStream<Uint8Array>;
  /**
   * A {@linkcode WritableStream} instance to write the contents of the
   * file. This makes it easy to interoperate with other web streams based
   * APIs.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * const items = ["hello", "world"];
   * using file = await open("my_file.txt", { write: true });
   * const encoder = new TextEncoder();
   * const writer = file.writable.getWriter();
   * for (const item of items) {
   *   await writer.write(encoder.encode(item));
   * }
   * ```
   */
  writable: WritableStream<Uint8Array>;
  /**
   * Close the file. Closing a file when you are finished with it is
   * important to avoid leaking resources.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("my_file.txt");
   * // do work with "file" object
   * ```
   */
  close(): void;
  /** Disposal protocol enabling the `using` keyword **TypeScript Only** */
  [Symbol.dispose](): void;
  /**
   * Checks if the file resource is a TTY (terminal).
   *
   * @example Usage
   * ```ts ignore
   * // This example is system and context specific
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("/dev/tty6");
   * file.isTerminal(); // true
   * ```
   */
  isTerminal(): boolean;
  /**
   * Acquire an advisory file-system lock for the file.
   *
   * @default {false}
   */
  lock(exclusive?: boolean): Promise<void>;
  /**
   * Synchronously acquire an advisory file-system lock synchronously for the
   * file.
   *
   * @default {false}
   */
  lockSync(exclusive?: boolean): void;
  /**
   * Read the file into an array buffer (`p`).
   *
   * Resolves to either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This
   * does not indicate EOF.
   *
   * **It is not guaranteed that the full buffer will be read in a single
   * call.**
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * // if "/foo/bar.txt" contains the text "hello world":
   * using file = await open("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = await file.read(buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * ```
   */
  read(p: Uint8Array): Promise<number | null>;
  /**
   * Synchronously read from the file into an array buffer (`p`).
   *
   * Returns either the number of bytes read during the operation or EOF
   * (`null`) if there was nothing more to read.
   *
   * It is possible for a read to successfully return with `0` bytes. This
   * does not indicate EOF.
   *
   * **It is not guaranteed that the full buffer will be read in a single
   * call.**
   *
   * @example Usage
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * // if "/foo/bar.txt" contains the text "hello world":
   * using file = openSync("/foo/bar.txt");
   * const buf = new Uint8Array(100);
   * const numberOfBytesRead = file.readSync(buf); // 11 bytes
   * const text = new TextDecoder().decode(buf);  // "hello world"
   * ```
   */
  readSync(p: Uint8Array): number | null;
  /**
   * Set TTY to be under raw mode or not. In raw mode, characters are read and
   * returned as is, without being processed. All special processing of
   * characters by the terminal is disabled, including echoing input
   * characters. Reading from a TTY device in raw mode is faster than reading
   * from a TTY device in canonical mode.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("/dev/tty6");
   * file.setRaw(true, { cbreak: true });
   * ```
   */
  setRaw(mode: boolean, options?: SetRawOptions): void;
  /**
   * Resolves to a {@linkcode FileInfo} for the file.
   *
   * @example Usage
   * ```ts ignore
   * import { assert } from "@std/assert";
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("hello.txt");
   * const fileInfo = await file.stat();
   * assert(fileInfo.isFile);
   * ```
   */
  stat(): Promise<FileInfo>;
  /**
   * Synchronously returns a {@linkcode FileInfo} for the file.
   *
   * @example Usage
   * ```ts ignore
   * import { assert } from "@std/assert";
   * import { openSync } from "@std/fs/unstable-open";
   * using file = openSync("hello.txt");
   * const fileInfo = file.statSync();
   * assert(fileInfo.isFile);
   * ```
   */
  statSync(): FileInfo;
  /**
   * Flushes any pending data and metadata operations of the given file
   * stream to disk.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * import { readTextFile } from "@std/fs/unstable-read-text-file";
   * const file = await open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello World"));
   * await file.truncate(1);
   * await file.sync();
   * console.log(await readTextFile("my_file.txt")); // H
   * ```
   */
  sync(): Promise<void>;
  /**
   * Synchronously flushes any pending data and metadata operations of the
   * given file stream to disk.
   *
   * @example Usage
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * import { readTextFileSync } from "@std/fs/unstable-read-text-file";
   * const file = openSync(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello World"));
   * file.truncateSync(1);
   * file.syncSync();
   * console.log(readTextFileSync("my_file.txt")); // H
   * ```
   */
  syncSync(): void;
  /**
   * Flushes any pending data operations of the given file stream to disk.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * import { readTextFile } from "@std/fs/unstable-read-text-file";
   * using file = await open(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * await file.write(new TextEncoder().encode("Hello World"));
   * await file.syncData();
   * console.log(await readTextFile("my_file.txt")); // Hello World
   * ```
   */
  syncData(): Promise<void>;
  /**
   * Synchronously flushes any pending data operations of the given file stream
   * to disk.
   *
   * @example Usage
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * import { readTextFileSync } from "@std/fs/unstable-read-text-file";
   * using file = openSync(
   *   "my_file.txt",
   *   { read: true, write: true, create: true },
   * );
   * file.writeSync(new TextEncoder().encode("Hello World"));
   * file.syncDataSync();
   * console.log(readTextFileSync("my_file.txt")); // Hello World
   * ```
   */
  syncDataSync(): void;
  /**
   * Truncates (or extends) the file to reach the specified `len`. If `len` is
   * not specified, then the entire file contents are truncated.
   *
   * @example Truncate the entire file
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("my_file.txt", { write: true });
   * await file.truncate();
   * ```
   *
   * @example Truncate part of the file
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * // if "my_file.txt" contains the text "hello world":
   * using file = await open("my_file.txt", { write: true });
   * await file.truncate(7);
   * const buf = new Uint8Array(100);
   * await file.read(buf);
   * const text = new TextDecoder().decode(buf); // "hello w"
   * ```
   */
  truncate(len?: number): Promise<void>;
  /**
   * Synchronously truncates (or extends) the file to reach the specified `len`.
   * If `len` is not specified, then the entire file contents are truncated.
   *
   * @example Truncate the entire file
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * using file = openSync("my_file.txt", { write: true });
   * file.truncateSync();
   * ```
   *
   * @example Truncate part of the file
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * // if "my_file.txt" contains the text "hello world":
   * using file = openSync("my_file.txt", { write: true });
   * file.truncateSync(7);
   * const buf = new Uint8Array(100);
   * file.readSync(buf);
   * const text = new TextDecoder().decode(buf); // "hello w"
   * ```
   */
  truncateSync(len?: number): void;
  /** Release an advisory file-system lock for the file.*/
  unlock(): Promise<void>;
  /** Synchronously release an advisory file-system lock for the file. */
  unlockSync(): void;
  /**
   * Changes the access (`atime`) and modification (`mtime`) times of the
   * file stream resource. Given times are either in seconds (UNIX epoch
   * time) or as `Date` objects.
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * using file = await open("file.txt", { create: true, write: true });
   * await file.utime(1556495550, new Date());
   * ```
   */
  utime(atime: number | Date, mtime: number | Date): Promise<void>;
  /**
   * Synchronously changes the access (`atime`) and modification (`mtime`) times
   * of the file stream resource. Given times are either in seconds (UNIX epoch
   * time) or as `Date` objects.
   *
   * @example Usage
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * using file = openSync("file.txt", { create: true, write: true });
   * file.utime(1556495550, new Date());
   * ```
   */
  utimeSync(atime: number | Date, mtime: number | Date): void;
  /**
   * Write the contents of the array buffer (`p`) to the file.
   *
   * Resolves to the number of bytes written.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * @example Usage
   * ```ts ignore
   * import { open } from "@std/fs/unstable-open";
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * using file = await open("/foo/bar.txt", { write: true });
   * const bytesWritten = await file.write(data); // 11
   * ```
   */
  write(p: Uint8Array): Promise<number>;
  /**
   * Synchronously write the contents of the array buffer (`p`) to the file.
   *
   * Returns the number of bytes written.
   *
   * **It is not guaranteed that the full buffer will be written in a single
   * call.**
   *
   * @example Usage
   * ```ts ignore
   * import { openSync } from "@std/fs/unstable-open";
   * const encoder = new TextEncoder();
   * const data = encoder.encode("Hello world");
   * using file = openSync("/foo/bar.txt", { write: true });
   * const bytesWritten = file.writeSync(data); // 11
   * ```
   */
  writeSync(p: Uint8Array): number;
}

/** Options when setting TTY to raw mode. */
export interface SetRawOptions {
  /**
   * The `cbreak` option can be used to indicate that characters that correspond
   * to a signal should still be generated. When disabling raw mode, this option
   * is ignored. This functionality currently only works on Linux and Mac OS.
   */
  cbreak: boolean;
}
