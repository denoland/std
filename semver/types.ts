// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * The possible release types are used as an operator for the
 * increment function and as a result of the difference function.
 */
export type ReleaseType =
  | "pre"
  | "major"
  | "premajor"
  | "minor"
  | "preminor"
  | "patch"
  | "prepatch"
  | "prerelease";

/**
 * SemVer comparison operators.
 */
export type Operator =
  | ""
  | "="
  | "=="
  | "==="
  | "!=="
  | "!="
  | ">"
  | ">="
  | "<"
  | "<=";

/**
 * The style to use when formatting a SemVer object into a string
 */
export type FormatStyle =
  | "full"
  | "release"
  | "primary"
  | "build"
  | "pre"
  | "patch"
  | "minor"
  | "major";
