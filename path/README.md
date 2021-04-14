# Deno Path Manipulation Libraries

Usage:

```ts
import * as path from "https://deno.land/std@$STD_VERSION/path/mod.ts";
```

### globToRegExp

Generate a regex based on glob pattern and options This was meant to be using
the `fs.walk` function but can be used anywhere else.

_Note: On Windows systems, generated regex will be case-insensitive by default_

```ts
import { globToRegExp } from "https://deno.land/std@$STD_VERSION/path/glob.ts";

globToRegExp("foo/**/*.json", {
  flags: "g",
  extended: true,
  globstar: true,
}); // returns the regex to find all .json files in the folder foo.
```
