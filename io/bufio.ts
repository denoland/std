// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// io/bufio.ts is deprecated. See io/buffer.ts instead.

import * as buffer from "./buffer.ts";

/** @deprecated */
export const BufferFullError = buffer.BufferFullError;
/** @deprecated */
export const PartialReadError = buffer.PartialReadError;
/** @deprecated */
export type ReadLineResult = buffer.ReadLineResult;
/** @deprecated */
export const BufReader = buffer.BufReader;
/** @deprecated */
export const BufWriter = buffer.BufWriter;
/** @deprecated */
export const BufWriterSync = buffer.BufWriterSync;
/** @deprecated */
export const readDelim = buffer.readDelim;
/** @deprecated */
export const readStringDelim = buffer.readStringDelim;
/** @deprecated */
export const readLines = buffer.readLines;
