Provides utilities for formatting text of different types:

- [Human-readable bytes](https://jsr.io/@std/fmt/doc/bytes/~)
- [Styles for the CLI](https://jsr.io/@std/fmt/doc/colors/~)
- [Time duration](https://jsr.io/@std/fmt/doc/duration/~)
- [Printing formatted strings to stdout](https://jsr.io/@std/fmt/doc/printf/~)

```ts
import { format } from "@std/fmt/bytes";
import { red } from "@std/fmt/colors";

console.log(red(format(1337))); // Prints "1.34 kB"
```

# Runtime compatibility

[bytes](https://jsr.io/@std/fmt/doc/bytes/~),
[colors](https://jsr.io/@std/fmt/doc/colors/~), and
[duration](https://jsr.io/@std/fmt/doc/duration/~) supports all major runtimes.
[printf](https://jsr.io/@std/fmt/doc/printf/~) is mostly compatible with major
runtimes, however some of features, such as `%v`, `%i` and `%I` format
specifiers, are only available in Deno. See the API docs for details.
