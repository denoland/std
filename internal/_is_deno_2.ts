// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// TODO(iuioiua): Remove this file when Deno 2 is released.
// deno-lint-ignore no-explicit-any
export const IS_DENO_2 = (globalThis as any).window === undefined;
