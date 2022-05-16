import { BufReader } from "../../../io/buffer.ts";
import type * as types from "./types.ts";
import { EOFError, ErrorReplyError, InvalidStateError } from "../errors.ts";
import { decoder, encoder } from "./_util.ts";

const IntegerReplyCode = ":".charCodeAt(0);
const BulkReplyCode = "$".charCodeAt(0);
const SimpleStringCode = "+".charCodeAt(0);
const ArrayReplyCode = "*".charCodeAt(0);
const ErrorReplyCode = "-".charCodeAt(0);

export async function readReply(reader: BufReader): Promise<types.RedisReply> {
  const res = await reader.peek(1);
  if (res == null) {
    throw new EOFError();
  }

  const code = res[0];
  if (code === ErrorReplyCode) {
    await tryReadErrorReply(reader);
  }

  switch (code) {
    case IntegerReplyCode:
      return IntegerReply.decode(reader);
    case SimpleStringCode:
      return SimpleStringReply.decode(reader);
    case BulkReplyCode:
      return BulkReply.decode(reader);
    case ArrayReplyCode:
      return ArrayReply.decode(reader);
    default:
      throw new InvalidStateError(
        `unknown code: '${String.fromCharCode(code)}' (${code})`,
      );
  }
}

abstract class BaseReply implements types.RedisReply {
  constructor(readonly code: number) {}

  buffer(): Uint8Array {
    throw createDecodeError(this.code, "buffer");
  }

  string(): string {
    throw createDecodeError(this.code, "string");
  }

  bulk(): types.Bulk {
    throw createDecodeError(this.code, "bulk");
  }

  integer(): types.Integer {
    throw createDecodeError(this.code, "integer");
  }

  array(): types.ConditionalArray {
    throw createDecodeError(this.code, "array");
  }

  abstract value(): types.Raw;
}

class SimpleStringReply extends BaseReply {
  static async decode(reader: BufReader): Promise<types.RedisReply> {
    const body = await readSimpleStringReplyBody(reader);
    return new SimpleStringReply(body);
  }

  readonly #body: Uint8Array;
  constructor(body: Uint8Array) {
    super(SimpleStringCode);
    this.#body = body;
  }

  override bulk() {
    return this.string();
  }

  override buffer() {
    return this.#body;
  }

  override string() {
    return decoder.decode(this.#body);
  }

  override value() {
    return this.string();
  }
}

class BulkReply extends BaseReply {
  static async decode(reader: BufReader): Promise<types.RedisReply> {
    const body = await readBulkReplyBody(reader);
    return new BulkReply(body);
  }

  readonly #body: Uint8Array | null;
  private constructor(body: Uint8Array | null) {
    super(BulkReplyCode);
    this.#body = body;
  }

  override bulk() {
    return this.#body ? decoder.decode(this.#body) : undefined;
  }

  override buffer() {
    return this.#body ?? new Uint8Array();
  }

  override string() {
    return decoder.decode(this.#body ?? new Uint8Array());
  }

  override value() {
    return this.bulk();
  }
}

class IntegerReply extends BaseReply {
  static async decode(reader: BufReader): Promise<types.RedisReply> {
    const body = await readIntegerReplyBody(reader);
    return new IntegerReply(body);
  }

  readonly #body: Uint8Array;
  private constructor(body: Uint8Array) {
    super(IntegerReplyCode);
    this.#body = body;
  }

  override integer() {
    return parseInt(decoder.decode(this.#body));
  }

  override string() {
    return this.integer().toString();
  }

  override value() {
    return this.integer();
  }
}

class ArrayReply extends BaseReply {
  static async decode(reader: BufReader): Promise<types.RedisReply> {
    const body = await readArrayReplyBody(reader);
    return new ArrayReply(body);
  }

  readonly #body: types.ConditionalArray;
  private constructor(body: types.ConditionalArray) {
    super(ArrayReplyCode);
    this.#body = body;
  }

  override array() {
    return this.#body;
  }

  override value() {
    return this.array();
  }
}

async function readIntegerReplyBody(reader: BufReader): Promise<Uint8Array> {
  const line = await readLine(reader);
  if (line == null) {
    throw new InvalidStateError();
  }

  return line.subarray(1, line.length);
}

async function readBulkReplyBody(
  reader: BufReader,
): Promise<Uint8Array | null> {
  const line = await readLine(reader);
  if (line == null) {
    throw new InvalidStateError();
  }

  if (line[0] !== BulkReplyCode) {
    tryParseErrorReply(line);
  }

  const size = parseSize(line);
  if (size < 0) {
    // nil bulk reply
    return null;
  }

  const dest = new Uint8Array(size + 2);
  await reader.readFull(dest);
  return dest.subarray(0, dest.length - 2); // Strip CR and LF
}

async function readSimpleStringReplyBody(
  reader: BufReader,
): Promise<Uint8Array> {
  const line = await readLine(reader);
  if (line == null) {
    throw new InvalidStateError();
  }

  if (line[0] !== SimpleStringCode) {
    tryParseErrorReply(line);
  }
  return line.subarray(1, line.length);
}

export async function readArrayReplyBody(
  reader: BufReader,
): Promise<types.ConditionalArray> {
  const line = await readLine(reader);
  if (line == null) {
    throw new InvalidStateError();
  }

  const argCount = parseSize(line);
  const array: types.ConditionalArray = [];
  for (let i = 0; i < argCount; i++) {
    const res = await reader.peek(1);
    if (res === null) {
      throw new EOFError();
    }

    const code = res[0];
    switch (code) {
      case SimpleStringCode: {
        const reply = await SimpleStringReply.decode(reader);
        array.push(reply.string());
        break;
      }
      case BulkReplyCode: {
        const reply = await BulkReply.decode(reader);
        array.push(reply.bulk());
        break;
      }
      case IntegerReplyCode: {
        const reply = await IntegerReply.decode(reader);
        array.push(reply.integer());
        break;
      }
      case ArrayReplyCode: {
        const reply = await ArrayReply.decode(reader);
        array.push(reply.value());
        break;
      }
    }
  }
  return array;
}

export const okReply = new SimpleStringReply(encoder.encode("OK"));

function tryParseErrorReply(line: Uint8Array): never {
  const code = line[0];
  if (code === ErrorReplyCode) {
    throw new ErrorReplyError(decoder.decode(line));
  }
  throw new Error(`invalid line: ${line}`);
}

async function tryReadErrorReply(reader: BufReader): Promise<never> {
  const line = await readLine(reader);
  if (line == null) {
    throw new InvalidStateError();
  }
  tryParseErrorReply(line);
}

async function readLine(reader: BufReader): Promise<Uint8Array> {
  const result = await reader.readLine();
  if (result == null) {
    throw new InvalidStateError();
  }

  const { line } = result;
  return line;
}

function parseSize(line: Uint8Array): number {
  const sizeStr = line.subarray(1, line.length);
  const size = parseInt(decoder.decode(sizeStr));
  return size;
}

function createDecodeError(code: number, expectedType: string): Error {
  return new InvalidStateError(
    `cannot decode '${
      String.fromCharCode(code)
    }' type as \`${expectedType}\` value`,
  );
}
