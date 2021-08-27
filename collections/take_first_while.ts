// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export function takeFirstWhile<T>(
  collection: Array<T>,
  predicate: (el: T) => boolean,
): Array<T> {
  if (collection.length === 0) {
    return [];
  }

  const newArray: Array<T> = [];

  for (const i of collection) {
    if (predicate(i)) {
      newArray.push(i);
    } else {
      break;
    }
  }

  return newArray;
}
