// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright @dsherret and dsherret/conditional-type-checks contributors. All rights reserved. MIT license.

import {
  Assert,
  assert,
  AssertFalse,
  AssertTrue,
  Has,
  IsAny,
  IsExact,
  IsNever,
  IsNullable,
  IsUnknown,
  NotHas,
} from "./types.ts";

// IsNullable
{
  // matching
  assert<IsNullable<string | null>>(true);
  assert<IsNullable<string | undefined>>(true);
  assert<IsNullable<null | undefined>>(true); // maybe this shouldn't be true?

  // not matching
  assert<IsNullable<string>>(false);
  assert<IsNullable<any>>(false);
  assert<IsNullable<never>>(false);
  assert<IsNullable<unknown>>(false);
}

// IsExact
{
  // matching
  assert<IsExact<string | number, string | number>>(true);
  assert<IsExact<string | number | Date, string | number | Date>>(true);
  assert<IsExact<string | undefined, string | undefined>>(true);
  assert<IsExact<any, any>>(true); // ok to have any for both
  assert<IsExact<unknown, unknown>>(true);
  assert<IsExact<never, never>>(true);
  assert<IsExact<{}, {}>>(true);
  assert<IsExact<{ prop: string }, { prop: string }>>(true);
  assert<IsExact<{ prop: { prop: string } }, { prop: { prop: string } }>>(true);
  assert<IsExact<{ prop: never }, { prop: never }>>(true);
  assert<IsExact<{ prop: any }, { prop: any }>>(true);
  assert<IsExact<{ prop: unknown }, { prop: unknown }>>(true);
  assert<IsExact<typeof globalThis, typeof globalThis>>(true);

  // not matching
  assert<IsExact<string | number | Date, string | number>>(false);
  assert<IsExact<string, string | number>>(false);
  assert<IsExact<string | undefined, string>>(false);
  assert<IsExact<string | undefined, any | string>>(false);
  assert<IsExact<any | string | undefined, string>>(false);
  assert<IsExact<string, any>>(false);
  assert<IsExact<string, unknown>>(false);
  assert<IsExact<string, never>>(false);
  assert<IsExact<never, never | string>>(false);
  assert<IsExact<unknown, any>>(false);
  assert<IsExact<never, any>>(false);
  assert<IsExact<Date | typeof globalThis, Date>>(false);
  assert<IsExact<{ name: string; other?: Date }, { name: string }>>(false);
  assert<IsExact<{ prop: Date }, { prop: string }>>(false);
  assert<IsExact<{ other?: Date }, { prop?: string }>>(false);
  assert<IsExact<{ prop: { prop?: string } }, { prop: { prop: string } }>>(
    false,
  );
  assert<IsExact<{ prop: any }, { prop: string }>>(false);
  assert<IsExact<{ prop: any }, { prop: unknown }>>(false);
  assert<IsExact<{ prop: any }, { prop: never }>>(false);
  assert<IsExact<{ prop: unknown }, { prop: never }>>(false);
  assert<IsExact<{ prop: { prop: unknown } }, { prop: { prop: any } }>>(false);
  assert<IsExact<{ prop: { prop: unknown } }, { prop: { prop: never } }>>(
    false,
  );
  assert<IsExact<{ prop: { prop: any } }, { prop: { prop: never } }>>(false);
  assert<IsExact<{ prop: string }, { prop: never }>>(false);
  assert<IsExact<{ prop: { prop: any } }, { prop: { prop: string } }>>(false);
  assert<
    IsExact<
      { prop: any } | { prop: string },
      { prop: number } | { prop: string }
    >
  >(false);
  assert<IsExact<{ prop: string | undefined }, { prop?: string }>>(false); // these are different
}

// Has
{
  // matching
  assert<Has<string | number, string>>(true);
  assert<Has<number, number>>(true);
  assert<Has<string | number, Date | string>>(true); // maybe?
  assert<Has<any, number>>(true);
  assert<Has<any, any>>(true);
  assert<Has<any, unknown>>(true);
  assert<Has<any, never>>(true);

  // not matching
  assert<Has<string | number, Date>>(false);
  assert<Has<string, number>>(false);
  assert<Has<number, any>>(false);
  assert<Has<unknown, any>>(false);
  assert<Has<never, any>>(false);
}

// NotHas
{
  // matching
  assert<NotHas<string | number, Date>>(true);
  assert<NotHas<string, number>>(true);

  // not matching
  assert<NotHas<string | number, string>>(false);
  assert<NotHas<number, number>>(false);
  assert<NotHas<string | number, Date | string>>(false); // should be true?
}

// IsAny
{
  // matching
  assert<IsAny<any>>(true);

  // not matching
  assert<IsAny<string>>(false);
  assert<IsAny<unknown>>(false);
  assert<IsAny<never>>(false);

  // tests for issue #3 (IsAny resolving to boolean)
  assert<IsExact<IsAny<string>, false>>(true);
  assert<IsExact<IsAny<5>, false>>(true);
}

// IsNever
{
  // matching
  assert<IsNever<never>>(true);

  // not matching
  assert<IsNever<string>>(false);
  assert<IsNever<any>>(false);
  assert<IsNever<unknown>>(false);
}

// IsUnknown
{
  // matching
  assert<IsUnknown<unknown>>(true);

  // not matching
  assert<IsUnknown<string>>(false);
  assert<IsUnknown<any>>(false);
  assert<IsUnknown<never>>(false);
}

// AssertTrue
{
  type test = AssertTrue<IsNever<never>>;
}

// AssertFalse
{
  type test = AssertFalse<IsNever<string>>;
}

// Assert
{
  type test =
    | Assert<Has<string | number, number>, true>
    | Assert<Has<string | number, Date>, false>;
}

// Recursive types
{
  type RecursiveType1 = string | number | Date | RecursiveType1[];
  assert<IsExact<RecursiveType1, RecursiveType1>>(true);
  type RecursiveType2 = {
    a: string;
    prop: RecursiveType2;
    sub: {
      prop: RecursiveType2;
      other: RecursiveType1;
    };
  };
  assert<IsExact<RecursiveType2, RecursiveType2>>(true);
  assert<IsExact<RecursiveType1, RecursiveType2>>(false);
}
