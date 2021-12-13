# signal

signal is a module used to capture and monitor OS signals.

# usage

The following functions are exposed in `mod.ts`:

## signal

Generates an AsyncIterable which can be awaited on for one or more signals.
`dispose()` can be called when you are finished waiting on the events.

```typescript
import { signal } from "https://deno.land/std/signal/mod.ts";
const sig = signal("SIGUSR1", "SIGINT");
setTimeout(() => {}, 5000); // Prevents exiting immediately.

for await (const _ of sig) {
  // ..
}

// At some other point in your code when finished listening:
sig.dispose();
```
