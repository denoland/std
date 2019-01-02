import { dial } from "deno";
import { assertEqual, test } from "./package.ts";
import { IrcServer } from "./mod.ts";

const TEST_ADDRESS = "127.0.0.1:";

let PORT = 25567;

// ! test hangs for some reason
test(async function NICKerrors() {
  const THIS_ADDRESS = TEST_ADDRESS + PORT++;
  // test SHOULD complete in this time
  const timerID = setTimeout(() => {
    throw new Error("Test did not complete in time.");
  }, 3000);

  const server = new IrcServer(THIS_ADDRESS);
  server.start();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const client1 = await dial("tcp", THIS_ADDRESS);
  const readBuffer = new Uint8Array(1024);

  // no nickname given
  const nickError431 = "NICK \r\n";

  let encodedMsg = encoder.encode(nickError431);
  await client1.write(encodedMsg);
  let rr = await client1.read(readBuffer);

  let decodedResp = decoder.decode(readBuffer.buffer.slice(0, rr.nread));
  assertEqual(decodedResp, ":127.0.0.1 431 * :No nickname given\r\n");

  // now test two users attempting to register the same nickname

  const nickError433 = "NICK nickname\r\n";
  encodedMsg = encoder.encode(nickError433);

  await client1.write(encodedMsg);

  const client2 = await dial("tcp", THIS_ADDRESS);

  await client2.write(encodedMsg);
  rr = await client2.read(readBuffer);
  decodedResp = decoder.decode(readBuffer.buffer.slice(0, rr.nread));
  assertEqual(
    decodedResp,
    ':127.0.0.1 433 * :Nickname "nickname" has already been taken.\r\n'
  );

  clearTimeout(timerID);
  client1.close();
  client2.close();
  server.close();
});

// ! gives an OS error
test(async function USERerrors() {
  const THIS_ADDRESS = TEST_ADDRESS + PORT++;
  // test SHOULD complete in this time
  const timerID = setTimeout(() => {
    throw new Error("Test did not complete in time.");
  }, 3000);

  const server = new IrcServer(THIS_ADDRESS);
  server.start();

  const client1 = await dial("tcp", THIS_ADDRESS);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // not enough params
  const userError461 = "USER\r\n";
  let encodedMsg = encoder.encode(userError461);
  await client1.write(encodedMsg);

  const readBuffer = new Uint8Array(1024);

  let rr = await client1.read(readBuffer);
  let decodedMsg = decoder.decode(readBuffer.buffer.slice(0, rr.nread));

  assertEqual(decodedMsg, ":127.0.0.1 461 * :Wrong params for USER command\r\n");

  // then test if user is already registered

  const nickMsg = encoder.encode("NICK nickname\r\n");
  const firstUserMsg = encoder.encode("USER username 0 * :Full Name\r\n");
  const secondUserMsg = encoder.encode("USER othername 0 * :Other Name\r\n");

  await client1.write(nickMsg);
  await client1.write(firstUserMsg);
  await client1.write(secondUserMsg);

  rr = await client1.read(readBuffer);
  decodedMsg = decoder.decode(readBuffer.buffer.slice(0, rr.nread));
  assertEqual(decodedMsg, ":127.0.0.1 001 nickname :Welcome to the server nickname\r\n");

  rr = await client1.read(readBuffer);
  decodedMsg = decoder.decode(readBuffer.buffer.slice(0, rr.nread));

  assertEqual(decodedMsg, ":127.0.0.1 462 nickname :Cannot register twice\r\n");

  clearTimeout(timerID);
  client1.close();
  server.close();
});
