# deno

deno module is made to provide helpers for deno related actions.

## readConfigFile

```ts
import { readConfigFile } from "https://deno.land/std@$STD_VERSION/deno/readConfigFile.ts";
```

loads the deno
[configuration file](https://deno.land/manual/getting_started/configuration_file#configuration-file)
from the given directory.

```jsonc
// deno.json
{ "compilerOptions": { "strict": true } }
```

```ts
import { readConfigFile } from "https://deno.land/std@$STD_VERSION/deno/readConfigFile.ts";
const config = await readConfigFile(Deno.cwd()); // { compilerOptions: { strict: true } }
```
