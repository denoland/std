// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { equals } from "./equals.ts";

/**
 * Returns `true` if they're logically equivalent, even if they're not the exact same version object.
 *
 * @deprecated (will be removed after 0.213.0) Use {@linkcode equals} instead.
 */
export const eq = equals;
