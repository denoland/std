// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { AssertionError } from "../assert/assertion_error.ts";
import { equal } from "../assert/equal.ts";
import { inspectArg } from "./_inspect_args.ts";
import { MatcherContext, MatchResult } from "./_types.ts";

export function toHaveProperty(
  context: MatcherContext,
  propName: string | string[],
  v?: unknown,
): MatchResult {
  const { value } = context;

  let propPath = [] as string[];
  if (Array.isArray(propName)) {
    propPath = propName;
  } else {
    propPath = propName.split(".");
  }

  let current = value as any;
  while (true) {
    if (current === undefined || current === null) {
      break;
    }
    if (propPath.length === 0) {
      break;
    }
    const prop = propPath.shift()!;
    current = current[prop];
  }

  let hasProperty;
  if (v) {
    hasProperty = current !== undefined && propPath.length === 0 &&
      equal(current, v);
  } else {
    hasProperty = current !== undefined && propPath.length === 0;
  }

  let ofValue = "";
  if (v) {
    ofValue = ` of the value ${inspectArg(v)}`;
  }

  if (context.isNot) {
    if (hasProperty) {
      throw new AssertionError(
        `Expected the value not to have the property ${
          propPath.join(".")
        }${ofValue}, but it does.`,
      );
    }
  } else {
    if (!hasProperty) {
      throw new AssertionError(
        `Expected the value to have the property ${
          propPath.join(".")
        }${ofValue}, but it does not.`,
      );
    }
  }
}
