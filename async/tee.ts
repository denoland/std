// Utility for representing n-tuple
type Tuple<T, N extends number> = N extends N
  ? number extends N ? T[] : TupleOf<T, N, []>
  : never;
type TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : TupleOf<T, N, [T, ...R]>;

interface QueueNode<T> {
  value: T;
  next: QueueNode<T> | undefined;
}

// deno-lint-ignore no-explicit-any
class Queue<T, TReturn = any> {
  #source: AsyncIterator<T>;
  #queue: QueueNode<T>;
  head: QueueNode<T>;

  done: boolean;
  return: { value: TReturn; isExsit: boolean };

  constructor(iterable: AsyncIterable<T>) {
    this.#source = iterable[Symbol.asyncIterator]();
    this.#queue = {
      value: undefined!,
      next: undefined,
    };
    this.head = this.#queue;
    this.done = false;
    this.return = {
      value: undefined!,
      isExsit: false,
    };
  }

  async next(): Promise<void> {
    const result = await this.#source.next();
    if (!result.done) {
      const nextNode: QueueNode<T> = {
        value: result.value,
        next: undefined,
      };
      this.#queue.next = nextNode;
      this.#queue = nextNode;
    } else {
      this.done = true;
      if (this.#source.return) {
        this.return = {
          value: result.value,
          isExsit: true,
        };
      }
    }
  }
}

export function tee<T, N extends number = 2>(
  iterable: AsyncIterable<T>,
  n: N = 2 as N,
): Tuple<AsyncIterable<T>, N> {
  const queue = new Queue<T>(iterable);

  async function* generator(): AsyncGenerator<T> {
    let buffer = queue.head;
    while (true) {
      if (buffer.next) {
        buffer = buffer.next;
        yield buffer.value;
      } else if (queue.done) {
        if (queue.return.isExsit) {
          return queue.return.value;
        }
      } else {
        await queue.next();
      }
    }
  }

  const branches = Array.from({ length: n }).map(
    () => generator(),
  ) as Tuple<
    AsyncIterable<T>,
    N
  >;
  return branches;
}
