// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
export interface TransformStreamFromProcess {
  throwIfStatusError?: boolean;
}

/**
 * Create a `TransformStream` from a `Deno.Process`.
 *
 * The `TransformStream` will write to the process's stdin and read from its
 * stdout.
 */
export function transformStreamFromProcess(
  process: Deno.Process,
  options: TransformStreamFromProcess = {},
): TransformStream<
  Uint8Array,
  Uint8Array
> {
  if (!process.stdin || !process.stdout) {
    throw new Error("stdin and stdout must be piped");
  }

  const { throwIfStatusError = true } = options;

  const stdin = process.stdin;
  const stdout = process.stdout;
  let outputPromise: Promise<void> | null = null;

  return new TransformStream<Uint8Array, Uint8Array>({
    async flush() {
      stdin.close();
      if (outputPromise) {
        await outputPromise.catch(() => {});
      }
      process.close();
    },
    start(controller) {
      outputPromise = readOutput()
        .catch((err) => {
          controller.error(err);
        });

      async function readOutput() {
        for await (const chunk of stdout.readable) {
          controller.enqueue(chunk);
        }

        if (throwIfStatusError) {
          const status = await process.status();

          if (!status.success) {
            throw new Error("process exited with status " + status.code);
          }
        }
        controller.terminate();
      }
    },
    async transform(chunk) {
      await stdin.write(chunk);
    },
  });
}
