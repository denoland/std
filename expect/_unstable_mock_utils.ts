// Copyright 2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2024 Anton Mikhailov. All rights reserved. MIT License.

import type { MOCK_SYMBOL, MockCall } from "@std/internal/mock";

export { isMockFunction, MOCK_SYMBOL } from "@std/internal/mock";

export type ExpectMockCall<Args extends unknown[], Return> = Omit<
  MockCall<Args, Return>,
  "returned"
> & {
  timestamp: number;
  returned?: Return | undefined;
};
export interface ExpectMockInternals<Args extends unknown[], Return> {
  calls: ExpectMockCall<Args, Return>[];
}
export interface ExpectMockInstance<Args extends unknown[], Return> {
  [MOCK_SYMBOL]: ExpectMockInternals<Args, Return>;
  mockImplementation(stub: (...args: Args) => Return): this;
  mockImplementationOnce(stub: (...args: Args) => Return): this;
  mockReturnValue(value: Return): this;
  mockReturnValueOnce(value: Return): this;
  mockResolvedValue(value: Awaited<Return> | Return): this;
  mockResolvedValueOnce(value: Awaited<Return> | Return): this;
  mockRejectedValue(reason?: unknown): this;
  mockRejectedValueOnce(reason?: unknown): this;
  withImplementation(stub: (...args: Args) => Return): Disposable;
  withImplementation<ScopeResult>(
    stub: (...args: Args) => Return,
    callback: () => ScopeResult
  ): ScopeResult;
  mockRestore(): void;
}
