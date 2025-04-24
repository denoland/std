// Copyright 2018-2025 the Deno authors. MIT license.

import { getNodeFs, getNodeStream, getNodeTty, getNodeUtil } from "./_utils.ts";
import { mapError } from "./_map_error.ts";
import type { FileInfo, FsFile, SetRawOptions } from "./unstable_types.ts";
import { toFileInfo } from "./_to_file_info.ts";

/**
 * The internal class to convert a Node file descriptor into a FsFile object.
 */
export class NodeFsFile implements FsFile {
  #nodeFs = getNodeFs();
  #nodeStream = getNodeStream();
  #nodeTty = getNodeTty();
  #nodeUtil = getNodeUtil();
  #nodeReadFd = this.#nodeUtil.promisify(this.#nodeFs.read);
  #nodeWriteFd = this.#nodeUtil.promisify(this.#nodeFs.write);

  #closed: boolean;
  #rid: number;
  #readableStream?: ReadableStream<Uint8Array>;
  #writableStream?: WritableStream<Uint8Array>;

  constructor(fd: number) {
    this.#rid = fd;
    this.#closed = false;
  }

  get readable(): ReadableStream<Uint8Array> {
    if (this.#readableStream == null) {
      const readStream = this.#nodeFs.createReadStream(null as unknown, {
        fd: this.#rid,
        autoClose: false,
      });
      this.#readableStream = this.#nodeStream.Readable.toWeb(readStream);
    }
    return this.#readableStream as ReadableStream;
  }

  get writable(): WritableStream<Uint8Array> {
    if (this.#writableStream == null) {
      const writeStream = this.#nodeFs.createWriteStream(null as unknown, {
        fd: this.#rid,
        autoClose: false,
      });
      this.#writableStream = this.#nodeStream.Writable.toWeb(writeStream);
    }
    return this.#writableStream as WritableStream;
  }

  [Symbol.dispose](): void {
    if (!this.#closed) {
      this.close();
    }
  }

  close(): void {
    this.#closed = true;
    this.#nodeFs.closeSync(this.#rid);
  }

  isTerminal(): boolean {
    return this.#nodeTty.isatty(this.#rid);
  }

  // deno-lint-ignore require-await no-unused-vars
  async lock(exclusive?: boolean): Promise<void> {
    throw new Error("Method not implemented");
  }

  // deno-lint-ignore no-unused-vars
  lockSync(exclusive?: boolean): void {
    throw new Error("Method not implemented");
  }

  async read(p: Uint8Array): Promise<number | null> {
    try {
      const { bytesRead } = await this.#nodeReadFd(
        this.#rid,
        p,
        0,
        p.length,
        null,
      );
      return bytesRead === 0 ? null : bytesRead;
    } catch (error) {
      throw mapError(error);
    }
  }

  readSync(p: Uint8Array): number | null {
    try {
      const bytesRead = this.#nodeFs.readSync(this.#rid, p);
      return bytesRead === 0 ? null : bytesRead;
    } catch (error) {
      throw mapError(error);
    }
  }

  //deno-lint-ignore no-unused-vars
  setRaw(mode: boolean, options?: SetRawOptions): void {
    throw new Error("Method not implemented");
  }

  async stat(): Promise<FileInfo> {
    const nodeStatFd = this.#nodeUtil.promisify(this.#nodeFs.fstat);
    try {
      const fdStat = await nodeStatFd(this.#rid);
      return toFileInfo(fdStat);
    } catch (error) {
      throw mapError(error);
    }
  }

  statSync(): FileInfo {
    try {
      const fdStat = this.#nodeFs.fstatSync(this.#rid);
      return toFileInfo(fdStat);
    } catch (error) {
      throw mapError(error);
    }
  }

  async sync(): Promise<void> {
    const nodeFsyncFd = this.#nodeUtil.promisify(this.#nodeFs.fsync);
    try {
      await nodeFsyncFd(this.#rid);
    } catch (error) {
      throw mapError(error);
    }
  }

  syncSync(): void {
    try {
      this.#nodeFs.fsyncSync(this.#rid);
    } catch (error) {
      throw mapError(error);
    }
  }

  async syncData(): Promise<void> {
    const nodeFdatasyncFd = this.#nodeUtil.promisify(this.#nodeFs.fdatasync);
    try {
      await nodeFdatasyncFd(this.#rid);
    } catch (error) {
      throw mapError(error);
    }
  }

  syncDataSync(): void {
    try {
      this.#nodeFs.fdatasyncSync(this.#rid);
    } catch (error) {
      throw mapError(error);
    }
  }

  async truncate(len?: number): Promise<void> {
    const nodeTruncateFd = this.#nodeUtil.promisify(this.#nodeFs.ftruncate);
    try {
      await nodeTruncateFd(this.#rid, len);
    } catch (error) {
      throw mapError(error);
    }
  }

  truncateSync(len?: number): void {
    try {
      this.#nodeFs.ftruncateSync(this.#rid, len);
    } catch (error) {
      throw mapError(error);
    }
  }

  // deno-lint-ignore require-await
  async unlock(): Promise<void> {
    throw new Error("Method not implemented");
  }

  unlockSync(): void {
    throw new Error("Method not implemented");
  }

  async utime(atime: number | Date, mtime: number | Date): Promise<void> {
    const nodeUtimeFd = this.#nodeUtil.promisify(this.#nodeFs.futimes);
    try {
      await nodeUtimeFd(this.#rid, atime, mtime);
    } catch (error) {
      throw mapError(error);
    }
  }

  utimeSync(atime: number | Date, mtime: number | Date): void {
    try {
      this.#nodeFs.futimesSync(this.#rid, atime, mtime);
    } catch (error) {
      throw mapError(error);
    }
  }

  async write(p: Uint8Array): Promise<number> {
    try {
      const { bytesWritten } = await this.#nodeWriteFd(this.#rid, p);
      return bytesWritten;
    } catch (error) {
      throw mapError(error);
    }
  }

  writeSync(p: Uint8Array): number {
    try {
      return this.#nodeFs.writeSync(this.#rid, p);
    } catch (error) {
      throw mapError(error);
    }
  }
}
