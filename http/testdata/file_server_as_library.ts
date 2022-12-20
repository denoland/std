import { serve } from "../server.ts";
import { serveFile } from "../file_server.ts";

serve((req) => {
  return serveFile(req, "./testdata/hello.html");
}, { port: 8000, onListen: () => console.log("Server running...") });
