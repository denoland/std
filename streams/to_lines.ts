// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Converts a ReadableStream of `Uint8Array` or `string` into an
 * `AsyncGenerator` of `string`, where each value is divided by a newline at
 * `\n` or `\r\n`. Trimming the last line if it is empty.
 *
 * @param readable A `ReadableStream` of `Uint8Array` or `string`.
 * @returns An `AsyncGenerator<string>`
 *
 * @example JSON Lines
 * ```ts
 * import { toLines } from "@std/streams/to-lines";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const readable = ReadableStream.from([
 *   '{"name": "Alice", "age": ',
 *   '30}\r\n{"name": "Bob", "age"',
 *   ": 25}\n",
 * ]);
 *
 * type Person = { name: string, age: number };
 *
 * const people: Person[] = []
 * for await (const line of toLines(readable)) {
 *   people.push(JSON.parse(line) as Person)
 * }
 *
 * assertEquals(
 *   people,
 *   [{ "name": "Alice", "age": 30 }, { "name": "Bob", "age": 25 }],
 * );
 * ```
 */
export async function* toLines(
  readable: ReadableStream<Uint8Array> | ReadableStream<string>,
): AsyncGenerator<string> {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let index = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += typeof value === "string" ? value : decoder.decode(value);
      while (index < buffer.length) {
        if (buffer[index] === "\n") {
          yield buffer.slice(0, index - (buffer[index - 1] === "\r" ? 1 : 0));
          buffer = buffer.slice(index + 1);
          index = 0;
        } else {
          ++index;
        }
      }
    }
    if (buffer.length) {
      yield buffer;
    }
  } catch (reason) {
    await reader.cancel(reason);
  }
}

