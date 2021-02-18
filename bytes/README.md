# Bytes

The bytes module provides helper functions to manipulate byte slices.

# Usage

The following functions are exposed in `mod.ts`.

## indexOf

Finds the first index of a binary pattern within a given binary array, or
returns -1 if the pattern is not present.

```typescript
import { indexOf } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

indexOf(
  new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
  new Uint8Array([0, 1, 2]),
); // => returns 2

indexOf(
  new Uint8Array([1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 3]),
  new Uint8Array([0, 1, 2]),
  3,
); // => returns 5
```

## lastIndexOf

Finds the last index of a binary pattern within a given binary array, or
returns -1 if the pattern is not present.

```typescript
import { lastIndexOf } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

lastIndexOf(
  new Uint8Array([0, 1, 2, 3, 3, 0, 1, 2]),
  new Uint8Array([0, 1, 2]),
); // => returns 5

lastIndexOf(
  new Uint8Array([0, 1, 2, 3, 3, 0, 1, 2]),
  new Uint8Array([0, 1, 2]),
  3,
); // => returns 0
```

## equals

Checks whether two given binary arrays are equal to each other.

```typescript
import { equals } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

equals(new Uint8Array([0, 1, 2, 3]), new Uint8Array([0, 1, 2, 3])); // returns true
equals(new Uint8Array([0, 1, 2, 3]), new Uint8Array([0, 1, 2, 4])); // returns false
```

## startsWith

Checks whether a binary array starts with a binary array prefix.

```typescript
import { startsWith } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1])); // returns true
startsWith(new Uint8Array([0, 1, 2]), new Uint8Array([1, 2])); // returns false
```

## endsWith

Checks whether binary array ends with a binary array suffix.

```typescript
import { endsWith } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

endsWith(new Uint8Array([0, 1, 2]), new Uint8Array([0, 1])); // returns false
endsWith(new Uint8Array([0, 1, 2]), new Uint8Array([1, 2])); // returns true
```

## repeat

Creates a binary array consisting of multiple copies of a given binary array.

```typescript
import { repeat } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

repeat(new Uint8Array([1]), 3); // returns Uint8Array(3) [ 1, 1, 1 ]
```

## concat

Concatenates multiple binary arrays into a new one.

```typescript
import { concat } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

concat(new Uint8Array([1, 2]), new Uint8Array([3, 4])); // returns Uint8Array(4) [ 1, 2, 3, 4 ]

concat(
  new Uint8Array([1, 2]),
  new Uint8Array([3, 4]),
  new Uint8Array([5, 6]),
  new Uint8Array([7, 8]),
); // => returns Uint8Array(8) [ 1, 2, 3, 4, 5, 6, 7, 8 ]
```

## contains

Checks that a given binary array contains a sequence corresponding to a pattern array.

```typescript
import { contains } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

contains(
  new Uint8Array([1, 2, 0, 1, 2, 0, 2, 1, 3]),
  new Uint8Array([0, 1, 2]),
); // => returns true

contains(
  new Uint8Array([1, 2, 0, 1, 2, 0, 2, 1, 3]),
  new Uint8Array([2, 2]),
); // => returns false
```

## copy

Copies bytes from one binary array to another one.

```typescript
import { copy } from "https://deno.land/std@$STD_VERSION/bytes/mod.ts";

const dest = new Uint8Array(4);
const src = Uint8Array.of(1, 2, 3, 4);
const len = copy(src, dest); // returns len = 4
```
