Provides utilities for formatting text of different types:

- [Human-readable bytes](https://jsr.io/@std/fmt/doc/bytes/~)
- [Styles for the CLI](https://jsr.io/@std/fmt/doc/colors/~)
- [Time duration](https://jsr.io/@std/fmt/doc/duration/~)
- [Printing formatted strings to stdout](https://jsr.io/@std/fmt/doc/printf/~)

```ts
import { format } from "@std/fmt/bytes";
import { assertEquals } from "@std/assert";

assertEquals(format(1337), "1.34 kB");
assertEquals(format(100), "100 B");
```
