// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { textFromReadableStream } from "./text_from_readable_stream.ts";

export function jsonFromReadableStream(
  readableStream: ReadableStream,
): Promise<unknown> {
  return textFromReadableStream(readableStream).then(JSON.parse);
}
