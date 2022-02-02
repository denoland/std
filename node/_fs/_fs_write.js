// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { Buffer } from "../buffer.ts";
import { validateInteger } from "../internal/validators.js";

export function writeSync(fd, bufferLike, ...args) {
  const [buffer, pos] = bufferAndPos(bufferLike, args);
  if (typeof pos === "number") {
    Deno.seekSync(fd, pos, Deno.SeekMode.Start);
  }
  return writeAllSync(fd, buffer);
}

export function write(fd, bufferLike, ...args) {
  const cb = args[args.length - 1];
  const [buffer, pos] = bufferAndPos(bufferLike, args.slice(0, -1));

  async function innerWrite() {
    if (typeof pos === "number") {
      await Deno.seek(fd, pos, Deno.SeekMode.Start);
    }
    return writeAll(fd, buffer);
  }

  innerWrite().then(
    (n) => cb(null, n, bufferLike),
    (e) => cb(e, 0, bufferLike),
  );
}

async function writeAll(fd, buf) {
  let nwritten = 0;
  while (nwritten < buf.length) {
    nwritten += await Deno.write(fd, buf.subarray(nwritten));
  }
  return nwritten;
}

function writeAllSync(fd, buf) {
  let nwritten = 0;
  while (nwritten < buf.length) {
    nwritten += Deno.writeSync(fd, buf.subarray(nwritten));
  }
  return nwritten;
}

function bufferAndPos(bufferLike, args) {
  if (typeof bufferLike === "string") {
    const [position, encoding] = args;
    return [Buffer.from(bufferLike.buffer, encoding), position];
  }

  const [offset, length, position] = args;
  if (typeof offset === "number") {
    validateInteger(offset, "offset", 0);
  }
  return [Buffer.from(bufferLike.buffer, offset, length), position];
}
