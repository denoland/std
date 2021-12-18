// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

const kUsePromises = Symbol("use promises");

class FileHandle {
  constructor(fd: number, offset: number, length: number) {
    this.fd = fd;
    this.offset = offset;
    this.length = length;
  }
  fd: number;
  getAsyncId(): number;
  close(): Promise<void>;
  onread: () => void;
  stream: unknown;
}

function openFileHandle() {
}

export default {
  kUsePromises,
};
