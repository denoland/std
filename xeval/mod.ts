import { parse } from "../flags/mod.ts";
const { Buffer, EOF, args, exit, stdin, writeAll } = Deno;
type Reader = Deno.Reader;

/* eslint-disable-next-line max-len */
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncFunction.
const AsyncFunction = Object.getPrototypeOf(async function(): Promise<void> {})
  .constructor;

function showHelp(): void {
  console.log(`Deno xeval

USAGE:
  deno -A https://deno.land/std/xeval/mod.ts [OPTIONS] <code>

OPTIONS:
  -d, --delim <delim>       Set delimiter, defaults to newline
  -I, --replvar <replvar>   Set variable name to be used in eval, defaults to $

ARGS:
  <code>
`);
}

export type XevalFunc = (v: string) => void;

export interface XevalOptions {
  delimiter?: string;
}

const DEFAULT_DELIMITER = "\n";

// TODO(kevinkassimo): Move this utility somewhere public in deno_std.
// Import from there once doable.
// Read from reader until EOF and emit string chunks separated
// by the given delimiter.
async function* chunks(
  reader: Reader,
  delim: string
): AsyncIterableIterator<string> {
  const inputBuffer = new Buffer();
  const inspectArr = new Uint8Array(1024);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  // Avoid unicode problems
  const delimArr = encoder.encode(delim);

  // Record how far we have gone with delimiter matching.
  let nextMatchIndex = 0;
  while (true) {
    let result = await reader.read(inspectArr);
    let rr = result === EOF ? 0 : result;
    if (rr < 0) {
      // Silently fail.
      break;
    }
    const sliceRead = inspectArr.subarray(0, rr);
    // Remember how far we have scanned through inspectArr.
    let nextSliceStartIndex = 0;
    for (let i = 0; i < sliceRead.length; i++) {
      if (sliceRead[i] == delimArr[nextMatchIndex]) {
        // One byte matches with delimiter, move 1 step forward.
        nextMatchIndex++;
      } else {
        // Match delimiter failed. Start from beginning.
        nextMatchIndex = 0;
      }
      // A complete match is found.
      if (nextMatchIndex === delimArr.length) {
        nextMatchIndex = 0; // Reset delim match index.
        const sliceToJoin = sliceRead.subarray(nextSliceStartIndex, i + 1);
        // Record where to start next chunk when a subsequent match is found.
        nextSliceStartIndex = i + 1;
        // Write slice to buffer before processing, since potentially
        // part of the delimiter is stored in the buffer.
        await writeAll(inputBuffer, sliceToJoin);

        let readyBytes = inputBuffer.bytes();
        inputBuffer.reset();
        // Remove delimiter from buffer bytes.
        readyBytes = readyBytes.subarray(
          0,
          readyBytes.length - delimArr.length
        );
        let readyChunk = decoder.decode(readyBytes);
        yield readyChunk;
      }
    }
    // Write all unprocessed chunk to buffer for future inspection.
    await writeAll(inputBuffer, sliceRead.subarray(nextSliceStartIndex));
    if (result === EOF) {
      // Flush the remainder unprocessed chunk.
      const lastChunk = inputBuffer.toString();
      yield lastChunk;
      break;
    }
  }
}

export async function xeval(
  reader: Reader,
  xevalFunc: XevalFunc,
  { delimiter = DEFAULT_DELIMITER }: XevalOptions = {}
): Promise<void> {
  for await (const chunk of chunks(reader, delimiter)) {
    // Ignore empty chunks.
    if (chunk.length > 0) {
      await xevalFunc(chunk);
    }
  }
}

async function main(): Promise<void> {
  const parsedArgs = parse(args.slice(1), {
    boolean: ["help"],
    string: ["delim", "replvar"],
    alias: {
      delim: ["d"],
      replvar: ["I"],
      help: ["h"]
    }
  });

  if (parsedArgs.help || parsedArgs._.length != 1) {
    return showHelp();
  }

  const delimiter = parsedArgs.delim || DEFAULT_DELIMITER;
  const replVar = parsedArgs.replvar || "$";
  const code = parsedArgs._[0];

  // new AsyncFunction()'s error message for this particular case isn't great.
  if (!replVar.match(/^[_$A-z][_$A-z0-9]*$/)) {
    console.error(`Bad replvar identifier: "${replVar}"`);
    exit(1);
  }

  const xEvalFunc = new AsyncFunction(replVar, code);

  await xeval(stdin, xEvalFunc, { delimiter });
}

if (import.meta.main) {
  main();
}
