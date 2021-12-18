"use strict";

const {
  Error,
  MathMin,
  NumberIsSafeInteger,
  Promise,
  PromisePrototypeThen,
  PromiseResolve,
  SafeArrayIterator,
  SafePromisePrototypeFinally,
  Symbol,
  Uint8Array,
} = primordials;

import binding from "../../internal_binding/fs.ts";
const { Buffer } = require("buffer");

const {
  codes: {
    ERR_INVALID_ARG_VALUE,
  },
  AbortError,
} = require("internal/errors");
const { isArrayBufferView } = require("internal/util/types");
const {
  constants: {
    kWriteFileMaxChunkSize,
  },
  copyObject,
  getOptions,
  getStatsFromBinding,
  getValidatedPath,
  stringToFlags,
  validateBufferArray,
  validateOffsetLengthRead,
  validateOffsetLengthWrite,
  validateStringAfterArrayBufferView,
} = require("internal/fs/utils");
const {
  parseFileMode,
  validateAbortSignal,
  validateBuffer,
  validateEncoding,
  validateInteger,
} = require("internal/validators");
const pathModule = require("path");
const { lazyDOMException } = require("internal/util");
const { EventEmitterMixin } = require("internal/event_target");
const { isIterable } = require("internal/streams/utils");
const assert = require("internal/assert");

const kHandle = Symbol("kHandle");
const kFd = Symbol("kFd");
const kRefs = Symbol("kRefs");
const kClosePromise = Symbol("kClosePromise");
const kCloseResolve = Symbol("kCloseResolve");
const kCloseReject = Symbol("kCloseReject");
const kRef = Symbol("kRef");
const kUnref = Symbol("kUnref");

const { kUsePromises } = binding;
const {
  JSTransferable,
  kDeserialize,
  kTransfer,
  kTransferList,
} = require("internal/worker/js_transferable");

class FileHandle extends EventEmitterMixin(JSTransferable) {
  /**
   * @param {InternalFSBinding.FileHandle | undefined} filehandle
   */
  constructor(filehandle) {
    super();
    this[kHandle] = filehandle;
    this[kFd] = filehandle ? filehandle.fd : -1;

    this[kRefs] = 1;
    this[kClosePromise] = null;
  }

  getAsyncId() {
    return this[kHandle].getAsyncId();
  }

  get fd() {
    return this[kFd];
  }

  appendFile(data, options) {
    return fsCall(writeFile, this, data, options);
  }

  chmod(mode) {
    return fsCall(fchmod, this, mode);
  }

  chown(uid, gid) {
    return fsCall(fchown, this, uid, gid);
  }

  datasync() {
    return fsCall(fdatasync, this);
  }

  sync() {
    return fsCall(fsync, this);
  }

  read(buffer, offset, length, position) {
    return fsCall(read, this, buffer, offset, length, position);
  }

  readv(buffers, position) {
    return fsCall(readv, this, buffers, position);
  }

  readFile(options) {
    return fsCall(readFile, this, options);
  }

  stat(options) {
    return fsCall(fstat, this, options);
  }

  truncate(len = 0) {
    return fsCall(ftruncate, this, len);
  }

  utimes(atime, mtime) {
    return fsCall(futimes, this, atime, mtime);
  }

  write(buffer, offset, length, position) {
    return fsCall(write, this, buffer, offset, length, position);
  }

  writev(buffers, position) {
    return fsCall(writev, this, buffers, position);
  }

  writeFile(data, options) {
    return fsCall(writeFile, this, data, options);
  }

  close = () => {
    if (this[kFd] === -1) {
      return PromiseResolve();
    }

    if (this[kClosePromise]) {
      return this[kClosePromise];
    }

    this[kRefs]--;
    if (this[kRefs] === 0) {
      this[kFd] = -1;
      this[kClosePromise] = SafePromisePrototypeFinally(
        this[kHandle].close(),
        () => {
          this[kClosePromise] = undefined;
        },
      );
    } else {
      this[kClosePromise] = SafePromisePrototypeFinally(
        new Promise((resolve, reject) => {
          this[kCloseResolve] = resolve;
          this[kCloseReject] = reject;
        }),
        () => {
          this[kClosePromise] = undefined;
          this[kCloseReject] = undefined;
          this[kCloseResolve] = undefined;
        },
      );
    }

    this.emit("close");
    return this[kClosePromise];
  };

  [kTransfer]() {
    if (this[kClosePromise] || this[kRefs] > 1) {
      throw lazyDOMException(
        "Cannot transfer FileHandle while in use",
        "DataCloneError",
      );
    }

    const handle = this[kHandle];
    this[kFd] = -1;
    this[kHandle] = null;
    this[kRefs] = 0;

    return {
      data: { handle },
      deserializeInfo: "internal/fs/promises:FileHandle",
    };
  }

  [kTransferList]() {
    return [this[kHandle]];
  }

  [kDeserialize]({ handle }) {
    this[kHandle] = handle;
    this[kFd] = handle.fd;
  }

  [kRef]() {
    this[kRefs]++;
  }

  [kUnref]() {
    this[kRefs]--;
    if (this[kRefs] === 0) {
      this[kFd] = -1;
      PromisePrototypeThen(
        this[kHandle].close(),
        this[kCloseResolve],
        this[kCloseReject],
      );
    }
  }
}

async function fsCall(fn, handle, ...args) {
  assert(
    handle[kRefs] !== undefined,
    "handle must be an instance of FileHandle",
  );

  if (handle.fd === -1) {
    // eslint-disable-next-line no-restricted-syntax
    const err = new Error("file closed");
    err.code = "EBADF";
    err.syscall = fn.name;
    throw err;
  }

  try {
    handle[kRef]();
    return await fn(handle, ...new SafeArrayIterator(args));
  } finally {
    handle[kUnref]();
  }
}

function checkAborted(signal) {
  if (signal?.aborted) {
    throw new AbortError();
  }
}

async function writeFileHandle(filehandle, data, signal, encoding) {
  checkAborted(signal);
  if (isCustomIterable(data)) {
    for await (const buf of data) {
      checkAborted(signal);
      const toWrite = isArrayBufferView(buf)
        ? buf
        : Buffer.from(buf, encoding || "utf8");
      let remaining = toWrite.byteLength;
      while (remaining > 0) {
        const writeSize = MathMin(kWriteFileMaxChunkSize, remaining);
        const { bytesWritten } = await write(
          filehandle,
          toWrite,
          toWrite.byteLength - remaining,
          writeSize,
        );
        remaining -= bytesWritten;
        checkAborted(signal);
      }
    }
    return;
  }
  data = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let remaining = data.byteLength;
  if (remaining === 0) return;
  do {
    checkAborted(signal);
    const { bytesWritten } = await write(
      filehandle,
      data,
      0,
      MathMin(kWriteFileMaxChunkSize, data.byteLength),
    );
    remaining -= bytesWritten;
    data = new Uint8Array(
      data.buffer,
      data.byteOffset + bytesWritten,
      data.byteLength - bytesWritten,
    );
  } while (remaining > 0);
}

// Note that unlike fs.open() which uses numeric file descriptors,
// fsPromises.open() uses the fs.FileHandle class.
async function open(path, flags, mode) {
  path = getValidatedPath(path);
  const flagsNumber = stringToFlags(flags);
  mode = parseFileMode(mode, "mode", 0o666);
  return new FileHandle(
    await binding.openFileHandle(
      pathModule.toNamespacedPath(path),
      flagsNumber,
      mode,
      kUsePromises,
    ),
  );
}

async function read(handle, bufferOrOptions, offset, length, position) {
  let buffer = bufferOrOptions;
  if (!isArrayBufferView(buffer)) {
    if (bufferOrOptions === undefined) {
      bufferOrOptions = {};
    }
    if (bufferOrOptions.buffer) {
      buffer = bufferOrOptions.buffer;
      validateBuffer(buffer);
    } else {
      buffer = Buffer.alloc(16384);
    }
    offset = bufferOrOptions.offset || 0;
    length = buffer.byteLength;
    position = bufferOrOptions.position || null;
  }

  if (offset == null) {
    offset = 0;
  } else {
    validateInteger(offset, "offset", 0);
  }

  length |= 0;

  if (length === 0) {
    return { bytesRead: length, buffer };
  }

  if (buffer.byteLength === 0) {
    throw new ERR_INVALID_ARG_VALUE(
      "buffer",
      buffer,
      "is empty and cannot be written",
    );
  }

  validateOffsetLengthRead(offset, length, buffer.byteLength);

  if (!NumberIsSafeInteger(position)) {
    position = -1;
  }

  const bytesRead = (await binding.read(
    handle.fd,
    buffer,
    offset,
    length,
    position,
    kUsePromises,
  )) || 0;

  return { bytesRead, buffer };
}

async function readv(handle, buffers, position) {
  validateBufferArray(buffers);

  if (typeof position !== "number") {
    position = null;
  }

  const bytesRead =
    (await binding.readBuffers(handle.fd, buffers, position, kUsePromises)) ||
    0;
  return { bytesRead, buffers };
}

async function write(handle, buffer, offset, length, position) {
  if (buffer?.byteLength === 0) {
    return { bytesWritten: 0, buffer };
  }

  if (isArrayBufferView(buffer)) {
    if (offset == null) {
      offset = 0;
    } else {
      validateInteger(offset, "offset", 0);
    }
    if (typeof length !== "number") {
      length = buffer.byteLength - offset;
    }
    if (typeof position !== "number") {
      position = null;
    }
    validateOffsetLengthWrite(offset, length, buffer.byteLength);
    const bytesWritten = (await binding.writeBuffer(
      handle.fd,
      buffer,
      offset,
      length,
      position,
      kUsePromises,
    )) || 0;
    return { bytesWritten, buffer };
  }

  validateStringAfterArrayBufferView(buffer, "buffer");
  validateEncoding(buffer, length);
  const bytesWritten = (await binding.writeString(
    handle.fd,
    buffer,
    offset,
    length,
    kUsePromises,
  )) || 0;
  return { bytesWritten, buffer };
}

async function writev(handle, buffers, position) {
  validateBufferArray(buffers);

  if (typeof position !== "number") {
    position = null;
  }

  const bytesWritten =
    (await binding.writeBuffers(handle.fd, buffers, position, kUsePromises)) ||
    0;
  return { bytesWritten, buffers };
}

async function fstat(handle, options = { bigint: false }) {
  const result = await binding.fstat(handle.fd, options.bigint, kUsePromises);
  return getStatsFromBinding(result);
}

async function writeFile(path, data, options) {
  options = getOptions(options, { encoding: "utf8", mode: 0o666, flag: "w" });
  const flag = options.flag || "w";

  if (!ArrayBuffer.isView(data) && !isCustomIterable(data)) {
    validateStringAfterArrayBufferView(data, "data");
    data = Buffer.from(data, options.encoding || "utf8");
  }

  validateAbortSignal(options.signal);
  if (path instanceof FileHandle) {
    return writeFileHandle(path, data, options.signal, options.encoding);
  }

  checkAborted(options.signal);

  const fd = await open(path, flag, options.mode);
  return SafePromisePrototypeFinally(
    writeFileHandle(fd, data, options.signal, options.encoding),
    fd.close,
  );
}

function isCustomIterable(obj) {
  return isIterable(obj) && !isArrayBufferView(obj) && typeof obj !== "string";
}

export function appendFile(path, data, options) {
  options = getOptions(options, { encoding: "utf8", mode: 0o666, flag: "a" });
  options = copyObject(options);
  options.flag = options.flag || "a";
  return writeFile(path, data, options);
}
