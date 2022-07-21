// deno-lint-ignore-file no-explicit-any
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Original author: @dsherret https://github.com/dsherret/conditional-type-checks

import { assertType, IsAny, IsExact } from "./assert_type.ts";

// IsExact
{
  // matching
  assertType<IsExact<string | number, string | number>>(true);
  assertType<IsExact<string | number | Date, string | number | Date>>(true);
  assertType<IsExact<string | undefined, string | undefined>>(true);
  assertType<IsExact<any, any>>(true); // ok to have any for both
  assertType<IsExact<unknown, unknown>>(true);
  assertType<IsExact<never, never>>(true);
  // deno-lint-ignore ban-types
  assertType<IsExact<{}, {}>>(true);
  assertType<IsExact<{ prop: string }, { prop: string }>>(true);
  assertType<IsExact<{ prop: { prop: string } }, { prop: { prop: string } }>>(
    true,
  );
  assertType<IsExact<{ prop: never }, { prop: never }>>(true);
  assertType<IsExact<{ prop: any }, { prop: any }>>(true);
  assertType<IsExact<{ prop: unknown }, { prop: unknown }>>(true);
  assertType<IsExact<Window, Window>>(true);

  // not matching
  assertType<IsExact<string | number | Date, string | number>>(false);
  assertType<IsExact<string, string | number>>(false);
  assertType<IsExact<string | undefined, string>>(false);
  assertType<IsExact<string | undefined, any | string>>(false);
  assertType<IsExact<any | string | undefined, string>>(false);
  assertType<IsExact<string, any>>(false);
  assertType<IsExact<string, unknown>>(false);
  assertType<IsExact<string, never>>(false);
  assertType<IsExact<never, never | string>>(false);
  assertType<IsExact<unknown, any>>(false);
  assertType<IsExact<never, any>>(false);
  assertType<IsExact<Date | Window, Date>>(false);
  assertType<IsExact<{ name: string; other?: Date }, { name: string }>>(false);
  assertType<IsExact<{ prop: Date }, { prop: string }>>(false);
  assertType<IsExact<{ other?: Date }, { prop?: string }>>(false);
  assertType<IsExact<{ prop: { prop?: string } }, { prop: { prop: string } }>>(
    false,
  );
  assertType<IsExact<{ prop: any }, { prop: string }>>(false);
  assertType<IsExact<{ prop: any }, { prop: unknown }>>(false);
  assertType<IsExact<{ prop: any }, { prop: never }>>(false);
  assertType<IsExact<{ prop: unknown }, { prop: never }>>(false);
  assertType<IsExact<{ prop: { prop: unknown } }, { prop: { prop: any } }>>(
    false,
  );
  assertType<IsExact<{ prop: { prop: unknown } }, { prop: { prop: never } }>>(
    false,
  );
  assertType<IsExact<{ prop: { prop: any } }, { prop: { prop: never } }>>(
    false,
  );
  assertType<IsExact<{ prop: string }, { prop: never }>>(false);
  assertType<IsExact<{ prop: { prop: any } }, { prop: { prop: string } }>>(
    false,
  );
  assertType<
    IsExact<
      { prop: any } | { prop: string },
      { prop: number } | { prop: string }
    >
  >(false);
  assertType<IsExact<{ prop: string | undefined }, { prop?: string }>>(false); // these are different
}

// IsAny
{
  // matching
  assertType<IsAny<any>>(true);

  // not matching
  assertType<IsAny<string>>(false);
  assertType<IsAny<unknown>>(false);
  assertType<IsAny<never>>(false);

  // tests for issue #3 (IsAny resolving to boolean)
  assertType<IsExact<IsAny<string>, false>>(true);
  assertType<IsExact<IsAny<5>, false>>(true);
}
