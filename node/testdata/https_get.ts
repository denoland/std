import * as https from "../https.ts";
import type { EventEmitter } from "../events.ts";
https.get("https://localhost:4505", (res: EventEmitter) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(data);
  });
}).end();
