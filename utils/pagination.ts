// Copyright 2023 the Deno authors. All rights reserved. MIT license.

// This should not exceed 10 since denoKV Kv.getMany can't handle as input an array with more than 10 elements
export const PAGE_LENGTH = 10;

export function calcPageNum(url: URL) {
  return parseInt(url.searchParams.get("page") || "1");
}

export function calcLastPage(total = 0, pageLength = PAGE_LENGTH): number {
  return Math.ceil(total / pageLength);
}
