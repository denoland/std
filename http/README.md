# http

A framework for creating HTTP/HTTPS server.

## Example

```typescript
import { createServer } from "https://deno.land/x/http/server.ts";
import { encode } from "https://deno.land/x/strings/strings.ts";

async function main() {
  const server = createServer();
  server.handle("/", async req => {
    await req.respond({
      status: 200,
      body: encode("ok")
    });
  });
  server.handle("/foo/:id", async req => {
    await req.respond({
      status: 200,
      headers: new Headers({
        "content-type": "application/json"
      }),
      body: encode(JSON.stringify({ id: req.params.id }))
    });
  });
  server.listen("127.0.0.1:8080");
}

main();
```

### File Server

A small program for serving local files over HTTP.

Add the following to your `.bash_profile`

```
alias file_server="deno https://deno.land/x/http/file_server.ts --allow-net"
```
