Provides utilities for formatting text of different types:

- [Human-readable bytes](https://jsr.io/@std/fmt/doc/bytes/~)
- [Styles for the CLI](https://jsr.io/@std/fmt/doc/colors/~)

```ts
import { format } from "@std/fmt/bytes";
import { assertEquals } from "@std/assert";

assertEquals(format(1337), "1.34 kB");
assertEquals(format(100), "100 B");
```
