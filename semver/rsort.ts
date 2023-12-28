// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { reverseSort } from "./reverse_sort.ts";

/**
 * Sorts a list of semantic versions in descending order.
 * @deprecated (will be removed after 0.212.0) Use {@linkcode reverseSort} instead.
 */
export const rsort = reverseSort;
