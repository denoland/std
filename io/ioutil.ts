// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// io/ioutil.ts is deprecated. The items were moved to `io/util.ts`

import * as util from "./util.ts";

/** @deprecated Use copyN from https://deno.land/std/io/util.ts instead. */
export const copyN = util.copyN;
/** @deprecated Use readShort from https://deno.land/std/io/util.ts instead. */
export const readShort = util.readShort;
/** @deprecated Use readInt from https://deno.land/std/io/util.ts instead. */
export const readInt = util.readInt;
/** @deprecated Use readLong from https://deno.land/std/io/util.ts instead. */
export const readLong = util.readLong;
/** @deprecated Use readLongToBytes from https://deno.land/std/io/util.ts instead. */
export const sliceLongToBytes = util.sliceLongToBytes;
