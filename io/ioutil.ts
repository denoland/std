// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// io/ioutil.ts is deprecated. The items were moved to `io/util.ts`

import * as util from "./util.ts";

/** @deprecated (will be removed after 0.157.0) Use copyN from https://deno.land/std/io/util.ts instead. */
export const copyN = util.copyN;
/** @deprecated (will be removed after 0.157.0) Use readShort from https://deno.land/std/io/util.ts instead. */
export const readShort = util.readShort;
/** @deprecated (will be removed after 0.157.0) Use readInt from https://deno.land/std/io/util.ts instead. */
export const readInt = util.readInt;
/** @deprecated (will be removed after 0.157.0) Use readLong from https://deno.land/std/io/util.ts instead. */
export const readLong = util.readLong;
/** @deprecated (will be removed after 0.157.0) Use readLongToBytes from https://deno.land/std/io/util.ts instead. */
export const sliceLongToBytes = util.sliceLongToBytes;
