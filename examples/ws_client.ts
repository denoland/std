import {
  connectWebSocket,
  isWebSocketPingEvent,
  isWebSocketPongEvent
} from "../ws/mod.ts";
import { decode } from "../strings/strings.ts";
import { BufReader } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";

async function main() {
  const sock = await connectWebSocket("ws://127.0.0.1:8080");
  console.log("ws connected!");
  (async function() {
    for await (const msg of sock.receive()) {
      if (typeof msg === "string") {
        console.log("string: " + msg);
      } else if (isWebSocketPingEvent(msg)) {
        console.log("ping");
      } else if (isWebSocketPongEvent(msg)) {
        const [_, payload] = msg;
        console.log("ping:" + decode(payload));
      }
    }
  })();
  const bufr = new BufReader(Deno.stdin);
  const tpr = new TextProtoReader(bufr);
  while (true) {
    const [line, err] = await tpr.readLine();
    if (err) {
      console.error(err);
      break;
    }
    if (line === "close") {
      break;
    } else if (line === "ping") {
      await sock.ping();
    } else {
      await sock.send(line);
    }
  }
  await sock.close(1000);
}
main();
