// Copyright 2018-2026 the Deno authors. MIT license.
// deno-lint-ignore-file

import { assertType } from "./types.ts";
import type { IsMutuallyAssignable } from "./unstable_types.ts";

// IsMutuallyAssignable
{
  // matching
  assertType<IsMutuallyAssignable<string | (string & Date), string>>(true);
  assertType<IsMutuallyAssignable<string & (string | Date), string>>(true);
  assertType<
    IsMutuallyAssignable<string, string | (string & RegExpMatchArray)>
  >(true);
  assertType<
    IsMutuallyAssignable<(Date & string) | (string & Date), Date & string>
  >(
    true,
  );
  assertType<IsMutuallyAssignable<never, 0 & 1>>(true);

  // not matching
  assertType<IsMutuallyAssignable<string & RegExpMatchArray, string>>(false);
  assertType<IsMutuallyAssignable<string | RegExpMatchArray, string>>(false);
  assertType<IsMutuallyAssignable<string | number, Date>>(false);
  assertType<IsMutuallyAssignable<string, number>>(false);
  assertType<IsMutuallyAssignable<never, any>>(false);
}
