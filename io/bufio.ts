// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// io/bufio.ts is deprecated. See io/buffer.ts instead.

import * as buffer from "./buffer.ts";

/** @deprecated (will be removed after 0.157.0) Use BufferFullError from https://deno.land/std/io/buffer.ts instead. */
export const BufferFullError = buffer.BufferFullError;
/** @deprecated (will be removed after 0.157.0) Use PartialReadError from https://deno.land/std/io/buffer.ts instead. */
export const PartialReadError = buffer.PartialReadError;
/** @deprecated (will be removed after 0.157.0) Use ReadLineResult from https://deno.land/std/io/buffer.ts instead. */
export type ReadLineResult = buffer.ReadLineResult;
/** @deprecated (will be removed after 0.157.0) Use BufReader from https://deno.land/std/io/buffer.ts instead. */
export const BufReader = buffer.BufReader;
/** @deprecated (will be removed after 0.157.0) Use BufWriter from https://deno.land/std/io/buffer.ts instead. */
export const BufWriter = buffer.BufWriter;
/** @deprecated (will be removed after 0.157.0) Use BufWriterSync from https://deno.land/std/io/buffer.ts instead. */
export const BufWriterSync = buffer.BufWriterSync;
/** @deprecated (will be removed after 0.157.0) Use readDelim from https://deno.land/std/io/buffer.ts instead. */
export const readDelim = buffer.readDelim;
/** @deprecated (will be removed after 0.157.0) Use readStringDelim from https://deno.land/std/io/buffer.ts instead. */
export const readStringDelim = buffer.readStringDelim;
/** @deprecated (will be removed after 0.157.0) Use readLines from https://deno.land/std/io/buffer.ts instead. */
export const readLines = buffer.readLines;
