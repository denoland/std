export default function randomInt(min: number): number;
export default function randomInt(min: number, max?: number): number;
export default function randomInt(
  min: number,
  cb?: ((err: Error | null, n?: number) => void) | number,
): void;
export default function randomInt(
  min?: number,
  max?: number,
  cb?: (err: Error | null, n?: number) => void,
): void;

export default function randomInt(
  min?: number,
  max?: ((err: Error | null, n?: number) => void) | number,
  cb?: (err: Error | null, n?: number) => void,
): number | void {
  if (min !== undefined && max === undefined) {
    max = min;
    min = 0;
  }

  if (Number(min as number) >= Number(max as number)) {
    throw new Error("Min is bigger than Max!");
  }

  const randomBuffer = new Uint32Array(1);

  crypto.getRandomValues(randomBuffer);

  const randomNumber = randomBuffer[0] / (0xffffffff + 1);

  min = Math.ceil(min as number);
  max = Math.floor(max as number);

  const result = Math.floor(randomNumber * (max - min + 1)) + min;

  if (cb) {
    cb(null, result);
    return;
  }

  return result;
}
