# `std/uuid`

Generate and validate v1, v4, and v5 UUIDs.

## Examples

### Generate and validate a v4 (random) UUID

```ts
import { v4 } from "https://deno.land/std@$STD_VERSION/uuid/mod.ts";

// Generate a v4 UUID. For this we use the browser standard `crypto.randomUUID`
// function.
const myUUID = crypto.randomUUID();

// Validate the v4 UUID.
const isValid = v4.validate(myUUID);
```

### Generate and validate a v5 (SHA-1 digest) UUID

```ts
import { v5 } from "https://deno.land/std@$STD_VERSION/uuid/mod.ts";

const data = new TextEncoder().encode("Hello World!");

// Generate a v5 UUID using a namespace and some data.
const myUUID = await v5.generate("6ba7b810-9dad-11d1-80b4-00c04fd430c8", data);

// Validate the v5 UUID.
const isValid = v5.validate(myUUID);
```
