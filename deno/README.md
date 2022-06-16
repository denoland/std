# deno

deno module is made to provide helpers for deno related actions.

## loadConfigFile

```ts
import { loadConfigFile } from "https://deno.land/std@$STD_VERSION/deno/loadConfigFile.ts";
```

loads the deno
[configuration file](https://deno.land/manual/getting_started/configuration_file#configuration-file)
from the given directory.

```jsonc
// deno.json
{ "compilerOptions": { "strict": true } }
```

```ts
import { loadConfigFile } from "https://deno.land/std@$STD_VERSION/deno/loadConfigFile.ts";
const config = await loadConfigFile(Deno.cwd()); // { compilerOptions: { strict: true } }
```
