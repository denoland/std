// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { FormDataDecoderStream } from "@std/formdata/formdata-decoder-stream";

type Uint8Array_ = ReturnType<Uint8Array["slice"]>;

async function toBlob(body: BodyInit, init?: ResponseInit): Promise<Blob> {
  return await new Response(body, init).blob();
}

function toRequest(input: [string, string | Blob][]): Request {
  return new Request("https://example.com/", {
    method: "POST",
    body: function () {
      const formData = new FormData();
      for (const [key, value] of input) formData.append(key, value);
      return formData;
    }(),
  });
}

Deno.test("FormDataDecoderStream", async () => {
  const request = toRequest([
    ["a", "b"],
    ["c", await toBlob("Hello")],
  ]);

  for await (const entry of FormDataDecoderStream.from(request)) {
    switch (entry.name) {
      case "a": {
        assertEquals(await new Response(entry.value).text(), "b");
        break;
      }
      case "c":
        assertEquals(await new Response(entry.value).text(), "Hello");
        break;
      default:
        throw Error("Unreachable");
    }
  }
});

Deno.test("FormDataDecoderStream handles preamble", async () => {
  const request = toRequest([["a", "b"]]);
  const contentType = request.headers.get("Content-Type");
  assert(typeof contentType === "string");
  const readable = request.body?.pipeThrough(
    new TransformStream<Uint8Array_, Uint8Array_>({
      start(controller) {
        controller.enqueue(new Uint8Array(100));
      },
    }),
  );
  assert(readable != undefined);

  for await (
    const entry of new FormDataDecoderStream(contentType, readable).readable
  ) {
    assertEquals(entry.name, "a");
    assertEquals(await new Response(entry.value).text(), "b");
  }
});

Deno.test("FormDataDecoderStream handles epilogue", async () => {
  const request = toRequest([["a", "b"]]);
  const contentType = request.headers.get("Content-Type");
  assert(typeof contentType === "string");
  const readable = request.body?.pipeThrough(
    new TransformStream<Uint8Array_, Uint8Array_>({
      flush(controller) {
        controller.enqueue(new Uint8Array(100));
      },
    }),
  );
  assert(readable != undefined);

  for await (
    const entry of new FormDataDecoderStream(contentType, readable).readable
  ) {
    assertEquals(entry.name, "a");
    assertEquals(await new Response(entry.value).text(), "b");
  }
});

Deno.test("FormDataDecoderStream throws on missing Content-Type header", () => {
  const request = toRequest([["a", "b"]]);
  request.headers.delete("Content-Type");

  assertThrows(
    () => FormDataDecoderStream.from(request),
    Error,
    "Content-Type header is missing",
  );
});

Deno.test("FormDataDecoderStream throws on missing body", () => {
  const request = new Request("https://example.com", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
  });
  assertThrows(
    () => FormDataDecoderStream.from(request),
    Error,
    "Request body is missing",
  );
});

Deno.test(
  "FormDataDecoderStream throws on missing boundary in Content-Type",
  () => {
    const request = toRequest([["a", "b"]]);
    request.headers.set("Content-Type", "multipart/form-data");

    assertThrows(
      () => FormDataDecoderStream.from(request),
      Error,
      "Boundary not found in contentType",
    );
  },
);

Deno.test("FormDataDecoderStream throws on invalid boundary", () => {
  const request = toRequest([["a", "b"]]);
  let contentType = request.headers.get("Content-Type");
  assert(typeof contentType === "string");
  contentType = contentType.replace("boundary=", 'boundary="') + '\u{1F4A9}"';
  const readable = request.body;
  assert(readable != undefined);

  assertThrows(
    () => {
      new FormDataDecoderStream(contentType, readable);
    },
    Error,
    "Boundary has invalid characters within it",
  );
});

Deno.test(
  "FormDataDecoderStream throws on Unexpected EOF while decoding headers",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    let boundary = contentType
      .split(";")
      .find((x) => x.trimStart().startsWith("boundary="))
      ?.split("=")[1];
    assert(boundary != undefined);
    if (boundary.startsWith('"')) boundary = boundary.slice(1, -1);
    const text = await request.text();
    const index = text.indexOf(boundary) + boundary.length + 2;

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.slice(0, index)])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          throw "Unreachable";
        }
      },
      Error,
      "Unexpected EOF",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on Content-Disposition due to no headers",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();
    const index1 = text.indexOf("Content-Disposition");
    const index2 = text.indexOf("\r\n", index1);

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.slice(0, index1) + text.slice(index2)])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          throw "Unreachable";
        }
      },
      Error,
      "Missing Content-Disposition header within FormData segment",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on invalid Content-Disposition type",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.replace("form-data", "data-forms")])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          throw "Unreachable";
        }
      },
      Error,
      "Content-Disposition was not of form-data",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on missing Content-Disposition name field",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.replace("name=", "game=")])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          throw "Unreachable";
        }
      },
      Error,
      "Content-Disposition missing name field",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on Unexpected EOF after decoding headers",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.slice(0, text.indexOf("\r\n\r\n") + 2)])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) throw "Unreachable";
      },
      Error,
      "Unexpected EOF",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on missing Content-Disposition header",
  async () => {
    const request = toRequest([["a", "b"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();

    await assertRejects(
      async () => {
        for await (
          const _entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([
              text.replace("Content-Disposition", "Content-Type"),
            ])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          throw "Unreachable";
        }
      },
      Error,
      "Missing Content-Disposition header within FormData segment",
    );
  },
);

Deno.test(
  "FormDataDecoderStream throws on Unexpected EOF while decoding body",
  async () => {
    const request = toRequest([["a", "I am a tee pot"]]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const text = await request.text();

    await assertRejects(
      async () => {
        for await (
          const entry of new FormDataDecoderStream(
            contentType,
            ReadableStream.from([text.slice(0, text.indexOf("I am a tee pot"))])
              .pipeThrough(new TextEncoderStream()),
          ).readable
        ) {
          await assertRejects(
            async () => await new Response(entry.value).text(),
            Error,
            "Unexpected EOF",
          );
        }
      },
      Error,
      "Unexpected EOF",
    );
  },
);

Deno.test("FormDataDecoderStream handles CRLF in body", async () => {
  const buffer = Uint8Array.from([
    13,
    10,
    1,
    13,
    10,
    2,
    2,
    13,
    10,
    13,
    10,
    3,
    3,
    3,
  ]);
  const request = toRequest([[
    "a",
    await toBlob(buffer),
  ]]);

  for await (const entry of FormDataDecoderStream.from(request)) {
    assertEquals(entry.name, "a");
    assertEquals(
      await new Response(entry.value).bytes(),
      buffer,
    );
  }
});

Deno.test("FormDataDecoderStream handles large bodies", async () => {
  const decoder = new TextDecoder();
  const request = toRequest([["a", "I am a LARGE Body"]]);

  let body = "";
  for await (const entry of FormDataDecoderStream.from(request)) {
    const reader = entry.value.getReader({ mode: "byob" });
    while (true) {
      const { done, value } = await reader.read(new Uint8Array(5), { min: 5 });
      body += decoder.decode(value);
      if (done) break;
    }
  }
  assertEquals(body, "I am a LARGE Body");
});

Deno.test("FormDataDecoderStream handles tight bodies", async () => {
  const decoder = new TextDecoder();
  const request = toRequest([["a", "I am\r\n a TIGHT Body"]]);

  let body = "";
  for await (const entry of FormDataDecoderStream.from(request)) {
    const reader = entry.value.getReader({ mode: "byob" });
    while (true) {
      const { done, value } = await reader.read(new Uint8Array(5), { min: 5 });
      body += decoder.decode(value);
      if (done) break;
    }
  }
  assertEquals(body, "I am\r\n a TIGHT Body");
});

Deno.test("FormDataDecoderStream handles being cancelled", async () => {
  const request = toRequest([["a", await toBlob(new Uint8Array(1024 * 1024))], [
    "b",
    "c",
  ]]);

  for await (const entry of FormDataDecoderStream.from(request)) {
    switch (entry.name) {
      case "a":
        await entry.value.cancel();
        break;
      case "b":
        assertEquals(await new Response(entry.value).text(), "c");
        break;
      default:
        throw new Error("Unreachable");
    }
  }
});

Deno.test(
  "FormDataDecoderStream handles being cancelled on an invalid stream",
  async () => {
    const request = toRequest([
      ["a", await toBlob(new Uint8Array(1024 * 1024))],
    ]);
    const contentType = request.headers.get("Content-Type");
    assert(typeof contentType === "string");
    const readable = ReadableStream.from([
      (await request.bytes()).subarray(0, 1024),
    ]);

    await assertRejects(
      async () => {
        for await (
          const entry of new FormDataDecoderStream(contentType, readable)
            .readable
        ) {
          await entry.value.cancel();
        }
      },
      Error,
      "Unexpected EOF",
    );
  },
);

Deno.test("FormDataDecoderStream handles field name _charset_", async () => {
  const request = toRequest([["_charset_", "text/html"], ["a", "b"]]);

  for await (const entry of FormDataDecoderStream.from(request)) {
    assertEquals(entry.name, "a");
    assertEquals(entry.contentType, "text/html");
    assertEquals(await new Response(entry.value).text(), "b");
  }
});
