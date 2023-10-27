# Deno Standard Library

[![codecov](https://codecov.io/gh/denoland/deno_std/branch/main/graph/badge.svg?token=w6s3ODtULz)](https://codecov.io/gh/denoland/deno_std)
[![ci](https://github.com/denoland/deno_std/actions/workflows/ci.yml/badge.svg)](https://github.com/denoland/deno_std/actions/workflows/ci.yml)

High-quality APIs for [Deno](https://deno.com/) and the web. Use fearlessly.

## Get Started

```ts
import { copy } from "https://deno.land/std@$STD_VERSION/fs/copy.ts";

await copy("./foo", "./bar");
```

See [here](#recommended-usage-patterns) for recommended usage patterns.

## Documentation

Check out the documentation [here](https://deno.land/std?doc).

## Recommended Usage Patterns

1. Include the version of the library in the import specifier.

   Good:
   ```ts
   import { copy } from "https://deno.land/std@0.204.0/fs/copy.ts";
   ```

1. Only import modules that you require.

   Bad (when using only one function):
   ```ts
   import * as fs from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
   ```

   Good (when using only one function):
   ```ts
   import { copy } from "https://deno.land/std@$STD_VERSION/fs/copy.ts";
   ```

   Good (when using multiple functions):
   ```ts
   import * as fs from "https://deno.land/std@$STD_VERSION/fs/mod.ts";
   ```

1. Do not import symbols with an underscore in the name.

   Bad:
   ```ts
   import { _format } from "https://deno.land/std@$STD_VERSION/path/_common/format.ts";
   ```

1. Do not import modules with an underscore in the path.

   Bad:
   ```ts
   import { filterInPlace } from "https://deno.land/std@$STD_VERSION/collections/_utils.ts";
   ```

1. Do not import test modules or test data.

   Bad:
   ```ts
   import { test } from "https://deno.land/std@$STD_VERSION/front_matter/test.ts";
   ```

## Contributing

Check out the contributing guidelines [here](./CONTRIBUTING.md).

## Releases

The Standard Library is versioned independently of the
[Deno CLI](https://deno.com/). This will change once the library is stabilized.
See
[here](https://raw.githubusercontent.com/denoland/dotland/main/versions.json)
for the compatibility of different versions of the Deno Standard Library and the
Deno CLI.
