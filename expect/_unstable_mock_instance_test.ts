// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assert } from "@std/assert";
import { createMockInstance } from "./_unstable_mock_instance.ts";
import { MOCK_SYMBOL } from "./_unstable_mock_utils.ts";
import { expect } from "./unstable_expect.ts";

Deno.test("createMockInstance()", async ({ step }) => {
  const createMock = (stubs: Array<(a: number, b: number) => number>) =>
    createMockInstance<
      [number, number],
      number,
      (a: number, b: number) => number
    >(
      (a, b) => a + b,
      stubs,
      (wrap) => wrap,
    );
  const createAsyncMock = (
    stubs: Array<(a: number, b: number) => Promise<number>>,
  ) =>
    createMockInstance<
      [number, number],
      Promise<number>,
      (a: number, b: number) => Promise<number>
    >(
      (a, b) => Promise.resolve(a + b),
      stubs,
      (wrap) => wrap,
    );

  await step("should define mock instance methods", () => {
    const mock = createMock([]);

    expect(mock).toBeInstanceOf(Function);
    assert(
      MOCK_SYMBOL in mock && typeof mock[MOCK_SYMBOL] === "object" &&
        mock[MOCK_SYMBOL] !== null && "calls" in mock[MOCK_SYMBOL] &&
        Array.isArray(mock[MOCK_SYMBOL].calls),
      "mock instance should have mock internals",
    );
    expect(mock).toHaveProperty("mockImplementation", expect.any(Function));
    expect(mock).toHaveProperty("mockImplementation", expect.any(Function));
    expect(mock).toHaveProperty("mockImplementationOnce", expect.any(Function));
    expect(mock).toHaveProperty("mockReturnValue", expect.any(Function));
    expect(mock).toHaveProperty("mockReturnValueOnce", expect.any(Function));
    expect(mock).toHaveProperty("mockResolvedValue", expect.any(Function));
    expect(mock).toHaveProperty("mockResolvedValueOnce", expect.any(Function));
    expect(mock).toHaveProperty("mockRejectedValue", expect.any(Function));
    expect(mock).toHaveProperty("mockRejectedValueOnce", expect.any(Function));
    expect(mock).toHaveProperty("withImplementation", expect.any(Function));
    expect(mock).toHaveProperty("withImplementation", expect.any(Function));
    expect(mock).toHaveProperty("mockRestore", expect.any(Function));
  });

  await step("should use stubs and switch to current after", () => {
    const mock = createMock([() => 5, () => {
      throw new Error("test error");
    }]);

    expect(() => mock(1, 1)).toThrow("test error");
    expect(mock(1, 2)).toBe(5);
    expect(mock(1, 3)).toBe(4);

    expect(mock[MOCK_SYMBOL]).toStrictEqual({
      calls: [{
        args: [1, 1],
        result: "thrown",
        error: new Error("test error"),
        timestamp: expect.any(Number),
      }, {
        args: [1, 2],
        result: "returned",
        returned: 5,
        timestamp: expect.any(Number),
      }, {
        args: [1, 3],
        result: "returned",
        returned: 4,
        timestamp: expect.any(Number),
      }],
    });
  });

  await step("should handle undefined original", () => {
    const mock = createMockInstance<
      [number, number],
      number,
      (a: number, b: number) => number
    >(
      undefined,
      [],
      (wrap) => wrap,
    );
    expect(mock(1, 2)).toBeUndefined();
  });

  await step("should be recognized by expect and assert", () => {
    const mock = createMock([]);
    mock(1, 1);
    mock(1, 2);
    expect(mock).toHaveBeenCalledTimes(2);
    expect(mock).toHaveBeenNthCalledWith(1, 1, 1);
    expect(mock).toHaveBeenLastCalledWith(1, 2);
    expect(mock).toHaveReturnedWith(2);
    expect(mock).toHaveLastReturnedWith(3);
  });

  await step(".mockImplementation()", () => {
    const mock = createMock([]).mockImplementation((a, b) => a - b);
    expect(mock(1, 1)).toBe(0);
    expect(mock(1, 2)).toBe(-1);
  });

  await step(".mockImplementationOnce()", () => {
    const mock = createMock([]).mockImplementationOnce((a, b) => a - b);
    expect(mock(1, 1)).toBe(0);
    expect(mock(1, 2)).toBe(3);
  });

  await step(".mockReturnValue()", () => {
    const mock = createMock([]).mockReturnValue(5);
    expect(mock(1, 1)).toBe(5);
    expect(mock(1, 2)).toBe(5);
  });

  await step(".mockReturnValueOnce()", () => {
    const mock = createMock([]).mockReturnValueOnce(5);
    expect(mock(1, 1)).toBe(5);
    expect(mock(1, 2)).toBe(3);
  });

  await step(".mockResolvedValue()", async () => {
    const mock = createAsyncMock([]).mockResolvedValue(5);
    await expect(mock(1, 1)).resolves.toBe(5);
    await expect(mock(1, 2)).resolves.toBe(5);
  });

  await step(".mockResolvedValueOnce()", async () => {
    const mock = createAsyncMock([]).mockResolvedValueOnce(5);
    await expect(mock(1, 1)).resolves.toBe(5);
    await expect(mock(1, 2)).resolves.toBe(3);
  });

  await step(".mockRejectedValue()", async () => {
    const mock = createAsyncMock([]).mockRejectedValue(new Error("test error"));
    await expect(mock(1, 1)).rejects.toThrow("test error");
    await expect(mock(1, 2)).rejects.toThrow("test error");
  });

  await step(".mockRejectedValueOnce()", async () => {
    const mock = createAsyncMock([]).mockRejectedValueOnce(
      new Error("test error"),
    );
    await expect(mock(1, 1)).rejects.toThrow("test error");
    await expect(mock(1, 2)).resolves.toBe(3);
  });

  await step(".withImplementation()", () => {
    const mock = createMock([]);
    {
      using _withMock = mock.withImplementation((a, b) => a - b);
      expect(mock(1, 1)).toBe(0);
    }
    expect(mock(1, 2)).toBe(3);
  });

  await step(".withImplementation() with sync scope", () => {
    let counter = 0;
    const mock = createMock([]);

    mock.withImplementation((a, b) => a - b, () => {
      expect(mock(1, 1)).toBe(0);
      counter += 1;
    });

    expect(mock(1, 2)).toBe(3);
    expect(counter).toBe(1);
  });

  await step(".withImplementation() with sync scope that throws error", () => {
    let counter = 0;
    const mock = createMock([]);

    expect(() =>
      mock.withImplementation((a, b) => a - b, () => {
        counter += 1;
        throw new Error("scope error");
      })
    ).toThrow(new Error("scope error"));

    expect(counter).toBe(1);
  });

  await step(".withImplementation() with async scope", async () => {
    let counter = 0;
    const mock = createAsyncMock([]);

    const promise = mock.withImplementation(
      (a, b) => Promise.resolve(a - b),
      async () => {
        counter += 1;
        await expect(mock(1, 1)).resolves.toBe(0);
      },
    );

    await expect(mock(1, 2)).resolves.toBe(-1);
    await promise;
    await expect(mock(1, 3)).resolves.toBe(4);

    expect(counter).toBe(1);
  });

  await step(".mockRestore()", () => {
    const mock = createMock([]);
    mock.mockReturnValue(5).mockReturnValueOnce(1);
    mock.mockRestore();
    expect(mock(1, 1)).toEqual(2);
    expect(mock(1, 2)).toEqual(3);
  });
});
