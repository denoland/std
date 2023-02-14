// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// deno-lint-ignore-file no-explicit-any
import { chunk } from "../collections/chunk.ts";
import { BytesList } from "../bytes/bytes_list.ts";
import { writeAll } from "../streams/write_all.ts";
import { readDelim } from "../io/read_delim.ts";

/** Redis command */
export type Command = (string | number | Uint8Array)[];
/** Redis reply */
export type Reply =
  | string
  | number
  | null
  | boolean
  | BigInt
  | Record<string, any>
  | Reply[];

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CRLF = "\r\n";
const CRLF_RAW = encoder.encode(CRLF);

const ARRAY_PREFIX_STRING = "*";
const BULK_STRING_PREFIX_STRING = "$";

const ARRAY_PREFIX = ARRAY_PREFIX_STRING.charCodeAt(0);
const ATTRIBUTE_PREFIX = "|".charCodeAt(0);
const BIG_NUMBER_PREFIX = "(".charCodeAt(0);
const BLOB_ERROR_PREFIX = "!".charCodeAt(0);
const BOOLEAN_PREFIX = "#".charCodeAt(0);
const BULK_STRING_PREFIX = BULK_STRING_PREFIX_STRING.charCodeAt(0);
const DOUBLE_PREFIX = ",".charCodeAt(0);
const ERROR_PREFIX = "-".charCodeAt(0);
const INTEGER_PREFIX = ":".charCodeAt(0);
const MAP_PREFIX = "%".charCodeAt(0);
const NULL_PREFIX = "_".charCodeAt(0);
const PUSH_PREFIX = ">".charCodeAt(0);
const SET_PREFIX = "~".charCodeAt(0);
const SIMPLE_STRING_PREFIX = "+".charCodeAt(0);
const VERBATIM_STRING_PREFIX = "=".charCodeAt(0);

const STREAMED_REPLY_START_DELIMITER = "?".charCodeAt(0);
const STREAMED_STRING_END_DELIMITER = ";0";
const STREAMED_AGGREGATE_END_DELIMITER = ".";

/**
 * Sections:
 * 1. Request
 * 2. Reply
 * 3. Combined
 */

/** 1. Request */

function createRawRequest(command: Command): Uint8Array {
  const lines = new BytesList();
  lines.add(encoder.encode(ARRAY_PREFIX_STRING + command.length + CRLF));
  for (const arg of command) {
    const bytes = arg instanceof Uint8Array
      ? arg
      : encoder.encode(arg.toString());
    lines.add(
      encoder.encode(BULK_STRING_PREFIX_STRING + bytes.byteLength + CRLF),
    );
    lines.add(bytes);
    lines.add(encoder.encode(CRLF));
  }
  return lines.concat();
}

function createStringRequest(command: (string | number)[]): Uint8Array {
  let string = ARRAY_PREFIX_STRING + command.length + CRLF;
  for (const arg of command) {
    string += BULK_STRING_PREFIX_STRING + arg.toString().length + CRLF;
    string += arg + CRLF;
  }
  return encoder.encode(string);
}

/**
 * Transforms a command, which is an array of arguments, into an RESP request.
 *
 * See {@link https://redis.io/docs/reference/protocol-spec/#send-commands-to-a-redis-server}
 */
function createRequest(command: Command): Uint8Array {
  return command.some((arg) => arg instanceof Uint8Array)
    ? createRawRequest(command)
    : createStringRequest(command as (string | number)[]);
}

/**
 * Just writes a command to the Redis server.
 *
 * Example:
 * ```ts
 * import { writeCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";
 *
 * const redisConn = await Deno.connect({ port: 6379 });
 *
 * await writeCommand(redisConn, ["SHUTDOWN"]);
 * ```
 */
export async function writeCommand(
  writer: Deno.Writer,
  command: Command,
): Promise<void> {
  await writeAll(writer, createRequest(command));
}

/** 2. Reply */

function removePrefix(line: Uint8Array): string {
  return decoder.decode(line.slice(1));
}

function isSteamedReply(line: Uint8Array): boolean {
  return line[1] === STREAMED_REPLY_START_DELIMITER;
}

function toObject(array: any[]): Record<string, any> {
  return Object.fromEntries(chunk(array, 2));
}

async function readNReplies(
  length: number,
  iterator: AsyncIterableIterator<Uint8Array>,
  raw = false,
): Promise<Reply[]> {
  const replies: Reply[] = [];
  for (let i = 0; i < length; i++) {
    replies.push(await readReply(iterator, raw));
  }
  return replies;
}

async function readStreamedReply(
  delimiter: string,
  iterator: AsyncIterableIterator<Uint8Array>,
  raw = false,
): Promise<Reply[]> {
  const replies: Reply[] = [];
  while (true) {
    const reply = await readReply(iterator, raw);
    if (reply === delimiter) {
      break;
    }
    replies.push(reply);
  }
  return replies;
}

async function readArray(
  line: Uint8Array,
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<null | Reply[]> {
  const length = readNumber(line);
  return length === -1 ? null : await readNReplies(length, iterator);
}

/**
 * Read but don't return attribute data.
 *
 * @todo include attribute data somehow
 */
async function readAttribute(
  line: Uint8Array,
  iterator: AsyncIterableIterator<Uint8Array>,
  raw = false,
): Promise<null | Reply> {
  await readMap(line, iterator);
  return await readReply(iterator, raw);
}

function readBigNumber(line: Uint8Array): BigInt {
  return BigInt(removePrefix(line));
}

async function readBlobError(
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<never> {
  /** Skip to reading the next line, which is a string */
  const { value } = await iterator.next();
  return await Promise.reject(decoder.decode(value));
}

function readBoolean(line: Uint8Array): boolean {
  return removePrefix(line) === "t";
}

/** Also reads verbatim string */
async function readBulkString(
  line: Uint8Array,
  iterator: AsyncIterableIterator<Uint8Array>,
  raw = false,
): Promise<string | null> {
  if (readNumber(line) === -1) {
    return null;
  }
  const { value } = await iterator.next();
  return raw ? value : decoder.decode(value);
}

async function readError(line: Uint8Array): Promise<never> {
  return await Promise.reject(removePrefix(line));
}

async function readMap(
  line: Uint8Array,
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<Record<string, any>> {
  const length = readNumber(line) * 2;
  const array = await readNReplies(length, iterator);
  return toObject(array);
}

/** Reads an integer or double */
function readNumber(line: Uint8Array): number {
  const number = removePrefix(line);
  switch (number) {
    case "inf":
      return Infinity;
    case "-inf":
      return -Infinity;
    default:
      return Number(number);
  }
}

async function readSet(
  line: Uint8Array,
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<Set<Reply>> {
  return new Set(await readArray(line, iterator));
}

function readSimpleString(line: Uint8Array): string {
  return removePrefix(line);
}

async function readStreamedArray(
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<Reply[]> {
  return await readStreamedReply(STREAMED_AGGREGATE_END_DELIMITER, iterator);
}

async function readStreamedMap(
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<Record<string, any>> {
  const array = await readStreamedReply(
    STREAMED_AGGREGATE_END_DELIMITER,
    iterator,
  );
  return toObject(array);
}

async function readStreamedSet(
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<Set<Reply>> {
  return new Set(await readStreamedArray(iterator));
}

async function readStreamedString(
  iterator: AsyncIterableIterator<Uint8Array>,
): Promise<string> {
  return (await readStreamedReply(STREAMED_STRING_END_DELIMITER, iterator))
    /** Remove byte counts */
    .filter((line) => !(line as string).startsWith(";"))
    .join("");
}

/**
 * Reads and processes the response line-by-line.
 *
 * See {@link https://redis.io/docs/reference/protocol-spec/#resp-protocol-description}
 */
export async function readReply(
  iterator: AsyncIterableIterator<Uint8Array>,
  raw = false,
): Promise<Reply> {
  const { value } = await iterator.next();
  if (value.length === 0) {
    return await Promise.reject(new TypeError("No reply received"));
  }
  switch (value[0]) {
    case ARRAY_PREFIX:
    case PUSH_PREFIX:
      return isSteamedReply(value)
        ? await readStreamedArray(iterator)
        : await readArray(value, iterator);
    case ATTRIBUTE_PREFIX:
      return await readAttribute(value, iterator);
    case BIG_NUMBER_PREFIX:
      return readBigNumber(value);
    case BLOB_ERROR_PREFIX:
      return readBlobError(iterator);
    case BOOLEAN_PREFIX:
      return readBoolean(value);
    case BULK_STRING_PREFIX:
    case VERBATIM_STRING_PREFIX:
      return isSteamedReply(value)
        ? await readStreamedString(iterator)
        : await readBulkString(value, iterator, raw);
    case DOUBLE_PREFIX:
    case INTEGER_PREFIX:
      return readNumber(value);
    case ERROR_PREFIX:
      return readError(value);
    case MAP_PREFIX:
      return isSteamedReply(value)
        ? await readStreamedMap(iterator)
        : await readMap(value, iterator);
    case NULL_PREFIX:
      return null;
    case SET_PREFIX:
      return isSteamedReply(value)
        ? await readStreamedSet(iterator)
        : await readSet(value, iterator);
    case SIMPLE_STRING_PREFIX:
      return readSimpleString(value);
    /** No prefix */
    default:
      return decoder.decode(value);
  }
}

/** 3. Combined */

/**
 * Sends a command to the Redis server and returns the parsed reply.
 *
 * Example:
 * ```ts
 * import { sendCommand } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";
 *
 * const redisConn = await Deno.connect({ port: 6379 });
 *
 * // Returns "OK"
 * await sendCommand(redisConn, ["SET", "hello", "world"]);
 *
 * // Returns "world"
 * await sendCommand(redisConn, ["GET", "hello"]);
 * ```
 */
export async function sendCommand(
  redisConn: Deno.Conn,
  command: Command,
  raw = false,
): Promise<Reply> {
  await writeCommand(redisConn, command);
  return await readReply(readDelim(redisConn, CRLF_RAW), raw);
}

/**
 * Pipelines commands to the Redis server and returns the parsed replies.
 *
 * Example:
 * ```ts
 * import { pipelineCommands } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";
 *
 * const redisConn = await Deno.connect({ port: 6379 });
 *
 * // Returns [1, 2, 3, 4]
 * await pipelineCommands(redisConn, [
 *  ["INCR", "X"],
 *  ["INCR", "X"],
 *  ["INCR", "X"],
 *  ["INCR", "X"],
 * ]);
 * ```
 */
export async function pipelineCommands(
  redisConn: Deno.Conn,
  commands: Command[],
): Promise<Reply[]> {
  const requests = new BytesList();
  commands
    .map(createRequest)
    .forEach((request) => requests.add(request));
  await writeAll(redisConn, requests.concat());
  return readNReplies(commands.length, readDelim(redisConn, CRLF_RAW));
}

/**
 * Used for pub/sub. Listens for replies from the Redis server.
 *
 * Example:
 * ```ts
 * import { writeCommand, readReplies } from "https://deno.land/std@$STD_VERSION/redis/mod.ts";
 *
 * const redisConn = await Deno.connect({ port: 6379 });
 *
 * await writeCommand(redisConn, ["SUBSCRIBE", "mychannel"]);
 *
 * for await (const reply of readReplies(redisConn)) {
 *   // Prints ["subscribe", "mychannel", 1] first iteration
 *   console.log(reply);
 * }
 * ```
 */
export async function* readReplies(
  redisConn: Deno.Conn,
  raw = false,
): AsyncIterableIterator<Reply> {
  const iterator = readDelim(redisConn, CRLF_RAW);
  while (true) {
    yield await readReply(iterator, raw);
  }
}
